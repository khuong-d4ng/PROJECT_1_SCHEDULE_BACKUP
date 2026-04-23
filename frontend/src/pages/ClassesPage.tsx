import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, Modal, Form, Tag, message, Space, Row, Col, Empty } from 'antd';
import { PlusOutlined, LinkOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '../api/client';



const MAJORS = [
  { value: 'CNTT', label: 'Công nghệ Thông tin' },
  { value: 'HTTT', label: 'Hệ thống Thông tin' },
  { value: 'KHMT', label: 'Khoa học Máy tính' }
];

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterMajor, setFilterMajor] = useState<string | null>(null);
  const [filterBatch, setFilterBatch] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const [formCreate] = Form.useForm();
  const [formAssign] = Form.useForm();

  // Load Data
  const loadClasses = async () => {
    setLoading(true);
    try {
      const params: any = { _t: Date.now() }; // Cache bust để UI realtime
      if (filterMajor) params.department_major = filterMajor;
      if (filterBatch) params.batch = filterBatch;
      
      const res = await apiClient.get('/classes/', { params });
      setClasses(res.data);
    } catch {
      message.error("Lỗi lấy danh sách Lớp");
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const res = await apiClient.get('/programs/');
      setPrograms(res.data);
    } catch {}
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [filterMajor, filterBatch]);

  // Actions
  const handleCreateNew = async (values: any) => {
    try {
      await apiClient.post('/classes/', values);
      message.success("Tạo Lớp thành công!");
      setIsCreateModalOpen(false);
      formCreate.resetFields();
      loadClasses();
    } catch (e: any) {
      message.error(e.response?.data?.detail || "Lỗi tạo Lớp");
    }
  };

  const handleDelete = async (classId: number) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc muốn xóa lớp này? Thao tác này sẽ dọn dẹp các lịch liên quan.",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiClient.delete(`/classes/${classId}`);
          message.success("Xóa Lớp thành công!");
          loadClasses();
        } catch {
          message.error("Không thể xóa Lớp do Ràng buộc Dữ liệu.");
        }
      }
    });
  };

  const handleAssignProgram = async (values: any) => {
    try {
      await apiClient.put(`/classes/${selectedClass.class_id}/assign-program`, null, {
        params: { program_id: values.program_id }
      });
      message.success("Gán Khung Chương trình thành công!");
      setIsAssignModalOpen(false);
      setSelectedClass(null);
      // Buộc Reload lại Classes
      await loadClasses();
    } catch {
      message.error("Lỗi Gán Khung CT");
    }
  };

  const openAssignModal = (cls: any) => {
    setSelectedClass(cls);
    formAssign.setFieldsValue({ program_id: cls.program ? cls.program.id : null });
    setIsAssignModalOpen(true);
  };

  const columns = [
    { title: 'STT', key: 'idx', width: 60, align: 'center' as const, render: (_: any, __: any, index: number) => index + 1 },
    { title: 'Tên Lớp', dataIndex: 'class_name', key: 'class_name', render: (val: string) => <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{val}</span> },
    { title: 'Dịch vụ Mảng', dataIndex: 'department_major', key: 'department_major', width: 120 },
    { title: 'Khóa', dataIndex: 'batch', key: 'batch', width: 80, align: 'center' as const, render: (val: string) => `K${val}` },
    { 
      title: 'Khung Chương Trình (Chuyên Ngành)', 
      key: 'program', 
      render: (_: any, record: any) => record.program ? (
        <Tag color="geekblue" className="text-sm px-3 py-1">
          {record.program.name} 
        </Tag>
      ) : (
        <Tag color="red" className="text-sm px-3 py-1 bg-red-50 border-red-200">
          Chưa gán Khung Đào Tạo
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 250,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type={record.program ? "dashed" : "primary"} 
            size="small" 
            icon={<LinkOutlined />} 
            onClick={() => openAssignModal(record)}
          >
            {record.program ? 'Đổi Khung' : 'Gán Khung'}
          </Button>
          <Button danger type="text" size="small" onClick={() => handleDelete(record.class_id)}>Xóa Lớp</Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Quản lý Lớp Cố định</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
          Tạo Lớp Mới
        </Button>
      </div>

      <div style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
        {/* Filters Top Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Bộ lọc:</span>
          <Select
            style={{ width: 240 }}
            placeholder="Lọc theo Ngành…"
            options={MAJORS}
            allowClear
            value={filterMajor}
            onChange={setFilterMajor}
          />
          <Input
            style={{ width: 160 }}
            placeholder="Khóa (VD: 19)…"
            allowClear
            value={filterBatch || ''}
            onChange={e => setFilterBatch(e.target.value || null)}
            name="filter-batch"
            autoComplete="off"
          />
        </div>

        {/* Data Table */}
        <div style={{ padding: '0 24px 24px' }}>
          <Table
            columns={columns}
            dataSource={classes}
            rowKey="class_id"
            loading={loading}
            pagination={{ pageSize: 15, showTotal: (total) => `${total} lớp` }}
            size="middle"
            showSorterTooltip={false}
            locale={{ emptyText: <Empty description="Không có lớp nào" /> }}
          />
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal
        title="Tạo Lớp Học Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => formCreate.submit()}
        okText="Lưu Lớp"
        cancelText="Hủy"
      >
        <Form form={formCreate} layout="vertical" onFinish={handleCreateNew}>
          <div className="bg-blue-50 p-3 mb-4 rounded border border-blue-200 text-blue-800 text-sm">
            Sau khi lớp được tạo ra, bạn có thể gán Khung chương trình cho nó ngay trên bảng dữ liệu bên ngoài.
          </div>
          
          <Form.Item name="class_name" label="Tên Lớp Học (Mã Lớp)" rules={[{ required: true, message: 'Nhập tên lớp' }]}>
            <Input placeholder="VD: CNTT 19-01" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department_major" label="Thuộc Ngành quản lý" rules={[{ required: true, message: 'Chọn Ngành' }]}>
                <Select options={MAJORS} placeholder="Chọn Ngành" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="batch" label="Khóa" rules={[{ required: true, message: 'Nhập khóa' }]}>
                <Input placeholder="VD: 19" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="program_id" label="(Tùy chọn) Khung Chương Trình (Chuyên Ngành)">
            <Select 
              allowClear
              placeholder="Chọn Khung chương trình (có thể bỏ qua để gán sau)"
              options={programs.map(p => ({ label: `${p.name} (Khóa ${p.batch})`, value: p.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ASSIGN MODAL */}
      <Modal
        title={selectedClass ? `Gán Khung Chương Trình cho Lớp: ${selectedClass.class_name}` : "Gán Khung"}
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        onOk={() => formAssign.submit()}
        okText="Cập nhật Khung"
        cancelText="Hủy"
      >
        <Form form={formAssign} layout="vertical" onFinish={handleAssignProgram}>
          <Form.Item label="Thời điểm / Tình huống sử dụng nhánh">
            <p className="text-gray-500 mb-0 -mt-2">Thường các Lớp khi lên năm 3 sẽ bắt đầu chia nhánh chuyên ngành hẹp, lúc này bạn chỉ cần vào đây và chọn Khung tương ứng cho Lớp.</p>
          </Form.Item>
          <Form.Item name="program_id" label="Chuyên ngành / Khung chương trình">
            <Select 
              allowClear
              placeholder="Vui lòng chọn 1 Chuyên Ngành..."
              options={programs.map(p => ({ label: `${p.name} (Khóa ${p.batch})`, value: p.id }))}
              showSearch
              filterOption={(input, option: any) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
