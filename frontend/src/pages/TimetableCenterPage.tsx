import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, Typography, Button, Table, Modal, Form, 
  Input, Select, Space, Card, Badge, message, Popconfirm, Tag, Spin
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, RocketOutlined, 
  SaveOutlined, DownloadOutlined, ArrowLeftOutlined, WarningOutlined, SettingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

// Components for Drag and Drop
const DraggableLecturer = ({ lecturer, stats, isOverLimit }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lecturer.id,
    data: { name: lecturer.name, stats, isOverLimit }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`p-2 mb-2 border rounded cursor-grab bg-white shadow-sm hover:shadow active:cursor-grabbing ${isOverLimit ? 'opacity-50 grayscale' : ''}`}
    >
      <div className="font-bold">{lecturer.name}</div>
      <div className="text-xs text-gray-500 mb-1">{lecturer.id}</div>
      <div className="flex flex-wrap gap-1 text-[10px]">
        <Badge color={stats.classCount >= 10 ? 'red' : 'blue'} text={`Lớp: ${stats.classCount}/10`} />
        <Badge color={stats.subjectCount >= 3 ? 'red' : 'blue'} text={`Môn: ${stats.subjectCount}/3`} />
        <Badge color={stats.hoursCount >= 160 ? (stats.hoursCount > 250 ? 'red' : 'green') : 'orange'} text={`Tiết: ${stats.hoursCount}`} />
      </div>
    </div>
  );
};

const DroppableCell = ({ id, value, type, isError, onRemove }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { type }
  });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`min-h-[40px] p-2 border border-dashed rounded ${isOver ? 'bg-blue-50 border-blue-500' : 'border-gray-300'} ${isError ? 'bg-red-50 border-red-500' : ''}`}
    >
      {value ? (
        <div className="flex justify-between items-center bg-gray-100 p-1 rounded">
          <span className={value === 'Hết GV chính khả dụng' ? 'text-red-500 font-semibold' : ''}>{value}</span>
          <span className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => onRemove(id, type)}>✕</span>
        </div>
      ) : (
        <span className="text-gray-400 text-xs italic">Thả GV vào đây</span>
      )}
    </div>
  );
};

