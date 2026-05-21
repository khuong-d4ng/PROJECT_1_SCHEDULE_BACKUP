import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Button, ConfigProvider, Select, Spin, message, Tag, Table, Popover, Badge } from 'antd';
import {
  BookOutlined, TeamOutlined, AppstoreOutlined,
  BankOutlined, CalendarOutlined, FormOutlined,
  DashboardOutlined, ThunderboltOutlined,
  UploadOutlined, LogoutOutlined, BellOutlined
} from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
import SubjectsPage from './pages/SubjectsPage';
import LecturersPage from './pages/LecturersPage';
import RegistrationsPage from './pages/RegistrationsPage';
import CurriculumPage from './pages/CurriculumPage';
import TimetableCenterPage from './pages/TimetableCenterPage';
import ClassesPage from './pages/ClassesPage';
import LoginPage from './pages/LoginPage';
import LecturerPortalPage from './pages/LecturerPortalPage';
import apiClient from './api/client';
import dayjs from 'dayjs';

/* ============ SIDEBAR LINK ============ */
const SidebarLink = ({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className="sidebar-link"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 14px',
        borderRadius: 'var(--radius-md)',
        fontWeight: isActive ? 600 : 500,
        fontSize: '13.5px',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        backgroundColor: isActive ? 'var(--color-primary-bg)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
        textDecoration: 'none',
        transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#f8f9fb';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-text)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
        }
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1, opacity: isActive ? 1 : 0.7 }}>{icon}</span>
      <span>{children}</span>
    </Link>
  );
};

/* ============ SECTION HEADER ============ */
const SidebarSection = ({ title }: { title: string }) => (
  <div style={{
    fontSize: '10.5px',
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    padding: '16px 14px 6px',
  }}>
    {title}
  </div>
);

