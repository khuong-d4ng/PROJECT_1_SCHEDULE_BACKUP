import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, message, Upload, Empty } from 'antd';
import { PlusOutlined, UploadOutlined, SolutionOutlined } from '@ant-design/icons';
import apiClient from '../api/client';

interface Program {
  id: int;
  program_code: string;
  name: string;
  department_major: string;
  batch: string;
}

interface CurriculumItem {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  theory_credits: number;
  practice_credits: number;
  semester_index: number;
}

const MAJORS = [
  { value: 'CNTT', label: 'Công nghệ Thông tin (CNTT)' },
  { value: 'HTTT', label: 'Hệ thống Thông tin (HTTT)' },
  { value: 'KHMT', label: 'Khoa học Máy tính (KHMT)' },
];

const CurriculumPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchPrograms = async () => {
    try {
      const res = await apiClient.get('/programs/');
      setPrograms(res.data);
    } catch (e) {
      message.error("Lỗi tải chương trình đào tạo");
    }
  };

  const fetchCurriculums = async (programId: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/programs/${programId}/curriculum`);
      setCurriculums(res.data);
    } catch (e) {
      message.error("Lỗi khi tải chi tiết chương trình");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleSelectProgram = (prog: Program) => {
    setSelectedProgram(prog);
    fetchCurriculums(prog.id);
  };

  const handleCreateProgram = async (values: any) => {
    try {
      await apiClient.post('/programs/', values);
      message.success('Tạo Khung chương trình thành công');
      setIsModalOpen(false);
      form.resetFields();
      fetchPrograms();
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Lỗi khi tạo');
    }
  };

  const columns = [
    { title: 'Kỳ học', dataIndex: 'semester_index', key: 'semester_index', defaultSortOrder: 'ascend' as const, sorter: (a: CurriculumItem, b: CurriculumItem) => a.semester_index - b.semester_index },
    { title: 'Mã HP', dataIndex: 'subject_code', key: 'subject_code' },
    { title: 'Tên Học Phần', dataIndex: 'subject_name', key: 'subject_name' },
    { title: 'Số TC', dataIndex: 'credits', key: 'credits' },
    { title: 'Trọng số (LT-TH)', key: 'weight', render: (_: any, r: CurriculumItem) => `${r.theory_credits || 0}-${r.practice_credits || 0}` },
  ];

  return (
    <div className="flex h-full space-x-4">
      {/* Left Panel: Program List */}
      <Card className="w-1/3 flex flex-col h-full overflow-hidden" title="Khung Chương Trình" 
        extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Thêm mới</Button>}
        bodyStyle={{ padding: 0, overflowY: 'auto' }}>
        <div className="flex flex-col">
          {programs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Chưa có dữ liệu</div>
          ) : (
            programs.map(prog => (
              <div 
                key={prog.id} 
                onClick={() => handleSelectProgram(prog)}
                className={`p-4 border-b cursor-pointer transition-colors ${selectedProgram?.id === prog.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
              >
                <div className="font-semibold text-blue-800 text-base">{prog.name}</div>
                <div className="text-gray-500 text-sm mt-1">Mã: {prog.program_code} - Khóa {prog.batch}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Right Panel: Content & Import */}
      <Card className="w-2/3 flex flex-col h-full" 
        title={selectedProgram ? `Chi tiết: ${selectedProgram.name}` : "Chọn 1 chương trình để xem"} 
        extra={
          selectedProgram && (
            <Upload 
              accept=".xlsx,.xls"
              showUploadList={false}
              customRequest={async ({ file, onSuccess, onError }) => {
                const formData = new FormData();
                formData.append('file', file);
                try {
                  const res = await apiClient.post(`/programs/${selectedProgram.id}/import-excel`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  message.success(`Import thành công! Đã thêm ${res.data.new_subjects} môn mới và xếp vào ${res.data.curriculum_rows} tiết.`);
                  fetchCurriculums(selectedProgram.id);
                  onSuccess?.("ok");
                } catch (e: any) {
                  message.error(e.response?.data?.detail || "Lỗi import");
                  onError?.(e);
                }
              }}
            >
              <Button type="primary" danger icon={<UploadOutlined />}>Import Excel CTĐT</Button>
            </Upload>
          )
        }>
        
        {!selectedProgram ? (
          <Empty className="mt-20" description="Vui lòng chọn 1 khung chương trình ở thanh bên trái" image={<SolutionOutlined style={{ fontSize: 60, color: '#bfbfbf' }} />} />
        ) : (
          <Table 
            dataSource={curriculums} 
            columns={columns} 
            rowKey="subject_id" 
            pagination={{ pageSize: 20 }}
            loading={loading}
            size="small"
            scroll={{ y: 500 }}
          />
        )}
      </Card>

      <Modal title="Tạo Khung Chương Trình (Chuyên Ngành)" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreateProgram}>
          <Form.Item name="name" label="Tên Khung Chương trình" rules={[{ required: true }]} help="Ví dụ: Công nghệ thông tin - Định hướng PM (Khóa 19)">
            <Input />
          </Form.Item>
          <Form.Item name="program_code" label="Mã Khung" rules={[{ required: true }]} help="Mã duy nhất viết liền không dấu, VD: CNTT_PM_19">
            <Input />
          </Form.Item>
          <div className="flex space-x-4">
            <Form.Item className="flex-1" name="department_major" label="Ngành (Dùng để filter)">
              <Select options={MAJORS} />
            </Form.Item>
            <Form.Item className="flex-1" name="batch" label="Khóa">
              <Input placeholder="VD: 19" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CurriculumPage;
