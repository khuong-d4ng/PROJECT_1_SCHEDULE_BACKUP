import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Upload, Empty } from 'antd';
import { PlusOutlined, CloudUploadOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

interface Lecturer {
  lecturer_id: number;
  lecturer_code: string;
  full_name: string;
  type: string;
  max_quota: number;
}

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

  useEffect(() => {
    fetchLecturers();
  }, []);

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
        />
      </div>

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
    </div>
  );
};

export default LecturersPage;
