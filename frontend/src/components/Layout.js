import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  BookOpen, 
  Calendar, 
  ClipboardCheck, 
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  X,
  Layers
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'dean', 'dean_academics', 'hod', 'faculty', 'staff', 'student'] },
    { path: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'dean', 'dean_academics', 'hod', 'faculty', 'staff'] },
    { path: '/departments', label: 'Departments', icon: Building2, roles: ['admin', 'dean', 'dean_academics'] },
    { path: '/programs', label: 'Programs', icon: Layers, roles: ['admin', 'dean', 'dean_academics', 'hod'] },
    { path: '/curriculum', label: 'Curriculum', icon: BookOpen, roles: ['admin', 'dean', 'dean_academics', 'hod', 'faculty'] },
    { path: '/timetable', label: 'Timetable', icon: Calendar, roles: ['admin', 'dean', 'dean_academics', 'hod', 'faculty', 'staff', 'student'] },
    { path: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin', 'dean', 'dean_academics', 'hod', 'faculty', 'staff', 'student'] },
    { path: '/batches', label: 'Batches', icon: Users, roles: ['admin', 'dean', 'dean_academics', 'hod', 'staff'] },
    { path: '/users', label: 'User Management', icon: Settings, roles: ['admin', 'dean', 'dean_academics'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  const roleLabels = {
    admin: 'Administrator',
    dean: 'Dean',
    dean_academics: 'Dean Academics',
    hod: 'Head of Department (HOD)',
    faculty: 'Faculty',
    staff: 'Staff',
    student: 'Student'
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="main-layout">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50" data-testid="header">
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
              data-testid="mobile-menu-btn"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png"
                alt="Raffles University"
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Academic CRM
                </h1>
                <p className="text-xs text-slate-500">Raffles University</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900" data-testid="user-name">{user?.name}</p>
              <p className="text-xs text-slate-500" data-testid="user-role">{roleLabels[user?.role] || user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50"
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside 
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200 z-40 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar"
      >
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
              data-testid={`nav-${item.path.slice(1)}`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
