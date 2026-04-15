import React, { useState, useEffect } from 'react';
import { Select, Button, Modal, message, Upload, Input, Form } from 'antd';
import { CloudUploadOutlined, PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import apiClient from '../api/client';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { saveAs } from 'file-saver';

// --- BẢN MODEL VÀ KIỂU DỮ LIỆU ---
interface RegistrationList {
  list_id: number;
  list_name: string;
  created_at: string;
}

interface Lecturer {
  lecturer_id: number;
  lecturer_code: string;
  full_name: string;
  type: string;
}

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
}

// Draggable Lecturer Tag
const DraggableLecturer = ({ lecturer, assignCount }: { lecturer: Lecturer; assignCount: number }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lecturer-${lecturer.lecturer_id}`,
    data: { lecturer }
  });

  const style: React.CSSProperties = {
    ...(transform ? { transform: CSS.Translate.toString(transform) } : {}),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      style={style}
      className="bg-white border border-slate-300 rounded p-2 mb-2 cursor-grab shadow-sm text-sm hover:border-blue-400 relative"
    >
      <div className="flex justify-between items-center">
        <div className="font-semibold">{lecturer.full_name}</div>
        {assignCount > 0 && (
          <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
            {assignCount}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500">{lecturer.lecturer_code} - {lecturer.type}</div>
    </div>
  );
};

// Overlay hiển thị khi đang kéo (nổi trên mọi element)
const LecturerOverlay = ({ lecturer }: { lecturer: Lecturer }) => (
  <div className="bg-white border-2 border-blue-500 rounded p-2 shadow-xl text-sm w-72 pointer-events-none">
    <div className="font-semibold text-blue-700">{lecturer.full_name}</div>
    <div className="text-xs text-gray-500">{lecturer.lecturer_code} - {lecturer.type}</div>
  </div>
);

// Droppable Subject Zone
const DroppableSubjectArea = ({ type, subject, assignments, removeAssignment }: any) => {
  const dropId = `${subject.subject_id}-${type}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { subject_id: subject.subject_id, type } });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`min-h-[60px] p-2 rounded border-2 border-dashed transition-colors ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="text-xs text-slate-500 mb-2 font-medium">
        {type === 'main' ? 'Giảng viên Lý thuyết' : 'Giảng viên Thực hành'}
      </div>
      <div className="flex flex-wrap gap-2">
        {assignments.map((asst: any, idx: number) => (
          <div key={idx} className={`flex items-center text-xs px-2 py-1 rounded border ${type === 'main' ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-gray-100 border-gray-200 text-gray-800'}`}>
            <span>{asst.lecturer_name}</span>
            <CloseOutlined className="ml-2 cursor-pointer hover:text-red-500" onClick={() => removeAssignment(subject.subject_id, asst.lecturer_id, type === 'main')} />
          </div>
        ))}
        {assignments.length === 0 && <span className="text-slate-400 text-xs italic">Kéo thả GV vào đây</span>}
      </div>
    </div>
  );
};


