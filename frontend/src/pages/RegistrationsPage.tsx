import React, { useState, useEffect } from 'react';
import { Select, Button, Modal, message, Upload, Input, Form, Table, Tag, Tooltip, Popover, Checkbox } from 'antd';
import { CloudUploadOutlined, PlusOutlined, SaveOutlined, CloseOutlined, DeleteOutlined, FilterOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
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
      style={{...style, boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.15s' }}
      className="bg-white border border-slate-300 rounded p-2 mb-2 cursor-grab text-sm hover:border-orange-300 relative"
    >
      <div className="flex justify-between items-center">
        <div className="font-semibold">{lecturer.full_name}</div>
        {assignCount > 0 && (
          <span style={{ background: 'var(--color-primary)', color: 'white', fontSize: '10px', fontWeight: 700, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
  <div style={{ background: 'white', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '8px 10px', boxShadow: 'var(--shadow-dropdown)', fontSize: '13px', width: '280px', pointerEvents: 'none' }}>
    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{lecturer.full_name}</div>
    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{lecturer.lecturer_code} – {lecturer.type}</div>
  </div>
);

// Droppable Subject Zone
const DroppableSubjectArea = ({ type, subject, assignments, removeAssignment }: any) => {
  const dropId = `${subject.subject_id}-${type}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { subject_id: subject.subject_id, type } });
  
  return (
    <div 
      ref={setNodeRef} 
      style={{
        minHeight: '60px', padding: '8px', borderRadius: 'var(--radius-md)',
        border: isOver ? '2px solid var(--color-primary)' : '2px dashed var(--color-border)',
        backgroundColor: isOver ? 'var(--color-primary-bg)' : 'var(--color-bg)',
        transition: 'border-color 0.12s, background-color 0.12s'
      }}
    >
      <div className="text-xs text-slate-500 mb-2 font-medium">
        {type === 'main' ? 'Giảng viên Lý thuyết' : 'Giảng viên Thực hành'}
      </div>
      <div className="flex flex-wrap gap-2">
        {assignments.map((asst: any, idx: number) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: `1px solid ${type === 'main' ? '#e0e7ff' : 'var(--color-border)'}`, background: type === 'main' ? '#eef2ff' : 'var(--color-bg)', color: type === 'main' ? 'var(--color-accent)' : 'var(--color-text)' }}>
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

  // States for Smart Import
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [missingSubjects, setMissingSubjects] = useState<any[]>([]);
  const [missingLecturers, setMissingLecturers] = useState<any[]>([]);
  const [draftAssignments, setDraftAssignments] = useState<any[]>([]);

  // ---- SUBJECT FILTER BY CURRICULUM ----
  const [programs, setPrograms] = useState<any[]>([]);
  const [filterProgramIds, setFilterProgramIds] = useState<number[]>([]);
  const [filterSemester, setFilterSemester] = useState<number | null>(null);
  const [filteredSubjectIds, setFilteredSubjectIds] = useState<Set<number> | null>(null);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  // ---- LECTURER FILTER + SORT ----
  const [lecTypeFilter, setLecTypeFilter] = useState<string | null>(null); // 'Cơ hữu' | 'Thỉnh giảng' | null
  const [lecSortOrder, setLecSortOrder] = useState<'asc' | 'desc' | null>(null); // sort by assignCount

  // Load Initial Data
  const fetchBaseData = async () => {
    try {
      const [resLists, resLecs, resSubs, resProgs] = await Promise.all([
        apiClient.get('/registrations/lists'),
        apiClient.get('/lecturers/'),
        apiClient.get('/subjects/'),
        apiClient.get('/programs/')
      ]);
      setLists(resLists.data);
      setLecturers(resLecs.data);
      setSubjects(resSubs.data);
      setPrograms(resProgs.data);
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

  const handleDeleteList = (listId: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa phiên bản phân công này? Mọi dữ liệu phân công bên trong sẽ bị mất.',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await apiClient.delete(`/registrations/lists/${listId}`);
          message.success("Đã xóa phiên bản phân công");
          setLists(lists.filter(l => l.list_id !== listId));
          if (selectedListId === listId) {
            setSelectedListId(null);
          }
        } catch (e: any) {
          message.error("Lỗi khi xóa phiên bản");
        }
      }
    });
  };

  // Import Analyze Handler
  const handleUploadExcel = async (file: File) => {
    if (!selectedListId) {
      message.warning('Vui lòng chọn hoặc tạo 1 danh sách trước khi import');
      return false;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/registrations/import-analyze', formData, {
         headers: {
            'Content-Type': 'multipart/form-data'
         }
      });
      const { missing_subjects, missing_lecturers, assignments } = res.data;
      if (missing_subjects.length > 0 || missing_lecturers.length > 0) {
         setMissingSubjects(missing_subjects);
         setMissingLecturers(missing_lecturers);
         setDraftAssignments(assignments);
         setIsAnalyzeModalOpen(true);
      } else {
         applyDraftAssignments(assignments, subjects, lecturers);
      }
    } catch (e: any) {
      message.error(e.response?.data?.detail || "Lỗi khi phân tích file");
    }
    return false; // Prevent default upload
  };

  const applyDraftAssignments = (drafts: any[], currentSubs: any[], currentLecs: any[]) => {
      const newAsst: any[] = [];
      const subMap = new Map(currentSubs.map(s => [s.subject_code, s.subject_id]));
      const lecMap = new Map(currentLecs.map(l => [l.lecturer_code, { id: l.lecturer_id, name: l.full_name, type: l.type }]));
      
      for (const d of drafts) {
          const subId = subMap.get(d.subject_code);
          const lecInfo = lecMap.get(d.lecturer_code);
          if (subId && lecInfo) {
              newAsst.push({
                 lecturer_id: lecInfo.id,
                 lecturer_name: lecInfo.name,
                 lecturer_code: d.lecturer_code,
                 subject_id: subId,
                 is_main_lecturer: d.is_main_lecturer
              });
          }
      }
      setAssignments(newAsst);
      message.success("Đã load nguyện vọng lên màn hình. Vui lòng kiểm tra và bấm LƯU để xác nhận.");
  }

  const handleResolveMissing = async () => {
      try {
          const payload = {
              resolved_subjects: missingSubjects,
              resolved_lecturers: missingLecturers
          };
          await apiClient.post('/registrations/import-resolve', payload);
          // Reload
          const [resLecs, resSubs] = await Promise.all([
            apiClient.get('/lecturers/'),
            apiClient.get('/subjects/')
          ]);
          setLecturers(resLecs.data);
          setSubjects(resSubs.data);
          
          applyDraftAssignments(draftAssignments, resSubs.data, resLecs.data);
          setIsAnalyzeModalOpen(false);
          message.success("Đã đưa dữ liệu mới vào CSDL Master thành công!");
      } catch (e: any) {
          message.error(e.response?.data?.detail || "Lỗi khi lưu dữ liệu mới");
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

  // --- APPLY CURRICULUM FILTER ---
  const applyCurriculumFilter = async () => {
    if (filterProgramIds.length === 0 || !filterSemester) {
      message.warning('Vui lòng chọn ít nhất 1 khung chương trình và 1 kì học');
      return;
    }
    setLoadingFilter(true);
    try {
      const ids = new Set<number>();
      for (const pid of filterProgramIds) {
        const res = await apiClient.get(`/programs/${pid}/curriculum`);
        const items = res.data.filter((c: any) => c.semester_index === filterSemester);
        items.forEach((c: any) => ids.add(c.subject_id));
      }
      setFilteredSubjectIds(ids);
      setFilterPopoverOpen(false);
      message.success(`Đã lọc: ${ids.size} môn học phù hợp`);
    } catch {
      message.error('Lỗi khi tải dữ liệu chương trình');
    } finally {
      setLoadingFilter(false);
    }
  };

  const clearCurriculumFilter = () => {
    setFilteredSubjectIds(null);
    setFilterProgramIds([]);
    setFilterSemester(null);
  };

  // --- DISPLAY SUBJECTS (filtered) ---
  const displaySubjects = filteredSubjectIds
    ? subjects.filter(s => filteredSubjectIds.has(s.subject_id))
    : subjects;

  // --- FILTERED + SORTED LECTURERS ---
  let filteredLecturers = lecturers.filter(l =>
    l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.lecturer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (lecTypeFilter) {
    filteredLecturers = filteredLecturers.filter(l => l.type === lecTypeFilter);
  }
  if (lecSortOrder) {
    filteredLecturers = [...filteredLecturers].sort((a, b) => {
      const countA = getAssignCount(a.lecturer_id);
      const countB = getAssignCount(b.lecturer_id);
      return lecSortOrder === 'asc' ? countA - countB : countB - countA;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 76px)', overflow: 'hidden' }}>
      {/* TOOLBAR */}
      <div style={{ background: 'var(--color-white)', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-secondary)' }}>Phiên bản:</span>
          <Select 
            className="w-64" 
            value={selectedListId} 
            onChange={setSelectedListId}
            placeholder="-- Chọn danh sách --"
            optionLabelProp="label"
          >
            {lists.map(l => (
              <Select.Option key={l.list_id} value={l.list_id} label={l.list_name}>
                <div className="flex justify-between items-center w-full">
                  <span>{l.list_name}</span>
                  <DeleteOutlined 
                    className="text-red-400 hover:text-red-600 ml-2" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(l.list_id);
                    }} 
                  />
                </div>
              </Select.Option>
            ))}
          </Select>
          {selectedListId && (
            <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteList(selectedListId)} title="Xóa Phiên bản đang chọn" />
          )}
          <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Tạo Nháp mới</Button>
          <Upload beforeUpload={handleUploadExcel} showUploadList={false} accept=".xlsx, .xls">
            <Button icon={<CloudUploadOutlined />} disabled={!selectedListId}>Import Excel</Button>
          </Upload>
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
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '16px', gap: '16px' }}>
          
          {/* LEFT COLUMN: SUBJECTS */}
          <div style={{ flex: 1, background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontWeight: 600, margin: 0, color: 'var(--color-text)', fontSize: '14px' }}>Danh sách Môn Học</h3>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>({displaySubjects.length} môn)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {filteredSubjectIds && (
                  <Tag color="orange" closable onClose={clearCurriculumFilter} style={{ margin: 0, fontSize: '11px' }}>
                    Đang lọc: {filteredSubjectIds.size} môn
                  </Tag>
                )}
                <Popover
                  title={<span style={{ fontWeight: 600 }}>Lọc môn theo Đợt học</span>}
                  trigger="click"
                  open={filterPopoverOpen}
                  onOpenChange={setFilterPopoverOpen}
                  placement="bottomRight"
                  content={
                    <div style={{ width: '320px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Khung chương trình:</label>
                        <Select
                          mode="multiple"
                          style={{ width: '100%' }}
                          placeholder="Chọn khung chương trình…"
                          value={filterProgramIds}
                          onChange={setFilterProgramIds}
                          options={programs.map(p => ({ label: `${p.name} (K${p.batch})`, value: p.id }))}
                          maxTagCount={2}
                        />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Học kì:</label>
                        <Select
                          style={{ width: '100%' }}
                          placeholder="Chọn học kì…"
                          value={filterSemester}
                          onChange={setFilterSemester}
                          options={[1,2,3,4,5,6,7,8].map(n => ({ label: `Học kì ${n}`, value: n }))}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button size="small" onClick={() => { clearCurriculumFilter(); setFilterPopoverOpen(false); }}>Xóa lọc</Button>
                        <Button size="small" type="primary" onClick={applyCurriculumFilter} loading={loadingFilter}>Áp dụng</Button>
                      </div>
                    </div>
                  }
                >
                  <Tooltip title="Lọc môn theo đợt học">
                    <Button size="small" icon={<FilterOutlined />} type={filteredSubjectIds ? 'primary' : 'default'} />
                  </Tooltip>
                </Popover>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="custom-scrollbar">
            {!selectedListId && <div className="text-red-500 italic">Vui lòng chọn/tạo 1 phiên bản trước khi rải môn.</div>}
            {selectedListId && displaySubjects.length === 0 && filteredSubjectIds && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                <FilterOutlined style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }} />
                <div>Không có môn nào phù hợp với bộ lọc đã chọn.</div>
                <Button size="small" type="link" onClick={clearCurriculumFilter}>Xóa bộ lọc</Button>
              </div>
            )}
            {selectedListId && displaySubjects.map(subj => (
              <div key={subj.subject_id} className="mb-4 border border-slate-200 rounded-lg">
                <div style={{ background: 'var(--color-bg)', padding: '8px 12px', borderBottom: '1px solid var(--color-border-light)', fontWeight: 600, color: 'var(--color-accent)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', fontSize: '13px' }}>
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
          </div>

          {/* RIGHT COLUMN: LECTURER POOL */}
          <div style={{ width: '300px', background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontWeight: 600, margin: 0, color: 'var(--color-text)', fontSize: '14px' }}>Pool Giảng Viên</h3>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{filteredLecturers.length}/{lecturers.length}</span>
              </div>
              <Input.Search
                placeholder="Tìm tên hoặc mã GV…"
                size="small"
                allowClear
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <Tag.CheckableTag
                  checked={lecTypeFilter === null}
                  onChange={() => setLecTypeFilter(null)}
                  style={{ fontSize: '11px', borderRadius: 'var(--radius-sm)' }}
                >
                  Tất cả
                </Tag.CheckableTag>
                <Tag.CheckableTag
                  checked={lecTypeFilter === 'Cơ hữu'}
                  onChange={(checked) => setLecTypeFilter(checked ? 'Cơ hữu' : null)}
                  style={{ fontSize: '11px', borderRadius: 'var(--radius-sm)' }}
                >
                  Cơ hữu
                </Tag.CheckableTag>
                <Tag.CheckableTag
                  checked={lecTypeFilter === 'Thỉnh giảng'}
                  onChange={(checked) => setLecTypeFilter(checked ? 'Thỉnh giảng' : null)}
                  style={{ fontSize: '11px', borderRadius: 'var(--radius-sm)' }}
                >
                  Thỉnh giảng
                </Tag.CheckableTag>
                <div style={{ marginLeft: 'auto' }}>
                  <Tooltip title={lecSortOrder === 'asc' ? 'Đang: Ít → Nhiều. Bấm đổi' : lecSortOrder === 'desc' ? 'Đang: Nhiều → Ít. Bấm tắt' : 'Sắp xếp theo số môn'}>
                    <Button
                      size="small"
                      type={lecSortOrder ? 'primary' : 'default'}
                      icon={lecSortOrder === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                      onClick={() => {
                        if (!lecSortOrder) setLecSortOrder('asc');
                        else if (lecSortOrder === 'asc') setLecSortOrder('desc');
                        else setLecSortOrder(null);
                      }}
                      style={{ padding: '0 6px' }}
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }} className="custom-scrollbar">
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

      {/* Modal Kiểm duyệt Dữ liệu Mới */}
      <Modal width={800} title="Kiểm Duyệt Dữ Liệu Mới" open={isAnalyzeModalOpen} onCancel={() => setIsAnalyzeModalOpen(false)} onOk={handleResolveMissing} okText="Xác nhận & Thêm vào hệ thống">
          <p className="mb-4 text-orange-600 font-medium whitespace-pre-wrap">Hệ thống phát hiện một số dữ liệu chưa từng tồn tại trong CSDL. Vui lòng kiểm tra, điền bổ sung thông tin (như số tín chỉ, tiết học) trước khi chèn vào hệ thống Master.</p>
          
          {missingSubjects.length > 0 && (
          <div className="mb-6">
             <h3 className="font-bold mb-2 text-blue-700">Danh sách Môn Học Mới:</h3>
             <Table dataSource={missingSubjects} pagination={false} rowKey="subject_code" size="small" bordered>
                <Table.Column title="Mã Môn" dataIndex="subject_code" width={100} />
                <Table.Column title="Tên Môn" dataIndex="subject_name" />
                <Table.Column title="Tín chỉ" dataIndex="credits" width={100} render={(value, _record, index) => (
                   <Input type="number" value={value} onChange={e => {
                       const newVal = [...missingSubjects];
                       newVal[index].credits = parseInt(e.target.value) || 0;
                       setMissingSubjects(newVal);
                   }} />
                )} />
                <Table.Column title="LT" dataIndex="theory_hours" width={80} render={(value, _record, index) => (
                   <Input type="number" value={value} onChange={e => {
                       const newVal = [...missingSubjects];
                       newVal[index].theory_hours = parseInt(e.target.value) || 0;
                       setMissingSubjects(newVal);
                   }} />
                )} />
                <Table.Column title="TH" dataIndex="practice_hours" width={80} render={(value, _record, index) => (
                   <Input type="number" value={value} onChange={e => {
                       const newVal = [...missingSubjects];
                       newVal[index].practice_hours = parseInt(e.target.value) || 0;
                       setMissingSubjects(newVal);
                   }} />
                )} />
             </Table>
          </div>
          )}
          
          {missingLecturers.length > 0 && (
          <div>
             <h3 className="font-bold mb-2 text-blue-700">Danh sách Giảng Viên Mới:</h3>
             <Table dataSource={missingLecturers} pagination={false} rowKey="lecturer_code" size="small" bordered>
                <Table.Column title="Mã GV" dataIndex="lecturer_code" width={150} />
                <Table.Column title="Tên Giảng Viên" dataIndex="full_name" />
                <Table.Column title="Hình thức" dataIndex="type" width={150} render={(value, _record, index) => (
                   <Select value={value} onChange={val => {
                       const newVal = [...missingLecturers];
                       newVal[index].type = val;
                       setMissingLecturers(newVal);
                   }} options={[{label: 'Cơ hữu', value: 'Cơ hữu'}, {label: 'Thỉnh giảng', value: 'Thỉnh giảng'}]} />
                )} />
             </Table>
          </div>
          )}
      </Modal>

    </div>
  );
};

export default RegistrationsPage;
