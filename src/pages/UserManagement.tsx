import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTab } from '@/components/admin/UsersTab';
import { DepartmentsTab } from '@/components/admin/DepartmentsTab';
import { DesignationsTab } from '@/components/admin/DesignationsTab';
import { ApprovalMatrixTab } from '@/components/admin/ApprovalMatrixTab';
import { Users, Building2, Briefcase, GitBranch } from 'lucide-react';

export function UserManagement() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, departments, designations, and approval workflows
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="designations" className="gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Designations</span>
          </TabsTrigger>
          <TabsTrigger value="approval-matrix" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Approval Matrix</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>

        <TabsContent value="designations">
          <DesignationsTab />
        </TabsContent>

        <TabsContent value="approval-matrix">
          <ApprovalMatrixTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
