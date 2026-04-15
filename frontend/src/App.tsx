import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import SubjectsPage from './pages/SubjectsPage';
import LecturersPage from './pages/LecturersPage';
import RegistrationsPage from './pages/RegistrationsPage';
import CurriculumPage from './pages/CurriculumPage';
import TimetableCenterPage from './pages/TimetableCenterPage';

// Component để quản lý style cho link đang active
const SidebarLink = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`block p-2 rounded font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
    >
      {children}
    </Link>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-800">
        <header className="bg-blue-700 text-white p-4 shadow-md flex justify-between items-center">
          <h1 className="text-xl font-bold">Quản lý Phân công TKB</h1>
          <div>
            <span className="mr-4">Cán bộ xếp lịch</span>
            <Button>Đăng xuất</Button>
          </div>
        </header>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-slate-200 p-4">
            <nav className="space-y-2">
              <SidebarLink to="/">Dashboard</SidebarLink>
              <SidebarLink to="/subjects">Quản lý Môn học</SidebarLink>
              <SidebarLink to="/lecturers">Quản lý Giảng viên</SidebarLink>
              <SidebarLink to="/curriculum">Chương trình đào tạo</SidebarLink>
              <SidebarLink to="/timetable">Bảng TKB Trung tâm</SidebarLink>
              <SidebarLink to="/registrations">Nguyện vọng giảng dạy</SidebarLink>
            </nav>
          </aside>
          
          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-slate-500 font-medium mb-2">Tổng số Giảng viên</h3>
                      <p className="text-3xl font-bold text-blue-600">120</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-slate-500 font-medium mb-2">Tổng số Môn học</h3>
                      <p className="text-3xl font-bold text-emerald-600">450</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <h3 className="text-slate-500 font-medium mb-2">Đăng ký nguyện vọng</h3>
                      <p className="text-3xl font-bold text-amber-500">85%</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Thao tác nhanh</h3>
                    </div>
                    <div className="flex space-x-4">
                      <Button type="primary">Import Data (Excel)</Button>
                      <Button>Chạy xếp lịch tự động</Button>
                      <Button>Export TKB (Excel)</Button>
                    </div>
                  </div>
                </div>
              } />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/lecturers" element={<LecturersPage />} />
              <Route path="/curriculum" element={<CurriculumPage />} />
              <Route path="/timetable" element={<TimetableCenterPage />} />
              <Route path="/registrations" element={<RegistrationsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
