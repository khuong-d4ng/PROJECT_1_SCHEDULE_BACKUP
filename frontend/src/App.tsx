import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button, ConfigProvider, Select, Spin, message } from 'antd';
import {
  BookOutlined, TeamOutlined, AppstoreOutlined,
  BankOutlined, CalendarOutlined, FormOutlined,
  DashboardOutlined, ThunderboltOutlined, DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
import SubjectsPage from './pages/SubjectsPage';
import LecturersPage from './pages/LecturersPage';
import RegistrationsPage from './pages/RegistrationsPage';
import CurriculumPage from './pages/CurriculumPage';
import TimetableCenterPage from './pages/TimetableCenterPage';
import ClassesPage from './pages/ClassesPage';
import apiClient from './api/client';

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
  const [stats, setStats] = useState({ subjects: 0, lecturers: 0, sessions: 0 });
  const [dashboardSessions, setDashboardSessions] = useState<any[]>([]);
  const [selectedDashboardSession, setSelectedDashboardSession] = useState<number | null>(null);
  const [allLecturers, setAllLecturers] = useState<any[]>([]);
  const [sessionStats, setSessionStats] = useState<Record<string, any>>({});
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [sortBy, setSortBy] = useState<'workload' | 'hours' | 'name'>('workload');

  useEffect(() => {
    const load = async () => {
      try {
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
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedDashboardSession) return;
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
  }, [selectedDashboardSession]);

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

  const cards = [
    { label: 'Tổng Giảng viên', value: stats.lecturers, icon: <TeamOutlined />, color: 'var(--color-primary)' },
    { label: 'Tổng Môn học', value: stats.subjects, icon: <BookOutlined />, color: 'var(--color-accent)' },
    { label: 'Đợt TKB', value: stats.sessions, icon: <CalendarOutlined />, color: 'var(--color-success)' },
  ];

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '13px', opacity: 0.9 }}>Cán bộ xếp lịch</span>
              <Button
                size="small"
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

                <SidebarSection title="Quản lý Dữ liệu" />
                <SidebarLink to="/subjects" icon={<BookOutlined />}>Môn học</SidebarLink>
                <SidebarLink to="/lecturers" icon={<TeamOutlined />}>Giảng viên</SidebarLink>
                <SidebarLink to="/curriculum" icon={<AppstoreOutlined />}>Chương trình Đào tạo</SidebarLink>
                <SidebarLink to="/classes" icon={<BankOutlined />}>Lớp Cố định</SidebarLink>

                <SidebarSection title="Phân công TKB" />
                <SidebarLink to="/timetable" icon={<CalendarOutlined />}>Workspace TKB</SidebarLink>
                <SidebarLink to="/registrations" icon={<FormOutlined />}>Nguyện vọng Giảng dạy</SidebarLink>
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
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/lecturers" element={<LecturersPage />} />
                <Route path="/curriculum" element={<CurriculumPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/timetable" element={<TimetableCenterPage />} />
                <Route path="/registrations" element={<RegistrationsPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
