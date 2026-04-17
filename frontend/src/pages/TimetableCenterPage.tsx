import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Button, Table, Modal, Form, 
  Input, Select, Space, Card, message, Steps, Divider, Row, Col 
} from 'antd';
import { 
  PlusOutlined, EyeOutlined, SettingOutlined, CalendarOutlined 
} from '@ant-design/icons';
import apiClient from '../api/client';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export default function TimetableCenterPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  
  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [regLists, setRegLists] = useState<any[]>([]);
  
  const [programs, setPrograms] = useState<any[]>([]);
  
  // Wizard Form values
  const [wizardConfig, setWizardConfig] = useState({
    plan_name: "",
    registration_list_id: null,
    program_ids: [] as number[]
  });
  
  // Dynamic entries mapping: { [program_id]: [{semester_index}] }
  const [entriesConfig, setEntriesConfig] = useState<any>({});

  const fetchSessions = async () => {
    try {
      const res = await apiClient.get('/timetables/');
      setSessions(res.data);
    } catch {
      message.error("Lỗi lấy danh sách Đợt TKB");
    }
  };

  const fetchRegLists = async () => {
    try {
      const res = await apiClient.get('/registrations/lists');
      setRegLists(res.data);
    } catch {
      // ignore
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await apiClient.get('/programs/');
      setPrograms(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
    fetchRegLists();
    fetchPrograms();
  }, []);

  const loadSessionDetails = async (id: number) => {
    try {
      const res = await apiClient.get(`/timetables/${id}/rows`);
      setRows(res.data);
      setSelectedSessionId(id);
    } catch {
      message.error("Lỗi tải chi tiết TKB");
    }
  };

  // --- WIZARD HANDLERS ---
  const handleNextStep1 = () => {
    if (!wizardConfig.plan_name || wizardConfig.program_ids.length === 0) {
      message.warning("Vui lòng điền Tên đợt và chọn ít nhất 1 Khung Chương Trình");
      return;
    }
    const newConfig = { ...entriesConfig };
    wizardConfig.program_ids.forEach(p_id => {
      if (!newConfig[p_id]) {
        newConfig[p_id] = [{ semester_index: 1 }];
      }
    });
    setEntriesConfig(newConfig);
    setCurrentStep(1);
  };

  const handleAddEntry = (p_id: number) => {
    const list = [...entriesConfig[p_id]];
    list.push({ semester_index: 1 });
    setEntriesConfig({ ...entriesConfig, [p_id]: list });
  };

  const updateEntry = (p_id: number, index: number, field: string, val: any) => {
    const list = [...entriesConfig[p_id]];
    list[index][field] = val;
    setEntriesConfig({ ...entriesConfig, [p_id]: list });
  };

  const handleGenerate = async () => {
    try {
      const payloadEntries: any[] = [];
      Object.keys(entriesConfig).forEach(p_id => {
        entriesConfig[p_id].forEach((cfg: any) => {
          if (cfg.semester_index) {
            payloadEntries.push({
              program_id: parseInt(p_id),
              semester_index: cfg.semester_index
            });
          }
        });
      });

      if (payloadEntries.length === 0) {
        message.warning("Vui lòng điện đầy đủ Kỳ cho các khung");
        return;
      }

      const res = await apiClient.post('/timetables/generate', {
        plan_name: wizardConfig.plan_name,
        registration_list_id: wizardConfig.registration_list_id,
        entries: payloadEntries
      });

      message.success("Tạo Đợt TKB và Gen dữ liệu Lớp-Môn thành công!");
      setIsWizardOpen(false);
      setCurrentStep(0);
      setWizardConfig({ plan_name: "", registration_list_id: null, program_ids: [] });
      fetchSessions();
      loadSessionDetails(res.data.session_id);

    } catch (e: any) {
      message.error(e.response?.data?.detail || "Lỗi tạo TKB");
    }
  };

  // --- UPDATE ROW HANDLER ---
  const handleRowChange = async (row_id: number, field: string, value: any) => {
    try {
      // Update local state first for instant UI response
      const updatedRows = rows.map(r => r.row_id === row_id ? { ...r, [field]: value } : r);
      setRows(updatedRows);
      
      // Update DB
      await apiClient.put(`/timetables/rows/${row_id}`, { [field]: value });
    } catch {
      message.error("Lỗi cập nhật dòng TKB");
      // Optionally reload from server to revert
    }
  };

  // --- RENDERING DETAIL TABLE ---
  const tableColumns: ColumnsType<any> = [
    { title: 'STT', dataIndex: 'row_id', width: 60, align: 'center', render: (_, __, i) => i + 1 },
    { title: 'Tên Lớp', dataIndex: 'class_name', width: 120, fixed: 'left' },
    { title: 'Buổi CĐ', dataIndex: 'fixed_shift', width: 120, render: (val, record) => (
      <Select size="small" placeholder="Chọn buổi" style={{width: '100%'}} value={val} 
        onChange={v => handleRowChange(record.row_id, 'fixed_shift', v)}
        options={[{value:'Sáng',label:'Sáng'},{value:'Chiều',label:'Chiều'}]} />
    ) },
    { title: 'Mã Môn', dataIndex: 'subject_code', width: 100 },
    { title: 'Tên Học Phần', dataIndex: 'subject_name', width: 250 },
    { title: 'TC', dataIndex: 'credits', width: 60, align: 'center' },
    { title: 'LT', dataIndex: 'theory_hours', width: 60, align: 'center' },
    { title: 'TH', dataIndex: 'practice_hours', width: 60, align: 'center' },
    { title: 'GV Chính', dataIndex: 'main_lecturer_name', width: 200, render: (val) => val || <span className="text-gray-400 italic">Trống</span> },
    { title: 'GV Thực Hành', dataIndex: 'prac_lecturer_name', width: 200, render: (val) => val || <span className="text-gray-400 italic">Trống</span> },
    { title: 'Phòng', dataIndex: 'room_type', width: 120, render: (val, record) => (
      <Select size="small" placeholder="Chọn phòng" style={{width: '100%'}} value={val} 
        onChange={v => handleRowChange(record.row_id, 'room_type', v)}
        options={[{value:'Phòng thường',label:'Phòng thường'},{value:'Phòng máy',label:'Phòng máy'}]} />
    ) },
    { title: 'Thứ-Sáng', dataIndex: 'morning_day', width: 100, align: 'center' },
    { title: 'Thứ-Chiều', dataIndex: 'afternoon_day', width: 100, align: 'center' },
  ];

  if (selectedSessionId) {
    const curSession = sessions.find(s => s.session_id === selectedSessionId);
    return (
      <div className="p-4 bg-white min-h-full">
        <Space className="mb-4 w-full" justify="space-between">
          <div>
            <Button onClick={() => setSelectedSessionId(null)} className="mr-4">← Quay lại</Button>
            <Text strong className="text-lg text-blue-800">
              Workspace (Central Timetable): {curSession?.plan_name}
            </Text>
          </div>
          <Space>
            <Button type="primary" icon={<SettingOutlined />}>Lưu Cấu Hình Buổi/Phòng</Button>
          </Space>
        </Space>
        
        <Table 
          columns={tableColumns} 
          dataSource={rows} 
          rowKey="row_id" 
          scroll={{ x: 1800, y: 'calc(100vh - 200px)' }}
          size="small"
          bordered
          pagination={false}
        />
      </div>
    );
  }

  return (
    <div className="p-6 h-full p-4 bg-slate-50">
      <Space className="w-full mb-6" justify="space-between">
        <Title level={3} className="!mb-0 text-slate-700">TKB Trung Tâm</Title>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsWizardOpen(true)}>
          Khởi tạo Đợt TKB mới
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        {sessions.map(s => (
          <Col span={8} key={s.session_id}>
            <Card hoverable className="h-full border-t-4 border-t-blue-500 shadow-sm" actions={[
              <Button type="link" icon={<EyeOutlined />} onClick={() => loadSessionDetails(s.session_id)}>Truy cập Workspace</Button>
            ]}>
              <Card.Meta 
                title={<div className="font-bold text-lg">{s.plan_name}</div>}
                description={
                  <div className="mt-2 space-y-2">
                    <div><CalendarOutlined className="mr-2"/>Ngày tạo: {s.created_at}</div>
                    <div className="text-xs text-gray-400">Trạng thái: {s.status}</div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
        {sessions.length === 0 && (
          <div className="w-full text-center text-gray-400 mt-20 italic">Chưa có Đợt xếp lịch nào. Hãy tạo đợt mới.</div>
        )}
      </Row>

      {/* MODAL WIZARD */}
      <Modal
        title={currentStep === 0 ? "Bước 1: Thông tin cơ bản" : "Bước 2: Cấu hình Khóa & Kỳ"}
        open={isWizardOpen}
        onCancel={() => { setIsWizardOpen(false); setCurrentStep(0); }}
        width={700}
        footer={null}
        destroyOnClose
      >
        <Steps current={currentStep} className="mb-8 mt-4" items={[
          { title: "Thông tin mảng & Ngành" },
          { title: "Cấu hình Lớp theo Khóa" },
          { title: "Hoàn tất Gen Lớp" }
        ]} />

        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <label className="font-semibold block mb-1">Tên Đợt TKB (*):</label>
              <Input placeholder="VD: TKB Chính khóa HK1 2024-2025" 
                 value={wizardConfig.plan_name} onChange={e => setWizardConfig({...wizardConfig, plan_name: e.target.value})} 
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Nguồn Đăng Ký Nguyện Vọng:</label>
              <Select 
                allowClear
                className="w-full"
                placeholder="Chọn Danh sách nguyện vọng giảng dạy (Không bắt buộc ngay)"
                value={wizardConfig.registration_list_id}
                onChange={v => setWizardConfig({...wizardConfig, registration_list_id: v})}
                options={regLists.map(l => ({label: l.list_name, value: l.list_id}))}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Chọn Khung Chương Trình tham gia xếp lịch (*):</label>
              <Select 
                mode="multiple"
                className="w-full"
                placeholder="Chọn ít nhất 1 Chương trình"
                value={wizardConfig.program_ids}
                onChange={val => setWizardConfig({...wizardConfig, program_ids: val})}
                options={programs.map(p => ({label: `${p.name} (Khóa ${p.batch})`, value: p.id}))}
              />
            </div>
            <div className="text-right mt-6">
              <Button type="primary" onClick={handleNextStep1}>Tiếp tục →</Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200">
              Hệ thống sẽ dựa vào cấu hình dưới đây để nhân chéo với DB (Lấy các lớp của khóa tương ứng, lấy các môn của học kì đó) và tự sinh (auto-gen) ra một cấu trúc Mảng y hệt file Excel.
            </div>
            
            {wizardConfig.program_ids.map(p_id => {
              const prog = programs.find(p => p.id === p_id);
              return (
                <Card key={p_id} title={<span className="text-blue-700">Chương trình: {prog?.name}</span>} size="small">
                  {entriesConfig[p_id]?.map((cfg: any, i: number) => (
                    <Row gutter={16} key={i} className="mb-2">
                      <Col span={10}>
                        <Select className="w-full" value={cfg.semester_index} onChange={v => updateEntry(p_id, i, 'semester_index', v)} options={[1,2,3,4,5,6,7,8].map(n=>({label:`Học Kì ${n}`, value:n}))} />
                      </Col>
                      <Col span={4}>
                        <Button danger type="text" onClick={() => {
                          const list = [...entriesConfig[p_id]];
                          list.splice(i, 1);
                          setEntriesConfig({...entriesConfig, [p_id]: list});
                        }}>Xóa</Button>
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => handleAddEntry(p_id)}>
                    Thêm Kì Khác Cho Chương Trình Này
                  </Button>
                </Card>
              );
            })}

            <div className="flex justify-between mt-6">
              <Button onClick={() => setCurrentStep(0)}>← Quay lại</Button>
              <Button type="primary" onClick={handleGenerate}>Xác nhận Tạo cấu trúc Lớp & Môn →</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
