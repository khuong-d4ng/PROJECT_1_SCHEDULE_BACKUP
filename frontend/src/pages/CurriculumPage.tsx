import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, Button, message, Input, Tag, Empty, Tabs } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, SearchOutlined, BookOutlined, SwapLeftOutlined } from '@ant-design/icons';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import apiClient from '../api/client';

const MAJORS = [
  { value: 'CNTT', label: 'Công nghệ Thông tin (CNTT)' },
  { value: 'HTTT', label: 'Hệ thống Thông tin (HTTT)' },
  { value: 'KHMT', label: 'Khoa học Máy tính (KHMT)' },
];

const BATCHES = [{ value: '19', label: 'Khóa 19' }];

const SEMESTERS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `Kì ${i + 1}`,
}));

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  credits: number;
}

// ============================================================
// TAB 1: Chọn môn cho ngành
// ============================================================
const MajorSubjectsTab: React.FC = () => {
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [searchAll, setSearchAll] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');

  useEffect(() => {
    apiClient.get('/subjects/').then(res => setAllSubjects(res.data)).catch(() => message.error('Lỗi tải danh sách môn'));
  }, []);

  useEffect(() => {
    if (!selectedMajor) { setAssignedSubjectIds(new Set()); return; }
    apiClient.get(`/curriculum/${selectedMajor}`)
      .then(res => setAssignedSubjectIds(new Set(res.data.map((s: Subject) => s.subject_id))))
      .catch(() => message.error('Lỗi tải chương trình đào tạo'));
  }, [selectedMajor]);

  const availableSubjects = useMemo(() => allSubjects.filter(s => !assignedSubjectIds.has(s.subject_id)), [allSubjects, assignedSubjectIds]);
  const assignedSubjects = useMemo(() => allSubjects.filter(s => assignedSubjectIds.has(s.subject_id)), [allSubjects, assignedSubjectIds]);

  const filteredAvailable = useMemo(() => {
    if (!searchAll) return availableSubjects;
    const q = searchAll.toLowerCase();
    return availableSubjects.filter(s => s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q));
  }, [availableSubjects, searchAll]);

  const filteredAssigned = useMemo(() => {
    if (!searchAssigned) return assignedSubjects;
    const q = searchAssigned.toLowerCase();
    return assignedSubjects.filter(s => s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q));
  }, [assignedSubjects, searchAssigned]);

  const addSubject = (id: number) => setAssignedSubjectIds(prev => new Set([...prev, id]));
  const removeSubject = (id: number) => setAssignedSubjectIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  const addAll = () => setAssignedSubjectIds(prev => new Set([...prev, ...filteredAvailable.map(s => s.subject_id)]));
  const removeAll = () => {
    const ids = new Set(filteredAssigned.map(s => s.subject_id));
    setAssignedSubjectIds(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
  };

  const handleSave = async () => {
    if (!selectedMajor) return;
    setSaving(true);
    try {
      const res = await apiClient.post(`/curriculum/${selectedMajor}/save`, { subject_ids: Array.from(assignedSubjectIds) });
      message.success(res.data.message);
    } catch (e: any) { message.error(e.response?.data?.detail || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-700">Ngành:</span>
          <Select className="w-72" value={selectedMajor} onChange={setSelectedMajor} options={MAJORS} placeholder="-- Chọn ngành --" allowClear />
        </div>
        <div className="flex items-center space-x-3">
          <Tag color="blue" className="text-sm px-3 py-1">Đã chọn: <strong>{assignedSubjectIds.size}</strong> / {allSubjects.length} môn</Tag>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!selectedMajor}>Lưu</Button>
        </div>
      </div>

      {!selectedMajor ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-slate-200">
          <Empty description="Vui lòng chọn một ngành để thiết lập chương trình đào tạo" />
        </div>
      ) : (
        <div className="flex flex-1 space-x-4 overflow-hidden">
          {/* Available */}
          <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-700">Tất cả môn học <span className="text-sm font-normal text-slate-500 ml-2">({filteredAvailable.length})</span></h3>
                <Button size="small" type="dashed" onClick={addAll} icon={<PlusOutlined />}>Thêm tất cả</Button>
              </div>
              <Input prefix={<SearchOutlined className="text-slate-400" />} placeholder="Tìm theo tên hoặc mã môn..." allowClear value={searchAll} onChange={e => setSearchAll(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {filteredAvailable.length === 0 ? (
                <div className="text-slate-400 text-sm italic text-center mt-8">{searchAll ? 'Không tìm thấy' : 'Tất cả môn đã được thêm'}</div>
              ) : filteredAvailable.map(subj => (
                <div key={subj.subject_id} className="flex items-center justify-between p-3 mb-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group" onClick={() => addSubject(subj.subject_id)}>
                  <div><div className="font-medium text-slate-800 text-sm">{subj.subject_name}</div><div className="text-xs text-slate-500">{subj.subject_code} • {subj.credits} TC</div></div>
                  <PlusOutlined className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg" />
                </div>
              ))}
            </div>
          </div>
          {/* Assigned */}
          <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-blue-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-blue-800">Môn thuộc ngành {selectedMajor} <span className="text-sm font-normal text-blue-600 ml-2">({filteredAssigned.length})</span></h3>
                <Button size="small" danger type="dashed" onClick={removeAll} icon={<DeleteOutlined />}>Xóa tất cả</Button>
              </div>
              <Input prefix={<SearchOutlined className="text-slate-400" />} placeholder="Tìm trong danh sách đã chọn..." allowClear value={searchAssigned} onChange={e => setSearchAssigned(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              {filteredAssigned.length === 0 ? (
                <div className="text-slate-400 text-sm italic text-center mt-8">{searchAssigned ? 'Không tìm thấy' : 'Chưa có môn nào. Click bên trái để thêm.'}</div>
              ) : filteredAssigned.map(subj => (
                <div key={subj.subject_id} className="flex items-center justify-between p-3 mb-2 bg-blue-50 border border-blue-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer group" onClick={() => removeSubject(subj.subject_id)}>
                  <div><div className="font-medium text-blue-900 text-sm">{subj.subject_name}</div><div className="text-xs text-blue-600">{subj.subject_code} • {subj.credits} TC</div></div>
                  <DeleteOutlined className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================================
// TAB 2: Chọn môn cho kì (Drag & Drop)
// ============================================================

// Draggable Subject Card
const DraggableSubject = ({ subject, source }: { subject: Subject; source: 'pool' | 'semester' }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${source}-${subject.subject_id}`,
    data: { subject, source },
  });
  const style: React.CSSProperties = {
    ...(transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : {}),
    opacity: isDragging ? 0.3 : 1,
  };
  const colors = source === 'semester'
    ? 'bg-blue-50 border-blue-200 hover:border-red-300 hover:bg-red-50'
    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm';

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}
      className={`flex items-center justify-between p-3 mb-2 border rounded-lg transition-all cursor-grab active:cursor-grabbing ${colors}`}>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm text-slate-800 truncate">{subject.subject_name}</div>
        <div className="text-xs text-slate-500">{subject.subject_code} • {subject.credits} TC</div>
      </div>
      {source === 'semester' && <SwapLeftOutlined className="text-slate-400 ml-2 flex-shrink-0" title="Kéo ra pool để xóa" />}
    </div>
  );
};

const SubjectOverlay = ({ subject }: { subject: Subject }) => (
  <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-2xl w-72 pointer-events-none">
    <div className="font-semibold text-blue-700 text-sm">{subject.subject_name}</div>
    <div className="text-xs text-slate-500">{subject.subject_code} • {subject.credits} TC</div>
  </div>
);

const DroppableZone = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex-1 transition-colors rounded-lg ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}>
      {children}
    </div>
  );
};

const SemesterSubjectsTab: React.FC = () => {
  const [major, setMajor] = useState<string | null>(null);
  const [batch, setBatch] = useState<string>('19');
  const [semesterIndex, setSemesterIndex] = useState<number | null>(null);

  const [curriculumSubjects, setCurriculumSubjects] = useState<Subject[]>([]);
  const [semesterSubjectIds, setSemesterSubjectIds] = useState<Set<number>>(new Set());
  const [usedInOtherSemesters, setUsedInOtherSemesters] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [searchPool, setSearchPool] = useState('');

  useEffect(() => { setSemesterIndex(null); }, [major]);

  // Load curriculum
  useEffect(() => {
    if (!major) { setCurriculumSubjects([]); return; }
    apiClient.get(`/curriculum/${major}`)
      .then(res => setCurriculumSubjects(res.data))
      .catch(() => message.error('Lỗi tải CTĐT'));
  }, [major]);

  // Load semester data
  useEffect(() => {
    if (!major || !batch || !semesterIndex) {
      setSemesterSubjectIds(new Set());
      setUsedInOtherSemesters(new Set());
      return;
    }
    setLoading(true);
    Promise.all([
      apiClient.get('/class-semester-subjects/', { params: { major_code: major, batch_code: batch, semester_index: semesterIndex } }),
      apiClient.get('/class-semester-subjects/used', { params: { major_code: major, batch_code: batch, exclude_semester: semesterIndex } }),
    ])
      .then(([semRes, usedRes]) => {
        setSemesterSubjectIds(new Set(semRes.data.map((s: Subject) => s.subject_id)));
        setUsedInOtherSemesters(new Set(usedRes.data));
      })
      .catch(() => message.error('Lỗi tải dữ liệu kì'))
      .finally(() => setLoading(false));
  }, [major, batch, semesterIndex]);

  const poolSubjects = useMemo(() =>
    curriculumSubjects.filter(s => !semesterSubjectIds.has(s.subject_id) && !usedInOtherSemesters.has(s.subject_id)),
    [curriculumSubjects, semesterSubjectIds, usedInOtherSemesters]);

  const semesterSubjects = useMemo(() =>
    curriculumSubjects.filter(s => semesterSubjectIds.has(s.subject_id)),
    [curriculumSubjects, semesterSubjectIds]);

  const filteredPool = useMemo(() => {
    if (!searchPool) return poolSubjects;
    const q = searchPool.toLowerCase();
    return poolSubjects.filter(s => s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q));
  }, [poolSubjects, searchPool]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const subj = event.active.data.current?.subject;
    if (subj) setActiveSubject(subj);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveSubject(null);
    const { active, over } = event;
    if (!over) return;
    const subject = active.data.current?.subject as Subject;
    const source = active.data.current?.source as string;
    const dropZone = over.id as string;
    if (!subject) return;

    if (source === 'pool' && dropZone === 'semester-panel') {
      setSemesterSubjectIds(prev => new Set([...prev, subject.subject_id]));
    }
    if (source === 'semester' && dropZone === 'pool-panel') {
      setSemesterSubjectIds(prev => { const n = new Set(prev); n.delete(subject.subject_id); return n; });
    }
  }, []);

  const handleSave = async () => {
    if (!major || !batch || !semesterIndex) return;
    setSaving(true);
    try {
      const res = await apiClient.post('/class-semester-subjects/save', {
        major_code: major,
        batch_code: batch,
        semester_index: semesterIndex,
        subject_ids: Array.from(semesterSubjectIds),
      });
      message.success(res.data.message);
    } catch (e: any) { message.error(e.response?.data?.detail || 'Lỗi khi lưu'); }
    finally { setSaving(false); }
  };

  const isReady = major && batch && semesterIndex;
  const totalCredits = semesterSubjects.reduce((sum, s) => sum + s.credits, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600 text-sm">Ngành:</span>
              <Select className="w-56" value={major} onChange={setMajor} options={MAJORS} placeholder="Chọn ngành" allowClear />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600 text-sm">Khóa:</span>
              <Select className="w-28" value={batch} onChange={setBatch} options={BATCHES} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600 text-sm">Kì:</span>
              <Select className="w-28" value={semesterIndex} onChange={setSemesterIndex} options={SEMESTERS} placeholder="Chọn kì" disabled={!major} />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isReady && <Tag color="geekblue" className="text-sm px-3 py-1">{semesterSubjectIds.size} môn • {totalCredits} TC</Tag>}
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!isReady}>Lưu</Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {!isReady ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-slate-200">
          <Empty image={<BookOutlined style={{ fontSize: 64, color: '#94a3b8' }} />}
            description={<span className="text-slate-500">{!major ? 'Chọn Ngành để bắt đầu' : 'Chọn Kì học'}</span>} />
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500">Đang tải...</div>
        </div>
      ) : (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 space-x-4 overflow-hidden">
            {/* Semester Panel */}
            <DroppableZone id="semester-panel">
              <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="font-semibold text-blue-800"><BookOutlined className="mr-2" />Kì {semesterIndex} — {major} K{batch}</h3>
                  <p className="text-xs text-blue-600 mt-1">{semesterSubjects.length} môn • {totalCredits} TC{semesterSubjects.length === 0 && ' — Kéo môn từ pool bên phải vào đây'}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                  {semesterSubjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center w-full">
                        <BookOutlined style={{ fontSize: 48 }} className="mb-4 text-slate-300" />
                        <p className="text-sm">Kéo thả môn học từ pool bên phải vào đây</p>
                        <p className="text-xs mt-1">hoặc kéo ngược lại pool để xóa</p>
                      </div>
                    </div>
                  ) : semesterSubjects.map(subj => (
                    <DraggableSubject key={subj.subject_id} subject={subj} source="semester" />
                  ))}
                </div>
              </div>
            </DroppableZone>

            {/* Pool Panel */}
            <DroppableZone id="pool-panel">
              <div className="w-96 bg-white border border-slate-200 rounded-lg flex flex-col h-full overflow-hidden flex-shrink-0">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-semibold text-slate-700 mb-3">Pool Môn Học <span className="text-sm font-normal text-slate-500 ml-2">({filteredPool.length} còn lại)</span></h3>
                  <Input prefix={<SearchOutlined className="text-slate-400" />} placeholder="Tìm môn..." allowClear value={searchPool} onChange={e => setSearchPool(e.target.value)} />
                </div>
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                  {curriculumSubjects.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm mt-8">
                      <p>Chưa có môn nào trong CTĐT ngành {major}.</p>
                      <p className="mt-1">Hãy vào tab <strong>"Môn học theo ngành"</strong> để thiết lập.</p>
                    </div>
                  ) : filteredPool.length === 0 ? (
                    <div className="text-slate-400 text-sm italic text-center mt-8">{searchPool ? 'Không tìm thấy' : 'Tất cả môn đã được xếp vào các kì'}</div>
                  ) : filteredPool.map(subj => (
                    <DraggableSubject key={subj.subject_id} subject={subj} source="pool" />
                  ))}
                </div>
              </div>
            </DroppableZone>
          </div>
          <DragOverlay dropAnimation={null}>{activeSubject ? <SubjectOverlay subject={activeSubject} /> : null}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
};


// ============================================================
// MAIN PAGE WITH TABS
// ============================================================
const CurriculumPage: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <Tabs
        defaultActiveKey="major"
        type="card"
        className="flex-1 flex flex-col [&_.ant-tabs-content]:flex-1 [&_.ant-tabs-content]:overflow-hidden [&_.ant-tabs-tabpane]:h-full"
        items={[
          {
            key: 'major',
            label: '📚 Môn học theo ngành',
            children: <MajorSubjectsTab />,
          },
          {
            key: 'semester',
            label: '📅 Môn học theo kì',
            children: <SemesterSubjectsTab />,
          },
        ]}
      />
    </div>
  );
};

export default CurriculumPage;
