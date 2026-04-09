import React, { useState, useEffect } from 'react';
import { 
  attendanceApi, studentApi, subjectApi, timetableApi,
  programApi, departmentApi, formatApiError 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { 
  ClipboardCheck, CalendarIcon, Check, X, Clock, AlertTriangle, 
  UserX, BarChart3, Building2, GraduationCap, ChevronRight, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';

const AttendancePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('marking');

  // Navigation
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Data
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [staffRecords, setStaffRecords] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const isStaff = ['faculty', 'dean', 'dean_academics', 'staff'].includes(user?.role);
  const isFaculty = user?.role === 'faculty';
  const canMark = ['admin', 'dean', 'dean_academics', 'faculty', 'staff'].includes(user?.role);
  const isAdmin = ['admin', 'dean_academics'].includes(user?.role);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [deptsRes, progsRes] = await Promise.all([departmentApi.getAll(), programApi.getAll()]);
        setDepartments(deptsRes.data);
        setPrograms(progsRes.data);

        if (user?.role === 'dean' && user?.department_id) {
          const dept = deptsRes.data.find(d => d.id === user.department_id);
          if (dept) setSelectedDept(dept);
        }
        if (isStaff) checkCurrentStatus();
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // Load subjects when program + semester selected
  useEffect(() => {
    if (!selectedProgram) { setSubjects([]); setStudents([]); setSelectedSubjectId(''); return; }
    const load = async () => {
      setSubjectsLoading(true);
      setSelectedSubjectId('');
      try {
        const res = await subjectApi.getAll({ program_id: selectedProgram.id, semester: selectedSemester });
        setSubjects(res.data);
      } catch (err) { toast.error(formatApiError(err)); }
      finally { setSubjectsLoading(false); }
    };
    load();
  }, [selectedProgram, selectedSemester]);

  // Load students when subject + date changes
  useEffect(() => {
    if (!selectedProgram || !selectedSubjectId) { setStudents([]); return; }
    const load = async () => {
      setStudentsLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const [studentRes, attRes] = await Promise.all([
          studentApi.getAll({ program_id: selectedProgram.id, semester: selectedSemester }),
          attendanceApi.getAll({ subject_id: selectedSubjectId, date: dateStr })
        ]);
        setStudents(studentRes.data);
        const map = {};
        attRes.data.forEach(r => { map[r.student_id] = r.status; });
        setAttendanceData(map);
      } catch (err) { toast.error(formatApiError(err)); }
      finally { setStudentsLoading(false); }
    };
    load();
  }, [selectedProgram, selectedSemester, selectedSubjectId, selectedDate]);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === 'stats' && user?.role === 'student') fetchPersonalStats();
    if (activeTab === 'defaulters' && isAdmin) fetchDefaulters();
    if (activeTab === 'staff-reports' && isAdmin) fetchStaffRecords();
  }, [activeTab]);

  const checkCurrentStatus = async () => {
    try {
      const res = await attendanceApi.getStaff({ user_id: user.id, date: format(new Date(), 'yyyy-MM-dd') });
      if (res.data.length > 0) { setIsCheckedIn(!!res.data[0].check_in); setLastCheckIn(res.data[0].check_in); }
    } catch (e) {}
  };

  const fetchPersonalStats = async () => {
    if (!user?.student_record_id) return;
    try { const res = await attendanceApi.getStats(user.student_record_id); setStats(res.data); } catch (e) {}
  };

  const fetchDefaulters = async () => {
    try { const res = await attendanceApi.getDefaulters({ threshold: 75 }); setDefaulters(res.data); } catch (e) {}
  };

  const fetchStaffRecords = async () => {
    try { const res = await attendanceApi.getStaff(); setStaffRecords(res.data); } catch (e) {}
  };

  const handleCheckAction = async () => {
    try {
      if (!isCheckedIn) {
        const res = await attendanceApi.checkIn();
        setIsCheckedIn(true); setLastCheckIn(res.data.check_in);
        toast.success('Checked in for duty');
      } else {
        const res = await attendanceApi.checkOut();
        setIsCheckedIn(false);
        toast.success(`Check-out successful. Total: ${res.data.total_hours} hrs`);
      }
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleMarkAttendance = async (studentId, status) => {
    if (!selectedSubjectId) return;
    try {
      await attendanceApi.mark({ student_id: studentId, subject_id: selectedSubjectId, date: format(selectedDate, 'yyyy-MM-dd'), status });
      setAttendanceData(prev => ({ ...prev, [studentId]: status }));
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleBulkMark = async (status) => {
    if (!selectedSubjectId || students.length === 0) return;
    try {
      await attendanceApi.markBulk({ subject_id: selectedSubjectId, date: format(selectedDate, 'yyyy-MM-dd'), records: students.map(s => ({ student_id: s.id, status })) });
      const newData = {};
      students.forEach(s => { newData[s.id] = status; });
      setAttendanceData(newData);
      toast.success(`All marked as ${status}`);
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Present</Badge>;
      case 'absent': return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
      case 'late': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Late</Badge>;
      default: return <Badge variant="outline" className="text-slate-400">—</Badge>;
    }
  };

  const deptPrograms = selectedDept ? programs.filter(p => p.department_id === selectedDept.id) : [];
  const semesterArray = selectedProgram ? Array.from({ length: selectedProgram.total_semesters }, (_, i) => i + 1) : [];

  const handleSelectDept = (dept) => {
    setSelectedDept(dept); setSelectedProgram(null); setSelectedSemester(1);
    setSubjects([]); setStudents([]); setSelectedSubjectId('');
  };

  const handleSelectProgram = (prog) => {
    setSelectedProgram(prog); setSelectedSemester(1);
    setSubjects([]); setStudents([]); setSelectedSubjectId('');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Attendance Module
          </h1>
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
            <span>Departments</span>
            {selectedDept && <><ChevronRight className="h-3 w-3" /><span className="text-blue-700 font-medium">{selectedDept.code}</span></>}
            {selectedProgram && <><ChevronRight className="h-3 w-3" /><span className="text-blue-900 font-semibold">{selectedProgram.code}</span></>}
            {selectedProgram && <><ChevronRight className="h-3 w-3" /><span>Sem {selectedSemester}</span></>}
          </div>
        </div>
      </div>

      {/* Staff Check-in Panel */}
      {isStaff && (
        <Card className="bg-gradient-to-r from-blue-900 to-indigo-900 border-none text-white overflow-hidden relative">
          <CardContent className="p-6 md:flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user.name}</h3>
              <p className="text-blue-100 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {isCheckedIn && lastCheckIn
                  ? `Checked in at ${format(new Date(lastCheckIn), 'hh:mm a')}`
                  : "You haven't checked in for duty today."}
              </p>
            </div>
            <Button
              onClick={handleCheckAction}
              className={`mt-4 md:mt-0 px-8 h-12 text-md font-bold shadow-xl transition-all active:scale-95 ${isCheckedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {isCheckedIn ? 'Punch Out' : 'Punch In My Attendance'}
            </Button>
          </CardContent>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="marking" className="data-[state=active]:bg-white">
            <ClipboardCheck className="h-4 w-4 mr-2" />Student Attendance
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-white">
            <BarChart3 className="h-4 w-4 mr-2" />My Dashboard
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="staff-reports" className="data-[state=active]:bg-white">
                <Clock className="h-4 w-4 mr-2" />Staff Attendance
              </TabsTrigger>
              <TabsTrigger value="defaulters" className="data-[state=active]:bg-white">
                <UserX className="h-4 w-4 mr-2" />Defaulters
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* ============================
            MARKING TAB
        ============================= */}
        <TabsContent value="marking" className="space-y-4 pt-4">
          <div className="grid grid-cols-12 gap-4">

            {/* Panel 1: Departments */}
            <div className="col-span-12 md:col-span-3">
              <Card className="border-slate-200">
                <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200 py-3">
                  <CardTitle className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-blue-900" />Departments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {departments.map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => handleSelectDept(dept)}
                      className={`w-full text-left px-3 py-2.5 text-xs border-b border-slate-100 transition-colors flex items-center justify-between group
                        ${selectedDept?.id === dept.id ? 'bg-blue-900 text-white' : 'hover:bg-blue-50 text-slate-700'}`}
                    >
                      <span className="font-medium leading-tight">{dept.name}</span>
                      <ChevronRight className={`h-3 w-3 shrink-0 ${selectedDept?.id === dept.id ? 'text-white' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Panel 2: Programs */}
            <div className="col-span-12 md:col-span-3">
              <Card className="border-slate-200">
                <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200 py-3">
                  <CardTitle className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-900" />
                    {selectedDept ? `${selectedDept.code} Programs` : 'Select Department'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!selectedDept ? (
                    <div className="text-center py-8 text-slate-400 text-xs">Select a department</div>
                  ) : deptPrograms.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">No programs</div>
                  ) : deptPrograms.map(prog => (
                    <button
                      key={prog.id}
                      onClick={() => handleSelectProgram(prog)}
                      className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition-colors
                        ${selectedProgram?.id === prog.id ? 'bg-blue-900 text-white' : 'hover:bg-blue-50 text-slate-700'}`}
                    >
                      <p className="font-semibold text-xs">{prog.code}</p>
                      <p className={`text-[10px] mt-0.5 ${selectedProgram?.id === prog.id ? 'text-blue-200' : 'text-slate-400'}`}>
                        {prog.total_semesters} Semesters
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Panel 3: Semester + Subject + Marking */}
            <div className="col-span-12 md:col-span-6 space-y-3">
              {!selectedProgram ? (
                <Card className="border-slate-200">
                  <CardContent className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                    <ClipboardCheck className="h-10 w-10 mb-2 opacity-30" />
                    Select department → program to start marking
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Semester Pills */}
                  <Card className="border-slate-200">
                    <CardContent className="p-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {semesterArray.map(sem => (
                          <button
                            key={sem}
                            onClick={() => { setSelectedSemester(sem); setSelectedSubjectId(''); }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all
                              ${selectedSemester === sem ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-800'}`}
                          >
                            Sem {sem}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subject + Date Selector */}
                  <Card className="border-slate-200">
                    <CardContent className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-semibold text-slate-500 mb-1.5">SUBJECT</p>
                          {subjectsLoading ? (
                            <div className="h-9 rounded-md bg-slate-100 animate-pulse" />
                          ) : (
                            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {subjects.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name} ({s.code})</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-500 mb-1.5">DATE</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full h-9 text-xs justify-start">
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {format(selectedDate, 'dd MMM yyyy')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-xl">
                              <Calendar mode="single" selected={selectedDate} onSelect={d => d && setSelectedDate(d)} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attendance Sheet */}
                  <Card className="border-slate-200">
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between bg-slate-50 border-b border-slate-200">
                      <CardTitle className="text-xs font-semibold flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-blue-900" />
                        {selectedSubjectId
                          ? `${selectedProgram.code} · Sem ${selectedSemester} · ${subjects.find(s => s.id === selectedSubjectId)?.code || ''}`
                          : 'Attendance Sheet'}
                      </CardTitle>
                      {canMark && selectedSubjectId && students.length > 0 && (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => handleBulkMark('present')}>
                            ✓ All Present
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleBulkMark('absent')}>
                            ✗ All Absent
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      {!selectedSubjectId ? (
                        <div className="text-center py-10 text-slate-400 text-xs">Select a subject to show students</div>
                      ) : studentsLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-5 h-5 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : students.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">No students in {selectedProgram.code} Sem {selectedSemester}</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="text-xs py-2 w-10">#</TableHead>
                              <TableHead className="text-xs py-2">Student</TableHead>
                              <TableHead className="text-xs py-2">Status</TableHead>
                              {canMark && <TableHead className="text-xs py-2 text-right">Mark</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students.map((student, idx) => (
                              <TableRow key={student.id} className="hover:bg-slate-50">
                                <TableCell className="text-xs text-slate-400 py-2">{idx + 1}</TableCell>
                                <TableCell className="py-2">
                                  <p className="font-semibold text-sm text-slate-900">{student.name}</p>
                                  <p className="text-[10px] text-slate-400">{student.student_id}</p>
                                </TableCell>
                                <TableCell className="py-2">{getStatusBadge(attendanceData[student.id])}</TableCell>
                                {canMark && (
                                  <TableCell className="text-right py-2">
                                    <div className="flex justify-end gap-1">
                                      <button
                                        onClick={() => handleMarkAttendance(student.id, 'present')}
                                        className={`w-7 h-7 rounded flex items-center justify-center transition-all ${attendanceData[student.id] === 'present' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                      ><Check className="h-3.5 w-3.5" /></button>
                                      <button
                                        onClick={() => handleMarkAttendance(student.id, 'absent')}
                                        className={`w-7 h-7 rounded flex items-center justify-center transition-all ${attendanceData[student.id] === 'absent' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                      ><X className="h-3.5 w-3.5" /></button>
                                      <button
                                        onClick={() => handleMarkAttendance(student.id, 'late')}
                                        className={`w-7 h-7 rounded flex items-center justify-center transition-all ${attendanceData[student.id] === 'late' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                                      ><Clock className="h-3.5 w-3.5" /></button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================
            MY DASHBOARD TAB (student stats)
        ============================= */}
        <TabsContent value="stats" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {user?.role === 'student' ? (
              stats.length > 0 ? stats.map((s, idx) => (
                <Card key={idx} className="border-slate-200 overflow-hidden">
                  <div className={`h-1 w-full ${s.percentage < 75 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="secondary" className="mb-1 text-[10px]">{s.subject_code}</Badge>
                        <CardTitle className="text-sm font-bold">{s.subject_name}</CardTitle>
                      </div>
                      <p className={`text-xl font-black ${s.percentage < 75 ? 'text-red-600' : 'text-emerald-700'}`}>{s.percentage}%</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={s.percentage} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 rounded p-2"><p className="text-[10px] text-slate-500">Total</p><p className="text-sm font-bold">{s.total_conducted}</p></div>
                      <div className="bg-emerald-50 rounded p-2"><p className="text-[10px] text-emerald-600">Present</p><p className="text-sm font-bold text-emerald-700">{s.total_attended}</p></div>
                      <div className="bg-red-50 rounded p-2"><p className="text-[10px] text-red-500">Absent</p><p className="text-sm font-bold text-red-600">{s.absent}</p></div>
                    </div>
                    {s.percentage < 75 && (
                      <div className="bg-red-50 p-2 rounded flex items-center gap-2 border border-red-100">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <p className="text-[10px] text-red-700 font-medium">Below 75% — Attendance Warning!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )) : (
                <Card className="col-span-full border-slate-200">
                  <CardContent className="py-20 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 italic">Attendance statistics appear once classes are conducted.</p>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="col-span-full border-slate-200">
                <CardContent className="py-20 text-center">
                  <BarChart3 className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Subject-wise analytics for faculty and deans is available in the Defaulters report.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab('defaulters')}>View Defaulter Reports</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ============================
            STAFF REPORTS TAB
        ============================= */}
        {isAdmin && (
          <TabsContent value="staff-reports" className="pt-4">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-900" />Faculty & Staff Attendance Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Staff Name</TableHead><TableHead>Role</TableHead><TableHead>Date</TableHead>
                      <TableHead>Check-In</TableHead><TableHead>Check-Out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffRecords.map(r => (
                      <TableRow key={r.id} className="hover:bg-slate-50">
                        <TableCell className="font-bold text-slate-900">{r.user_name}</TableCell>
                        <TableCell className="capitalize text-xs font-semibold">{r.role}</TableCell>
                        <TableCell>{r.date}</TableCell>
                        <TableCell className="text-emerald-600 font-medium">{r.check_in ? format(new Date(r.check_in), 'hh:mm a') : '-'}</TableCell>
                        <TableCell className="text-red-500 font-medium">{r.check_out ? format(new Date(r.check_out), 'hh:mm a') : '-'}</TableCell>
                        <TableCell className="font-black">{r.total_hours} hrs</TableCell>
                        <TableCell><Badge className="bg-emerald-100 text-emerald-800 capitalize">{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {staffRecords.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">No staff logs found for today.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ============================
            DEFAULTERS TAB
        ============================= */}
        {isAdmin && (
          <TabsContent value="defaulters" className="pt-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />Attendance Defaulter List (Below 75%)
                  </CardTitle>
                  <Badge variant="destructive" className="animate-pulse">{defaulters.length} Defaulters Identified</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Student Name</TableHead><TableHead>Enrollment</TableHead><TableHead>Program</TableHead>
                      <TableHead>Total</TableHead><TableHead>Attended</TableHead><TableHead className="text-red-600">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaulters.map((d, i) => (
                      <TableRow key={i} className="hover:bg-red-50">
                        <TableCell className="font-bold">{d.name}</TableCell>
                        <TableCell>{d.student_id}</TableCell>
                        <TableCell className="text-xs">{d.program}</TableCell>
                        <TableCell>{d.total_conducted}</TableCell>
                        <TableCell>{d.total_attended}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-red-600">{d.percentage}%</p>
                            <Progress value={d.percentage} className="h-1.5 w-16 bg-red-100" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {defaulters.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400 italic">No students below the threshold.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AttendancePage;
