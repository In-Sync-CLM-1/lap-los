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
type ProductType = Database['public']['Enums']['product_type'];

const ROLES: AppRole[] = ['sales_manager', 'regional_head', 'zonal_head', 'ceo'];
const PRODUCTS: ProductType[] = ['business_loan', 'personal_loan', 'stpl', 'po_finance'];

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString()}`;
};

const formatProductName = (product: ProductType) => {
  const names: Record<ProductType, string> = {
    business_loan: 'Business Loan',
    personal_loan: 'Personal Loan',
    stpl: 'STPL',
    po_finance: 'PO Finance'
  };
  return names[product] || product;
};

interface ApprovalRule {
  id: string;
  product_type: ProductType;
  min_amount: number;
  max_amount: number;
  required_role: AppRole;
  approval_level: number;
  description: string | null;
  is_active: boolean | null;
}

export function ApprovalMatrixTab() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterProduct, setFilterProduct] = useState<ProductType | 'all'>('all');

  const { data: rules, isLoading } = useQuery({
    queryKey: ['approval-matrix-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_matrix')
        .select('*')
        .order('product_type')
        .order('min_amount');
      if (error) throw error;
      return data as ApprovalRule[];
    }
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<ApprovalRule, 'id'>) => {
      const { error } = await supabase.from('approval_matrix').insert(rule);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-matrix-admin'] });
      toast.success('Approval rule created');
      setIsCreateOpen(false);
    },
    onError: (error) => toast.error('Failed to create: ' + error.message)
  });

  const updateRule = useMutation({
    mutationFn: async (rule: ApprovalRule) => {
      const { error } = await supabase
        .from('approval_matrix')
        .update({
          product_type: rule.product_type,
          min_amount: rule.min_amount,
          max_amount: rule.max_amount,
          required_role: rule.required_role,
          approval_level: rule.approval_level,
          description: rule.description,
          is_active: rule.is_active
        })
        .eq('id', rule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-matrix-admin'] });
      toast.success('Approval rule updated');
      setEditingRule(null);
    },
    onError: (error) => toast.error('Failed to update: ' + error.message)
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('approval_matrix').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-matrix-admin'] });
      toast.success('Approval rule deleted');
    },
    onError: (error) => toast.error('Failed to delete: ' + error.message)
  });

  const RuleForm = ({ 
    rule, 
    onSubmit, 
    onCancel, 
    isPending 
  }: { 
    rule?: ApprovalRule | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isPending: boolean;
  }) => {
    const [selectedProduct, setSelectedProduct] = useState<ProductType>(rule?.product_type || 'business_loan');
    const [selectedRole, setSelectedRole] = useState<AppRole>(rule?.required_role || 'sales_manager');
    
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          id: rule?.id,
          product_type: selectedProduct,
          min_amount: parseFloat(formData.get('min_amount') as string) || 0,
          max_amount: parseFloat(formData.get('max_amount') as string) || 0,
          required_role: selectedRole,
          approval_level: parseInt(formData.get('approval_level') as string) || 1,
          description: formData.get('description') as string || null,
          is_active: formData.get('is_active') === 'on'
        });
      }}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Product Type</Label>
              <Select value={selectedProduct} onValueChange={(v) => setSelectedProduct(v as ProductType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map(product => (
                    <SelectItem key={product} value={product}>
                      {formatProductName(product)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Required Role</Label>
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
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min_amount">Min Amount (₹)</Label>
              <Input 
                id="min_amount" 
                name="min_amount" 
                type="number" 
                min="0"
                defaultValue={rule?.min_amount || 0} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_amount">Max Amount (₹)</Label>
              <Input 
                id="max_amount" 
                name="max_amount" 
                type="number" 
                min="0"
                defaultValue={rule?.max_amount || 0} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="approval_level">Approval Level</Label>
              <Input 
                id="approval_level" 
                name="approval_level" 
                type="number" 
                min="1" 
                max="5" 
                defaultValue={rule?.approval_level || 1} 
                required 
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={rule?.description || ''} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="is_active" name="is_active" defaultChecked={rule?.is_active ?? true} />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {rule ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const filteredRules = rules?.filter(r => 
    filterProduct === 'all' || r.product_type === filterProduct
  );

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'ceo': return 'destructive';
      case 'zonal_head': return 'default';
      case 'regional_head': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Approval Matrix</CardTitle>
            <CardDescription>Configure approval thresholds by product and amount</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterProduct} onValueChange={(v) => setFilterProduct(v as ProductType | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {PRODUCTS.map(product => (
                  <SelectItem key={product} value={product}>
                    {formatProductName(product)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Rule
            </Button>
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
                  <TableHead>Product</TableHead>
                  <TableHead>Amount Range</TableHead>
                  <TableHead>Required Role</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules?.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Badge variant="outline">{formatProductName(rule.product_type)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCurrency(rule.min_amount)} - {formatCurrency(rule.max_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(rule.required_role)}>
                        {rule.required_role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{rule.approval_level}</TableCell>
                    <TableCell className="max-w-xs truncate">{rule.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm('Delete this approval rule?')) {
                              deleteRule.mutate(rule.id);
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
              <DialogTitle>Add Approval Rule</DialogTitle>
              <DialogDescription>Define a new approval threshold for a product type</DialogDescription>
            </DialogHeader>
            <RuleForm 
              onSubmit={(data) => createRule.mutate(data)} 
              onCancel={() => setIsCreateOpen(false)}
              isPending={createRule.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Approval Rule</DialogTitle>
              <DialogDescription>Update approval threshold configuration</DialogDescription>
            </DialogHeader>
            <RuleForm 
              rule={editingRule}
              onSubmit={(data) => updateRule.mutate(data)} 
              onCancel={() => setEditingRule(null)}
              isPending={updateRule.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
