import React, { useState, useEffect } from 'react';
import { batchApi, electiveApi, studentApi, userApi, formatApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Trash2, Users, UserPlus, UserMinus } from 'lucide-react';

const BatchesPage = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [electives, setElectives] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [electiveDialogOpen, setElectiveDialogOpen] = useState(false);
  const [addStudentDialog, setAddStudentDialog] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');

  const [batchForm, setBatchForm] = useState({
    elective_id: '',
    faculty_id: '',
    batch_name: ''
  });

  const [electiveForm, setElectiveForm] = useState({
    name: '',
    code: '',
    credits: 3,
    program_id: '',
    semester: 5,
    max_students: 60
  });

  const canEdit = ['admin', 'dean', 'dean_academics'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, electivesRes, studentsRes, usersRes] = await Promise.all([
        batchApi.getAll(),
        electiveApi.getAll(),
        studentApi.getAll(),
        canEdit ? userApi.getAll({ role: 'faculty' }) : Promise.resolve({ data: [] })
      ]);
      setBatches(batchesRes.data);
      setElectives(electivesRes.data);
      setStudents(studentsRes.data);
      setFaculty(usersRes.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await batchApi.create(batchForm);
      toast.success('Batch created successfully');
      setDialogOpen(false);
      setBatchForm({ elective_id: '', faculty_id: '', batch_name: '' });
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleCreateElective = async (e) => {
    e.preventDefault();
    try {
      await electiveApi.create({
        ...electiveForm,
        credits: parseInt(electiveForm.credits),
        semester: parseInt(electiveForm.semester),
        max_students: parseInt(electiveForm.max_students)
      });
      toast.success('Elective created successfully');
      setElectiveDialogOpen(false);
      setElectiveForm({
        name: '',
        code: '',
        credits: 3,
        program_id: '',
        semester: 5,
        max_students: 60
      });
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleAddStudent = async (batchId) => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    try {
      await batchApi.addStudent(batchId, selectedStudent);
      toast.success('Student added to batch');
      setAddStudentDialog(null);
      setSelectedStudent('');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleRemoveStudent = async (batchId, studentId) => {
    try {
      await batchApi.removeStudent(batchId, studentId);
      toast.success('Student removed from batch');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="batches-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Batch Management
          </h1>
          <p className="text-slate-500">Manage elective batches and student allocation</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Dialog open={electiveDialogOpen} onOpenChange={setElectiveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="add-elective-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Elective
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Elective</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateElective} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Elective Name</Label>
                    <Input
                      value={electiveForm.name}
                      onChange={(e) => setElectiveForm({ ...electiveForm, name: e.target.value })}
                      placeholder="Machine Learning"
                      required
                      data-testid="elective-name-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input
                        value={electiveForm.code}
                        onChange={(e) => setElectiveForm({ ...electiveForm, code: e.target.value.toUpperCase() })}
                        placeholder="CS501"
                        required
                        data-testid="elective-code-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credits</Label>
                      <Input
                        type="number"
                        min="1"
                        max="6"
                        value={electiveForm.credits}
                        onChange={(e) => setElectiveForm({ ...electiveForm, credits: e.target.value })}
                        data-testid="elective-credits-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select value={String(electiveForm.semester)} onValueChange={(v) => setElectiveForm({ ...electiveForm, semester: parseInt(v) })}>
                        <SelectTrigger data-testid="elective-semester-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map((s) => (
                            <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Students</Label>
                      <Input
                        type="number"
                        min="10"
                        max="200"
                        value={electiveForm.max_students}
                        onChange={(e) => setElectiveForm({ ...electiveForm, max_students: e.target.value })}
                        data-testid="elective-max-input"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" data-testid="submit-elective-btn">
                    Create Elective
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-900 hover:bg-blue-800" data-testid="add-batch-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Batch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Batch</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBatch} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Elective</Label>
                    <Select value={batchForm.elective_id} onValueChange={(v) => setBatchForm({ ...batchForm, elective_id: v })}>
                      <SelectTrigger data-testid="batch-elective-select">
                        <SelectValue placeholder="Select elective" />
                      </SelectTrigger>
                      <SelectContent>
                        {electives.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name} ({e.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Select value={batchForm.faculty_id} onValueChange={(v) => setBatchForm({ ...batchForm, faculty_id: v })}>
                      <SelectTrigger data-testid="batch-faculty-select">
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculty.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Name</Label>
                    <Input
                      value={batchForm.batch_name}
                      onChange={(e) => setBatchForm({ ...batchForm, batch_name: e.target.value })}
                      placeholder="Batch A"
                      required
                      data-testid="batch-name-input"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" data-testid="submit-batch-btn">
                    Create Batch
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Electives Overview */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Electives ({electives.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {electives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {electives.map((elective) => (
                <div key={elective.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`elective-card-${elective.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{elective.name}</h4>
                      <p className="text-sm text-slate-500">{elective.code}</p>
                    </div>
                    <Badge variant="outline">{elective.credits} Credits</Badge>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Semester {elective.semester} • Max {elective.max_students} students
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-4">No electives created yet</p>
          )}
        </CardContent>
      </Card>

      {/* Batches */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Batches</h2>
        {batches.length > 0 ? (
          batches.map((batch) => (
            <Card key={batch.id} className="border-slate-200" data-testid={`batch-card-${batch.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-900" />
                      {batch.batch_name}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {batch.elective_name} • Faculty: {batch.faculty_name}
                    </p>
                  </div>
                  {canEdit && (
                    <Dialog open={addStudentDialog === batch.id} onOpenChange={(open) => setAddStudentDialog(open ? batch.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" data-testid={`add-student-to-batch-${batch.id}`}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Student to {batch.batch_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                            <SelectTrigger data-testid="select-student-for-batch">
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.filter(s => !batch.student_ids.includes(s.id)).map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.student_id})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => handleAddStudent(batch.id)} 
                            className="w-full bg-blue-900 hover:bg-blue-800"
                            data-testid="confirm-add-student"
                          >
                            Add to Batch
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {batch.student_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {batch.student_ids.map((studentId) => (
                      <Badge key={studentId} variant="secondary" className="pr-1 flex items-center gap-1">
                        {getStudentName(studentId)}
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveStudent(batch.id, studentId)}
                            className="ml-1 p-0.5 rounded hover:bg-slate-300"
                            data-testid={`remove-student-${studentId}`}
                          >
                            <UserMinus className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No students assigned yet</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-slate-200">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No batches created yet</p>
              <p className="text-sm text-slate-400">Create an elective first, then create batches</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BatchesPage;
