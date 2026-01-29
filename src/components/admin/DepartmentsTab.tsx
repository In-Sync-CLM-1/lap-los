import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean | null;
}

export function DepartmentsTab() {
  const queryClient = useQueryClient();
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Department[];
    }
  });

  const createDepartment = useMutation({
    mutationFn: async (dept: Omit<Department, 'id'>) => {
      const { error } = await supabase.from('departments').insert(dept);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-admin'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created');
      setIsCreateOpen(false);
    },
    onError: (error) => toast.error('Failed to create: ' + error.message)
  });

  const updateDepartment = useMutation({
    mutationFn: async (dept: Department) => {
      const { error } = await supabase
        .from('departments')
        .update({
          name: dept.name,
          code: dept.code,
          description: dept.description,
          is_active: dept.is_active
        })
        .eq('id', dept.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-admin'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated');
      setEditingDept(null);
    },
    onError: (error) => toast.error('Failed to update: ' + error.message)
  });

  const deleteDepartment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments-admin'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted');
    },
    onError: (error) => toast.error('Failed to delete: ' + error.message)
  });

  const DepartmentForm = ({ 
    department, 
    onSubmit, 
    onCancel, 
    isPending 
  }: { 
    department?: Department | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isPending: boolean;
  }) => (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      onSubmit({
        id: department?.id,
        name: formData.get('name') as string,
        code: formData.get('code') as string,
        description: formData.get('description') as string || null,
        is_active: formData.get('is_active') === 'on'
      });
    }}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Department Name</Label>
          <Input id="name" name="name" defaultValue={department?.name} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" defaultValue={department?.code} required placeholder="e.g., SALES" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={department?.description || ''} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="is_active" name="is_active" defaultChecked={department?.is_active ?? true} />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {department ? 'Save Changes' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Manage organizational departments</CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Department
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments?.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell><code className="text-sm">{dept.code}</code></TableCell>
                    <TableCell className="max-w-xs truncate">{dept.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={dept.is_active ? 'default' : 'secondary'}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingDept(dept)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm('Delete this department?')) {
                              deleteDepartment.mutate(dept.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Department</DialogTitle>
              <DialogDescription>Create a new organizational department</DialogDescription>
            </DialogHeader>
            <DepartmentForm 
              onSubmit={(data) => createDepartment.mutate(data)} 
              onCancel={() => setIsCreateOpen(false)}
              isPending={createDepartment.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>Update department details</DialogDescription>
            </DialogHeader>
            <DepartmentForm 
              department={editingDept}
              onSubmit={(data) => updateDepartment.mutate(data)} 
              onCancel={() => setEditingDept(null)}
              isPending={updateDepartment.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