export default function TimetableCenterPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [registrationLists, setRegistrationLists] = useState([]);
  
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionForm] = Form.useForm();
  
  // Details view state
  const [entries, setEntries] = useState([]);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryForm] = Form.useForm();
  
  const [rows, setRows] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchRegistrationLists();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchEntries(selectedSession.id);
      fetchRows(selectedSession.id);
      if (selectedSession.registration_list_id) {
         fetchLecturers(selectedSession.registration_list_id);
      }
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/timetable/sessions');
      setSessions(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRegistrationLists = async () => {
    try {
      const res = await axios.get('/api/registrations/lists');
      setRegistrationLists(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEntries = async (id) => {
    try {
      const res = await axios.get(`/api/timetable/sessions/${id}/entries`);
      setEntries(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRows = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/timetable/sessions/${id}/rows`);
      setRows(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLecturers = async (list_id) => {
    try {
      const res = await axios.get(`/api/registrations/lists/${list_id}/detailed`);
      // Extract unique lecturers
      const uniqueMap = new Map();
      res.data.forEach(item => {
          if (!uniqueMap.has(item.lecturer_name)) {
              uniqueMap.set(item.lecturer_name, {
                  id: item.lecturer_id || item.lecturer_name,
                  name: item.lecturer_name
              });
          }
      });
      
      setLecturers(Array.from(uniqueMap.values()));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSession = async (values) => {
    try {
      await axios.post('/api/timetable/sessions', values);
      message.success('Đã tạo Đợt xếp lịch');
      setIsSessionModalOpen(false);
      sessionForm.resetFields();
      fetchSessions();
    } catch (e) {
      message.error('Lỗi khi tạo đợt xếp lịch');
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await axios.delete(`/api/timetable/sessions/${id}`);
      message.success('Đã xóa Đợt xếp lịch');
      fetchSessions();
    } catch (e) {
      message.error('Lỗi khi xóa');
    }
  };

  const handleAddEntry = async (values) => {
    try {
      const promises = [];
      const majors = ['CNTT', 'HTTT', 'KHMT'];
      
      for (const major of majors) {
          const batchCode = values[`${major}_batch_code`];
          const semesterIndex = values[`${major}_semester_index`];
          const numClasses = values[`${major}_num_classes`];
          
          if (batchCode && semesterIndex) {
              const payload = {
                  major_code: major,
                  batch_code: batchCode,
                  semester_index: parseInt(semesterIndex, 10),
                  num_classes: parseInt(numClasses || 0, 10)
              };
              promises.push(axios.post(`/api/timetable/sessions/${selectedSession.id}/entries`, payload));
          }
      }
      
      if (promises.length > 0) {
          await Promise.all(promises);
          message.success('Đã thêm phạm vi thành công');
      } else {
          message.warning('Vui lòng nhập ít nhất 1 ngành (Cần nhập Khóa và Kì)');
          return;
      }
      
      setIsEntryModalOpen(false);
      entryForm.resetFields();
      await fetchEntries(selectedSession.id);
      
      // Auto-generate rows immediately as a convenience
      generateRowsAutomatically();
      
    } catch (e) {
      console.log(e);
      const detail = e.response?.data?.detail;
      const errMsg = typeof detail === 'string' ? detail : 
                    (Array.isArray(detail) ? 'Dữ liệu nhập không hợp lệ' : 'Lỗi khi thêm phạm vi');
      message.error(errMsg);
    }
  };

  const generateRowsAutomatically = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/timetable/sessions/${selectedSession.id}/generate`);
      message.success('Đã tự động điền các môn học từ Chương trình đào tạo vào bảng');
      fetchRows(selectedSession.id);
    } catch (e) {
      message.error('Lỗi khi tự động tạo bảng môn học');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await axios.delete(`/api/timetable/sessions/${selectedSession.id}/entries/${entryId}`);
      message.success('Đã xóa phạm vi');
      fetchEntries(selectedSession.id);
    } catch (e) {
      message.error('Lỗi khi xóa phạm vi');
    }
  };

  const handleGenerateRows = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/timetable/sessions/${selectedSession.id}/generate`);
      message.success('Đã tạo bảng Timetable thành công');
      fetchRows(selectedSession.id);
    } catch (e) {
      message.error('Lỗi khi tạo bảng');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSchedule = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/timetable/sessions/${selectedSession.id}/auto-schedule`);
      message.success('Tự động xếp lịch hoàn tất');
      fetchRows(selectedSession.id);
    } catch (e) {
      message.error('Lỗi khi chạy Auto Schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || !active) return;

    const lecturerData = active.data.current;
    if (!lecturerData) return;
    
    // Check constraint before assigning
    if (lecturerData.isOverLimit) {
        message.warning(`Không thể xếp. Trình độ ưu tiên hoặc giới hạn số môn/tiết đã vượt ngưỡng.`);
        return;
    }
    
    const [rowId, type] = String(over.id).split('_');
    const targetRow = rows.find(r => r.id === parseInt(rowId));
    
    // Check slot collision
    const slotTarget = targetRow.shift === "Sáng" ? targetRow.day_morning : targetRow.day_afternoon;
    if (slotTarget) {
         const hasConflict = rows.some(r => 
            r.id !== parseInt(rowId) &&
            ((r.lecturer_name === lecturerData.name) || (r.practice_lecturer_name === lecturerData.name)) &&
            (r.day_morning === slotTarget || r.day_afternoon === slotTarget)
         );
         if (hasConflict) {
             message.error(`Không thể xếp. GV đang bị trùng khung giờ ${slotTarget} ở một lớp khác.`);
             return;
         }
    }

    try {
      const payload = {};
      if (type === 'major') payload.lecturer_name = lecturerData.name;
      if (type === 'practice') payload.practice_lecturer_name = lecturerData.name;
      
      const res = await axios.put(`/api/timetable/rows/${rowId}`, payload);
      setRows(rows.map(r => r.id === res.data.id ? res.data : r));
      message.success('Cập nhật Giảng viên thành công');
    } catch (e) {
      message.error('Lỗi khi cập nhật dòng');
    }
  };

  const handleRemoveLecturer = async (compoundId, type) => {
     const [rowId, _] = compoundId.split('_');
     try {
       const payload = {};
       if (type === 'major') payload.lecturer_name = null;
       if (type === 'practice') payload.practice_lecturer_name = null;
       
       const res = await axios.put(`/api/timetable/rows/${rowId}`, payload);
       setRows(rows.map(r => r.id === res.data.id ? res.data : r));
     } catch (e) {
         message.error('Lỗi xóa giảng viên');
     }
  };
  
  const handleSlotChange = async (rowId, field, value) => {
      try {
       const payload = { [field]: value };
       const res = await axios.put(`/api/timetable/rows/${rowId}`, payload);
       setRows(rows.map(r => r.id === res.data.id ? res.data : r));
     } catch (e) {
         message.error('Lỗi đổi khung giờ');
     }
  };

  // Derive realtime stats
  const lecturerStats = useMemo(() => {
    const stats = {};
    lecturers.forEach(l => {
        stats[l.name] = { classCount: 0, subjectCount: 0, hoursCount: 0, sessionCount: 0, subjects: new Set(), classes: new Set() };
    });
    
    rows.forEach(r => {
        const hours = (r.theory_hours || 0) + (r.practice_hours || 0);
        
        [r.lecturer_name, r.practice_lecturer_name].forEach(name => {
            if (name && name !== 'Hết GV chính khả dụng' && stats[name]) {
                stats[name].classes.add(r.class_name);
                if (r.subject_name) stats[name].subjects.add(r.subject_name);
                stats[name].hoursCount += hours;
                if (r.day_morning || r.day_afternoon) stats[name].sessionCount += 1;
            }
        });
    });
    
    Object.keys(stats).forEach(name => {
        stats[name].classCount = stats[name].classes.size;
        stats[name].subjectCount = stats[name].subjects.size;
    });
    
    return stats;
  }, [rows, lecturers]);

  const sessionColumns = [
    { title: 'Tên Đợt Xếp Lịch', dataIndex: 'name', key: 'name' },
    { title: 'Nguồn Nguyện Vọng', dataIndex: 'registration_list_id', key: 'reg', render: val => registrationLists.find(r => r.list_id === val)?.name || 'N/A' },
    { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', render: date => date ? new Date(date).toLocaleString() : 'N/A' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => setSelectedSession(record)}>Chi tiết</Button>
          <Popconfirm title="Chắc chắn xóa?" onConfirm={() => handleDeleteSession(record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const entryColumns = [
    { title: 'Ngành', dataIndex: 'major_code', key: 'major' },
    { title: 'Khóa', dataIndex: 'batch_code', key: 'batch' },
    { title: 'HK (trong CTĐT)', dataIndex: 'semester_index', key: 'sem' },
    { title: 'Số lớp', dataIndex: 'num_classes', key: 'num' },
    {
      title: '',
      key: 'act',
      render: (_, r) => (
        <Popconfirm title="Xóa?" onConfirm={() => handleDeleteEntry(r.id)}>
           <Button danger type="text" icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      )
    }
  ];

  const rowColumns = [
    { title: 'STT', dataIndex: 'row_index', width: 60, fixed: 'left' },
    { title: 'Tên lớp', dataIndex: 'class_name', width: 120, fixed: 'left' },
    { 
        title: 'Buổi', 
        dataIndex: 'shift', 
        width: 100,
        render: (text, record) => (
             <Select 
                value={text} 
                size="small"
                onChange={(v) => handleSlotChange(record.id, 'shift', v)}
                options={[{label: 'Sáng', value: 'Sáng'}, {label: 'Chiều', value: 'Chiều'}]} 
             />
        )
    },
    { title: 'Tên học phần', dataIndex: 'subject_name', width: 220 },
    { title: 'TC', dataIndex: 'credits', width: 60 },
    { title: 'LT', dataIndex: 'theory_hours', width: 60 },
    { title: 'TH', dataIndex: 'practice_hours', width: 60 },
    { 
       title: 'GV chính', 
       width: 200,
       dataIndex: 'lecturer_name',
       render: (val, record) => <DroppableCell id={`${record.id}_major`} type="major" value={val} isError={val === 'Hết GV chính khả dụng'} onRemove={handleRemoveLecturer} />
    },
    { 
       title: 'GV Thực hành', 
       width: 200,
       dataIndex: 'practice_lecturer_name',
       render: (val, record) => <DroppableCell id={`${record.id}_practice`} type="practice" value={val} isError={false} onRemove={handleRemoveLecturer} />
    },
    { 
        title: 'Thứ - Sáng', 
        dataIndex: 'day_morning',
        width: 120,
        render: (val, record) => record.shift === 'Sáng' ? (
           <Select allowClear value={val} size="small" className="w-full" onChange={(v) => handleSlotChange(record.id, 'day_morning', v)}>
               {[2,3,4,5,6,7].map(d => <Select.Option key={d} value={`S-T${d}`}>S-T{d}</Select.Option>)}
           </Select>
        ) : '-'
    },
    { 
        title: 'Thứ - Chiều', 
        dataIndex: 'day_afternoon',
        width: 120,
        render: (val, record) => record.shift === 'Chiều' ? (
           <Select allowClear value={val} size="small" className="w-full" onChange={(v) => handleSlotChange(record.id, 'day_afternoon', v)}>
               {[2,3,4,5,6,7].map(d => <Select.Option key={d} value={`C-T${d}`}>C-T{d}</Select.Option>)}
           </Select>
        ) : '-'
    },
  ];

  if (!selectedSession) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={2} className="m-0">Quản lý Đợt Xếp Lịch</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsSessionModalOpen(true)}>
            Tạo Đợt Mới
          </Button>
        </div>
        
        <Table columns={sessionColumns} dataSource={sessions} rowKey="id" />

        <Modal forceRender title="Tạo Đợt Xếp Lịch" open={isSessionModalOpen} onOk={() => { sessionForm.validateFields().then(handleCreateSession).catch(e => console.log('Validate failed:', e)); }} onCancel={() => setIsSessionModalOpen(false)}>
          <Form form={sessionForm} layout="vertical">
            <Form.Item name="name" label="Tên Đợt (VD: HK2 2025-2026)" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="registration_list_id" label="Nguồn Nguyện Vọng" rules={[{ required: true }]}>
              <Select>
                {registrationLists.map(rl => <Select.Option key={rl.list_id} value={rl.list_id}>{rl.name}</Select.Option>)}
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  // Session Detail view
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-10">
        <Space size="large">
          <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedSession(null)}>Quay lại</Button>
          <Title level={4} className="m-0">{selectedSession.name}</Title>
        </Space>
        
        <Space>
           <Button icon={<RocketOutlined />} type="primary" onClick={handleGenerateRows} loading={loading}>1. Sinh Bảng TKB</Button>
           <Button icon={<SettingOutlined />} onClick={handleAutoSchedule} loading={loading} className="bg-purple-600 outline-none text-white hover:!text-white hover:!bg-purple-700">2. Auto Schedule</Button>
           <Button icon={<DownloadOutlined />}>3. Export Excel</Button>
        </Space>
      </div>

      <Layout className="flex-1 overflow-hidden">
        <DndContext onDragEnd={handleDragEnd}>
        <Content className="p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
           {/* Scope definition block */}
           {rows.length === 0 && (
           <Card size="small" title="1. Phạm vi xếp lịch (Chưa có dữ liệu sinh)" className="shadow-sm">
               <Table 
                   columns={entryColumns} 
                   dataSource={entries} 
                   rowKey="id" 
                   pagination={false} 
                   size="small"
                   className="mb-4"
               />
               <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setIsEntryModalOpen(true)}>Thêm phạm vi ngành/khóa</Button>
           </Card>
           )}

           {/* Table block */}
           {rows.length > 0 && (
           <Space direction="vertical" className="w-full relative shadow-sm border rounded bg-white">
                  <Spin spinning={loading}>
                    <Table 
                        dataSource={rows}
                        columns={rowColumns}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        scroll={{ y: 'calc(100vh - 200px)', x: 1400 }}
                        rowClassName={(record) => (!record.lecturer_name || record.lecturer_name === 'Hết GV chính khả dụng') ? 'bg-red-50' : 'bg-green-50'}
                    />
                  </Spin>
           </Space>
           )}
        </Content>

        {rows.length > 0 && (
        <Sider width={300} theme="light" className="border-l overflow-y-auto p-4 bg-gray-50" style={{ height: 'calc(100vh - 64px)' }}>
            <Title level={5}>Pool Giảng Viên</Title>
            <Text type="secondary" className="text-xs mb-4 block">Kéo thả giảng viên vào ô tương ứng trong bảng lịch.</Text>
            
            <div className="flex flex-col gap-1 pr-1">
                {lecturers.map(l => {
                    const stats = lecturerStats[l.name];
                    const isOverLimit = stats.classCount >= 10 || stats.subjectCount >= 3 || stats.hoursCount >= 250;
                    return <DraggableLecturer key={l.id} lecturer={l} stats={stats} isOverLimit={isOverLimit} />;
                })}
            </div>
        </Sider>
        )}
        </DndContext>
      </Layout>

      <Modal forceRender title="Thêm Phạm Vi Đào Tạo" open={isEntryModalOpen} onOk={() => { entryForm.validateFields().then(handleAddEntry).catch(e => console.log('Validate failed:', e)); }} onCancel={() => setIsEntryModalOpen(false)} width={600}>
          <Form form={entryForm} layout="horizontal" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
             <p className="text-gray-500 mb-4 text-sm">Nhập thông tin khóa, kì cho các ngành cần xếp lịch. Bỏ trống các ngành không cần xếp.</p>
             {['CNTT', 'HTTT', 'KHMT'].map(major => (
                 <Card size="small" key={major} className="mb-4 shadow-sm border-gray-200">
                    <div className="font-semibold text-blue-800 mb-3 border-b pb-1">{major}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Form.Item name={`${major}_batch_code`} label="Khóa" className="mb-0">
                           <Input placeholder="VD: 19" />
                        </Form.Item>
                        <Form.Item name={`${major}_semester_index`} label="Kì" className="mb-0">
                           <Input type="number" placeholder="VD: 1" />
                        </Form.Item>
                        <Form.Item name={`${major}_num_classes`} label="Số lớp" className="mb-0">
                           <Input type="number" placeholder="VD: 6" />
                        </Form.Item>
                    </div>
                 </Card>
             ))}
          </Form>
      </Modal>
    </div>
  );
}
