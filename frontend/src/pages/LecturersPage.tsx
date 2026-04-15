import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Upload } from 'antd';
import { UploadOutlined, CloudUploadOutlined } from '@ant-design/icons';
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
  
  // States for File Upload and Preview
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
    } catch (error) {
      message.error('Lỗi khi tải danh sách giảng viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLecturers();
  }, []);

  const handleAdd = async (values: any) => {
    try {
      await apiClient.post('/lecturers/', values);
      message.success('Thêm giảng viên thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchLecturers();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi thêm giảng viên');
    }
  };

  // Upload Logic
  const handlePreviewUpload = async (options: any) => {
    const { file } = options;
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const response = await apiClient.post('/lecturers/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setPreviewData(response.data);
      setIsPreviewOpen(true);
      message.success(`Đọc thành công ${response.data.length} giảng viên, vui lòng kiểm tra!`);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi đọc file Excel');
    } finally {
      setUploading(false);
      setFileList([]); // Clear file list to allow re-upload
    }
  };

  const confirmImport = async () => {
    setUploading(true);
    try {
      const res = await apiClient.post('/lecturers/import/commit', previewData);
      message.success(res.data.message);
      setIsPreviewOpen(false);
      fetchLecturers(); // Refresh Dữ liệu bảng chính
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi ghi dữ liệu');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'lecturer_id', key: 'lecturer_id' },
    { title: 'Mã Giảng viên', dataIndex: 'lecturer_code', key: 'lecturer_code' },
    { title: 'Họ và tên', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Phân loại', dataIndex: 'type', key: 'type' },
    { title: 'Chỉ tiêu số tiết', dataIndex: 'max_quota', key: 'max_quota' },
  ];

  const previewColumns = [
    { title: 'Mã Giảng viên', dataIndex: 'lecturer_code', key: 'lecturer_code' },
    { title: 'Họ và tên', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Loại GV', dataIndex: 'type', key: 'type' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Danh sách Giảng viên</h2>
        <div className="flex space-x-3">
          <Upload 
            customRequest={handlePreviewUpload} 
            showUploadList={false} 
            fileList={fileList}
            accept=".xlsx"
          >
            <Button icon={<CloudUploadOutlined />} loading={uploading} className="border-blue-500 text-blue-500">
              Import Excel
            </Button>
          </Upload>
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
            Thêm mới
          </Button>
        </div>
      </div>

      <Table 
        dataSource={lecturers} 
        columns={columns} 
        rowKey="lecturer_id"
        loading={loading}
        pagination={{ pageSize: 15 }}
      />

      {/* Modal Import Preview */}
      <Modal 
        title="Xác nhận Import Dữ liệu Giảng Viên" 
        open={isPreviewOpen} 
        onCancel={() => setIsPreviewOpen(false)} 
        onOk={confirmImport}
        confirmLoading={uploading}
        width={800}
        okText="Xác nhận Import"
        cancelText="Hủy bỏ"
      >
        <p className="mb-4 text-emerald-600 font-medium">Tìm thấy {previewData.length} bản ghi hợp lệ. Bấm xác nhận để ghi đè vào hệ thống.</p>
        <Table 
          dataSource={previewData} 
          columns={previewColumns} 
          rowKey="lecturer_code"
          pagination={{ pageSize: 10 }}
          size="small"
          scroll={{ y: 300 }}
        />
      </Modal>

      <Modal title="Thêm giảng viên mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="lecturer_code" label="Mã giảng viên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Loại giảng viên" rules={[{ required: true }]} initialValue="Cơ hữu">
            <Select>
              <Select.Option value="Cơ hữu">Cơ hữu</Select.Option>
              <Select.Option value="Thỉnh giảng">Thỉnh giảng</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="max_quota" label="Chỉ tiêu số tiết/buổi">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LecturersPage;
