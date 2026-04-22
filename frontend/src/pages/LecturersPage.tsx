import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Upload, Empty, Drawer, Tabs, Tag, Descriptions, Spin, Badge } from 'antd';
import { PlusOutlined, CloudUploadOutlined, SearchOutlined, UserOutlined, BookOutlined, CalendarOutlined, ScheduleOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

interface Lecturer {
  lecturer_id: number;
  lecturer_code: string;
  full_name: string;
  type: string;
  max_quota: number;
}

interface RegistrationItem {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  is_main_lecturer: boolean;
  list_id: number;
  list_name: string;
}

interface TimetableRowItem {
  row_id: number;
  session_id: number;
  plan_name: string;
  class_name: string;
  subject_code: string;
  subject_name: string;
  theory_hours: number;
  practice_hours: number;
  fixed_shift: string | null;
  morning_day: string | null;
  afternoon_day: string | null;
  role: string;
}

interface TimetableSessionItem {
  session_id: number;
  plan_name: string;
  status: string;
}

interface TimetableInfo {
  sessions: TimetableSessionItem[];
  rows: TimetableRowItem[];
  summary: {
    total_classes: number;
    total_subjects: number;
    total_hours: number;
    slots: string[];
  };
}

interface RegList {
  list_id: number;
  list_name: string;
}

// --- Weekly Grid Component ---
const WeeklySlotGrid = ({ slots, totalSlots = 12 }: { slots: string[]; totalSlots?: number }) => {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const shifts = ['Sáng', 'Chiều'];
  const slotSet = new Set(slots);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        <span>Buổi đã xếp: <strong style={{ color: 'var(--color-primary)' }}>{slots.length}</strong>/{totalSlots}</span>
        <span>Trống: <strong style={{ color: 'var(--color-success, #52c41a)' }}>{totalSlots - slots.length}</strong> buổi</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 6px', borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, width: '60px' }}></th>
            {days.map(d => (
              <th key={d} style={{ padding: '8px 4px', borderBottom: '2px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shifts.map(shift => (
            <tr key={shift}>
              <td style={{ padding: '10px 6px', borderBottom: '1px solid var(--color-border-light)', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '11px' }}>{shift}</td>
              {days.map(day => {
                const label = `${shift} ${day}`;
                const isOccupied = slotSet.has(label);
                return (
                  <td key={day} style={{ padding: '6px 4px', borderBottom: '1px solid var(--color-border-light)', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-md)', margin: '0 auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isOccupied ? 'var(--color-primary)' : 'var(--color-bg)',
                        color: isOccupied ? 'white' : 'var(--color-text-muted)',
                        fontWeight: isOccupied ? 700 : 400,
                        fontSize: '10px',
                        border: isOccupied ? 'none' : '1px dashed var(--color-border)',
                        transition: 'background 0.15s',
                      }}
                      title={isOccupied ? `Đã xếp: ${label}` : `Trống: ${label}`}
                    >
                      {isOccupied ? '✓' : '–'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {slots.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {slots.map(s => (
            <Tag key={s} color="orange" style={{ fontSize: '11px', margin: 0 }}>{s}</Tag>
          ))}
        </div>
      )}
    </div>
  );
};


const LecturersPage: React.FC = () => {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');

  // File upload
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // Profile Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);

  // Profile Tabs Data
  const [regLists, setRegLists] = useState<RegList[]>([]);
  const [selectedRegListId, setSelectedRegListId] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const [timetableInfo, setTimetableInfo] = useState<TimetableInfo | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [loadingTimetable, setLoadingTimetable] = useState(false);

  const [form] = Form.useForm();

  const fetchLecturers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/lecturers/');
      setLecturers(response.data);
    } catch {
      message.error('Không thể tải danh sách giảng viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLecturers(); }, []);

  // --- Profile Logic ---
  const openProfile = useCallback(async (lecturer: Lecturer) => {
    setSelectedLecturer(lecturer);
    setDrawerOpen(true);
    setRegistrations([]);
    setTimetableInfo(null);
    setSelectedRegListId(null);
    setSelectedSessionId(null);

    // Load registration lists for filter dropdown
    try {
      const res = await apiClient.get('/registrations/lists');
      setRegLists(res.data);
    } catch { /* ignore */ }

    // Load all registrations (no filter)
    fetchRegistrations(lecturer.lecturer_id);
    // Load all timetable info (no filter)
    fetchTimetableInfo(lecturer.lecturer_id);
  }, []);

  const fetchRegistrations = async (lecturerId: number, listId?: number) => {
    setLoadingRegs(true);
    try {
      const params = listId ? { list_id: listId } : {};
      const res = await apiClient.get(`/lecturers/${lecturerId}/registrations`, { params });
      setRegistrations(res.data);
    } catch {
      message.error('Lỗi tải dữ liệu phân công');
    } finally {
      setLoadingRegs(false);
    }
  };

  const fetchTimetableInfo = async (lecturerId: number, sessionId?: number) => {
    setLoadingTimetable(true);
    try {
      const params = sessionId ? { session_id: sessionId } : {};
      const res = await apiClient.get(`/lecturers/${lecturerId}/timetable-info`, { params });
      setTimetableInfo(res.data);
    } catch {
      message.error('Lỗi tải dữ liệu lịch dạy');
    } finally {
      setLoadingTimetable(false);
    }
  };

  const handleRegListChange = (listId: number | null) => {
    setSelectedRegListId(listId);
    if (selectedLecturer) {
      fetchRegistrations(selectedLecturer.lecturer_id, listId || undefined);
    }
  };

  const handleSessionChange = (sessionId: number | null) => {
    setSelectedSessionId(sessionId);
    if (selectedLecturer) {
      fetchTimetableInfo(selectedLecturer.lecturer_id, sessionId || undefined);
    }
  };


  // --- CRUD Logic ---
  const handleAdd = async (values: any) => {
    setSubmitting(true);
    try {
      await apiClient.post('/lecturers/', values);
      message.success('Thêm giảng viên thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchLecturers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi thêm giảng viên. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewUpload = async (options: any) => {
    const { file } = options;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const response = await apiClient.post('/lecturers/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(response.data);
      setIsPreviewOpen(true);
      message.success(`Đọc thành công ${response.data.length} giảng viên`);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi đọc file Excel');
    } finally {
      setUploading(false);
      setFileList([]);
    }
  };

  const confirmImport = async () => {
    setUploading(true);
    try {
      const res = await apiClient.post('/lecturers/import/commit', previewData);
      message.success(res.data.message);
      setIsPreviewOpen(false);
      fetchLecturers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi ghi dữ liệu');
    } finally {
      setUploading(false);
    }
  };

  const filteredLecturers = lecturers.filter(l =>
    l.lecturer_code.toLowerCase().includes(searchText.toLowerCase()) ||
    l.full_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'STT', width: 60, align: 'center' as const, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Mã GV', dataIndex: 'lecturer_code', width: 140 },
    { title: 'Họ và tên', dataIndex: 'full_name', ellipsis: true },
    { title: 'Phân loại', dataIndex: 'type', width: 120 },
    { title: 'Chỉ tiêu (tiết)', dataIndex: 'max_quota', width: 120, align: 'center' as const, className: 'tabular-nums' },
  ];

  const previewColumns = [
    { title: 'Mã GV', dataIndex: 'lecturer_code' },
    { title: 'Họ và tên', dataIndex: 'full_name' },
    { title: 'Loại GV', dataIndex: 'type' },
  ];

  // --- Registration Tab Columns ---
  const regColumns = [
    { title: 'Mã môn', dataIndex: 'subject_code', width: 100 },
    { title: 'Tên môn học', dataIndex: 'subject_name', ellipsis: true },
    { title: 'TC', dataIndex: 'credits', width: 50, align: 'center' as const },
    { 
      title: 'Vai trò', width: 80, align: 'center' as const,
      render: (_: any, r: RegistrationItem) => (
        <Tag color={r.is_main_lecturer ? 'blue' : 'default'} style={{ fontSize: '11px', margin: 0 }}>
          {r.is_main_lecturer ? 'LT' : 'TH'}
        </Tag>
      )
    },
  ];

  // --- Timetable Tab Columns ---
  const ttColumns = [
    { title: 'Lớp', dataIndex: 'class_name', width: 110 },
    { title: 'Mã môn', dataIndex: 'subject_code', width: 90 },
    { title: 'Tên môn', dataIndex: 'subject_name', ellipsis: true },
    {
      title: 'Buổi', width: 80, align: 'center' as const,
      render: (_: any, r: TimetableRowItem) => (
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)' }}>
          {r.morning_day || r.afternoon_day || '–'}
        </span>
      )
    },
    {
      title: 'Vai trò', width: 60, align: 'center' as const,
      render: (_: any, r: TimetableRowItem) => (
        <Tag color={r.role === 'LT' ? 'blue' : 'default'} style={{ fontSize: '11px', margin: 0 }}>{r.role}</Tag>
      )
    },
    {
      title: 'Tiết', width: 60, align: 'center' as const, className: 'tabular-nums',
      render: (_: any, r: TimetableRowItem) => r.role === 'LT' ? r.theory_hours : r.practice_hours
    },
  ];

  return (
    <div style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Danh sách Giảng viên</h2>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{filteredLecturers.length} giảng viên</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Upload
            customRequest={handlePreviewUpload}
            showUploadList={false}
            fileList={fileList}
            accept=".xlsx"
          >
            <Button icon={<CloudUploadOutlined />} loading={uploading}>
              Import Excel
            </Button>
          </Upload>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Thêm Giảng viên
          </Button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
          placeholder="Tìm theo mã hoặc tên giảng viên…"
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 360 }}
          name="search-lecturers"
          autoComplete="off"
        />
      </div>

      {/* Table */}
      <div style={{ padding: '0 24px 24px' }}>
        <Table
          dataSource={filteredLecturers}
          columns={columns}
          rowKey="lecturer_id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (total) => `${total} kết quả` }}
          size="middle"
          locale={{ emptyText: <Empty description="Chưa có giảng viên nào" /> }}
          onRow={(record) => ({
            onClick: () => openProfile(record),
            style: { cursor: 'pointer' },
          })}
          rowClassName={() => 'lecturer-row-hover'}
        />
      </div>

      {/* ===== PROFILE DRAWER ===== */}
      <Drawer
        title={null}
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {selectedLecturer && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Profile Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'var(--color-primary)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 700, flexShrink: 0,
                }}>
                  {selectedLecturer.full_name.charAt(selectedLecturer.full_name.lastIndexOf(' ') + 1)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                    {selectedLecturer.full_name}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {selectedLecturer.lecturer_code}
                  </span>
                </div>
              </div>
              <Descriptions size="small" column={2} style={{ fontSize: '13px' }}>
                <Descriptions.Item label="Phân loại">
                  <Tag color={selectedLecturer.type === 'Cơ hữu' ? 'green' : 'purple'} style={{ margin: 0 }}>
                    {selectedLecturer.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Chỉ tiêu">
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>{selectedLecturer.max_quota} tiết</span>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Tabs */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Tabs
                defaultActiveKey="regs"
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                tabBarStyle={{ padding: '0 24px', margin: 0 }}
                items={[
                  {
                    key: 'regs',
                    label: <span><BookOutlined /> Môn dạy</span>,
                    children: (
                      <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                        <Select
                          style={{ width: '100%', marginBottom: '12px' }}
                          placeholder="Tất cả phiên bản"
                          allowClear
                          value={selectedRegListId}
                          onChange={handleRegListChange}
                          options={regLists.map(l => ({ label: l.list_name, value: l.list_id }))}
                        />
                        <Spin spinning={loadingRegs}>
                          {registrations.length === 0 && !loadingRegs ? (
                            <Empty description="Chưa có phân công nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          ) : (
                            <>
                              <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                {registrations.length} phân công ·{' '}
                                {registrations.filter(r => r.is_main_lecturer).length} LT,{' '}
                                {registrations.filter(r => !r.is_main_lecturer).length} TH
                              </div>
                              <Table
                                dataSource={registrations}
                                columns={regColumns}
                                rowKey={(r) => `${r.subject_id}-${r.list_id}-${r.is_main_lecturer}`}
                                pagination={false}
                                size="small"
                                scroll={{ y: 300 }}
                              />
                            </>
                          )}
                        </Spin>
                      </div>
                    ),
                  },
                  {
                    key: 'timetable',
                    label: <span><CalendarOutlined /> Lịch dạy</span>,
                    children: (
                      <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                        <Select
                          style={{ width: '100%', marginBottom: '12px' }}
                          placeholder="Tất cả TKB"
                          allowClear
                          value={selectedSessionId}
                          onChange={handleSessionChange}
                          options={timetableInfo?.sessions.map(s => ({ label: `${s.plan_name} (${s.status})`, value: s.session_id })) || []}
                        />
                        <Spin spinning={loadingTimetable}>
                          {timetableInfo && timetableInfo.rows.length > 0 ? (
                            <>
                              {/* Summary Bar */}
                              <div style={{
                                display: 'flex', gap: '12px', marginBottom: '12px', padding: '10px 12px',
                                background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: '12px',
                                border: '1px solid var(--color-border-light)',
                              }}>
                                <span>{timetableInfo.summary.total_classes} <strong>lớp</strong></span>
                                <span>·</span>
                                <span>{timetableInfo.summary.total_subjects} <strong>môn</strong></span>
                                <span>·</span>
                                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                  {timetableInfo.summary.total_hours}/{selectedLecturer.max_quota} tiết
                                </span>
                                <span>·</span>
                                <span>{timetableInfo.summary.slots.length}/12 <strong>buổi</strong></span>
                              </div>
                              <Table
                                dataSource={timetableInfo.rows}
                                columns={ttColumns}
                                rowKey="row_id"
                                pagination={false}
                                size="small"
                                scroll={{ y: 260 }}
                              />
                            </>
                          ) : (
                            !loadingTimetable && <Empty description="Chưa có lịch dạy nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          )}
                        </Spin>
                      </div>
                    ),
                  },
                  {
                    key: 'weekly',
                    label: <span><ScheduleOutlined /> Lịch tuần</span>,
                    children: (
                      <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                        <Select
                          style={{ width: '100%', marginBottom: '16px' }}
                          placeholder="Tất cả TKB"
                          allowClear
                          value={selectedSessionId}
                          onChange={handleSessionChange}
                          options={timetableInfo?.sessions.map(s => ({ label: `${s.plan_name} (${s.status})`, value: s.session_id })) || []}
                        />
                        <Spin spinning={loadingTimetable}>
                          {timetableInfo ? (
                            <WeeklySlotGrid slots={timetableInfo.summary.slots} />
                          ) : (
                            !loadingTimetable && <Empty description="Chưa có dữ liệu lịch" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          )}
                        </Spin>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Import Preview Modal */}
      <Modal
        title="Xác nhận Import Giảng viên"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        onOk={confirmImport}
        confirmLoading={uploading}
        width={800}
        okText="Xác nhận Import"
        cancelText="Hủy"
      >
        <p style={{ marginBottom: '16px', color: 'var(--color-success)', fontWeight: 500 }}>
          Tìm thấy {previewData.length} bản ghi hợp lệ. Bấm xác nhận để ghi vào hệ thống.
        </p>
        <Table
          dataSource={previewData}
          columns={previewColumns}
          rowKey="lecturer_code"
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* Add Modal */}
      <Modal
        title="Thêm Giảng viên Mới"
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Lưu Giảng viên"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="lecturer_code" label="Mã giảng viên" rules={[{ required: true, message: 'Vui lòng nhập mã GV' }]}>
            <Input placeholder="VD: DN01800012…" name="lecturer_code" autoComplete="off" spellCheck={false} />
          </Form.Item>
          <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="VD: Nguyễn Văn A…" name="full_name" autoComplete="off" />
          </Form.Item>
          <Form.Item name="type" label="Loại giảng viên" rules={[{ required: true }]} initialValue="Cơ hữu">
            <Select options={[
              { value: 'Cơ hữu', label: 'Cơ hữu' },
              { value: 'Thỉnh giảng', label: 'Thỉnh giảng' },
            ]} />
          </Form.Item>
          <Form.Item name="max_quota" label="Chỉ tiêu số tiết">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Row hover style */}
      <style>{`
        .lecturer-row-hover:hover td {
          background: var(--color-primary-bg, #fff7f0) !important;
        }
      `}</style>
    </div>
  );
};

export default LecturersPage;
