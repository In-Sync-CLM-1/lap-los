import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Search, Edit, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithDetails {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone: string | null;
  employee_id: string | null;
  is_active: boolean | null;
  branch_code: string | null;
  region: string | null;
  zone: string | null;
  department_id: string | null;
  designation_id: string | null;
  department?: { name: string } | null;
  designation?: { name: string; mapped_role: AppRole } | null;
  role?: AppRole;
}

export function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch users with their departments and designations
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(name),
          designation:designations(name, mapped_role)
        `)
        .order('full_name');

      if (error) throw error;

      // Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      return profiles.map(p => ({
        ...p,
        role: roleMap.get(p.user_id)
      })) as UserWithDetails[];
    }
  });

  // Fetch departments and designations for dropdowns
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: designations } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .eq('is_active', true)
        .order('level');
      if (error) throw error;
      return data;
    }
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async (userData: {
      id: string;
      user_id: string;
      full_name: string;
      phone: string | null;
      employee_id: string | null;
      is_active: boolean;
      branch_code: string | null;
      region: string | null;
      zone: string | null;
      department_id: string | null;
      designation_id: string | null;
    }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          phone: userData.phone,
          employee_id: userData.employee_id,
          is_active: userData.is_active,
          branch_code: userData.branch_code,
          region: userData.region,
          zone: userData.zone,
          department_id: userData.department_id,
          designation_id: userData.designation_id
        })
        .eq('id', userData.id);

      if (profileError) throw profileError;

      // Get the mapped role from designation
      if (userData.designation_id) {
        const designation = designations?.find(d => d.id === userData.designation_id);
        if (designation) {
          // Update or insert role
          const { error: roleError } = await supabase
            .from('user_roles')
            .upsert({
              user_id: userData.user_id,
              role: designation.mapped_role
            }, {
              onConflict: 'user_id,role'
            });
          
          // Delete old roles if different
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userData.user_id)
            .neq('role', designation.mapped_role);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated successfully');
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    }
  });

  // Toggle user active status
  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    }
  });

  const filteredUsers = users?.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const getRoleBadgeVariant = (role?: AppRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'ceo':
      case 'zonal_head':
      case 'regional_head': return 'default';
      case 'sales_manager':
      case 'credit_officer': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage system users and their access</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.employee_id || '-'}</TableCell>
                    <TableCell>{user.department?.name || '-'}</TableCell>
                    <TableCell>{user.designation?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role?.replace('_', ' ') || 'No role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleUserStatus.mutate({
                            id: user.id,
                            is_active: !user.is_active
                          })}
                        >
                          {user.is_active ? (
                            <UserX className="h-4 w-4 text-destructive" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user details and access permissions
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateUser.mutate({
                  id: editingUser.id,
                  user_id: editingUser.user_id,
                  full_name: formData.get('full_name') as string,
                  phone: formData.get('phone') as string || null,
                  employee_id: formData.get('employee_id') as string || null,
                  is_active: formData.get('is_active') === 'on',
                  branch_code: formData.get('branch_code') as string || null,
                  region: formData.get('region') as string || null,
                  zone: formData.get('zone') as string || null,
                  department_id: formData.get('department_id') as string || null,
                  designation_id: formData.get('designation_id') as string || null
                });
              }}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      defaultValue={editingUser.full_name}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        name="employee_id"
                        defaultValue={editingUser.employee_id || ''}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={editingUser.phone || ''}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="department_id">Department</Label>
                      <Select name="department_id" defaultValue={editingUser.department_id || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="designation_id">Designation</Label>
                      <Select name="designation_id" defaultValue={editingUser.designation_id || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          {designations?.map(desig => (
                            <SelectItem key={desig.id} value={desig.id}>
                              {desig.name} ({desig.mapped_role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="branch_code">Branch Code</Label>
                      <Input
                        id="branch_code"
                        name="branch_code"
                        defaultValue={editingUser.branch_code || ''}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        name="region"
                        defaultValue={editingUser.region || ''}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="zone">Zone</Label>
                      <Input
                        id="zone"
                        name="zone"
                        defaultValue={editingUser.zone || ''}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      name="is_active"
                      defaultChecked={editingUser.is_active ?? true}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateUser.isPending}>
                    {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
