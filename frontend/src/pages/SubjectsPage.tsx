import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message } from 'antd';
import apiClient from '../api/client';

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  theory_hours: number;
  practice_hours: number;
}

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/subjects/');
      setSubjects(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAdd = async (values: any) => {
    try {
      await apiClient.post('/subjects/', values);
      message.success('Thêm môn học thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchSubjects();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Lỗi khi thêm môn học');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'subject_id', key: 'subject_id' },
    { title: 'Mã học phần', dataIndex: 'subject_code', key: 'subject_code' },
    { title: 'Tên môn học', dataIndex: 'subject_name', key: 'subject_name' },
    { title: 'Số TC', dataIndex: 'credits', key: 'credits' },
    { title: 'Lý thuyết', dataIndex: 'theory_hours', key: 'theory_hours' },
    { title: 'Thực hành', dataIndex: 'practice_hours', key: 'practice_hours' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Danh sách Môn học</h2>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          Thêm Môn học mới
        </Button>
      </div>

      <Table 
        dataSource={subjects} 
        columns={columns} 
        rowKey="subject_id"
        loading={loading}
        pagination={{ pageSize: 15 }} // basic pagination
        scroll={{ y: 500 }}
      />

      <Modal title="Thêm môn học mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="subject_code" label="Mã học phần" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subject_name" label="Tên môn học" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="credits" label="Số tín chỉ" rules={[{ required: true }]}>
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item name="theory_hours" label="Số tiết Lý thuyết" rules={[{ required: true }]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="practice_hours" label="Số tiết Thực hành" rules={[{ required: true }]}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectsPage;
