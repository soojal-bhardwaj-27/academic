import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, studentApi, cachedGet } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Users, Building2, BookOpen, GraduationCap, Layers,
  ClipboardCheck, ChevronDown, ChevronRight, TrendingUp
} from 'lucide-react';

/* ─── Animated counter hook ─── */
function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon: Icon, gradient, delay = 0 }) {
  const count = useCountUp(value);
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{
        background: gradient,
        animation: `fadeSlideUp 0.5s ease both`,
        animationDelay: `${delay}ms`
      }}
      data-testid={`stat-card-${label.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold opacity-80 mb-1">{label}</p>
          <p className="text-3xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>{count}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      {/* Decorative circle */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    </div>
  );
}

/* ─── Department Row (collapsible) ─── */
function DepartmentRow({ dept, programs, studentsByProgram }) {
  const [open, setOpen] = useState(false);
  const deptTotal = programs.reduce((sum, p) => sum + (studentsByProgram[p.id] || 0), 0);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Header row */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-950 to-blue-900 text-white hover:from-blue-900 hover:to-blue-800 transition-all"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-blue-300 shrink-0" />
          <span className="font-semibold text-sm tracking-wide text-left" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {dept.name}
          </span>
          <span className="ml-2 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full">{dept.code}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs text-blue-300 uppercase tracking-wider">Total Students</p>
            <p className="text-lg font-bold">{deptTotal}</p>
          </div>
          <div className={`transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'}`}>
            <ChevronRight className="h-5 w-5 text-blue-300" />
          </div>
        </div>
      </button>

      {/* Collapsible program rows */}
      <div
        style={{
          maxHeight: open ? `${programs.length * 60 + 16}px` : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s ease'
        }}
      >
        {programs.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400 text-center">No programs found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">Program</th>
                <th className="text-center px-5 py-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">Code</th>
                <th className="text-right px-5 py-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">Students</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((prog, idx) => {
                const count = studentsByProgram[prog.id] || 0;
                return (
                  <tr
                    key={prog.id}
                    className={`border-b border-slate-100 last:border-0 transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-5 py-3 font-medium text-slate-800 flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      {prog.name}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{prog.code}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-bold ${count > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                        <GraduationCap className="h-3.5 w-3.5" />
                        {count}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [hierarchy, setHierarchy] = useState([]); // [{id, name, code, programs:[{id,name,code,student_count}]}]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // All 3 requests fire in parallel; hierarchy & stats use the fast endpoints
        const [statsRes, studentsRes, hierarchyRes] = await Promise.all([
          cachedGet('dashboard_stats', () => dashboardApi.getStats(), 30_000),
          cachedGet('recent_students', () => studentApi.getAll({ limit: 5 }), 30_000),
          cachedGet('dashboard_hierarchy', () => dashboardApi.getHierarchy(), 60_000),
        ]);
        setStats(statsRes.data);
        setRecentStudents(studentsRes.data.slice(0, 5));
        setHierarchy(hierarchyRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const roleLabels = {
    admin: 'Administrator',
    dean: 'Dean',
    dean_academics: 'Dean Academics',
    hod: 'Head of Department (HOD)',
    faculty: 'Faculty',
    staff: 'Staff',
    student: 'Student'
  };

  const statCards = [
    { label: 'Total Students', value: stats?.total_students || 0, icon: GraduationCap, gradient: 'linear-gradient(135deg, #1e3a8a, #2563eb)' },
    { label: 'Faculty Members', value: stats?.total_faculty || 0, icon: Users, gradient: 'linear-gradient(135deg, #065f46, #10b981)' },
    { label: 'Departments', value: stats?.total_departments || 0, icon: Building2, gradient: 'linear-gradient(135deg, #92400e, #f59e0b)' },
    { label: 'Programs', value: stats?.total_programs || 0, icon: Layers, gradient: 'linear-gradient(135deg, #4c1d95, #8b5cf6)' },
    { label: 'Subjects', value: stats?.total_subjects || 0, icon: BookOpen, gradient: 'linear-gradient(135deg, #881337, #f43f5e)' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4" data-testid="dashboard-loading">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm animate-pulse">Loading dashboard…</p>
      </div>
    );
  }

  // hierarchy already contains [{id, name, code, programs:[{id,name,code,student_count}]}]
  // no client-side grouping needed

  return (
    <div className="space-y-8 animate-fadeIn" data-testid="dashboard-page">
      {/* ── Welcome Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #5ae117ff 0%, #1e3a8a 60%, #2563eb 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-blue-300 text-xs uppercase tracking-widest mb-1 font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="welcome-heading">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-blue-200 text-sm">
            Logged in as <span className="font-semibold text-white">{roleLabels[user?.role]}</span> · Raffles University, Neemrana
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="stats-grid">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 80} />
        ))}
      </div>

      {/* ── Hierarchical View: Dept → Program → Students ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-700" />
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Student Distribution by Department &amp; Program
          </h2>
          <span className="ml-auto text-xs text-slate-400">Click a department to expand</span>
        </div>

        {hierarchy.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No departments found</p>
        ) : (
          hierarchy.map(dept => (
            <DepartmentRow
              key={dept.id}
              dept={dept}
              programs={dept.programs || []}
              studentsByProgram={Object.fromEntries((dept.programs || []).map(p => [p.id, p.student_count]))}
            />
          ))
        )}
      </div>

      {/* ── Recent Students & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card className="border-slate-200 shadow-sm" data-testid="recent-students-card">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <GraduationCap className="h-5 w-5 text-blue-700" />
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentStudents.length > 0 ? (
              <div className="space-y-2">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.student_id} · {student.program_name}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">
                      Sem {student.semester}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8 text-sm">No students added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200 shadow-sm" data-testid="quick-actions-card">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <ClipboardCheck className="h-5 w-5 text-blue-700" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              {['admin', 'dean', 'staff'].includes(user?.role) && (
                <a
                  href="/students"
                  className="group flex flex-col items-center p-4 bg-slate-50 hover:bg-blue-600 rounded-xl text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  data-testid="quick-add-student"
                >
                  <GraduationCap className="h-7 w-7 mb-2 text-blue-700 group-hover:text-white transition-colors" />
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-white transition-colors">Add Student</p>
                </a>
              )}
              {['admin', 'dean', 'dean_academics', 'faculty', 'staff'].includes(user?.role) && (
                <a
                  href="/attendance"
                  className="group flex flex-col items-center p-4 bg-slate-50 hover:bg-emerald-600 rounded-xl text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  data-testid="quick-mark-attendance"
                >
                  <ClipboardCheck className="h-7 w-7 mb-2 text-emerald-600 group-hover:text-white transition-colors" />
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-white transition-colors">Mark Attendance</p>
                </a>
              )}
              <a
                href="/timetable"
                className="group flex flex-col items-center p-4 bg-slate-50 hover:bg-purple-600 rounded-xl text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                data-testid="quick-view-timetable"
              >
                <BookOpen className="h-7 w-7 mb-2 text-purple-600 group-hover:text-white transition-colors" />
                <p className="text-sm font-semibold text-slate-900 group-hover:text-white transition-colors">View Timetable</p>
              </a>
              {['admin', 'dean', 'dean_academics'].includes(user?.role) && (
                <a
                  href="/curriculum"
                  className="group flex flex-col items-center p-4 bg-slate-50 hover:bg-amber-500 rounded-xl text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  data-testid="quick-manage-curriculum"
                >
                  <Layers className="h-7 w-7 mb-2 text-amber-500 group-hover:text-white transition-colors" />
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-white transition-colors">Curriculum</p>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── University Info ── */}
      <Card className="border-slate-200 overflow-hidden shadow-sm" data-testid="university-info-card">
        <div className="grid md:grid-cols-2">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2 text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Raffles University, Neemrana
            </h3>
            <p className="text-slate-500 mb-4 text-sm">
              A premier educational institution committed to academic excellence and holistic development of students.
            </p>
            <ul className="space-y-1.5 text-sm text-slate-500">
              {['State-of-the-art infrastructure', 'Industry-aligned curriculum', 'Experienced faculty members', 'Research-oriented learning'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="h-48 md:h-auto bg-contain bg-no-repeat bg-center bg-white p-6"
            style={{ backgroundImage: 'url(/logo.png)' }}
          />
        </div>
      </Card>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeSlideUp 0.4s ease both;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
