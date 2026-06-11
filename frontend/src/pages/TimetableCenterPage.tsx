import React, { useState, useEffect, useMemo } from 'react';
import {
  Button, Table, Modal,
  Input, Select, Space, Card, message, Steps, Row, Col,
  Progress, Tag, Tooltip, DatePicker, Tabs
} from 'antd';
const { CheckableTag } = Tag;
import {
  PlusOutlined, EyeOutlined, CalendarOutlined,
  ThunderboltOutlined, SearchOutlined, DeleteOutlined, DownloadOutlined,
  SortAscendingOutlined, SortDescendingOutlined, LeftOutlined, RightOutlined
} from '@ant-design/icons';
import apiClient from '../api/client';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// Typography components used via Typography.Title etc. if needed, 
// but here they were extracted and unused.

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
      style={{ ...style, boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.15s, box-shadow 0.15s' }}
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
        <span title="Số học phần dạy">Học phần: {subjects}</span>
        <span title="Số lớp dạy">Lớp: {classes}</span>
        <span title="Số buổi/tuần">Buổi: {slots}/14</span>
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
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Sidebar
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [lecSearch, setLecSearch] = useState('');

  // Real-time local stats calculation to track lecturer hours and load dynamically at 60 FPS in memory
  const statsMap = useMemo(() => {
    const lecData: Record<string, { hours: number; subjects: Set<number>; classes: Set<string>; slots: Set<string> }> = {};
    
    const getLec = (id: number) => {
      const key = String(id);
      if (!lecData[key]) {
        lecData[key] = {
          hours: 0,
          subjects: new Set<number>(),
          classes: new Set<string>(),
          slots: new Set<string>()
        };
      }
      return lecData[key];
    };

    rows.forEach(r => {
      const theoryH = r.theory_hours || 0;
      const practiceH = r.practice_hours || 0;
      const slot = r.morning_day || r.afternoon_day || null;
      
      const mainId = r.main_lecturer_id;
      const pracId = r.prac_lecturer_id;
      
      if (mainId) {
        const md = getLec(mainId);
        if (r.subject_id) md.subjects.add(r.subject_id);
        if (r.class_name) md.classes.add(r.class_name);
        if (slot) md.slots.add(slot);
        
        if (pracId) {
          md.hours += theoryH;
          const pd = getLec(pracId);
          pd.hours += practiceH;
          if (r.subject_id) pd.subjects.add(r.subject_id);
          if (r.class_name) pd.classes.add(r.class_name);
          if (slot) pd.slots.add(slot);
        } else {
          md.hours += theoryH + practiceH;
        }
      }
    });

    const result: Record<string, LecStats> = {};
    Object.entries(lecData).forEach(([lid, d]) => {
      result[lid] = {
        hours: d.hours,
        subjects: d.subjects.size,
        classes: d.classes.size,
        slots: d.slots.size
      };
    });
    return result;
  }, [rows]);
  // Pool filters
  const [poolTypeFilter, setPoolTypeFilter] = useState<string>('all'); // 'all' | 'Cơ hữu' | 'Thỉnh giảng'
  const [poolRoleFilter, setPoolRoleFilter] = useState<string>('all'); // 'all' | 'LT' | 'TH'
  const [poolSortAsc, setPoolSortAsc] = useState(true);
  const [activeLecturer, setActiveLecturer] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [classesList, setClassesList] = useState<any[]>([]);

  // Preference map: subject_id -> {main: [lec_ids], prac: [lec_ids]}
  const [prefMap, setPrefMap] = useState<Record<string, { main: number[], prac: number[] }>>({});
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
    program_ids: [] as number[],
    description: ""
  });
  const [entriesConfig, setEntriesConfig] = useState<any>({});

  // Date/Info Config Modal State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [dateModalSessionId, setDateModalSessionId] = useState<number | null>(null);
  const [dateModalSessionName, setDateModalSessionName] = useState<string>('');
  const [dateModalSessionDesc, setDateModalSessionDesc] = useState<string>('');
  const [startDateVal, setStartDateVal] = useState<dayjs.Dayjs | null>(null);
  const [dateModalRegListId, setDateModalRegListId] = useState<number | null>(null);
  const [dateModalLoading, setDateModalLoading] = useState(false);

  const handleOpenDateModal = (session: any) => {
    setDateModalSessionId(session.session_id);
    setDateModalSessionName(session.plan_name);
    setStartDateVal(session.start_date ? dayjs(session.start_date) : null);
    setDateModalSessionDesc(session.description || '');
    setDateModalRegListId(session.registration_list_id || null);
    setIsDateModalOpen(true);
  };

  const handleSaveSessionDate = async () => {
    if (!startDateVal) {
      message.warning("Vui lòng chọn ngày bắt đầu");
      return;
    }
    if (!dateModalSessionName.trim()) {
      message.warning("Tên đợt TKB không được bỏ trống");
      return;
    }
    setDateModalLoading(true);
    try {
      const formatted = startDateVal.format('YYYY-MM-DD');
      // Update dates
      await apiClient.put(`/timetables/${dateModalSessionId}/dates`, { start_date: formatted });
      // Update info (name, description, & registration_list_id)
      await apiClient.put(`/timetables/${dateModalSessionId}/info`, {
        plan_name: dateModalSessionName,
        description: dateModalSessionDesc,
        registration_list_id: dateModalRegListId
      });
      message.success("Cấu hình đợt TKB thành công!");
      setIsDateModalOpen(false);
      fetchSessions();
      if (selectedSessionId === dateModalSessionId && dateModalSessionId !== null) {
        loadSessionDetails(dateModalSessionId);
      }
    } catch (e: any) {
      message.error(e.response?.data?.detail || "Lỗi lưu cấu hình");
    } finally {
      setDateModalLoading(false);
    }
  };

  const handleResetTimetable = () => {
    Modal.confirm({
      title: 'Reset Đợt Thời Khóa Biểu',
      content: 'Thao tác này sẽ xóa toàn bộ giảng viên đã gán (cả giảng viên chính và thực hành) cùng với ca dạy của tất cả các dòng thuộc đợt này. Bạn có chắc chắn muốn tiếp tục?',
      okText: 'Xác nhận Reset',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        setDateModalLoading(true);
        try {
          await apiClient.post(`/timetables/${dateModalSessionId}/reset`);
          message.success("Đã reset toàn bộ Giảng viên và Ca học thành trống!");
          setIsDateModalOpen(false);
          fetchSessions();
          if (selectedSessionId === dateModalSessionId && dateModalSessionId !== null) {
            loadSessionDetails(dateModalSessionId);
          }
        } catch (e: any) {
          message.error(e.response?.data?.detail || "Lỗi khi reset TKB");
        } finally {
          setDateModalLoading(false);
        }
      }
    });
  };

  // --- DATA LOADING ---
  const fetchSessions = async () => {
    try {
      const res = await apiClient.get('/timetables/');
      setSessions(res.data);
    } catch { message.error("Lỗi lấy danh sách Đợt TKB"); }
  };

  const fetchRegLists = async () => {
    try { const res = await apiClient.get('/registrations/lists'); setRegLists(res.data); } catch { }
  };

  const fetchPrograms = async () => {
    try { const res = await apiClient.get('/programs/'); setPrograms(res.data); } catch { }
  };

  const fetchLecturers = async () => {
    try { const res = await apiClient.get('/lecturers/'); setLecturers(res.data); } catch { }
  };

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get('/classes/');
      setClassesList(res.data);
    } catch { }
  };

  const uniqueBatches = useMemo(() => {
    const batches = new Set<string>();
    classesList.forEach(c => {
      if (c.batch) {
        batches.add(c.batch);
      }
    });
    return Array.from(batches).sort();
  }, [classesList]);

  const fetchPrefMap = async (sessionId: number) => {
    try {
      const res = await apiClient.get(`/timetables/${sessionId}/preference-map`);
      setPrefMap(res.data);
    } catch { }
  };

  useEffect(() => {
    fetchSessions();
    fetchRegLists();
    fetchPrograms();
    fetchLecturers();
    fetchClasses();
  }, []);

  const loadSessionDetails = async (id: number) => {
    try {
      const res = await apiClient.get(`/timetables/${id}/rows`);
      setRows(res.data);
      setSelectedSessionId(id);
      setFocusedSubjectId(null);
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
      if (!newConfig[p_id]) newConfig[p_id] = [{ semester_index: 1, batch: null }];
    });
    setEntriesConfig(newConfig);
    setCurrentStep(1);
  };

  const handleAddEntry = (p_id: number) => {
    const list = [...entriesConfig[p_id]];
    list.push({ semester_index: 1, batch: null });
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
            payloadEntries.push({
              program_id: parseInt(p_id),
              semester_index: cfg.semester_index,
              batch: cfg.batch || null
            });
          }
        });
      });
      if (payloadEntries.length === 0) { message.warning("Vui lòng điền đầy đủ Kỳ cho các khung"); return; }

      const res = await apiClient.post('/timetables/generate', {
        plan_name: wizardConfig.plan_name,
        registration_list_id: wizardConfig.registration_list_id,
        description: wizardConfig.description,
        entries: payloadEntries
      });

      message.success("Tạo Đợt TKB và Gen dữ liệu Lớp-Học phần thành công!");
      setIsWizardOpen(false);
      setCurrentStep(0);
      setWizardConfig({ plan_name: "", registration_list_id: null, program_ids: [], description: "" });
      fetchSessions();
      loadSessionDetails(res.data.session_id);
    } catch (e: any) { message.error(e.response?.data?.detail || "Lỗi tạo TKB"); }
  };

  // --- ROW UPDATE ---
  const handleRowChange = (row_id: number, field: string, value: any) => {
    // Build local update object
    const localUpdate: any = { [field]: value };
    // When clearing a lecturer, also clear the display name; when assigning, set the full name
    if (field === 'main_lecturer_id') {
      if (value === null) {
        localUpdate.main_lecturer_name = null;
      } else {
        const found = lecturers.find(l => l.lecturer_id === value);
        localUpdate.main_lecturer_name = found ? found.full_name : null;
      }
    }
    if (field === 'prac_lecturer_id') {
      if (value === null) {
        localUpdate.prac_lecturer_name = null;
      } else {
        const found = lecturers.find(l => l.lecturer_id === value);
        localUpdate.prac_lecturer_name = found ? found.full_name : null;
      }
    }

    setRows(prevRows =>
      prevRows.map(r => {
        if (r.row_id === row_id) {
          return { ...r, ...localUpdate };
        }
        return r;
      })
    );
    setHasChanges(true);
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
  };

  // --- SAVE & GO BACK ---
  const handleSaveAll = async () => {
    if (!selectedSessionId) return;
    setSaveLoading(true);
    try {
      const payload = rows.map(r => ({
        row_id: r.row_id,
        fixed_shift: r.fixed_shift || null,
        room_type: r.room_type || null,
        morning_day: r.morning_day || null,
        afternoon_day: r.afternoon_day || null,
        main_lecturer_id: r.main_lecturer_id || null,
        prac_lecturer_id: r.prac_lecturer_id || null,
        start_date: r.start_date ? dayjs(r.start_date).format('YYYY-MM-DD') : null,
        end_date: r.end_date ? dayjs(r.end_date).format('YYYY-MM-DD') : null,
      }));

      await apiClient.post(`/timetables/${selectedSessionId}/save-rows`, payload);
      message.success("Đã lưu thành công toàn bộ thay đổi vào database!");
      setHasChanges(false);
      
      // Refresh sessions
      await fetchSessions();
    } catch (e: any) {
      message.error(e.response?.data?.detail || "Lỗi lưu dữ liệu thời khóa biểu");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      Modal.confirm({
        title: 'Xác nhận quay lại',
        content: 'Bạn có các thay đổi chưa được lưu. Nếu quay lại, các thay đổi này sẽ bị mất. Bạn vẫn muốn tiếp tục?',
        okText: 'Quay lại và mất thay đổi',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        onOk: () => {
          setSelectedSessionId(null);
          setFocusedSubjectId(null);
          setHasChanges(false);
          fetchSessions();
        }
      });
    } else {
      setSelectedSessionId(null);
      setFocusedSubjectId(null);
      fetchSessions();
    }
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
      // 1. Nếu có thay đổi chưa lưu, tự động lưu trước để database đồng bộ!
      if (hasChanges) {
        const payload = rows.map(r => ({
          row_id: r.row_id,
          fixed_shift: r.fixed_shift || null,
          room_type: r.room_type || null,
          morning_day: r.morning_day || null,
          afternoon_day: r.afternoon_day || null,
          main_lecturer_id: r.main_lecturer_id || null,
          prac_lecturer_id: r.prac_lecturer_id || null,
          start_date: r.start_date ? dayjs(r.start_date).format('YYYY-MM-DD') : null,
          end_date: r.end_date ? dayjs(r.end_date).format('YYYY-MM-DD') : null,
        }));
        await apiClient.post(`/timetables/${selectedSessionId}/save-rows`, payload);
      }

      // 2. Chạy tự động phân công
      const res = await apiClient.post(
        `/timetables/${selectedSessionId}/auto-assign`,
        null,
        { params: { strategy: autoAssignStrategy } }
      );
      
      // Cập nhật state rows cục bộ với danh sách dòng đề xuất từ backend
      if (res.data.rows) {
        setRows(res.data.rows);
      }
      
      setHasChanges(true); // Trực tiếp hiện nút "Lưu thay đổi *" !
      
      setAutoAssignResult(res.data);
      setIsAutoAssignModalOpen(false);
      setIsResultModalOpen(true);
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

  // --- HELPERS ---

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
    {
      title: 'Tên Lớp', dataIndex: 'class_name', width: 120, fixed: 'left', className: 'font-semibold',
      sorter: (a, b) => (a.class_name || '').localeCompare(b.class_name || '')
    },
    {
      title: 'Buổi CĐ', dataIndex: 'fixed_shift', width: 100,
      sorter: (a, b) => (a.fixed_shift || '').localeCompare(b.fixed_shift || ''),
      render: (val, record) => (
        <Select size="small" style={{ width: '100%' }} value={val} allowClear placeholder="Chọn"
          onChange={v => handleRowChange(record.row_id, 'fixed_shift', v)}
          options={[{ value: 'Sáng', label: 'Sáng' }, { value: 'Chiều', label: 'Chiều' }]} />
      )
    },
    {
      title: 'Mã Học phần', dataIndex: 'subject_code', width: 90,
      sorter: (a, b) => (a.subject_code || '').localeCompare(b.subject_code || '')
    },
    {
      title: 'Tên Học Phần', dataIndex: 'subject_name', width: 220, ellipsis: true,
      sorter: (a, b) => (a.subject_name || '').localeCompare(b.subject_name || '')
    },
    {
      title: 'TC', dataIndex: 'credits', width: 45, align: 'center',
      sorter: (a, b) => (a.credits || 0) - (b.credits || 0)
    },
    {
      title: 'LT', dataIndex: 'theory_hours', width: 45, align: 'center',
      sorter: (a, b) => (a.theory_hours || 0) - (b.theory_hours || 0)
    },
    {
      title: 'TH', dataIndex: 'practice_hours', width: 45, align: 'center',
      sorter: (a, b) => (a.practice_hours || 0) - (b.practice_hours || 0)
    },
    {
      title: 'GV Chính', dataIndex: 'main_lecturer_name', width: 180,
      sorter: (a, b) => (a.main_lecturer_name || '').localeCompare(b.main_lecturer_name || ''),
      render: (val, record) => (
        <DroppableCell rowId={record.row_id} field="main_lecturer_id">
          {val ? (
            <Tag color="blue" closable onClose={() => handleRowChange(record.row_id, 'main_lecturer_id', null)}>
              {val}
            </Tag>
          ) : <span className="text-gray-300 italic text-xs">Kéo GV vào đây</span>}
        </DroppableCell>
      )
    },
    {
      title: 'GV Thực Hành', dataIndex: 'prac_lecturer_name', width: 180,
      sorter: (a, b) => (a.prac_lecturer_name || '').localeCompare(b.prac_lecturer_name || ''),
      render: (val, record) => (
        <DroppableCell rowId={record.row_id} field="prac_lecturer_id">
          {val ? (
            <Tag color="cyan" closable onClose={() => handleRowChange(record.row_id, 'prac_lecturer_id', null)}>
              {val}
            </Tag>
          ) : <span className="text-gray-300 italic text-xs">Kéo GV vào đây</span>}
        </DroppableCell>
      )
    },
    {
      title: 'Phòng', dataIndex: 'room_type', width: 120,
      sorter: (a, b) => (a.room_type || '').localeCompare(b.room_type || ''),
      render: (val, record) => (
        <Select size="small" style={{ width: '100%' }} value={val} allowClear placeholder="Chọn"
          onChange={v => handleRowChange(record.row_id, 'room_type', v)}
          options={[{ value: 'Phòng thường', label: 'Phòng thường' }, { value: 'Phòng máy', label: 'Phòng máy' }]} />
      )
    },
    {
      title: 'Thứ-S', dataIndex: 'morning_day', width: 90, align: 'center',
      sorter: (a, b) => (a.morning_day || '').localeCompare(b.morning_day || ''),
      render: (val, record) => (
        <Select size="small" style={{ width: '100%' }} value={val || undefined} allowClear placeholder="-"
          onChange={v => handleRowChange(record.row_id, 'morning_day', v || null)}
          options={['S-T2', 'S-T3', 'S-T4', 'S-T5', 'S-T6', 'S-T7'].map(s => ({ value: s, label: s }))} />
      )
    },
    {
      title: 'Thứ-C', dataIndex: 'afternoon_day', width: 90, align: 'center',
      sorter: (a, b) => (a.afternoon_day || '').localeCompare(b.afternoon_day || ''),
      render: (val, record) => (
        <Select size="small" style={{ width: '100%' }} value={val || undefined} allowClear placeholder="-"
          onChange={v => handleRowChange(record.row_id, 'afternoon_day', v || null)}
          options={['C-T2', 'C-T3', 'C-T4', 'C-T5', 'C-T6', 'C-T7'].map(s => ({ value: s, label: s }))} />
      )
    },
    {
      title: 'Thời gian',
      key: 'dates',
      width: 250,
      render: (_, record) => {
        if (!record.start_date) {
          return <span className="text-gray-400 italic text-xs">Chưa thiết lập</span>;
        }
        return (
          <Space size="small">
            <span className="text-xs">{dayjs(record.start_date).format('DD/MM/YYYY')}</span>
            <span>-</span>
            <DatePicker
              size="small"
              value={record.end_date ? dayjs(record.end_date) : null}
              format="DD/MM/YYYY"
              allowClear={false}
              onChange={(date) => {
                const formattedDate = date ? date.format('YYYY-MM-DD') : null;
                handleRowChange(record.row_id, 'end_date', formattedDate);
              }}
            />
          </Space>
        );
      }
    },
  ];

  // --- Derive LT/TH role sets from prefMap (from the linked registration list) ---
  const lecturerRoleMap = useMemo(() => {
    const roleMap: Record<number, { isLT: boolean; isTH: boolean }> = {};
    for (const pref of Object.values(prefMap)) {
      for (const lid of (pref.main || [])) {
        if (!roleMap[lid]) roleMap[lid] = { isLT: false, isTH: false };
        roleMap[lid].isLT = true;
      }
      for (const lid of (pref.prac || [])) {
        if (!roleMap[lid]) roleMap[lid] = { isLT: false, isTH: false };
        roleMap[lid].isTH = true;
      }
    }
    return roleMap;
  }, [prefMap]);

  // --- WORKSPACE VIEW ---
  if (selectedSessionId) {
    const curSession = sessions.find(s => s.session_id === selectedSessionId);

    // Apply text search
    let filteredLecs = lecturers.filter(l =>
      l.full_name.toLowerCase().includes(lecSearch.toLowerCase()) ||
      l.lecturer_code.toLowerCase().includes(lecSearch.toLowerCase())
    );

    // Apply type filter (Cơ hữu / Thỉnh giảng)
    if (poolTypeFilter !== 'all') {
      filteredLecs = filteredLecs.filter(l => l.type === poolTypeFilter);
    }

    // Apply role filter (LT / TH from registration list)
    if (poolRoleFilter !== 'all') {
      filteredLecs = filteredLecs.filter(l => {
        const role = lecturerRoleMap[l.lecturer_id];
        if (!role) return false;
        return poolRoleFilter === 'LT' ? role.isLT : role.isTH;
      });
    }

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

    // Sort lecturers by hours
    const getHours = (id: number) => statsMap[String(id)]?.hours || 0;
    const sortedLecs = [...displayLecs].sort((a, b) =>
      poolSortAsc
        ? getHours(a.lecturer_id) - getHours(b.lecturer_id)
        : getHours(b.lecturer_id) - getHours(a.lecturer_id)
    );

    // When dragging: compute which subjects the dragged lecturer can teach
    const dragCapableSubjects = activeLecturer
      ? getLecturerCapableSubjects(activeLecturer.lecturer_id)
      : null;

    // Focused subject name for display
    const focusedRow = focusedSubjectId ? rows.find(r => r.subject_id === focusedSubjectId) : null;
    const focusedSubjectName = focusedRow?.subject_name || null;

    return (
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)', background: 'var(--color-bg)', position: 'relative' }}>
          {/* LEFT: Main Table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div style={{ background: 'var(--color-white)', padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button size="small" onClick={handleGoBack}>← Quay lại</Button>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
                    <Tooltip title={curSession?.plan_name}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '15px', 
                        color: 'var(--color-text)',
                        maxWidth: '220px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                        verticalAlign: 'middle'
                      }}>
                        {curSession?.plan_name}
                      </span>
                    </Tooltip>
                    <Tag color={curSession?.status === 'ACTIVE' ? 'green' : 'default'} style={{ margin: 0 }}>{curSession?.status}</Tag>
                    {curSession?.start_date && (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                        ({dayjs(curSession.start_date).format('DD/MM/YYYY')} - {curSession.end_date ? dayjs(curSession.end_date).format('DD/MM/YYYY') : '?'})
                      </span>
                    )}
                  </div>
                  {curSession?.description && (
                    <Tooltip title={curSession.description}>
                      <span style={{ 
                        fontSize: '11.5px', 
                        color: 'var(--color-text-secondary)', 
                        marginTop: '2px',
                        maxWidth: '350px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline-block'
                      }}>
                        Ghi chú: {curSession.description}
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>
              <Space>
                {hasChanges && (
                  <>
                    <style>{`
                      @keyframes savePulse {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 140, 22, 0.7); }
                        70% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(250, 140, 22, 0); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(250, 140, 22, 0); }
                      }
                    `}</style>
                    <Button
                      type="primary"
                      loading={saveLoading}
                      onClick={handleSaveAll}
                      style={{
                        backgroundColor: '#fa8c16',
                        borderColor: '#fa8c16',
                        color: '#fff',
                        fontWeight: 600,
                        animation: 'savePulse 1.8s infinite ease-in-out',
                      }}
                    >
                      Lưu thay đổi *
                    </Button>
                  </>
                )}
                <Tooltip title="Xuất file Excel TKB">
                  <Button icon={<DownloadOutlined />} onClick={handleExport} aria-label="Xuất file Excel">
                    Xuất ra Excel
                  </Button>
                </Tooltip>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => setIsAutoAssignModalOpen(true)}
                >
                  Tự động phân công
                </Button>
              </Space>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden p-3 flex flex-col">
              <Table
                columns={tableColumns}
                dataSource={rows}
                rowKey="row_id"
                scroll={{ x: 1600, y: 'calc(100vh - 240px)' }}
                size="small"
                bordered
                pagination={false}
                showSorterTooltip={false}
                rowClassName={(record) => {
                  const sId = String(record.subject_id);
                  const mainPrefs = prefMap[sId]?.main || [];
                  const pracPrefs = prefMap[sId]?.prac || [];
                  
                  const mainError = record.main_lecturer_id !== null && !mainPrefs.includes(record.main_lecturer_id);
                  const pracError = record.prac_lecturer_id !== null && !pracPrefs.includes(record.prac_lecturer_id);
                  
                  let cls = '';
                  if (dragCapableSubjects) {
                    if (dragCapableSubjects.has(record.subject_id)) {
                      cls = 'row-drag-capable';
                    } else {
                      cls = 'row-drag-incapable';
                    }
                  } else if (mainError || pracError) {
                    cls = 'row-assignment-error';
                  } else if (focusedSubjectId === record.subject_id) {
                    cls = 'row-focused';
                  }
                  return cls;
                }}
                onRow={(record) => ({
                  onClick: () => {
                    // Toggle focus: click again to deselect
                    setFocusedSubjectId(prev => prev === record.subject_id ? null : record.subject_id);
                  },
                  style: {
                    cursor: 'pointer',
                  }
                })}
              />
            </div>
          </div>

          {/* RIGHT: Sidebar Pool GV */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Collapse toggle button */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '-12px',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}>
              <Button
                shape="circle"
                size="small"
                icon={sidebarCollapsed ? <LeftOutlined /> : <RightOutlined />}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                  background: 'var(--color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Sliding container */}
            <div style={{
              width: sidebarCollapsed ? '0px' : '300px',
              overflow: 'hidden',
              transition: 'width 0.2s ease-in-out',
              background: 'var(--color-white)',
              borderLeft: sidebarCollapsed ? 'none' : '1px solid var(--color-border)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: sidebarCollapsed ? 'none' : '-2px 0 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ width: '300px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-bg)', flexShrink: 0 }}>
                  {focusedSubjectId ? (
                    <>
                      <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: '4px', fontSize: '13px' }}>GV có thể dạy:</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={focusedSubjectName || ''}>
                        {focusedSubjectName}
                      </div>
                      <Button size="small" type="link" className="p-0 text-xs" onClick={() => setFocusedSubjectId(null)}>
                        ← Xem tất cả GV
                      </Button>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '13px' }}>Danh sách Giảng Viên</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{sortedLecs.length}/{lecturers.length}</span>
                      </div>
                      <Input
                        prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
                        placeholder="Tìm tên hoặc mã GV…"
                        size="small"
                        allowClear
                        value={lecSearch}
                        onChange={e => setLecSearch(e.target.value)}
                        style={{ marginBottom: '8px' }}
                      />
                      {/* Filter Row 1: Employment Type */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <CheckableTag checked={poolTypeFilter === 'all'} onChange={() => setPoolTypeFilter('all')}
                          style={{ fontSize: '11px', borderRadius: '10px', padding: '1px 8px', border: poolTypeFilter === 'all' ? 'none' : '1px solid var(--color-border)' }}>Tất cả</CheckableTag>
                        <CheckableTag checked={poolTypeFilter === 'Cơ hữu'} onChange={() => setPoolTypeFilter(poolTypeFilter === 'Cơ hữu' ? 'all' : 'Cơ hữu')}
                          style={{ fontSize: '11px', borderRadius: '10px', padding: '1px 8px', border: poolTypeFilter === 'Cơ hữu' ? 'none' : '1px solid var(--color-border)' }}>Cơ hữu</CheckableTag>
                        <CheckableTag checked={poolTypeFilter === 'Thỉnh giảng'} onChange={() => setPoolTypeFilter(poolTypeFilter === 'Thỉnh giảng' ? 'all' : 'Thỉnh giảng')}
                          style={{ fontSize: '11px', borderRadius: '10px', padding: '1px 8px', border: poolTypeFilter === 'Thỉnh giảng' ? 'none' : '1px solid var(--color-border)' }}>Thỉnh giảng</CheckableTag>
                      </div>
                      {/* Filter Row 2: LT/TH Role + Sort */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <CheckableTag checked={poolRoleFilter === 'LT'} onChange={() => setPoolRoleFilter(poolRoleFilter === 'LT' ? 'all' : 'LT')}
                            style={{ fontSize: '11px', borderRadius: '10px', padding: '1px 8px', border: poolRoleFilter === 'LT' ? 'none' : '1px solid var(--color-border)' }}>Lý thuyết</CheckableTag>
                          <CheckableTag checked={poolRoleFilter === 'TH'} onChange={() => setPoolRoleFilter(poolRoleFilter === 'TH' ? 'all' : 'TH')}
                            style={{ fontSize: '11px', borderRadius: '10px', padding: '1px 8px', border: poolRoleFilter === 'TH' ? 'none' : '1px solid var(--color-border)' }}>Thực hành</CheckableTag>
                        </div>
                        <Tooltip title={poolSortAsc ? 'Ít tiết → Nhiều tiết' : 'Nhiều tiết → Ít tiết'}>
                          <Button
                            size="small"
                            type="text"
                            icon={poolSortAsc ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                            onClick={() => setPoolSortAsc(!poolSortAsc)}
                            style={{ fontSize: '14px', color: 'var(--color-accent)' }}
                          />
                        </Tooltip>
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Chọn 1 dòng TKB để lọc GV phù hợp
                      </div>
                    </>
                  )}
                </div>
                {/* Scrollable List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }} className="custom-scrollbar">
                  {sortedLecs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: '12px' }}>Không có giảng viên phù hợp</div>
                  )}
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
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLecturer ? <LecturerDragOverlay lecturer={activeLecturer} /> : null}
        </DragOverlay>

        {/* AUTO-ASSIGN MODAL */}
        <Modal
          title="Phân Công Giảng Viên Tự Động"
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
                  { value: 'A', label: 'Bão hòa (Saturation) — Dồn đủ 160 tiết/GV rồi mới chuyển sang GV tiếp theo' },
                  { value: 'B', label: 'San đều (Load Balancing) — Chia đều tiết cho tất cả GV' }
                ]}
              />
            </div>
          </div>
        </Modal>

        {/* RESULT MODAL */}
        <Modal
          title="Kết Quả Phân Công Tự Động"
          open={isResultModalOpen}
          onCancel={() => setIsResultModalOpen(false)}
          footer={<Button type="primary" onClick={() => setIsResultModalOpen(false)}>Đóng</Button>}
          width={700}
        >
          {autoAssignResult && (() => {
            const warnings = autoAssignResult.warnings || [];
            
            // Phân loại cảnh báo dựa trên từ khóa
            const noRegWarnings = warnings.filter((w: string) => w.includes("không có GV đăng ký"));
            const noLecAvailableWarnings = warnings.filter((w: string) => w.includes("Hết giảng viên chính khả dụng"));
            const overloadWarnings = warnings.filter((w: string) => 
              !w.includes("không có GV đăng ký") && !w.includes("Hết giảng viên chính khả dụng")
            );

            return (
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
                {warnings.length > 0 && (
                  <div>
                    <div className="font-semibold mb-3 text-amber-800">Danh sách cảnh báo chi tiết ({warnings.length}):</div>
                    <Tabs
                      defaultActiveKey="1"
                      type="card"
                      size="small"
                      items={[
                        {
                          key: '1',
                          label: `Hết GV khả dụng (${noLecAvailableWarnings.length})`,
                          children: (
                            <div className="max-h-60 overflow-y-auto bg-red-50 p-3 rounded border border-red-100 space-y-1 custom-scrollbar">
                              {noLecAvailableWarnings.length > 0 ? (
                                noLecAvailableWarnings.map((w: string, i: number) => (
                                  <div key={i} className="text-sm text-red-800 flex items-start gap-1">
                                    <span>❌</span>
                                    <span>{w.replace('❌', '').trim()}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-400 italic py-4 text-center">Không có cảnh báo nào</div>
                              )}
                            </div>
                          ),
                        },
                        {
                          key: '2',
                          label: `Môn chưa có đăng ký dạy (${noRegWarnings.length})`,
                          children: (
                            <div className="max-h-60 overflow-y-auto bg-amber-50 p-3 rounded border border-amber-100 space-y-1 custom-scrollbar">
                              {noRegWarnings.length > 0 ? (
                                noRegWarnings.map((w: string, i: number) => (
                                  <div key={i} className="text-sm text-amber-800 flex items-start gap-1">
                                    <span>⚠️</span>
                                    <span>{w.replace('⚠️', '').trim()}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-400 italic py-4 text-center">Không có cảnh báo nào</div>
                              )}
                            </div>
                          ),
                        },
                        {
                          key: '3',
                          label: `Cảnh báo quá tải (${overloadWarnings.length})`,
                          children: (
                            <div className="max-h-60 overflow-y-auto bg-orange-50/50 p-3 rounded border border-orange-100 space-y-1 custom-scrollbar">
                              {overloadWarnings.length > 0 ? (
                                overloadWarnings.map((w: string, i: number) => (
                                  <div key={i} className="text-sm text-orange-800 flex items-start gap-1">
                                    <span>⚠️</span>
                                    <span>{w.replace('⚠️', '').trim()}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-400 italic py-4 text-center">Không có cảnh báo nào</div>
                              )}
                            </div>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </div>
            );
          })()}
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
              <Button type="link" icon={<EyeOutlined />} onClick={() => loadSessionDetails(s.session_id)}>Workspace</Button>,
              <Button type="link" icon={<CalendarOutlined />} onClick={() => handleOpenDateModal(s)}>Cấu hình</Button>,
              <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteSession(s.session_id)}>Xóa</Button>
            ]}>
              <Card.Meta
                title={<div className="font-bold text-lg truncate" title={s.plan_name}>{s.plan_name}</div>}
                description={
                  <div className="mt-2 space-y-2 text-xs">
                    {s.description ? (
                      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', minHeight: '32px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {s.description}
                      </p>
                    ) : (
                      <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '8px', minHeight: '32px' }}>
                        Không có ghi chú
                      </p>
                    )}
                    <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px dashed var(--color-border-light)', paddingTop: '8px' }}>
                      <CalendarOutlined className="mr-1" />
                      <span>Ngày tạo: {dayjs(s.created_at).format('DD/MM/YYYY')}</span>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarOutlined className="mr-1" />
                      <span>
                        Thời gian: {s.start_date ? `${dayjs(s.start_date).format('DD/MM/YYYY')} - ${s.end_date ? dayjs(s.end_date).format('DD/MM/YYYY') : '?'}` : 'Chưa thiết lập'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Trạng thái: <Tag color={s.status === 'ACTIVE' ? 'green' : 'default'} style={{ fontSize: '10px', padding: '0 4px', lineHeight: '1.5' }}>{s.status}</Tag></div>
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
                value={wizardConfig.plan_name} onChange={e => setWizardConfig({ ...wizardConfig, plan_name: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Ghi chú / Mô tả (Không bắt buộc):</label>
              <Input.TextArea placeholder="Ghi chú đợt TKB (ví dụ: thông tin chung, lưu ý cho giảng viên...)"
                value={wizardConfig.description} onChange={e => setWizardConfig({ ...wizardConfig, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Nguồn Đăng Ký Nguyện Vọng:</label>
              <Select
                allowClear className="w-full"
                placeholder="Chọn Danh sách nguyện vọng giảng dạy (Không bắt buộc ngay)"
                value={wizardConfig.registration_list_id}
                onChange={v => setWizardConfig({ ...wizardConfig, registration_list_id: v })}
                options={regLists.map(l => ({ label: l.list_name, value: l.list_id }))}
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Chọn Khung Chương Trình tham gia xếp lịch (*):</label>
              <Select
                mode="multiple" className="w-full"
                placeholder="Chọn ít nhất 1 Chương trình"
                value={wizardConfig.program_ids}
                onChange={val => setWizardConfig({ ...wizardConfig, program_ids: val })}
                options={programs.map(p => ({ label: `${p.name} (Khóa ${p.batch})`, value: p.id }))}
              />
            </div>
            <div className="text-right mt-6">
              <Button type="primary" onClick={handleNextStep1}>Tiếp tục →</Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">


            {wizardConfig.program_ids.map(p_id => {
              const prog = programs.find(p => p.id === p_id);
              return (
                <Card key={p_id} title={<span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Chương trình: {prog?.name}</span>} size="small">
                  {entriesConfig[p_id]?.map((cfg: any, i: number) => (
                    <Row gutter={16} key={i} className="mb-2">
                      <Col span={10}>
                        <Select
                          className="w-full"
                          placeholder="Chọn Học kỳ"
                          value={cfg.semester_index}
                          onChange={v => updateEntry(p_id, i, 'semester_index', v)}
                          options={[1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ label: `Học Kì ${n}`, value: n }))}
                        />
                      </Col>
                      <Col span={10}>
                        <Select
                          className="w-full"
                          placeholder="Áp dụng cho Khóa"
                          allowClear
                          value={cfg.batch || undefined}
                          onChange={v => updateEntry(p_id, i, 'batch', v || null)}
                          options={uniqueBatches.map(b => ({ label: `Khóa ${b}`, value: b }))}
                        />
                      </Col>
                      <Col span={4}>
                        <Button danger type="text" onClick={() => {
                          const list = [...entriesConfig[p_id]];
                          list.splice(i, 1);
                          setEntriesConfig({ ...entriesConfig, [p_id]: list });
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
              <Button type="primary" onClick={handleGenerate}>Xác nhận Tạo cấu trúc Lớp & Học phần →</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL DATE CONFIG */}
      <Modal
        title="Cấu hình Đợt TKB"
        open={isDateModalOpen}
        onCancel={() => setIsDateModalOpen(false)}
        destroyOnClose
        footer={[
          <Button 
            key="reset" 
            danger 
            type="primary" 
            onClick={handleResetTimetable}
            style={{ float: 'left' }}
          >
            Reset Đợt TKB (Xóa hết GV)
          </Button>,
          <Button key="back" onClick={() => setIsDateModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={dateModalLoading} onClick={handleSaveSessionDate}>
            Lưu
          </Button>,
        ]}
      >
        <div style={{ padding: '16px 0' }} className="space-y-4">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '13.5px' }}>Tên đợt TKB (*):</span>
            <Input
              value={dateModalSessionName}
              onChange={e => setDateModalSessionName(e.target.value)}
              placeholder="Nhập tên đợt TKB"
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '13.5px' }}>Ghi chú / Mô tả (Không bắt buộc):</span>
            <Input.TextArea
              value={dateModalSessionDesc}
              onChange={e => setDateModalSessionDesc(e.target.value)}
              placeholder="Nhập ghi chú hoặc mô tả đợt TKB"
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '13.5px' }}>Nguồn Đăng Ký Nguyện Vọng:</span>
            <Select
              allowClear
              className="w-full"
              placeholder="Chọn Danh sách nguyện vọng giảng dạy (Không bắt buộc ngay)"
              value={dateModalRegListId}
              onChange={v => setDateModalRegListId(v)}
              options={regLists.map(l => ({ label: l.list_name, value: l.list_id }))}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#374151', fontSize: '13.5px' }}>Ngày bắt đầu (*):</span>
            <DatePicker
              style={{ width: '100%' }}
              value={startDateVal}
              onChange={val => setStartDateVal(val)}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày bắt đầu"
            />
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', color: '#1e40af', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
            Chọn ngày bắt đầu cho đợt TKB. Hệ thống sẽ tự động gán ngày bắt đầu này cho toàn bộ các lớp học phần thuộc đợt, và tự động tính toán ngày kết thúc cho mỗi học phần (mỗi tuần 1 buổi, tối đa 4 tiết).
          </div>
        </div>
      </Modal>
    </div>
  );
}
