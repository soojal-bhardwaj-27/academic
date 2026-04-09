import React, { useState, useEffect } from 'react';
import { timetableApi, subjectApi, programApi, departmentApi, userApi, formatApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Trash2, Calendar, Clock, FileUp, Building2, GraduationCap, ChevronRight } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const DAY_COLORS = {
  Monday: 'bg-blue-50 border-blue-200 text-blue-900',
  Tuesday: 'bg-violet-50 border-violet-200 text-violet-900',
  Wednesday: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  Thursday: 'bg-amber-50 border-amber-200 text-amber-900',
  Friday: 'bg-rose-50 border-rose-200 text-rose-900',
  Saturday: 'bg-slate-50 border-slate-200 text-slate-700',
};

const TimetablePage = () => {
  const { user } = useAuth();

  // Navigation
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Data
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timetableLoading, setTimetableLoading] = useState(false);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState({
    day: 'Monday', start_time: '09:00', end_time: '10:00',
    subject_id: '', faculty_id: '', room: '', program_id: '', semester: 1
  });

  const canEdit = ['admin', 'dean', 'dean_academics'].includes(user?.role);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [deptsRes, progsRes, usersRes] = await Promise.all([
          departmentApi.getAll(),
          programApi.getAll(),
          canEdit ? userApi.getAll({ role: 'faculty' }) : Promise.resolve({ data: [] })
        ]);
        setDepartments(deptsRes.data);
        setPrograms(progsRes.data);
        setFaculty(usersRes.data);

        if (user?.role === 'dean' && user?.department_id) {
          const dept = deptsRes.data.find(d => d.id === user.department_id);
          if (dept) setSelectedDept(dept);
        }
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // Load timetable when program+semester changes
  useEffect(() => {
    if (!selectedProgram) { setTimetable([]); return; }
    const load = async () => {
      setTimetableLoading(true);
      try {
        const [ttRes, subjRes] = await Promise.all([
          timetableApi.getAll({ program_id: selectedProgram.id, semester: selectedSemester }),
          subjectApi.getAll({ program_id: selectedProgram.id, semester: selectedSemester })
        ]);
        setTimetable(ttRes.data);
        setSubjects(subjRes.data);
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setTimetableLoading(false);
      }
    };
    load();
  }, [selectedProgram, selectedSemester]);

  const deptPrograms = selectedDept ? programs.filter(p => p.department_id === selectedDept.id) : [];
  const semesterArray = selectedProgram ? Array.from({ length: selectedProgram.total_semesters }, (_, i) => i + 1) : [];

  const handleSelectDept = (dept) => { setSelectedDept(dept); setSelectedProgram(null); setSelectedSemester(1); setTimetable([]); };
  const handleSelectProgram = (prog) => {
    setSelectedProgram(prog);
    setSelectedSemester(1);
    setFormData(f => ({ ...f, program_id: prog.id, semester: 1 }));
  };

  const getSlot = (day, time) => timetable.find(s => s.day === day && s.start_time === time);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await timetableApi.create({ ...formData, semester: parseInt(formData.semester) });
      toast.success('Timetable slot added');
      setDialogOpen(false);
      const res = await timetableApi.getAll({ program_id: selectedProgram.id, semester: selectedSemester });
      setTimetable(res.data);
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await timetableApi.delete(id);
      toast.success('Slot deleted');
      setTimetable(prev => prev.filter(s => s.id !== id));
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await timetableApi.bulkImport(fd);
      toast.success(res.data.message);
      if (res.data.errors?.length) toast.warning(`${res.data.errors.length} errors. Check console.`);
      setUploadDialogOpen(false);
      setFile(null);
      if (selectedProgram) {
        const r = await timetableApi.getAll({ program_id: selectedProgram.id, semester: selectedSemester });
        setTimetable(r.data);
      }
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setImporting(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="timetable-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Timetable Management
          </h1>
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
            <span>Departments</span>
            {selectedDept && <><ChevronRight className="h-3 w-3" /><span className="text-blue-700 font-medium">{selectedDept.code}</span></>}
            {selectedProgram && <><ChevronRight className="h-3 w-3" /><span className="text-blue-900 font-semibold">{selectedProgram.code}</span></>}
            {selectedProgram && <><ChevronRight className="h-3 w-3" /><span>Sem {selectedSemester}</span></>}
          </div>
        </div>
        {canEdit && selectedProgram && (
          <div className="flex gap-2">
            {/* Import Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 text-blue-900 hover:bg-blue-50">
                  <FileUp className="h-4 w-4 mr-2" />Import Excel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Bulk Import Timetable</DialogTitle></DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4 pt-4">
                  <div className="space-y-2 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                    <FileUp className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <Input type="file" accept=".xlsx,.csv" onChange={e => setFile(e.target.files[0])} className="cursor-pointer" />
                    <p className="text-xs text-slate-500 mt-2">
                      Required columns: <b>program_code, semester, day, start_time, end_time, subject_code, faculty_email, room</b>
                    </p>
                  </div>
                  <Button type="submit" className="w-full bg-blue-900" disabled={!file || importing}>
                    {importing ? 'Importing...' : 'Upload & Process'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Add Slot Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-900 hover:bg-blue-800" data-testid="add-slot-btn">
                  <Plus className="h-4 w-4 mr-2" />Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add Slot — {selectedProgram.code} Sem {selectedSemester}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select value={formData.day} onValueChange={v => setFormData({ ...formData, day: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Input value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="Room 101" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Select value={formData.start_time} onValueChange={v => setFormData({ ...formData, start_time: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Select value={formData.end_time} onValueChange={v => setFormData({ ...formData, end_time: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={formData.subject_id} onValueChange={v => setFormData({ ...formData, subject_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Select value={formData.faculty_id} onValueChange={v => setFormData({ ...formData, faculty_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                      <SelectContent>
                        {faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={String(formData.semester)} onValueChange={v => setFormData({ ...formData, semester: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{semesterArray.map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">Add Slot</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* 3-Column Navigator */}
      <div className="grid grid-cols-12 gap-4">
        {/* Departments */}
        <div className="col-span-12 md:col-span-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-900" />Departments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDept(dept)}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-slate-100 transition-colors flex items-center justify-between group
                    ${selectedDept?.id === dept.id ? 'bg-blue-900 text-white' : 'hover:bg-blue-50 text-slate-700'}`}
                >
                  <span className="font-medium leading-tight">{dept.name}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedDept?.id === dept.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {programs.filter(p => p.department_id === dept.id).length}
                    </span>
                    <ChevronRight className={`h-3 w-3 ${selectedDept?.id === dept.id ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Programs */}
        <div className="col-span-12 md:col-span-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-900" />
                {selectedDept ? `${selectedDept.code} Programs` : 'Select Department'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedDept ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />Select a department
                </div>
              ) : deptPrograms.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No programs</div>
              ) : deptPrograms.map(prog => (
                <button
                  key={prog.id}
                  onClick={() => handleSelectProgram(prog)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors
                    ${selectedProgram?.id === prog.id ? 'bg-blue-900 text-white' : 'hover:bg-blue-50 text-slate-700'}`}
                >
                  <p className="font-semibold text-sm">{prog.code}</p>
                  <p className={`text-xs mt-0.5 ${selectedProgram?.id === prog.id ? 'text-blue-200' : 'text-slate-500'}`}>
                    {prog.name} · {prog.total_semesters} Sems
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Timetable Grid */}
        <div className="col-span-12 md:col-span-6">
          {!selectedProgram ? (
            <Card className="border-slate-200">
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm">
                <Calendar className="h-12 w-12 mb-3 opacity-30" />
                Select a program to view the timetable
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Semester Selector */}
              <Card className="border-slate-200">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {semesterArray.map(sem => (
                      <button
                        key={sem}
                        onClick={() => setSelectedSemester(sem)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all
                          ${selectedSemester === sem ? 'bg-blue-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-800'}`}
                      >
                        Sem {sem}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Grid */}
              <Card className="border-slate-200">
                <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-900" />
                    {selectedProgram.code} — Semester {selectedSemester} Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {timetableLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="min-w-[600px]">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-slate-200 p-2 text-left font-semibold text-slate-600 w-20">
                              <Clock className="h-3.5 w-3.5 inline mr-1" />Time
                            </th>
                            {DAYS.map(day => (
                              <th key={day} className="border border-slate-200 p-2 text-center font-semibold text-slate-700 text-xs">{day}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {TIME_SLOTS.map(time => (
                            <tr key={time}>
                              <td className="border border-slate-200 p-2 text-xs font-medium text-slate-500 bg-slate-50 whitespace-nowrap">{time}</td>
                              {DAYS.map(day => {
                                const slot = getSlot(day, time);
                                return (
                                  <td key={`${day}-${time}`} className="border border-slate-200 p-1 h-16 align-top">
                                    {slot ? (
                                      <div className={`rounded p-1.5 h-full relative group border ${DAY_COLORS[day]}`} data-testid={`slot-${slot.id}`}>
                                        <p className="font-semibold text-xs leading-tight truncate">{slot.subject_name}</p>
                                        <p className="text-[10px] opacity-70 truncate mt-0.5">{slot.faculty_name}</p>
                                        <p className="text-[10px] opacity-60">{slot.room}</p>
                                        {canEdit && (
                                          <button
                                            onClick={() => handleDelete(slot.id)}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-opacity"
                                            data-testid={`delete-slot-${slot.id}`}
                                          >
                                            <Trash2 className="h-2.5 w-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="h-full" />
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {timetable.length === 0 && !timetableLoading && (
                <p className="text-center text-slate-400 text-sm py-2">No slots scheduled. {canEdit && 'Click "Add Slot" to begin.'}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;
