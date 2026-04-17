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
      // Calculate hours based on credit weight
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
      message.error(error.response?.data?.detail || 'Lỗi khi thêm môn học');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'subject_id', key: 'subject_id' },
    { title: 'Mã học phần', dataIndex: 'subject_code', key: 'subject_code' },
    { title: 'Tên môn học', dataIndex: 'subject_name', key: 'subject_name' },
    { title: 'Số TC', dataIndex: 'credits', key: 'credits', align: 'center' as const },
    { title: 'Trọng số (LT-TH)', key: 'weight', align: 'center' as const, render: (_: any, record: Subject) => `${record.theory_credits || 0} - ${record.practice_credits || 0}` },
    { title: 'Tiết Lý thuyết', dataIndex: 'theory_hours', key: 'theory_hours', align: 'center' as const },
    { title: 'Tiết Thực hành', dataIndex: 'practice_hours', key: 'practice_hours', align: 'center' as const },
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
          <div className="flex space-x-4">
            <Form.Item className="flex-1" name="credits" label="Tổng Tín Chỉ" rules={[{ required: true }]}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item className="flex-1" name="theory_credits" label="Tín chỉ Lý Thuyết" initialValue={0}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item className="flex-1" name="practice_credits" label="Tín chỉ Thực Hành" initialValue={0}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>
          <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded border">
            *Lưu ý: Số tiết sẽ tự động được máy chủ nhân 15. <br/>
            (Lý thuyết = TC LT × 15 | Thực hành = TC TH × 15)
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectsPage;
