import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const ROLES: AppRole[] = ['ro', 'credit_officer', 'sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'];

interface Designation {
  id: string;
  name: string;
  code: string;
  mapped_role: AppRole;
  level: number;
  description: string | null;
  is_active: boolean | null;
}

export function DesignationsTab() {
  const queryClient = useQueryClient();
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: designations, isLoading } = useQuery({
    queryKey: ['designations-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .order('level');
      if (error) throw error;
      return data as Designation[];
    }
  });

  const createDesignation = useMutation({
    mutationFn: async (desig: Omit<Designation, 'id'>) => {
      const { error } = await supabase.from('designations').insert(desig);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Designation created');
      setIsCreateOpen(false);
    },
    onError: (error) => toast.error('Failed to create: ' + error.message)
  });

  const updateDesignation = useMutation({
    mutationFn: async (desig: Designation) => {
      const { error } = await supabase
        .from('designations')
        .update({
          name: desig.name,
          code: desig.code,
          mapped_role: desig.mapped_role,
          level: desig.level,
          description: desig.description,
          is_active: desig.is_active
        })
        .eq('id', desig.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Designation updated');
      setEditingDesig(null);
    },
    onError: (error) => toast.error('Failed to update: ' + error.message)
  });

  const deleteDesignation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('designations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations-admin'] });
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast.success('Designation deleted');
    },
    onError: (error) => toast.error('Failed to delete: ' + error.message)
  });

  const DesignationForm = ({ 
    designation, 
    onSubmit, 
    onCancel, 
    isPending 
  }: { 
    designation?: Designation | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isPending: boolean;
  }) => {
    const [selectedRole, setSelectedRole] = useState<AppRole>(designation?.mapped_role || 'ro');
    
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          id: designation?.id,
          name: formData.get('name') as string,
          code: formData.get('code') as string,
          mapped_role: selectedRole,
          level: parseInt(formData.get('level') as string) || 1,
          description: formData.get('description') as string || null,
          is_active: formData.get('is_active') === 'on'
        });
      }}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Designation Name</Label>
              <Input id="name" name="name" defaultValue={designation?.name} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" defaultValue={designation?.code} required placeholder="e.g., SM" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Mapped Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="level">Hierarchy Level</Label>
              <Input 
                id="level" 
                name="level" 
                type="number" 
                min="1" 
                max="10" 
                defaultValue={designation?.level || 1} 
                required 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={designation?.description || ''} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="is_active" name="is_active" defaultChecked={designation?.is_active ?? true} />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {designation ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const getRoleBadgeVariant = (role: AppRole) => {
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Designations</CardTitle>
            <CardDescription>Manage job titles and their role mappings</CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Designation
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
                  <TableHead>Mapped Role</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designations?.map((desig) => (
                  <TableRow key={desig.id}>
                    <TableCell className="font-medium">{desig.name}</TableCell>
                    <TableCell><code className="text-sm">{desig.code}</code></TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(desig.mapped_role)}>
                        {desig.mapped_role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{desig.level}</TableCell>
                    <TableCell>
                      <Badge variant={desig.is_active ? 'default' : 'secondary'}>
                        {desig.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingDesig(desig)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm('Delete this designation?')) {
                              deleteDesignation.mutate(desig.id);
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
              <DialogTitle>Add Designation</DialogTitle>
              <DialogDescription>Create a new job designation mapped to a system role</DialogDescription>
            </DialogHeader>
            <DesignationForm 
              onSubmit={(data) => createDesignation.mutate(data)} 
              onCancel={() => setIsCreateOpen(false)}
              isPending={createDesignation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingDesig} onOpenChange={(open) => !open && setEditingDesig(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Designation</DialogTitle>
              <DialogDescription>Update designation details and role mapping</DialogDescription>
            </DialogHeader>
            <DesignationForm 
              designation={editingDesig}
              onSubmit={(data) => updateDesignation.mutate(data)} 
              onCancel={() => setEditingDesig(null)}
              isPending={updateDesignation.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
