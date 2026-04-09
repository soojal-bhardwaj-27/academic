import React, { useState, useEffect } from 'react';
import { subjectApi, programApi, departmentApi, formatApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, Trash2, BookOpen, Building2, GraduationCap, ChevronRight, Layers } from 'lucide-react';

const getTypeColor = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'core': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'elective': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'lab': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'practical': return 'bg-amber-100 text-amber-800 border-amber-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const CurriculumPage = () => {
  const { user } = useAuth();

  // State
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Navigation State
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', credits: 3, type: 'core', program_id: '', semester: 1 });

  const canEdit = ['admin', 'dean', 'dean_academics'].includes(user?.role);

  // Initial load: departments and all programs
  useEffect(() => {
    const init = async () => {
      try {
        const [deptsRes, progsRes] = await Promise.all([departmentApi.getAll(), programApi.getAll()]);
        setDepartments(deptsRes.data);
        setPrograms(progsRes.data);

        // Auto-select department for deans
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

  // Load subjects when program and semester selected
  useEffect(() => {
    if (!selectedProgram) { setSubjects([]); return; }
    const load = async () => {
      setSubjectsLoading(true);
      try {
        const res = await subjectApi.getAll({ program_id: selectedProgram.id, semester: selectedSemester });
        setSubjects(res.data);
      } catch (err) {
        toast.error(formatApiError(err));
      } finally {
        setSubjectsLoading(false);
      }
    };
    load();
  }, [selectedProgram, selectedSemester]);

  const deptPrograms = selectedDept
    ? programs.filter(p => p.department_id === selectedDept.id)
    : [];

  const semesterCount = selectedProgram?.total_semesters || 0;
  const semesterArray = Array.from({ length: semesterCount }, (_, i) => i + 1);

  const handleSelectDept = (dept) => {
    setSelectedDept(dept);
    setSelectedProgram(null);
    setSelectedSemester(1);
    setSubjects([]);
  };

  const handleSelectProgram = (prog) => {
    setSelectedProgram(prog);
    setSelectedSemester(1);
    setSubjects([]);
    setFormData(f => ({ ...f, program_id: prog.id, semester: 1 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subjectApi.create({ ...formData, credits: parseFloat(formData.credits), semester: parseInt(formData.semester) });
      toast.success('Subject added successfully');
      setDialogOpen(false);
      setFormData({ name: '', code: '', credits: 3, type: 'core', program_id: selectedProgram?.id || '', semester: selectedSemester });
      // Reload
      if (selectedProgram) {
        const res = await subjectApi.getAll({ program_id: selectedProgram.id, semester: selectedSemester });
        setSubjects(res.data);
      }
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await subjectApi.delete(id);
      toast.success('Subject deleted');
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="curriculum-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Curriculum Management
          </h1>
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
            <span>Departments</span>
            {selectedDept && <><ChevronRight className="h-3 w-3" /><span className="text-blue-700 font-medium">{selectedDept.name}</span></>}
            {selectedProgram && <><ChevronRight className="h-3 w-3" /><span className="text-blue-900 font-semibold">{selectedProgram.code}</span></>}
            {selectedProgram && <><ChevronRight className="h-3 w-3" /><span className="text-slate-700">Sem {selectedSemester}</span></>}
          </div>
        </div>
        {canEdit && selectedProgram && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800" data-testid="add-subject-btn">
                <Plus className="h-4 w-4 mr-2" />Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Subject to {selectedProgram.name} — Sem {selectedSemester}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Data Structures" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject Code</Label>
                    <Input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="CS201" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Credits</Label>
                    <Input type="number" min="1" max="6" value={formData.credits} onChange={e => setFormData({ ...formData, credits: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">Core</SelectItem>
                        <SelectItem value="elective">Elective</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                        <SelectItem value="practical">Practical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={String(formData.semester)} onValueChange={v => setFormData({ ...formData, semester: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {semesterArray.map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800">Add Subject</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 3-Panel Layout */}
      <div className="grid grid-cols-12 gap-4">

        {/* Panel 1: Departments */}
        <div className="col-span-12 md:col-span-3">
          <Card className="border-slate-200 sticky top-4">
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-900" /> Departments
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
                  <div className={`flex items-center gap-1 shrink-0 ml-2`}>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedDept?.id === dept.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {programs.filter(p => p.department_id === dept.id).length}
                    </span>
                    <ChevronRight className={`h-3 w-3 ${selectedDept?.id === dept.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Panel 2: Programs */}
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
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Select a department first
                </div>
              ) : deptPrograms.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No programs found</div>
              ) : (
                deptPrograms.map(prog => (
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
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel 3: Semesters + Subjects */}
        <div className="col-span-12 md:col-span-6">
          {!selectedProgram ? (
            <Card className="border-slate-200 h-full">
              <CardContent className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                <Layers className="h-10 w-10 mb-2 opacity-30" />
                Select a program to view curriculum
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Semester Pills */}
              <Card className="border-slate-200">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {semesterArray.map(sem => (
                      <button
                        key={sem}
                        onClick={() => setSelectedSemester(sem)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all
                          ${selectedSemester === sem
                            ? 'bg-blue-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-800'}`}
                      >
                        Sem {sem}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Subjects for Selected Semester */}
              <Card className="border-slate-200">
                <CardHeader className="pb-3 bg-slate-50 border-b border-slate-200">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-900" />
                      <span>{selectedProgram.name} — Semester {selectedSemester}</span>
                    </div>
                    <div className="flex gap-2">
                      {!subjectsLoading && (
                        <>
                          <Badge variant="secondary">{subjects.length} subjects</Badge>
                          <Badge variant="outline">{subjects.reduce((s, x) => s + (x.credits || 0), 0)} credits</Badge>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {subjectsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="text-center py-10">
                      <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-500 text-sm">No subjects in Semester {selectedSemester}</p>
                      {canEdit && <p className="text-xs text-slate-400 mt-1">Click "Add Subject" to get started</p>}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {subjects.map((subj, idx) => (
                        <div key={subj.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 group">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-blue-900">{subj.code}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeColor(subj.type)}`}>
                                  {(subj.type || 'core').toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 mt-0.5">{subj.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500">{subj.credits} cr</span>
                            {canEdit && (
                              <button
                                onClick={() => handleDelete(subj.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-red-500 hover:bg-red-50 transition-opacity"
                                data-testid={`delete-subject-${subj.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurriculumPage;