/* ============ DASHBOARD ============ */
const DashboardPage = () => {
  const currentUser = useMemo(() => {
    const stored = localStorage.getItem('user_info');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isLecturer = currentUser?.role === 'Giảng viên';

  // State for Admin / Scheduler Dashboard
  const [stats, setStats] = useState({ subjects: 0, lecturers: 0, sessions: 0 });
  const [allLecturers, setAllLecturers] = useState<any[]>([]);
  const [sessionStats, setSessionStats] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<'workload' | 'hours' | 'name'>('workload');

  // State for Lecturer Dashboard
  const [lecturerProfile, setLecturerProfile] = useState<any>(null);
  const [lecturerTimetable, setLecturerTimetable] = useState<any>({
    sessions: [],
    rows: [],
    summary: { total_classes: 0, total_subjects: 0, total_hours: 0, slots: [] }
  });
  const [loadingLecturerData, setLoadingLecturerData] = useState(false);

  // Common State
  const [dashboardSessions, setDashboardSessions] = useState<any[]>([]);
  const [selectedDashboardSession, setSelectedDashboardSession] = useState<number | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const activeSession = useMemo(() => {
    return selectedDashboardSession
      ? dashboardSessions.find(s => s.session_id === selectedDashboardSession)
      : null;
  }, [dashboardSessions, selectedDashboardSession]);

  // Load basic info
  useEffect(() => {
    const load = async () => {
      try {
        if (isLecturer) {
          if (!currentUser?.lecturer_id) return;
          setLoadingLecturerData(true);
          const [profRes, sesRes] = await Promise.all([
            apiClient.get(`/lecturers/${currentUser.lecturer_id}`),
            apiClient.get('/timetables/'),
          ]);
          setLecturerProfile(profRes.data);
          setDashboardSessions(sesRes.data);
          setLoadingLecturerData(false);
        } else {
          const [subRes, lecRes, sesRes] = await Promise.all([
            apiClient.get('/subjects/'),
            apiClient.get('/lecturers/'),
            apiClient.get('/timetables/'),
          ]);
          setStats({
            subjects: subRes.data.length,
            lecturers: lecRes.data.length,
            sessions: sesRes.data.length,
          });
          setDashboardSessions(sesRes.data);
          setAllLecturers(lecRes.data);
        }
      } catch {}
    };
    load();
  }, [isLecturer, currentUser]);

  // Load schedule stats for Admin / Scheduler
  useEffect(() => {
    if (isLecturer || !selectedDashboardSession) return;
    const fetchSessionStats = async () => {
      setLoadingSchedule(true);
      try {
        const res = await apiClient.get(`/timetables/${selectedDashboardSession}/stats`);
        setSessionStats(res.data);
      } catch {
        message.error("Lỗi lấy thông tin lịch trình");
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchSessionStats();
  }, [isLecturer, selectedDashboardSession]);

  // Load schedule for Lecturer
  useEffect(() => {
    if (!isLecturer || !currentUser?.lecturer_id) return;
    const fetchLecturerTimetable = async () => {
      setLoadingSchedule(true);
      try {
        const url = selectedDashboardSession
          ? `/lecturers/${currentUser.lecturer_id}/timetable-info?session_id=${selectedDashboardSession}`
          : `/lecturers/${currentUser.lecturer_id}/timetable-info`;
        const res = await apiClient.get(url);
        setLecturerTimetable(res.data);
      } catch {
        message.error("Lỗi lấy lịch giảng dạy");
      } finally {
        setLoadingSchedule(false);
      }
    };
    fetchLecturerTimetable();
  }, [isLecturer, currentUser, selectedDashboardSession]);

  // Admin schedule grid helper
  const renderScheduleGrid = (slotsList: string[]) => {
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const hasSlot = (slotStr: string) => slotsList.includes(slotStr);
    
    return (
      <div className="flex flex-col gap-1 border border-gray-200 p-1 bg-gray-50 rounded">
        <div className="flex gap-1">
          <div className="w-8 text-[10px] font-medium text-gray-500 text-center flex items-center justify-center">Sáng</div>
          {days.map(d => (
            <div key={`S-${d}`} title={`Sáng ${d}`} className={`w-8 h-6 rounded flex items-center justify-center text-[9px] ${hasSlot(`S-${d}`) ? 'bg-orange-500 text-white font-bold' : 'bg-white border border-gray-200 text-gray-300'}`}>
              {hasSlot(`S-${d}`) ? 'Bận' : d}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <div className="w-8 text-[10px] font-medium text-gray-500 text-center flex items-center justify-center">Chiều</div>
          {days.map(d => (
            <div key={`C-${d}`} title={`Chiều ${d}`} className={`w-8 h-6 rounded flex items-center justify-center text-[9px] ${hasSlot(`C-${d}`) ? 'bg-orange-500 text-white font-bold' : 'bg-white border border-gray-200 text-gray-300'}`}>
              {hasSlot(`C-${d}`) ? 'Bận' : d}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Lecturer schedule grid helper
  const renderLecturerWeeklyGrid = (busySlots: string[]) => {
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    // Helper to match slot formats returned: "Sáng T2" -> isBusy('Sáng', 'T2')
    const isBusy = (shift: string, day: string) => busySlots.includes(`${shift} ${day}`);
    const totalBusy = busySlots.length;
    const totalEmpty = 12 - totalBusy;

    return (
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#374151' }}>Lịch tuần (Buổi bận)</span>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            Buổi đã xếp: <strong style={{ color: '#f37423' }}>{totalBusy}/12</strong> | Trống: <strong style={{ color: '#16a34a' }}>{totalEmpty} buổi</strong>
          </span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ width: '80px', padding: '10px', fontWeight: 500, color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}></th>
                {days.map(d => (
                  <th key={d} style={{ padding: '10px', fontWeight: 600, color: '#4b5563', fontSize: '14px', borderBottom: '1px solid #f3f4f6' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px 10px', fontWeight: 500, color: '#4b5563', fontSize: '13px', borderBottom: '1px solid #f3f4f6', textAlign: 'left' }}>Sáng</td>
                {days.map(d => {
                  const busy = isBusy('Sáng', d);
                  return (
                    <td key={`S-${d}`} style={{ padding: '12px 6px', borderBottom: '1px solid #f3f4f6' }}>
                      {busy ? (
                        <div style={{
                          width: '40px', height: '40px', margin: '0 auto',
                          background: 'linear-gradient(135deg, #f37423, #ff9a56)',
                          color: '#fff', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', boxShadow: '0 4px 10px rgba(243, 116, 35, 0.2)'
                        }}>
                          ✓
                        </div>
                      ) : (
                        <div style={{
                          width: '40px', height: '40px', margin: '0 auto',
                          background: '#f9fafb', border: '1px dashed #d1d5db',
                          color: '#9ca3af', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px'
                        }}>
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td style={{ padding: '12px 10px', fontWeight: 500, color: '#4b5563', fontSize: '13px', textAlign: 'left' }}>Chiều</td>
                {days.map(d => {
                  const busy = isBusy('Chiều', d);
                  return (
                    <td key={`C-${d}`} style={{ padding: '12px 6px' }}>
                      {busy ? (
                        <div style={{
                          width: '40px', height: '40px', margin: '0 auto',
                          background: 'linear-gradient(135deg, #f37423, #ff9a56)',
                          color: '#fff', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', boxShadow: '0 4px 10px rgba(243, 116, 35, 0.2)'
                        }}>
                          ✓
                        </div>
                      ) : (
                        <div style={{
                          width: '40px', height: '40px', margin: '0 auto',
                          background: '#f9fafb', border: '1px dashed #d1d5db',
                          color: '#9ca3af', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px'
                        }}>
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
          {busySlots.map(slot => (
            <span key={slot} style={{
              background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5',
              padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500
            }}>
              {slot}
            </span>
          ))}
          {busySlots.length === 0 && (
            <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Không có buổi bận nào</span>
          )}
        </div>
      </div>
    );
  };

  // Lecturer profile card helper
  const renderLecturerProfileCard = (profile: any) => {
    if (!profile) return null;
    const nameParts = profile.full_name.split(' ');
    const initials = nameParts.length > 0 ? nameParts[nameParts.length - 1][0] : '?';

    return (
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f37423, #ff9a56)',
            color: '#fff',
            fontSize: '28px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(243, 116, 35, 0.25)'
          }}>
            {initials}
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#111827' }}>
              {profile.full_name}
            </h3>
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
              {profile.lecturer_code}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Phân loại</div>
            <div style={{ marginTop: '4px' }}>
              <span style={{
                background: profile.type === 'Cơ hữu' ? '#f0fdf4' : '#eff6ff',
                color: profile.type === 'Cơ hữu' ? '#16a34a' : '#2563eb',
                border: profile.type === 'Cơ hữu' ? '1px solid #dcfce7' : '1px solid #dbeafe',
                padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600
              }}>
                {profile.type}
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Chức vụ</div>
            <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              {profile.position || 'Giảng viên'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Chỉ tiêu</div>
            <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              {profile.max_quota || 0} tiết
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sortedLecturers = useMemo(() => {
    return [...allLecturers].sort((a, b) => {
      const statsA = sessionStats[a.lecturer_id] || { slots: 0, hours: 0 };
      const statsB = sessionStats[b.lecturer_id] || { slots: 0, hours: 0 };
      
      if (sortBy === 'workload') {
        if (statsB.slots !== statsA.slots) return statsB.slots - statsA.slots;
        return a.full_name.localeCompare(b.full_name);
      } else if (sortBy === 'hours') {
        if (statsB.hours !== statsA.hours) return statsB.hours - statsA.hours;
        return a.full_name.localeCompare(b.full_name);
      } else {
        return a.full_name.localeCompare(b.full_name);
      }
    });
  }, [allLecturers, sessionStats, sortBy]);

  const coHuuCount = useMemo(() => allLecturers.filter(l => l.type === 'Cơ hữu').length, [allLecturers]);
  const thinhGiangCount = useMemo(() => allLecturers.filter(l => l.type === 'Thỉnh giảng').length, [allLecturers]);
  const coHuuPct = stats.lecturers > 0 ? Math.round((coHuuCount / stats.lecturers) * 100) : 0;
  const thinhGiangPct = stats.lecturers > 0 ? Math.round((thinhGiangCount / stats.lecturers) * 100) : 0;

  const cards = [
    { label: 'Tổng Giảng viên', value: stats.lecturers, icon: <TeamOutlined />, color: 'var(--color-primary)' },
    { label: 'Tổng Môn học', value: stats.subjects, icon: <BookOutlined />, color: 'var(--color-accent)' },
    { label: 'Đợt TKB', value: stats.sessions, icon: <CalendarOutlined />, color: 'var(--color-success)' },
  ];

  /* ─── RENDERING LECTURER DASHBOARD ─── */
  if (isLecturer) {
    const busySlotsList = lecturerTimetable?.summary?.slots || [];
    const tableData = lecturerTimetable?.rows || [];

    const formatSlot = (morning: string | null, afternoon: string | null) => {
      if (morning) {
        const day = morning.replace('S-T', '');
        return `Sáng Thứ ${day === '7' ? '7' : day}`;
      }
      if (afternoon) {
        const day = afternoon.replace('C-T', '');
        return `Chiều Thứ ${day === '7' ? '7' : day}`;
      }
      return '-';
    };

    const columns = [
      {
        title: 'Đợt TKB',
        dataIndex: 'plan_name',
        key: 'plan_name',
        render: (text: string) => <strong style={{ color: '#374151' }}>{text}</strong>
      },
      {
        title: 'Lớp',
        dataIndex: 'class_name',
        key: 'class_name',
        render: (text: string) => <Tag color="blue">{text}</Tag>
      },
      {
        title: 'Mã Môn',
        dataIndex: 'subject_code',
        key: 'subject_code',
      },
      {
        title: 'Môn học',
        dataIndex: 'subject_name',
        key: 'subject_name',
        render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
      },
      {
        title: 'Vai trò',
        dataIndex: 'role',
        key: 'role',
        render: (role: string) => (
          <Tag color={role === 'LT' ? 'orange' : 'green'}>
            {role === 'LT' ? 'Lý thuyết' : 'Thực hành'}
          </Tag>
        )
      },
      {
        title: 'Ca dạy (Buổi bận)',
        key: 'shift',
        render: (_: any, record: any) => formatSlot(record.morning_day, record.afternoon_day)
      },
      {
        title: 'Số tiết',
        key: 'hours',
        render: (_: any, record: any) => {
          const hours = record.role === 'LT' ? record.theory_hours : record.practice_hours;
          return `${hours} tiết`;
        }
      },
      {
        title: 'Thời gian',
        key: 'duration',
        render: (_: any, record: any) => {
          if (record.start_date && record.end_date) {
            return `${dayjs(record.start_date).format('DD/MM/YYYY')} - ${dayjs(record.end_date).format('DD/MM/YYYY')}`;
          }
          return 'Chưa xác định';
        }
      }
    ];

    return (
      <Spin spinning={loadingLecturerData || loadingSchedule}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px', color: 'var(--color-text)' }}>
            Tổng quan Cá nhân
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '28px' }}>
            {/* Lecturer Profile */}
            {renderLecturerProfileCard(lecturerProfile)}

            {/* Weekly busy grid */}
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Chọn Đợt TKB:</span>
                <Select
                  placeholder="Tất cả TKB"
                  style={{ width: 250 }}
                  value={selectedDashboardSession}
                  onChange={v => setSelectedDashboardSession(v)}
                  options={[
                    { label: 'Tất cả TKB', value: null },
                    ...dashboardSessions.map(s => ({ label: s.plan_name, value: s.session_id }))
                  ]}
                  allowClear
                />
              </div>

              {activeSession?.description && (
                <div style={{
                  background: 'linear-gradient(135deg, #fffaf5, #fff5eb)',
                  border: '1px solid #ffe3c9',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 6px rgba(243, 116, 35, 0.05)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>📢</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#c2410c', fontSize: '13.5px', marginBottom: '2px' }}>
                      Thông báo/Lưu ý đợt TKB ({activeSession.plan_name})
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '13px', lineHeight: '1.5' }}>
                      {activeSession.description}
                    </div>
                  </div>
                </div>
              )}

              {renderLecturerWeeklyGrid(busySlotsList)}
            </div>
          </div>

          <div style={{
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Chi tiết Lịch giảng dạy</h3>
            <Table
              dataSource={tableData}
              columns={columns}
              rowKey="row_id"
              pagination={{ pageSize: 5 }}
              locale={{ emptyText: 'Chưa có lịch dạy nào được phân công' }}
            />
          </div>
        </div>
      </Spin>
    );
  }

  /* ─── RENDERING ADMIN / SCHEDULER DASHBOARD ─── */
  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px', color: 'var(--color-text)' }}>
        Tổng quan Hệ thống
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            background: 'var(--color-white)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: '8px' }}>{c.label}</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{c.value}</div>
                
                {c.label === 'Tổng Giảng viên' && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', gap: '16px' }}>
                    <div>
                      Cơ hữu: <b style={{ color: 'var(--color-text)' }}>{coHuuCount}</b> <span style={{ opacity: 0.7 }}>({coHuuPct}%)</span>
                    </div>
                    <div>
                      Thỉnh giảng: <b style={{ color: 'var(--color-text)' }}>{thinhGiangCount}</b> <span style={{ opacity: 0.7 }}>({thinhGiangPct}%)</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '22px',
                color: c.color,
                opacity: 0.25,
              }}>
                {c.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Thao tác nhanh</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/timetable">
            <Button type="primary" icon={<ThunderboltOutlined />}>
              Mở Workspace TKB
            </Button>
          </Link>
          <Link to="/lecturers">
            <Button icon={<UploadOutlined />}>Import Giảng viên</Button>
          </Link>
          <Link to="/registrations">
            <Button icon={<FormOutlined />}>Quản lý Nguyện vọng</Button>
          </Link>
        </div>
      </div>

      <div style={{
        marginTop: '28px',
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Tổng quát Lịch Giảng Viên</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Select 
              value={sortBy}
              onChange={v => setSortBy(v)}
              style={{ width: 220 }}
              options={[
                { label: 'Sắp xếp: Mức độ bận', value: 'workload' },
                { label: 'Sắp xếp: Số tiết dạy', value: 'hours' },
                { label: 'Sắp xếp: Tên giảng viên', value: 'name' },
              ]}
            />
            <Select 
              placeholder="Chọn Đợt TKB" 
              style={{ width: 300 }}
              value={selectedDashboardSession}
              onChange={v => setSelectedDashboardSession(v)}
              options={dashboardSessions.map(s => ({ label: s.plan_name, value: s.session_id }))}
              allowClear
            />
          </div>
        </div>
        
        {selectedDashboardSession ? (
          <Spin spinning={loadingSchedule}>
            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {sortedLecturers.map(lec => {
                const lecStats = sessionStats[lec.lecturer_id] || { hours: 0, subjects: 0, classes: 0, slots: 0, slots_list: [] };
                return (
                  <div key={lec.lecturer_id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors bg-white">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm">{lec.full_name}</div>
                      <div className="text-xs text-gray-500 mt-1">{lec.lecturer_code} • {lec.type}</div>
                    </div>
                    
                    <div className="flex-shrink-0 mx-6">
                      {renderScheduleGrid(lecStats.slots_list || [])}
                    </div>

                    <div className="flex gap-4 w-[320px] justify-end text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">{lecStats.slots}</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Buổi dạy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{lecStats.hours}</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Tiết dạy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{lecStats.classes}</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Lớp</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{lecStats.subjects}</div>
                        <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Môn</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Spin>
        ) : (
          <div className="text-center text-gray-400 py-10">Vui lòng chọn 1 đợt TKB để xem lịch trình của tất cả Giảng viên</div>
        )}
      </div>
    </div>
  );
};

/* ============ APP ============ */
function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const stored = localStorage.getItem('user_info');
    return stored ? JSON.parse(stored) : null;
  });

  interface Notification {
    notification_id: number;
    title: string;
    content: string;
    link?: string;
    is_read: boolean;
    created_at: string;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get<Notification[]>('/notifications/');
        setNotifications(response.data);
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
      }
    };

    fetchNotifications();

    // Thiết lập interval thăm dò (polling) mỗi 30 giây
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(noti =>
          noti.notification_id === notificationId ? { ...noti, is_read: true } : noti
        )
      );
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(noti => ({ ...noti, is_read: true })));
      message.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
      message.error('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const notificationContent = (
    <div style={{ width: '320px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '8px'
      }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>Thông báo ({unreadCount})</span>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            onClick={handleMarkAllAsRead}
            style={{ padding: 0, fontSize: '12px' }}
          >
            Đọc tất cả
          </Button>
        )}
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto', margin: '0 -12px', padding: '0 12px' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Không có thông báo nào
          </div>
        ) : (
          notifications.map(noti => (
            <div
              key={noti.notification_id}
              onClick={() => handleMarkAsRead(noti.notification_id)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: noti.is_read ? 'transparent' : 'rgba(243, 116, 35, 0.06)',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = noti.is_read ? '#f9f9f9' : 'rgba(243, 116, 35, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = noti.is_read ? 'transparent' : 'rgba(243, 116, 35, 0.06)';
              }}
            >
              {noti.link ? (
                <Link
                  to={noti.link}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: noti.is_read ? 500 : 600, fontSize: '13px', color: 'var(--color-text)' }}>
                      {noti.title}
                    </div>
                    {!noti.is_read && (
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#f37423',
                        marginTop: '4px',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    {noti.content}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    {dayjs(noti.created_at).format('DD/MM/YYYY HH:mm')}
                  </div>
                </Link>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: noti.is_read ? 500 : 600, fontSize: '13px', color: 'var(--color-text)' }}>
                      {noti.title}
                    </div>
                    {!noti.is_read && (
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#f37423',
                        marginTop: '4px',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    {noti.content}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    {dayjs(noti.created_at).format('DD/MM/YYYY HH:mm')}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const handleLoginSuccess = (_token: string, user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setCurrentUser(null);
  };

  const isStaff = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Cán bộ xếp lịch');

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#f37423',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      }}
    >
      <Router>
        {/* Not logged in -> show login page */}
        {!currentUser ? (
          <Routes>
            <Route path="*" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          </Routes>
        ) : (
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
            {/* Skip link */}
            <a href="#main-content" className="skip-link">Bỏ qua tới nội dung chính</a>

            {/* ─── HEADER ─── */}
            <header style={{
              background: 'var(--color-primary)',
              color: 'var(--color-white)',
              padding: '0 24px',
              height: '52px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(243, 116, 35, 0.25)',
              position: 'relative',
              zIndex: 100,
            }} role="banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>🎓</span>
                <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px' }}>
                  Quản lý Phân công TKB
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: 'none', fontSize: '11px' }}>
                  {currentUser.role}
                </Tag>
                <span style={{ fontSize: '13px', opacity: 0.95, fontWeight: 500 }}>
                  {currentUser.full_name || currentUser.username}
                </span>

                <Popover
                  content={notificationContent}
                  title={null}
                  trigger="click"
                  placement="bottomRight"
                  overlayStyle={{ zIndex: 1050 }}
                >
                  <Badge count={unreadCount} size="small" offset={[2, -2]}>
                    <Button
                      type="text"
                      shape="circle"
                      icon={<BellOutlined style={{ fontSize: '16px', color: 'white' }} />}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.15)',
                        borderColor: 'transparent',
                        cursor: 'pointer',
                      }}
                    />
                  </Badge>
                </Popover>

                <Button
                  size="small"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  style={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    fontSize: '12px',
                    background: 'rgba(255,255,255,0.15)',
                  }}
                >
                  Đăng xuất
                </Button>
              </div>
            </header>

            {/* ─── BODY ─── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* ─── SIDEBAR ─── */}
              <aside style={{
                width: '240px',
                background: 'var(--color-white)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
              }}>
                <nav aria-label="Điều hướng chính" style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
                  <SidebarLink to="/" icon={<DashboardOutlined />}>Tổng quan</SidebarLink>

                  {isStaff && (
                    <>
                      <SidebarSection title="Quản lý Dữ liệu" />
                      <SidebarLink to="/subjects" icon={<BookOutlined />}>Môn học</SidebarLink>
                      <SidebarLink to="/lecturers" icon={<TeamOutlined />}>Giảng viên</SidebarLink>
                      <SidebarLink to="/curriculum" icon={<AppstoreOutlined />}>Chương trình Đào tạo</SidebarLink>
                      <SidebarLink to="/classes" icon={<BankOutlined />}>Lớp Cố định</SidebarLink>

                      <SidebarSection title="Phân công TKB" />
                      <SidebarLink to="/timetable" icon={<CalendarOutlined />}>Workspace TKB</SidebarLink>
                      <SidebarLink to="/registrations" icon={<FormOutlined />}>Nguyện vọng Giảng dạy</SidebarLink>
                    </>
                  )}

                  {!isStaff && (
                    <>
                      <SidebarSection title="Giảng viên" />
                      <SidebarLink to="/my-registrations" icon={<FormOutlined />}>Đăng ký Nguyện vọng</SidebarLink>
                    </>
                  )}
                </nav>

                {/* Bottom version */}
                <div style={{
                  padding: '12px 14px',
                  borderTop: '1px solid var(--color-border-light)',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                }}>
                  Phiên bản 1.0 — 2026
                </div>
              </aside>

              {/* ─── MAIN CONTENT ─── */}
              <main id="main-content" style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  {isStaff && (
                    <>
                      <Route path="/subjects" element={<SubjectsPage />} />
                      <Route path="/lecturers" element={<LecturersPage />} />
                      <Route path="/curriculum" element={<CurriculumPage />} />
                      <Route path="/classes" element={<ClassesPage />} />
                      <Route path="/timetable" element={<TimetableCenterPage />} />
                    </>
                  )}
                  <Route path="/registrations" element={<RegistrationsPage />} />
                  <Route path="/my-registrations" element={<LecturerPortalPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        )}
      </Router>
    </ConfigProvider>
  );
}

export default App;
