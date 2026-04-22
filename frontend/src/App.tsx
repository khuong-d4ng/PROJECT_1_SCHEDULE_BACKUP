import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button, ConfigProvider } from 'antd';
import {
  BookOutlined, TeamOutlined, AppstoreOutlined,
  BankOutlined, CalendarOutlined, FormOutlined,
  DashboardOutlined, ThunderboltOutlined, DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
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
      } catch {}
    };
    load();
  }, []);

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
