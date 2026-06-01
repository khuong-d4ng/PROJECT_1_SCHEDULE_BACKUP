import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Empty, Drawer, Descriptions, Tag, Space } from 'antd';
import { PlusOutlined, SearchOutlined, BookOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  theory_hours: number;
  practice_hours: number;
  theory_credits?: number;
  practice_credits?: number;
}

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editForm] = Form.useForm();
  const form = Form.useForm()[0];
  const watchTheory = Form.useWatch('theory_credits', editForm) || 0;
  const watchPractice = Form.useWatch('practice_credits', editForm) || 0;

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/subjects/');
      setSubjects(response.data);
    } catch {
      message.error('Không thể tải danh sách học phần. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAdd = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        theory_hours: (values.theory_credits || 0) * 15,
        practice_hours: (values.practice_credits || 0) * 15
      };
      await apiClient.post('/subjects/', payload);
      message.success('Thêm học phần thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchSubjects();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi thêm học phần. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };
  const openProfile = (subject: Subject) => {
    setSelectedSubject(subject);
    setDrawerOpen(true);
    editForm.setFieldsValue(subject);
  };

  const handleUpdate = async (values: any) => {
    if (!selectedSubject) return;
    
    Modal.confirm({
      title: 'Xác nhận lưu thay đổi?',
      content: 'Thông tin học phần sẽ được cập nhật trên toàn hệ thống.',
      okText: 'Lưu',
      cancelText: 'Hủy',
      onOk: async () => {
        setSubmitting(true);
        try {
          const payload = {
            ...values,
            theory_hours: (values.theory_credits || 0) * 15,
            practice_hours: (values.practice_credits || 0) * 15
          };
          await apiClient.put(`/subjects/${selectedSubject.subject_id}`, payload);
          message.success('Cập nhật học phần thành công');
          setDrawerOpen(false);
          fetchSubjects();
        } catch (error: any) {
          message.error(error.response?.data?.detail || 'Lỗi khi cập nhật học phần.');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const filteredSubjects = subjects.filter(s =>
    s.subject_code.toLowerCase().includes(searchText.toLowerCase()) ||
    s.subject_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'STT', width: 60, align: 'center' as const, render: (_: any, __: any, i: number) => i + 1 },
    { 
      title: 'Mã học phần', dataIndex: 'subject_code', width: 130,
      sorter: (a: Subject, b: Subject) => (a.subject_code || '').localeCompare(b.subject_code || '')
    },
    { 
      title: 'Tên học phần', dataIndex: 'subject_name', ellipsis: true,
      sorter: (a: Subject, b: Subject) => (a.subject_name || '').localeCompare(b.subject_name || '')
    },
    { 
      title: 'Số TC', dataIndex: 'credits', width: 75, align: 'center' as const, className: 'tabular-nums',
      sorter: (a: Subject, b: Subject) => (a.credits || 0) - (b.credits || 0)
    },
    { 
      title: 'Trọng số (LT-TH)', width: 130, align: 'center' as const, 
      render: (_: any, record: Subject) => `${record.theory_credits || 0} – ${record.practice_credits || 0}` 
    },
    { 
      title: 'Tiết LT', dataIndex: 'theory_hours', width: 80, align: 'center' as const, className: 'tabular-nums',
      sorter: (a: Subject, b: Subject) => (a.theory_hours || 0) - (b.theory_hours || 0)
    },
    { 
      title: 'Tiết TH', dataIndex: 'practice_hours', width: 80, align: 'center' as const, className: 'tabular-nums',
      sorter: (a: Subject, b: Subject) => (a.practice_hours || 0) - (b.practice_hours || 0)
    },
  ];

  return (
    <div style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Danh sách Học phần</h2>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{filteredSubjects.length} học phần</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Thêm Học phần
        </Button>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
          placeholder="Tìm theo mã hoặc tên học phần…"
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 360 }}
          name="search-subjects"
          autoComplete="off"
        />
      </div>

      {/* Table */}
      <div style={{ padding: '0 24px 24px' }}>
        <Table
          dataSource={filteredSubjects}
          columns={columns}
          rowKey="subject_id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (total) => `${total} kết quả` }}
          scroll={{ y: 500 }}
          size="middle"
          locale={{ emptyText: <Empty description="Chưa có học phần nào" /> }}
          showSorterTooltip={false}
          onRow={(record) => ({
            onClick: () => openProfile(record),
            style: { cursor: 'pointer' },
          })}
          rowClassName={() => 'subject-row-hover'}
        />
      </div>

      {/* Add Modal */}
      <Modal
        title="Thêm Học phần Mới"
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Lưu Học phần"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="subject_code" label="Mã học phần" rules={[{ required: true, message: 'Vui lòng nhập mã học phần' }]}>
            <Input placeholder="VD: FIT4001…" name="subject_code" autoComplete="off" spellCheck={false} />
          </Form.Item>
          <Form.Item name="subject_name" label="Tên học phần" rules={[{ required: true, message: 'Vui lòng nhập tên học phần' }]}>
            <Input placeholder="VD: Nhập môn Công nghệ Thông tin…" name="subject_name" autoComplete="off" />
          </Form.Item>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item style={{ flex: 1 }} name="credits" label="Tổng Tín Chỉ" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item style={{ flex: 1 }} name="theory_credits" label="TC Lý Thuyết" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item style={{ flex: 1 }} name="practice_credits" label="TC Thực Hành" initialValue={0}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'var(--color-bg)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
            Số tiết sẽ tự động tính: TC × 15. (VD: 2 TC LT = 30 tiết LT)
          </div>
        </Form>
      </Modal>

      {/* ===== PROFILE DRAWER ===== */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 20 }}>
            <span><BookOutlined /> Chi tiết Học phần</span>
            <Space>
              <Button icon={<CloseOutlined />} onClick={() => setDrawerOpen(false)} size="small" type="text" />
            </Space>
          </div>
        }
        placement="right"
        width={500}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        closable={false}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Đóng</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={() => editForm.submit()} loading={submitting}>
              Lưu thay đổi
            </Button>
          </Space>
        }
      >
        {selectedSubject && (
          <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
            <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', border: '1px solid var(--color-border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Mã học phần</div>
              <Form.Item name="subject_code" noStyle rules={[{ required: true }]}>
                <Input variant="borderless" style={{ fontSize: '18px', fontWeight: 700, padding: 0, color: 'var(--color-primary)' }} />
              </Form.Item>
            </div>

            <Form.Item name="subject_name" label="Tên học phần" rules={[{ required: true }]}>
              <Input placeholder="Tên học phần" />
            </Form.Item>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item style={{ flex: 1 }} name="credits" label="Tổng Tín Chỉ" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item style={{ flex: 1 }} name="theory_credits" label="TC Lý Thuyết">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item style={{ flex: 1 }} name="practice_credits" label="TC Thực Hành">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Descriptions title="Thông tin tính toán" column={2} bordered size="small" style={{ marginTop: '20px' }}>
              <Descriptions.Item label="Tiết Lý thuyết">
                <Tag color="blue">{watchTheory * 15} tiết</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tiết Thực hành">
                <Tag color="cyan">{watchPractice * 15} tiết</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '24px', padding: '12px', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)', fontSize: '12px' }}>
              <strong>Lưu ý:</strong> Thay đổi thông tin học phần sẽ ảnh hưởng đến tất cả các bảng dữ liệu liên quan (Khung chương trình, Đăng ký giảng dạy, v.v.)
            </div>
          </Form>
        )}
      </Drawer>

      <style>{`
        .subject-row-hover:hover td {
          background: var(--color-primary-bg, #fff7f0) !important;
        }
      `}</style>
    </div>
  );
};

export default SubjectsPage;
