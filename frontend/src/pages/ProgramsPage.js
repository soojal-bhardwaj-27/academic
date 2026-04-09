import React, { useState, useEffect } from 'react';
import { programApi, departmentApi, formatApiError } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Trash2, Layers } from 'lucide-react';

const ProgramsPage = () => {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
    duration_years: 4,
    total_semesters: 8
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [programsRes, deptsRes] = await Promise.all([
        programApi.getAll(),
        departmentApi.getAll()
      ]);
      setPrograms(programsRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await programApi.create({
        ...formData,
        duration_years: parseInt(formData.duration_years),
        total_semesters: parseInt(formData.total_semesters)
      });
      toast.success('Program created successfully');
      setDialogOpen(false);
      setFormData({
        name: '',
        code: '',
        department_id: '',
        duration_years: 4,
        total_semesters: 8
      });
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;
    try {
      await programApi.delete(id);
      toast.success('Program deleted');
      fetchData();
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
    <div className="space-y-6 animate-fadeIn" data-testid="programs-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Programs
          </h1>
          <p className="text-slate-500">Manage academic programs (B.Tech, MBA, etc.)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="add-program-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Program</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Program Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Bachelor of Technology"
                  required
                  data-testid="program-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Program Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="BTECH"
                  required
                  data-testid="program-code-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={formData.department_id} onValueChange={(v) => setFormData({ ...formData, department_id: v })}>
                  <SelectTrigger data-testid="department-select">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (Years)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.duration_years}
                    onChange={(e) => setFormData({ ...formData, duration_years: e.target.value })}
                    data-testid="duration-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Semesters</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.total_semesters}
                    onChange={(e) => setFormData({ ...formData, total_semesters: e.target.value })}
                    data-testid="semesters-input"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" data-testid="submit-program-btn">
                Create Program
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Programs Table */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-900" />
            Programs ({programs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {programs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Program Name</TableHead>
                    <TableHead className="font-semibold">Department</TableHead>
                    <TableHead className="font-semibold">Duration</TableHead>
                    <TableHead className="font-semibold">Semesters</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id} className="hover:bg-slate-50" data-testid={`program-row-${program.id}`}>
                      <TableCell className="font-medium text-blue-900">{program.code}</TableCell>
                      <TableCell>{program.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">
                          {program.department_name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{program.duration_years} Years</TableCell>
                      <TableCell>{program.total_semesters} Semesters</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(program.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-program-${program.id}`}
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
              <Layers className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No programs created yet</p>
              <p className="text-sm text-slate-400">Create a department first, then add programs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramsPage;
