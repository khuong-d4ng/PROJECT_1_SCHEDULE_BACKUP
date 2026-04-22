import React, { useState, useEffect } from 'react';
import { 
  Layout, Typography, Button, Table, Modal, Form, 
  Input, Select, Space, Card, message, Steps, Divider, Row, Col,
  Progress, Tag, Tooltip
} from 'antd';
import { 
  PlusOutlined, EyeOutlined, SettingOutlined, CalendarOutlined,
  ThunderboltOutlined, SearchOutlined, DeleteOutlined, DownloadOutlined
} from '@ant-design/icons';
import apiClient from '../api/client';
import type { ColumnsType } from 'antd/es/table';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const { Title, Text } = Typography;

// ---------- DND Components ----------

interface LecStats { hours: number; subjects: number; classes: number; slots: number; }

const DraggableLecturerCard = ({ lecturer, stats }: { lecturer: any; stats: LecStats }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lec-${lecturer.lecturer_id}`,
    data: { lecturer }
  });
  const style: React.CSSProperties = {
    ...(transform ? { transform: CSS.Translate.toString(transform) } : {}),
    opacity: isDragging ? 0.3 : 1,
  };

  const { hours, subjects, classes, slots } = stats;
  const pct = Math.min(100, Math.round((hours / 160) * 100));
  const barColor = hours >= 250 ? 'var(--color-danger)' : hours >= 160 ? 'var(--color-success)' : 'var(--color-primary)';

  return (
    <div
      ref={setNodeRef} {...listeners} {...attributes}
      style={{...style, boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.15s, box-shadow 0.15s' }}
      className="bg-white border border-slate-200 rounded-lg p-2.5 mb-2 cursor-grab hover:border-orange-300"
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold text-sm text-slate-800 truncate" title={lecturer.full_name}>{lecturer.full_name}</span>
        <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{lecturer.lecturer_code}</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <Progress percent={pct} size="small" strokeColor={barColor} showInfo={false} className="flex-1" />
        <Tooltip title={`${hours} / 160 tiết (Giới hạn mềm 250)`}>
          <span className={`text-xs font-bold ${hours >= 250 ? 'text-red-500' : hours >= 160 ? 'text-green-600' : 'text-blue-600'}`}>
            {hours}h
          </span>
        </Tooltip>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span title="Số môn dạy">📚 {subjects} môn</span>
        <span title="Số lớp dạy">🏫 {classes} lớp</span>
        <span title="Số buổi/tuần">📅 {slots}/14</span>
      </div>
    </div>
  );
};

const LecturerDragOverlay = ({ lecturer }: { lecturer: any }) => (
  <div style={{ background: 'white', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '10px', boxShadow: 'var(--shadow-dropdown)', fontSize: '13px', width: '240px', pointerEvents: 'none' }}>
    <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{lecturer.full_name}</div>
    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{lecturer.lecturer_code}</div>
  </div>
);

const DroppableCell = ({ rowId, field, children }: { rowId: number; field: string; children: React.ReactNode }) => {
  const dropId = `${rowId}-${field}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { rowId, field } });
  return (
    <div ref={setNodeRef} style={{ minHeight: '32px', borderRadius: 'var(--radius-sm)', transition: 'background-color 0.12s, box-shadow 0.12s', backgroundColor: isOver ? 'var(--color-primary-bg)' : 'transparent', boxShadow: isOver ? 'inset 0 0 0 2px var(--color-primary)' : 'none' }}>
      {children}
    </div>
  );
};

// ---------- MAIN COMPONENT ----------

