import React, { useState, useEffect } from 'react';
import { userApi, departmentApi, formatApiError } from '../services/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Settings, Search, Edit } from 'lucide-react';
import { authApi } from '../services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'faculty',
    department_id: ''
  });

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'bg-red-100 text-red-800' },
    { value: 'dean', label: 'Dean', color: 'bg-purple-100 text-purple-800' },
    { value: 'dean_academics', label: 'Dean Academics', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'faculty', label: 'Faculty', color: 'bg-blue-100 text-blue-800' },
    { value: 'staff', label: 'Staff', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'student', label: 'Student', color: 'bg-slate-100 text-slate-800' }
  ];

  useEffect(() => {
    fetchData();
  }, [filterRole]);

  const fetchData = async () => {
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      
      const [usersRes, deptsRes] = await Promise.all([
        userApi.getAll(params),
        departmentApi.getAll()
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole) return;
    try {
      await userApi.updateRole(editingUser.id, newRole);
      toast.success('Role updated successfully');
      setEditingUser(null);
      setNewRole('');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await authApi.register(newUser);
      toast.success('User created successfully');
      setCreateDialogOpen(false);
      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'faculty',
        department_id: ''
      });
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    return (
      <Badge className={`${roleConfig?.color || 'bg-slate-100 text-slate-800'} hover:opacity-80`}>
        {roleConfig?.label || role}
      </Badge>
    );
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="users-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            User Management
          </h1>
          <p className="text-slate-500">Manage user accounts and roles</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-900 hover:bg-blue-800" data-testid="create-user-btn">
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  data-testid="new-user-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@raffles.edu.in"
                  required
                  data-testid="new-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  data-testid="new-user-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger data-testid="new-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department (Optional)</Label>
                <Select value={newUser.department_id || 'none'} onValueChange={(v) => setNewUser({ ...newUser, department_id: v === 'none' ? null : v })}>
                  <SelectTrigger data-testid="new-user-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" data-testid="submit-new-user">
                Create User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-users"
              />
            </div>
            <Select value={filterRole || "all"} onValueChange={(v) => setFilterRole(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-48" data-testid="filter-role">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-900" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50" data-testid={`user-row-${user.id}`}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-slate-500">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => {
                        if (open) {
                          setEditingUser(user);
                          setNewRole(user.role);
                        } else {
                          setEditingUser(null);
                          setNewRole('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid={`edit-user-${user.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User Role</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <p className="text-sm text-slate-500">User</p>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                            <div className="space-y-2">
                              <Label>New Role</Label>
                              <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger data-testid="edit-role-select">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={handleUpdateRole} className="w-full bg-blue-900 hover:bg-blue-800" data-testid="confirm-role-update">
                              Update Role
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
