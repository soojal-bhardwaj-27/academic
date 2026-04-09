import React, { useState, useEffect } from 'react';
import { studentApi, programApi, formatApiError } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Upload, Search, Trash2, Download, GraduationCap } from 'lucide-react';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    enrollment_number: '',
    email: '',
    mobile_number: '',
    program_id: '',
    academic_session: '2025-2029',
    category: 'General',
    semester: 1
  });

  useEffect(() => {
    fetchData();
  }, [filterProgram, filterSemester]);

  const fetchData = async () => {
    try {
      const params = {};
      if (filterProgram) params.program_id = filterProgram;
      if (filterSemester) params.semester = parseInt(filterSemester);

      const [studentsRes, programsRes] = await Promise.all([
        studentApi.getAll(params),
        programApi.getAll()
      ]);
      setStudents(studentsRes.data);
      setPrograms(programsRes.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await studentApi.create({
        ...formData,
        semester: parseInt(formData.semester)
      });
      toast.success('Student added successfully');
      setDialogOpen(false);
      setFormData({
        name: '',
        enrollment_number: '',
        email: '',
        mobile_number: '',
        program_id: '',
        academic_session: '2025-2029',
        category: 'General',
        semester: 1
      });
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await studentApi.bulkImport(file);
      toast.success(`Imported ${result.data.imported} students`);
      if (result.data.errors.length > 0) {
        toast.warning(`${result.data.errors.length} errors occurred`);
        console.log('Import errors:', result.data.errors);
      }
      setImportDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentApi.delete(id);
      toast.success('Student deleted');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,enrollment_number,email,mobile_number,program_code,academic_session,semester,category\nJohn Doe,RU2025001,john@example.com,9876543210,BTECH,2025-2029,1,General';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="students-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Student Management
          </h1>
          <p className="text-slate-500">Manage student admissions and data</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-200" data-testid="import-btn">
                <Upload className="h-4 w-4 mr-2" />
                Import Excel/CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Students from Excel/CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Required Columns:</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>name</strong> - Student's full name</li>
                    <li>• <strong>enrollment_number</strong> - Unique enrollment ID</li>
                    <li>• <strong>email</strong> - Email address (optional)</li>
                    <li>• <strong>mobile_number</strong> - Student's phone number</li>
                    <li>• <strong>program_code</strong> - e.g., BTECH, MBA</li>
                    <li>• <strong>academic_session</strong> - e.g., 2025-2029</li>
                    <li>• <strong>semester</strong> - Current semester (1-8)</li>
                    <li>• <strong>category</strong> - Optional (General, OBC, etc.)</li>
                  </ul>
                </div>
                <Button variant="outline" onClick={downloadTemplate} className="w-full" data-testid="download-template-btn">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                <div className="space-y-2">
                  <Label>Upload File (Excel or CSV)</Label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImport}
                    className="cursor-pointer"
                    data-testid="file-input"
                  />
                </div>
                <p className="text-xs text-slate-500">Supported formats: .xlsx, .xls, .csv</p>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800" data-testid="add-student-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="student-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Enrollment Number</Label>
                    <Input
                      value={formData.enrollment_number}
                      onChange={(e) => setFormData({ ...formData, enrollment_number: e.target.value })}
                      required
                      data-testid="enrollment-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input
                      value={formData.mobile_number}
                      onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                      required
                      data-testid="student-mobile-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="student-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={formData.program_id} onValueChange={(v) => setFormData({ ...formData, program_id: v })}>
                    <SelectTrigger data-testid="program-select">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Session</Label>
                    <Input
                      value={formData.academic_session}
                      onChange={(e) => setFormData({ ...formData, academic_session: e.target.value })}
                      placeholder="2025-2029"
                      data-testid="session-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={String(formData.semester)} onValueChange={(v) => setFormData({ ...formData, semester: parseInt(v) })}>
                      <SelectTrigger data-testid="semester-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map((s) => (
                          <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger data-testid="category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                      <SelectItem value="EWS">EWS</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" data-testid="submit-student-btn">
                  Add Student
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, ID, or enrollment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={filterProgram || "all"} onValueChange={(v) => setFilterProgram(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-48" data-testid="filter-program">
                <SelectValue placeholder="All Programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSemester || "all"} onValueChange={(v) => setFilterSemester(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-semester">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {[1,2,3,4,5,6,7,8].map((s) => (
                  <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-900" />
            Students ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Student ID</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Mobile</TableHead>
                    <TableHead className="font-semibold">Enrollment</TableHead>
                    <TableHead className="font-semibold">Program</TableHead>
                    <TableHead className="font-semibold">Semester</TableHead>
                    <TableHead className="font-semibold">Session</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-slate-50" data-testid={`student-row-${student.id}`}>
                      <TableCell className="font-medium text-blue-900">{student.student_id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{student.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{student.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">{student.mobile_number || 'N/A'}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{student.enrollment_number}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase">
                          {student.program_name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">Sem {student.semester}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{student.academic_session}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-student-${student.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No students found</p>
              <p className="text-sm text-slate-400">Add students manually or import from CSV</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsPage;
