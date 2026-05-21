import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Input, Select, message, Upload, Empty, Spin } from 'antd';
import { PlusOutlined, UploadOutlined, SolutionOutlined, EditOutlined, HolderOutlined } from '@ant-design/icons';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import apiClient from '../api/client';

interface Program {
  id: number;
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

const DraggableSubject = ({ subject }: { subject: CurriculumItem }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: subject.subject_id.toString(),
    data: { subject }
  });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="flex items-center p-3 mb-2 bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow">
      <HolderOutlined className="mr-3 text-gray-400" />
      <div className="flex-1 grid grid-cols-4 gap-4">
        <div className="font-medium text-gray-700">{subject.subject_code}</div>
        <div className="col-span-2 text-gray-800">{subject.subject_name}</div>
        <div className="text-gray-500">{subject.credits} TC ({subject.theory_credits}-{subject.practice_credits})</div>
      </div>
    </div>
  );
};

const DroppableSemester = ({ semester, children }: { semester: number, children: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `semester-${semester}`,
    data: { semester }
  });

  return (
    <div ref={setNodeRef} className={`min-h-[80px] p-2 rounded transition-colors ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-transparent border-2 border-transparent'}`}>
      {children}
      {React.Children.count(children) === 0 && <div className="text-gray-400 text-center py-4">Kéo môn học vào đây</div>}
    </div>
  );
};

const CurriculumPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeSubject, setActiveSubject] = useState<CurriculumItem | null>(null);

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
    setIsEditMode(false);
    fetchCurriculums(prog.id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const subject = active.data.current?.subject as CurriculumItem;
    if (subject) setActiveSubject(subject);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveSubject(null);
    const { active, over } = event;
    if (!over) return;

    const overId = over.id.toString();
    if (!overId.startsWith('semester-')) return;

    const targetSemester = parseInt(overId.replace('semester-', ''), 10);
    const subjectId = parseInt(active.id.toString(), 10);

    const subject = curriculums.find(c => c.subject_id === subjectId);
    if (!subject || subject.semester_index === targetSemester) return;

    // Optimistic update
    setCurriculums(prev => prev.map(c => 
      c.subject_id === subjectId ? { ...c, semester_index: targetSemester } : c
    ));

    try {
      if (selectedProgram) {
        await apiClient.put(`/programs/${selectedProgram.id}/curriculum/${subjectId}`, { semester_index: targetSemester });
        message.success('Cập nhật kỳ học thành công');
      }
    } catch (e) {
      message.error('Lỗi khi cập nhật kỳ học');
      // Revert if error
      if (selectedProgram) fetchCurriculums(selectedProgram.id);
    }
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
    { 
      title: 'Mã HP', dataIndex: 'subject_code', key: 'subject_code',
      sorter: (a: CurriculumItem, b: CurriculumItem) => (a.subject_code || '').localeCompare(b.subject_code || '')
    },
    { 
      title: 'Tên Học Phần', dataIndex: 'subject_name', key: 'subject_name',
      sorter: (a: CurriculumItem, b: CurriculumItem) => (a.subject_name || '').localeCompare(b.subject_name || '')
    },
    { 
      title: 'Số TC', dataIndex: 'credits', key: 'credits',
      sorter: (a: CurriculumItem, b: CurriculumItem) => (a.credits || 0) - (b.credits || 0)
    },
    { 
      title: 'Trọng số (LT-TH)', key: 'weight', 
      render: (_: any, r: CurriculumItem) => `${r.theory_credits || 0}-${r.practice_credits || 0}` 
    },
  ];

  return (
    <div className="flex h-full space-x-4">
      {/* Left Panel: Program List */}
      <Card
        style={{ width: '33%', boxShadow: 'var(--shadow-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}
        title={<span style={{ fontWeight: 600 }}>Khung Chương Trình</span>}
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
                className={`p-4 border-b cursor-pointer transition-colors ${selectedProgram?.id === prog.id ? 'border-l-4' : 'hover:bg-gray-50'}`}
                style={selectedProgram?.id === prog.id ? { backgroundColor: 'var(--color-primary-bg)', borderLeftColor: 'var(--color-primary)' } : {}}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-accent)', fontSize: '14px' }}>{prog.name}</div>
                <div className="text-gray-500 text-sm mt-1">Mã: {prog.program_code} - Khóa {prog.batch}</div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Right Panel: Content & Import */}
      <Card
        style={{ width: '67%', boxShadow: 'var(--shadow-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}
        title={<span style={{ fontWeight: 600 }}>{selectedProgram ? `Chi tiết: ${selectedProgram.name}` : 'Chọn 1 chương trình để xem'}</span>}
        extra={
          selectedProgram && (
            <div className="flex space-x-2">
              <Button 
                type={isEditMode ? "primary" : "default"} 
                icon={<EditOutlined />} 
                onClick={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? "Xong" : "Chỉnh sửa"}
              </Button>
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
            </div>
          )
        }>

        {!selectedProgram ? (
          <Empty className="mt-20" description="Vui lòng chọn 1 khung chương trình ở thanh bên trái" image={<SolutionOutlined style={{ fontSize: 60, color: '#bfbfbf' }} />} />
        ) : (
          <Spin spinning={loading}>
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div style={{ height: 500, overflowY: 'auto', paddingRight: 8 }}>
                {Object.entries(
                  curriculums.reduce((acc, curr) => {
                  const sem = curr.semester_index;
                  if (!acc[sem]) acc[sem] = [];
                  acc[sem].push(curr);
                  return acc;
                }, {} as Record<number, CurriculumItem[]>)
              )
              .sort(([semA], [semB]) => Number(semA) - Number(semB))
              .map(([sem, subjects]) => (
                <div key={sem} style={{ 
                  marginBottom: 20, 
                  border: '1px solid var(--color-border)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '16px',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                  <h3 style={{ 
                    marginTop: 0, 
                    marginBottom: 16, 
                    color: 'var(--color-accent)',
                    fontWeight: 600,
                    fontSize: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: 8
                  }}>
                    Kỳ học {sem} <span style={{fontSize: '13px', color: '#888', fontWeight: 'normal', marginLeft: 8}}>({subjects.length} môn học)</span>
                  </h3>
                  {isEditMode ? (
                    <DroppableSemester semester={Number(sem)}>
                      {subjects.map(sub => (
                        <DraggableSubject key={sub.subject_id} subject={sub} />
                      ))}
                    </DroppableSemester>
                  ) : (
                    <Table
                      dataSource={subjects}
                      columns={columns.filter(c => c.key !== 'semester_index')}
                      rowKey="subject_id"
                      pagination={false}
                      size="small"
                      showSorterTooltip={false}
                    />
                  )}
                </div>
              ))}
              {curriculums.length === 0 && !loading && (
                <Empty className="mt-10" description="Chưa có môn học nào trong khung chương trình này" />
              )}
            </div>
            <DragOverlay>
              {activeSubject ? (
                <div className="flex items-center p-3 bg-white border-2 border-blue-400 shadow-lg rounded opacity-90 scale-105 cursor-grabbing w-[600px]">
                  <HolderOutlined className="mr-3 text-blue-500" />
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div className="font-medium text-blue-700">{activeSubject.subject_code}</div>
                    <div className="col-span-2 text-gray-800">{activeSubject.subject_name}</div>
                    <div className="text-gray-500">{activeSubject.credits} TC ({activeSubject.theory_credits}-{activeSubject.practice_credits})</div>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
            </DndContext>
          </Spin>
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
