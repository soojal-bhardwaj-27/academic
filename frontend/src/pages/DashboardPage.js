import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, studentApi, departmentApi, programApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Building2, BookOpen, GraduationCap, Layers, ClipboardCheck } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          dashboardApi.getStats(),
          studentApi.getAll({ limit: 5 })
        ]);
        setStats(statsRes.data);
        setRecentStudents(studentsRes.data.slice(0, 5));
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
    { label: 'Total Students', value: stats?.total_students || 0, icon: GraduationCap, color: 'bg-blue-500' },
    { label: 'Faculty Members', value: stats?.total_faculty || 0, icon: Users, color: 'bg-emerald-500' },
    { label: 'Departments', value: stats?.total_departments || 0, icon: Building2, color: 'bg-amber-500' },
    { label: 'Programs', value: stats?.total_programs || 0, icon: Layers, color: 'bg-purple-500' },
    { label: 'Subjects', value: stats?.total_subjects || 0, icon: BookOpen, color: 'bg-rose-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="welcome-heading">
          Welcome back, {user?.name}
        </h1>
        <p className="text-blue-100">
          You are logged in as <span className="font-medium">{roleLabels[user?.role]}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-testid="stats-grid">
        {statCards.map((stat, index) => (
          <Card key={stat.label} className="border-slate-200 hover:shadow-md transition-shadow card-hover" data-testid={`stat-card-${index}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Students & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card className="border-slate-200" data-testid="recent-students-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <GraduationCap className="h-5 w-5 text-blue-900" />
              Recent Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentStudents.length > 0 ? (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.student_id} • {student.program_name}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Sem {student.semester}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No students added yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-slate-200" data-testid="quick-actions-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <ClipboardCheck className="h-5 w-5 text-blue-900" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {['admin', 'dean', 'staff'].includes(user?.role) && (
                <a href="/students" className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-center transition-colors" data-testid="quick-add-student">
                  <GraduationCap className="h-6 w-6 mx-auto mb-2 text-blue-900" />
                  <p className="text-sm font-medium text-slate-900">Add Student</p>
                </a>
              )}
              {['admin', 'dean', 'dean_academics', 'faculty', 'staff'].includes(user?.role) && (
                <a href="/attendance" className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-center transition-colors" data-testid="quick-mark-attendance">
                  <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                  <p className="text-sm font-medium text-slate-900">Mark Attendance</p>
                </a>
              )}
              <a href="/timetable" className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-center transition-colors" data-testid="quick-view-timetable">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium text-slate-900">View Timetable</p>
              </a>
              {['admin', 'dean', 'dean_academics'].includes(user?.role) && (
                <a href="/curriculum" className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-center transition-colors" data-testid="quick-manage-curriculum">
                  <Layers className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                  <p className="text-sm font-medium text-slate-900">Curriculum</p>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* University Info */}
      <Card className="border-slate-200 overflow-hidden" data-testid="university-info-card">
        <div className="grid md:grid-cols-2">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Raffles University, Neemrana
            </h3>
            <p className="text-slate-600 mb-4">
              A premier educational institution committed to academic excellence and holistic development of students.
            </p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>• State-of-the-art infrastructure</p>
              <p>• Industry-aligned curriculum</p>
              <p>• Experienced faculty members</p>
              <p>• Research-oriented learning</p>
            </div>
          </div>
          <div 
            className="h-48 md:h-auto bg-contain bg-no-repeat bg-center bg-white p-6"
            style={{ 
              backgroundImage: 'url(/logo.png)'
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