// --- COMPONENT CHÍNH ---
const RegistrationsPage: React.FC = () => {
  const [lists, setLists] = useState<RegistrationList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Mảng lưu chi tiết các phép gán {lecturer_id, subject_id, is_main_lecturer}
  const [assignments, setAssignments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLecturer, setActiveLecturer] = useState<Lecturer | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Load Initial Data
  const fetchBaseData = async () => {
    try {
      const [resLists, resLecs, resSubs] = await Promise.all([
        apiClient.get('/registrations/lists'),
        apiClient.get('/lecturers/'),
        apiClient.get('/subjects/')
      ]);
      setLists(resLists.data);
      setLecturers(resLecs.data);
      setSubjects(resSubs.data);
      if (resLists.data.length > 0 && !selectedListId) {
        setSelectedListId(resLists.data[0].list_id);
      }
    } catch (e) {
      message.error("Lỗi tải dữ liệu nền");
    }
  };

  useEffect(() => { fetchBaseData(); }, []);

  // Load Assignments for active list
  useEffect(() => {
    if (selectedListId) {
      apiClient.get(`/registrations/lists/${selectedListId}/detailed`)
        .then(res => setAssignments(res.data))
        .catch(() => message.error("Lỗi lấy danh sách chi tiết"));
    } else {
      setAssignments([]);
    }
  }, [selectedListId]);

  // Handle Create List
  const handleCreateList = async (val: any) => {
    try {
      // Tạm cắm cứng semester 1 cho bản thử nghiệm
      const res = await apiClient.post('/registrations/lists', { ...val, semester_id: 1 });
      setLists([res.data, ...lists]);
      setSelectedListId(res.data.list_id);
      setIsModalOpen(false);
      form.resetFields();
      message.success("Tạo phiên bản thành công");
    } catch {
      message.error("Lỗi tạo danh sách");
    }
  };

  // DnD Logic
  const handleDragStart = (event: any) => {
    const lecInfo = event.active.data.current?.lecturer;
    if (lecInfo) setActiveLecturer(lecInfo);
  };

  const handleDragEnd = (event: any) => {
    setActiveLecturer(null);
    const { active, over } = event;
    if (!over) return;
    
    const lecInfo = active.data.current?.lecturer;
    const dropSubjId = over.data.current?.subject_id;
    const dropType = over.data.current?.type; // 'main' or 'prac'

    if (!lecInfo || !dropSubjId) return;

    const isMain = dropType === 'main';

    // Tránh gán trùng lặp 1 người 1 môn 1 vị trí
    const exist = assignments.find(a => a.lecturer_id === lecInfo.lecturer_id && a.subject_id === dropSubjId && a.is_main_lecturer === isMain);
    if (!exist) {
      setAssignments([...assignments, {
        lecturer_id: lecInfo.lecturer_id,
        lecturer_name: lecInfo.full_name,
        lecturer_code: lecInfo.lecturer_code,
        subject_id: dropSubjId,
        is_main_lecturer: isMain
      }]);
    }
  };

  // Đếm số môn đã gán cho mỗi giảng viên
  const getAssignCount = (lecturerId: number) => assignments.filter(a => a.lecturer_id === lecturerId).length;

  const removeAssignment = (subjId: number, lecId: number, isMain: boolean) => {
    setAssignments(assignments.filter(a => !(a.subject_id === subjId && a.lecturer_id === lecId && a.is_main_lecturer === isMain)));
  };

  // Save the entire list
  const saveAssignments = async () => {
    if (!selectedListId) return;
    try {
      const payload = { assignments: assignments.map(a => ({ lecturer_id: a.lecturer_id, subject_id: a.subject_id, is_main_lecturer: a.is_main_lecturer })) };
      const res = await apiClient.post(`/registrations/lists/${selectedListId}/save`, payload);
      message.success(res.data.message);
    } catch (e: any) {
      message.error(e.response?.data?.detail || "Lỗi khi lưu");
    }
  };

  const filteredLecturers = lecturers.filter(l => l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || l.lecturer_code.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* TOOLBAR */}
      <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-700">Phiên bản Phân công:</span>
          <Select 
            className="w-64" 
            value={selectedListId} 
            onChange={setSelectedListId}
            options={lists.map(l => ({ label: l.list_name, value: l.list_id }))}
            placeholder="-- Chọn danh sách --"
          />
          <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Tạo Nháp mới</Button>
        </div>
        <div>
          {/* Export Excel API Call */}
          <Button className="mr-2" onClick={async () => {
            if (!selectedListId) return;
            try {
              const res = await apiClient.get(`/registrations/lists/${selectedListId}/export`, {
                responseType: 'blob'
              });
              const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              // Lấy tên Phiên bản làm tên file
              const currentList = lists.find(l => l.list_id === selectedListId);
              const fileName = currentList ? `${currentList.list_name}.xlsx` : `PhanCong_Dot_${selectedListId}.xlsx`;
              saveAs(blob, fileName);
              message.success('Đã tải file Excel thành công!');
            } catch {
              message.error('Lỗi khi xuất file Excel');
            }
          }} disabled={!selectedListId}>
            Export Excel
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={saveAssignments} disabled={!selectedListId}>
            Lưu Phiên Bản
          </Button>
        </div>
      </div>

      {/* DND WORKSPACE */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden p-4 space-x-4">
          
          {/* LEFT COLUMN: SUBJECTS */}
          <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 custom-scrollbar overflow-y-auto">
            <h3 className="font-semibold mb-4 text-slate-700">Danh sách Môn Học (Khung TKB)</h3>
            {!selectedListId && <div className="text-red-500 italic">Vui lòng chọn/tạo 1 phiên bản trước khi rải môn.</div>}
            {selectedListId && subjects.map(subj => (
              <div key={subj.subject_id} className="mb-4 border border-slate-200 rounded-lg">
                <div className="bg-slate-100 p-2 border-b border-slate-200 font-medium text-blue-900 rounded-t-lg">
                  {subj.subject_code} - {subj.subject_name}
                </div>
                <div className="p-3 grid grid-cols-2 gap-4">
                  <DroppableSubjectArea 
                    type="main" 
                    subject={subj} 
                    assignments={assignments.filter(a => a.subject_id === subj.subject_id && a.is_main_lecturer)} 
                    removeAssignment={removeAssignment}
                  />
                  <DroppableSubjectArea 
                    type="prac" 
                    subject={subj} 
                    assignments={assignments.filter(a => a.subject_id === subj.subject_id && !a.is_main_lecturer)} 
                    removeAssignment={removeAssignment}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN: LECTURER POOL */}
          <div className="w-80 bg-white border border-slate-200 rounded-lg p-4 flex flex-col">
            <h3 className="font-semibold mb-2 text-slate-700">Pool Giảng Viên</h3>
            <Input.Search 
              placeholder="Tìm tên hoặc mã GV..." 
              className="mb-4"
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="custom-scrollbar overflow-y-auto flex-1 pr-2">
              {filteredLecturers.map(lec => (
                <DraggableLecturer key={lec.lecturer_id} lecturer={lec} assignCount={getAssignCount(lec.lecturer_id)} />
              ))}
            </div>
          </div>
        </div>

        {/* DragOverlay: Nổi trên toàn bộ z-index */}
        <DragOverlay dropAnimation={null}>
          {activeLecturer ? <LecturerOverlay lecturer={activeLecturer} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Create List Modal */}
      <Modal title="Tạo Danh Sách Phân Công Mới" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreateList}>
          <Form.Item name="list_name" label="Tên Danh Sách/Phiên bản" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
            <Input placeholder="VD: Phân công lý thuyết Đợt 1" />
          </Form.Item>
          <Form.Item name="description" label="Diễn giải thêm">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default RegistrationsPage;
