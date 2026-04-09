import React, { useState, useEffect } from 'react';
import { departmentApi, programApi, formatApiError } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Trash2, Building2, BookOpen, Clock, Layers } from 'lucide-react';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [coursesDialogOpen, setCoursesDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeptClick = async (dept) => {
    setSelectedDept(dept);
    setCoursesDialogOpen(true);
    setLoading(true);
    try {
      const response = await programApi.getAll({ department_id: dept.id });
      setPrograms(response.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await departmentApi.create(formData);
      toast.success('Department created successfully');
      setDialogOpen(false);
      setFormData({ name: '', code: '' });
      fetchDepartments();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await departmentApi.delete(id);
      toast.success('Department deleted');
      fetchDepartments();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="departments-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Departments
          </h1>
          <p className="text-slate-500">Manage academic departments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="add-department-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Department Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Computer Science & Engineering"
                  required
                  data-testid="department-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Department Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="CSE"
                  required
                  data-testid="department-code-input"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" data-testid="submit-department-btn">
                Create Department
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="departments-grid">
        {departments.map((dept) => (
          <Card 
            key={dept.id} 
            className="border-slate-200 card-hover cursor-pointer" 
            onClick={() => handleDeptClick(dept)}
            data-testid={`department-card-${dept.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <Building2 className="h-6 w-6 text-blue-900" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{dept.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase tracking-wider">
                        {dept.code}
                      </span>
                      <span className="text-xs text-slate-400">• Click to view courses</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(dept.id);
                  }}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  data-testid={`delete-department-${dept.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Courses Drill-down Dialog */}
      <Dialog open={coursesDialogOpen} onOpenChange={setCoursesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <div className="p-2 bg-blue-900 rounded-lg">
                <Layers className="h-6 w-6 text-white" />
              </div>
              {selectedDept?.name}
            </DialogTitle>
            <DialogDescription>
              Available programs and courses in this department
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {programs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {programs.map((prog) => (
                  <Card key={prog.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="p-4 pb-2">
                       <CardTitle className="text-lg text-blue-900 font-bold">{prog.name}</CardTitle>
                       <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{prog.code}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                       <div className="flex items-center gap-4 mt-3">
                         <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            {prog.duration_years} Years
                         </div>
                         <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                            {prog.total_semesters} Semesters
                         </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <BookOpen className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                No courses found for this department.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {departments.length === 0 && (
        <Card className="border-slate-200 shadow-none bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <Building2 className="h-16 w-16 mx-auto text-slate-200 mb-4" />
            <p className="text-xl font-bold text-slate-400">No departments created yet</p>
            <p className="text-slate-400 mt-1">Manage your university's vertical schools from this dashboard.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepartmentsPage;