export default function TimetableCenterPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  
  // Sidebar
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, LecStats>>({});
  const [lecSearch, setLecSearch] = useState('');
  const [activeLecturer, setActiveLecturer] = useState<any>(null);

  // Preference map: subject_id -> {main: [lec_ids], prac: [lec_ids]}
  const [prefMap, setPrefMap] = useState<Record<string, {main: number[], prac: number[]}>>({}); 
  // Click row to focus a subject -> filter sidebar
  const [focusedSubjectId, setFocusedSubjectId] = useState<number | null>(null);

  // Auto-Assign
  const [isAutoAssignModalOpen, setIsAutoAssignModalOpen] = useState(false);
  const [autoAssignStrategy, setAutoAssignStrategy] = useState('A');
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [autoAssignResult, setAutoAssignResult] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [regLists, setRegLists] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  
  const [wizardConfig, setWizardConfig] = useState({
    plan_name: "",
    registration_list_id: null as number | null,
    program_ids: [] as number[]
  });
  const [entriesConfig, setEntriesConfig] = useState<any>({});

  // --- DATA LOADING ---
  const fetchSessions = async () => {
    try {
      const res = await apiClient.get('/timetables/');
      setSessions(res.data);
    } catch { message.error("Lỗi lấy danh sách Đợt TKB"); }
  };

  const fetchRegLists = async () => {
    try { const res = await apiClient.get('/registrations/lists'); setRegLists(res.data); } catch {}
  };

  const fetchPrograms = async () => {
    try { const res = await apiClient.get('/programs/'); setPrograms(res.data); } catch {}
  };

  const fetchLecturers = async () => {
    try { const res = await apiClient.get('/lecturers/'); setLecturers(res.data); } catch {}
  };

  const fetchStats = async (sessionId: number) => {
    try {
      const res = await apiClient.get(`/timetables/${sessionId}/stats`);
      setStatsMap(res.data);
    } catch {}
  };

  const fetchPrefMap = async (sessionId: number) => {
    try {
      const res = await apiClient.get(`/timetables/${sessionId}/preference-map`);
      setPrefMap(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
    fetchRegLists();
    fetchPrograms();
    fetchLecturers();
  }, []);

  const loadSessionDetails = async (id: number) => {
    try {
      const res = await apiClient.get(`/timetables/${id}/rows`);
      setRows(res.data);
      setSelectedSessionId(id);
      setFocusedSubjectId(null);
      fetchStats(id);
      fetchPrefMap(id);
    } catch { message.error("Lỗi tải chi tiết TKB"); }
  };

  // --- WIZARD HANDLERS ---
  const handleNextStep1 = () => {
    if (!wizardConfig.plan_name || wizardConfig.program_ids.length === 0) {
      message.warning("Vui lòng điền Tên đợt và chọn ít nhất 1 Khung Chương Trình");
      return;
    }
    const newConfig = { ...entriesConfig };
    wizardConfig.program_ids.forEach(p_id => {
      if (!newConfig[p_id]) newConfig[p_id] = [{ semester_index: 1 }];
    });
    setEntriesConfig(newConfig);
    setCurrentStep(1);
  };

  const handleAddEntry = (p_id: number) => {
    const list = [...entriesConfig[p_id]];
    list.push({ semester_index: 1 });
    setEntriesConfig({ ...entriesConfig, [p_id]: list });
  };

  const updateEntry = (p_id: number, index: number, field: string, val: any) => {
    const list = [...entriesConfig[p_id]];
    list[index][field] = val;
    setEntriesConfig({ ...entriesConfig, [p_id]: list });
  };

  const handleGenerate = async () => {
    try {
      const payloadEntries: any[] = [];
      Object.keys(entriesConfig).forEach(p_id => {
        entriesConfig[p_id].forEach((cfg: any) => {
          if (cfg.semester_index) {
            payloadEntries.push({ program_id: parseInt(p_id), semester_index: cfg.semester_index });
          }
        });
      });
      if (payloadEntries.length === 0) { message.warning("Vui lòng điền đầy đủ Kỳ cho các khung"); return; }

      const res = await apiClient.post('/timetables/generate', {
        plan_name: wizardConfig.plan_name,
        registration_list_id: wizardConfig.registration_list_id,
        entries: payloadEntries
      });

      message.success("Tạo Đợt TKB và Gen dữ liệu Lớp-Môn thành công!");
      setIsWizardOpen(false);
      setCurrentStep(0);
      setWizardConfig({ plan_name: "", registration_list_id: null, program_ids: [] });
      fetchSessions();
      loadSessionDetails(res.data.session_id);
    } catch (e: any) { message.error(e.response?.data?.detail || "Lỗi tạo TKB"); }
  };

  // --- ROW UPDATE ---
  const handleRowChange = async (row_id: number, field: string, value: any) => {
    try {
      // Build local update object
      const localUpdate: any = { [field]: value };
      // When clearing a lecturer, also clear the display name
      if (field === 'main_lecturer_id' && value === null) {
        localUpdate.main_lecturer_name = null;
      }
      if (field === 'prac_lecturer_id' && value === null) {
        localUpdate.prac_lecturer_name = null;
      }

      const updatedRows = rows.map(r => r.row_id === row_id ? { ...r, ...localUpdate } : r);
      setRows(updatedRows);
      await apiClient.put(`/timetables/rows/${row_id}`, { [field]: value });
      if (field === 'main_lecturer_id' || field === 'prac_lecturer_id') {
        fetchStats(selectedSessionId!);
      }
    } catch { message.error("Lỗi cập nhật dòng TKB"); }
  };

  // --- DND ---
  const handleDragStart = (event: any) => {
    const lec = event.active.data.current?.lecturer;
    if (lec) setActiveLecturer(lec);
  };

  const handleDragEnd = (event: any) => {
    setActiveLecturer(null);
    const { active, over } = event;
    if (!over) return;

    const lec = active.data.current?.lecturer;
    const { rowId, field } = over.data.current || {};
    if (!lec || !rowId || !field) return;

    const lecId = lec.lecturer_id;
    handleRowChange(rowId, field, lecId);

    // Update local row state for immediate visual feedback
    setRows(prev => prev.map(r => {
      if (r.row_id === rowId) {
        return {
          ...r,
          [field]: lecId,
          [field === 'main_lecturer_id' ? 'main_lecturer_name' : 'prac_lecturer_name']: lec.full_name
        };
      }
      return r;
    }));
  };

  // --- DELETE SESSION ---
  const handleDeleteSession = (sessionId: number) => {
    Modal.confirm({
      title: 'Xóa Đợt TKB',
      content: 'Toàn bộ dữ liệu phân công của đợt này sẽ bị xóa vĩnh viễn. Tiếp tục?',
      okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Hủy',
      onOk: async () => {
        try {
          await apiClient.delete(`/timetables/${sessionId}`);
          message.success("Đã xóa Đợt TKB");
          fetchSessions();
        } catch { message.error("Lỗi xóa Đợt TKB"); }
      }
    });
  };

  // --- AUTO-ASSIGN ---
  const handleAutoAssign = async () => {
    setAutoAssignLoading(true);
    try {
      const res = await apiClient.post(
        `/timetables/${selectedSessionId}/auto-assign`,
        null,
        { params: { strategy: autoAssignStrategy } }
      );
      setAutoAssignResult(res.data);
      setIsAutoAssignModalOpen(false);
      setIsResultModalOpen(true);
      // Reload data
      await loadSessionDetails(selectedSessionId!);
    } catch (e: any) {
      message.error(e.response?.data?.detail || 'Lỗi Auto-Assign');
    } finally {
      setAutoAssignLoading(false);
    }
  };

  // --- EXPORT ---
  const handleExport = async () => {
    try {
      const res = await apiClient.get(`/timetables/${selectedSessionId}/export-excel`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const curSession = sessions.find(s => s.session_id === selectedSessionId);
      a.download = `TKB_${curSession?.plan_name || 'export'}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Đã tải file Excel thành công!');
    } catch {
      message.error('Lỗi xuất file Excel');
    }
  };

  // --- HELPERS: Check if lecturer can teach subject ---
  const canLecturerTeachSubject = (lecId: number, subjectId: number, role: 'main' | 'prac') => {
    const pref = prefMap[String(subjectId)];
    if (!pref) return false;
    return pref[role]?.includes(lecId) || false;
  };

  // Get all subject_ids this lecturer can teach (for drag highlight)
  const getLecturerCapableSubjects = (lecId: number): Set<number> => {
    const result = new Set<number>();
    for (const [sid, pref] of Object.entries(prefMap)) {
      if (pref.main?.includes(lecId) || pref.prac?.includes(lecId)) {
        result.add(parseInt(sid));
      }
    }
    return result;
  };

  // --- COLUMNS ---
  const tableColumns: ColumnsType<any> = [
    { title: 'STT', dataIndex: 'row_id', width: 55, align: 'center', render: (_, __, i) => i + 1 },
    { title: 'Tên Lớp', dataIndex: 'class_name', width: 120, fixed: 'left', className: 'font-semibold' },
    { title: 'Buổi CĐ', dataIndex: 'fixed_shift', width: 100, render: (val, record) => (
      <Select size="small" style={{width: '100%'}} value={val} allowClear placeholder="Chọn"
        onChange={v => handleRowChange(record.row_id, 'fixed_shift', v)}
        options={[{value:'Sáng',label:'☀️ Sáng'},{value:'Chiều',label:'🌙 Chiều'}]} />
    ) },
    { title: 'Mã Môn', dataIndex: 'subject_code', width: 90 },
    { title: 'Tên Học Phần', dataIndex: 'subject_name', width: 220, ellipsis: true },
    { title: 'TC', dataIndex: 'credits', width: 45, align: 'center' },
    { title: 'LT', dataIndex: 'theory_hours', width: 45, align: 'center' },
    { title: 'TH', dataIndex: 'practice_hours', width: 45, align: 'center' },
    { title: 'GV Chính', dataIndex: 'main_lecturer_name', width: 180, render: (val, record) => (
      <DroppableCell rowId={record.row_id} field="main_lecturer_id">
        {val ? (
          <Tag color="blue" closable onClose={() => handleRowChange(record.row_id, 'main_lecturer_id', null)}>
            {val}
          </Tag>
        ) : <span className="text-gray-300 italic text-xs">Kéo GV vào đây</span>}
      </DroppableCell>
    ) },
    { title: 'GV Thực Hành', dataIndex: 'prac_lecturer_name', width: 180, render: (val, record) => (
      <DroppableCell rowId={record.row_id} field="prac_lecturer_id">
        {val ? (
          <Tag color="cyan" closable onClose={() => handleRowChange(record.row_id, 'prac_lecturer_id', null)}>
            {val}
          </Tag>
        ) : <span className="text-gray-300 italic text-xs">Kéo GV vào đây</span>}
      </DroppableCell>
    ) },
    { title: 'Phòng', dataIndex: 'room_type', width: 120, render: (val, record) => (
      <Select size="small" style={{width: '100%'}} value={val} allowClear placeholder="Chọn"
        onChange={v => handleRowChange(record.row_id, 'room_type', v)}
        options={[{value:'Phòng thường',label:'Phòng thường'},{value:'Phòng máy',label:'Phòng máy'}]} />
    ) },
    { title: 'Thứ-S', dataIndex: 'morning_day', width: 90, align: 'center',
      render: (val, record) => (
        <Select size="small" style={{width: '100%'}} value={val || undefined} allowClear placeholder="-"
          onChange={v => handleRowChange(record.row_id, 'morning_day', v || null)}
          options={['S-T2','S-T3','S-T4','S-T5','S-T6','S-T7'].map(s => ({value: s, label: s}))} />
      )
    },
    { title: 'Thứ-C', dataIndex: 'afternoon_day', width: 90, align: 'center',
      render: (val, record) => (
        <Select size="small" style={{width: '100%'}} value={val || undefined} allowClear placeholder="-"
          onChange={v => handleRowChange(record.row_id, 'afternoon_day', v || null)}
          options={['C-T2','C-T3','C-T4','C-T5','C-T6','C-T7'].map(s => ({value: s, label: s}))} />
      )
    },
  ];

  // --- WORKSPACE VIEW ---
  if (selectedSessionId) {
    const curSession = sessions.find(s => s.session_id === selectedSessionId);
    const filteredLecs = lecturers.filter(l =>
      l.full_name.toLowerCase().includes(lecSearch.toLowerCase()) ||
      l.lecturer_code.toLowerCase().includes(lecSearch.toLowerCase())
    );

    // When a subject is focused (row clicked), filter sidebar to only show capable lecturers
    const capableLecIds = focusedSubjectId
      ? new Set([
          ...(prefMap[String(focusedSubjectId)]?.main || []),
          ...(prefMap[String(focusedSubjectId)]?.prac || [])
        ])
      : null;

    const displayLecs = capableLecIds
      ? filteredLecs.filter(l => capableLecIds.has(l.lecturer_id))
      : filteredLecs;

    // Sort lecturers: by hours ascending
    const getHours = (id: number) => statsMap[String(id)]?.hours || 0;
    const sortedLecs = [...displayLecs].sort((a, b) => getHours(a.lecturer_id) - getHours(b.lecturer_id));

    // When dragging: compute which subjects the dragged lecturer can teach
    const dragCapableSubjects = activeLecturer
      ? getLecturerCapableSubjects(activeLecturer.lecturer_id)
      : null;

    // Focused subject name for display
    const focusedRow = focusedSubjectId ? rows.find(r => r.subject_id === focusedSubjectId) : null;
    const focusedSubjectName = focusedRow?.subject_name || null;

    return (
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', height: '100%', background: 'var(--color-bg)' }}>
          {/* LEFT: Main Table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div style={{ background: 'var(--color-white)', padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button size="small" onClick={() => { setSelectedSessionId(null); setFocusedSubjectId(null); }}>← Quay lại</Button>
                <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)' }}>
                  {curSession?.plan_name}
                </span>
                <Tag color={curSession?.status === 'ACTIVE' ? 'green' : 'default'}>{curSession?.status}</Tag>
              </div>
              <Space>
                <Tooltip title="Xuất file Excel TKB">
                  <Button icon={<DownloadOutlined />} onClick={handleExport} aria-label="Xuất file Excel">
                    Export Excel
                  </Button>
                </Tooltip>
                <Button 
                  type="primary" 
                  icon={<ThunderboltOutlined />} 
                  onClick={() => setIsAutoAssignModalOpen(true)}
                >
                  ⚡ Auto-Assign
                </Button>
              </Space>
            </div>
            
            {/* Table */}
            <div className="flex-1 overflow-auto p-3">
              <Table 
                columns={tableColumns} 
                dataSource={rows} 
                rowKey="row_id" 
                scroll={{ x: 1600, y: 'calc(100vh - 220px)' }}
                size="small"
                bordered
                pagination={false}
                onRow={(record) => ({
                  onClick: () => {
                    // Toggle focus: click again to deselect
                    setFocusedSubjectId(prev => prev === record.subject_id ? null : record.subject_id);
                  },
                  style: {
                    cursor: 'pointer',
                    // If row is focused
                    ...(focusedSubjectId === record.subject_id && {
                      backgroundColor: '#eff6ff',
                      outline: '2px solid #3b82f6',
                      outlineOffset: '-2px'
                    }),
                    // If dragging: highlight compatible rows green, dim incompatible
                    ...(dragCapableSubjects && dragCapableSubjects.has(record.subject_id) && {
                      backgroundColor: '#f0fdf4',
                      outline: '2px solid #22c55e',
                      outlineOffset: '-2px'
                    }),
                    ...(dragCapableSubjects && !dragCapableSubjects.has(record.subject_id) && {
                      opacity: 0.35,
                    }),
                  }
                })}
              />
            </div>
          </div>

          {/* RIGHT: Sidebar Pool GV */}
          <div style={{ width: '280px', background: 'var(--color-white)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', boxShadow: '-2px 0 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-bg)' }}>
              {focusedSubjectId ? (
                <>
                  <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: '4px', fontSize: '13px' }}>✅ GV có thể dạy:</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={focusedSubjectName || ''}>
                    {focusedSubjectName}
                  </div>
                  <Button size="small" type="link" className="p-0 text-xs" onClick={() => setFocusedSubjectId(null)}>
                    ← Xem tất cả GV
                  </Button>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px', fontSize: '13px' }}>🎓 Pool Giảng Viên</div>
                  <Input 
                    prefix={<SearchOutlined className="text-slate-400" />}
                    placeholder="Tìm tên / mã GV…"
                    size="small"
                    allowClear
                    value={lecSearch}
                    onChange={e => setLecSearch(e.target.value)}
                  />
                  <div className="mt-2 text-xs text-slate-400">
                    {lecturers.length} GV tổng | {Object.keys(statsMap).length} đã phân công
                  </div>
                  <div className="mt-1 text-xs text-blue-400 italic">
                    👉 Click vào 1 dòng TKB để lọc GV phù hợp
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {sortedLecs.map(lec => (
                <DraggableLecturerCard 
                  key={lec.lecturer_id} 
                  lecturer={lec} 
                  stats={statsMap[String(lec.lecturer_id)] || { hours: 0, subjects: 0, classes: 0, slots: 0 }} 
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLecturer ? <LecturerDragOverlay lecturer={activeLecturer} /> : null}
        </DragOverlay>

        {/* AUTO-ASSIGN MODAL */}
        <Modal
          title="⚡ Phân Công Giảng Viên Tự Động"
          open={isAutoAssignModalOpen}
          onCancel={() => setIsAutoAssignModalOpen(false)}
          onOk={handleAutoAssign}
          confirmLoading={autoAssignLoading}
          okText="Chạy Thuật Toán"
          cancelText="Hủy"
        >
          <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 text-sm">
              Thuật toán sẽ tự động gán <b>Giảng viên</b> và <b>Ngày trong tuần (T2-T7)</b> cho tất cả các dòng TKB chưa được phân công, dựa trên buổi cố định đã chọn.
            </div>
            <div>
              <label className="font-semibold block mb-2">Chọn Chiến lược Phân bổ:</label>
              <Select 
                className="w-full" 
                value={autoAssignStrategy}
                onChange={setAutoAssignStrategy}
                options={[
                  { value: 'A', label: '🎯 Bão hòa (Saturation) — Dồn đủ 160 tiết/GV rồi mới chuyển sang GV tiếp theo' },
                  { value: 'B', label: '⚖️ San đều (Load Balancing) — Chia đều tiết cho tất cả GV' }
                ]}
              />
            </div>
          </div>
        </Modal>

        {/* RESULT MODAL */}
        <Modal
          title="📊 Kết Quả Phân Công Tự Động"
          open={isResultModalOpen}
          onCancel={() => setIsResultModalOpen(false)}
          footer={<Button type="primary" onClick={() => setIsResultModalOpen(false)}>Đóng</Button>}
          width={700}
        >
          {autoAssignResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                  <div className="text-3xl font-bold text-green-600">{autoAssignResult.assigned_count}</div>
                  <div className="text-sm text-green-700 mt-1">Đã phân công</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
                  <div className="text-3xl font-bold text-red-500">{autoAssignResult.unassigned_count}</div>
                  <div className="text-sm text-red-700 mt-1">Không thể gán</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                  <div className="text-3xl font-bold text-blue-600">{autoAssignResult.slot_assigned_count}</div>
                  <div className="text-sm text-blue-700 mt-1">Slot đã xếp</div>
                </div>
              </div>
              {autoAssignResult.warnings?.length > 0 && (
                <div>
                  <div className="font-semibold mb-2 text-amber-700">⚠️ Cảnh báo ({autoAssignResult.warnings.length}):</div>
                  <div className="max-h-60 overflow-y-auto bg-amber-50 p-3 rounded border border-amber-200 space-y-1">
                    {autoAssignResult.warnings.map((w: string, i: number) => (
                      <div key={i} className="text-sm text-amber-800">{w}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </DndContext>
    );
  }

  // --- SESSION LIST VIEW ---
  return (
    <div style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Workspace TKB</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsWizardOpen(true)}>
          Khởi tạo Đợt TKB mới
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {sessions.map(s => (
          <Col span={8} key={s.session_id}>
            <Card hoverable className="h-full" style={{ borderTop: '3px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }} actions={[
              <Button type="link" icon={<EyeOutlined />} onClick={() => loadSessionDetails(s.session_id)}>Truy cập Workspace</Button>,
              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSession(s.session_id)}>Xóa</Button>
            ]}>
              <Card.Meta 
                title={<div className="font-bold text-lg">{s.plan_name}</div>}
                description={
                  <div className="mt-2 space-y-2">
                    <div><CalendarOutlined className="mr-2"/>Ngày tạo: {s.created_at}</div>
                    <div className="text-xs text-gray-400">Trạng thái: {s.status}</div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
        {sessions.length === 0 && (
          <div className="w-full text-center text-gray-400 mt-20 italic">Chưa có Đợt xếp lịch nào. Hãy tạo đợt mới.</div>
        )}
      </Row>

      {/* MODAL WIZARD */}
      <Modal
        title={currentStep === 0 ? "Bước 1: Thông tin cơ bản" : "Bước 2: Cấu hình Khóa & Kỳ"}
        open={isWizardOpen}
        onCancel={() => { setIsWizardOpen(false); setCurrentStep(0); }}
        width={700}
        footer={null}
        destroyOnClose
      >
        <Steps current={currentStep} className="mb-8 mt-4" items={[
          { title: "Thông tin mảng & Ngành" },
          { title: "Cấu hình Lớp theo Khóa" },
          { title: "Hoàn tất Gen Lớp" }
        ]} />

        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <label className="font-semibold block mb-1">Tên Đợt TKB (*):</label>
              <Input placeholder="VD: TKB Chính khóa HK1 2024-2025" 
                 value={wizardConfig.plan_name} onChange={e => setWizardConfig({...wizardConfig, plan_name: e.target.value})} 
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Nguồn Đăng Ký Nguyện Vọng:</label>
              <Select 
                allowClear className="w-full"
                placeholder="Chọn Danh sách nguyện vọng giảng dạy (Không bắt buộc ngay)"
                value={wizardConfig.registration_list_id}
                onChange={v => setWizardConfig({...wizardConfig, registration_list_id: v})}
                options={regLists.map(l => ({label: l.list_name, value: l.list_id}))}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Chọn Khung Chương Trình tham gia xếp lịch (*):</label>
              <Select 
                mode="multiple" className="w-full"
                placeholder="Chọn ít nhất 1 Chương trình"
                value={wizardConfig.program_ids}
                onChange={val => setWizardConfig({...wizardConfig, program_ids: val})}
                options={programs.map(p => ({label: `${p.name} (Khóa ${p.batch})`, value: p.id}))}
              />
            </div>
            <div className="text-right mt-6">
              <Button type="primary" onClick={handleNextStep1}>Tiếp tục →</Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200">
              Hệ thống sẽ dựa vào cấu hình dưới đây để nhân chéo với DB (Lấy các lớp của khóa tương ứng, lấy các môn của học kì đó) và tự sinh (auto-gen) ra một cấu trúc Mảng y hệt file Excel.
            </div>
            
            {wizardConfig.program_ids.map(p_id => {
              const prog = programs.find(p => p.id === p_id);
              return (
                <Card key={p_id} title={<span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Chương trình: {prog?.name}</span>} size="small">
                  {entriesConfig[p_id]?.map((cfg: any, i: number) => (
                    <Row gutter={16} key={i} className="mb-2">
                      <Col span={10}>
                        <Select className="w-full" value={cfg.semester_index} onChange={v => updateEntry(p_id, i, 'semester_index', v)} options={[1,2,3,4,5,6,7,8].map(n=>({label:`Học Kì ${n}`, value:n}))} />
                      </Col>
                      <Col span={4}>
                        <Button danger type="text" onClick={() => {
                          const list = [...entriesConfig[p_id]];
                          list.splice(i, 1);
                          setEntriesConfig({...entriesConfig, [p_id]: list});
                        }}>Xóa</Button>
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" block icon={<PlusOutlined />} onClick={() => handleAddEntry(p_id)}>
                    Thêm Kì Khác Cho Chương Trình Này
                  </Button>
                </Card>
              );
            })}

            <div className="flex justify-between mt-6">
              <Button onClick={() => setCurrentStep(0)}>← Quay lại</Button>
              <Button type="primary" onClick={handleGenerate}>Xác nhận Tạo cấu trúc Lớp & Môn →</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
