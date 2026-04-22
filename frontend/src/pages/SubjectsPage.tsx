import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Empty } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
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
  const [form] = Form.useForm();

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/subjects/');
      setSubjects(response.data);
    } catch {
      message.error('Không thể tải danh sách môn học. Vui lòng thử lại.');
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
      message.success('Thêm môn học thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchSubjects();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi thêm môn học. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubjects = subjects.filter(s =>
    s.subject_code.toLowerCase().includes(searchText.toLowerCase()) ||
    s.subject_name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { title: 'STT', width: 60, align: 'center' as const, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Mã học phần', dataIndex: 'subject_code', width: 130 },
    { title: 'Tên môn học', dataIndex: 'subject_name', ellipsis: true },
    { title: 'Số TC', dataIndex: 'credits', width: 75, align: 'center' as const, className: 'tabular-nums' },
    { title: 'Trọng số (LT-TH)', width: 130, align: 'center' as const, render: (_: any, record: Subject) => `${record.theory_credits || 0} – ${record.practice_credits || 0}` },
    { title: 'Tiết LT', dataIndex: 'theory_hours', width: 80, align: 'center' as const, className: 'tabular-nums' },
    { title: 'Tiết TH', dataIndex: 'practice_hours', width: 80, align: 'center' as const, className: 'tabular-nums' },
  ];

  return (
    <div style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Danh sách Môn học</h2>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{filteredSubjects.length} môn học</span>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Thêm Môn học
        </Button>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
          placeholder="Tìm theo mã hoặc tên môn học…"
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
          locale={{ emptyText: <Empty description="Chưa có môn học nào" /> }}
        />
      </div>

      {/* Add Modal */}
      <Modal
        title="Thêm Môn học Mới"
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="Lưu Môn học"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="subject_code" label="Mã học phần" rules={[{ required: true, message: 'Vui lòng nhập mã học phần' }]}>
            <Input placeholder="VD: FIT4001…" name="subject_code" autoComplete="off" spellCheck={false} />
          </Form.Item>
          <Form.Item name="subject_name" label="Tên môn học" rules={[{ required: true, message: 'Vui lòng nhập tên môn học' }]}>
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
    </div>
  );
};

export default SubjectsPage;
