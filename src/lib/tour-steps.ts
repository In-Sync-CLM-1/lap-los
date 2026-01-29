import type { AppRole } from '@/types/database';

export interface TourStep {
  id: string;
  target: string; // data-tour attribute value
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  roles?: AppRole[]; // If undefined, shown to all
  route?: string; // Navigate to this route for this step
}

export const tourSteps: TourStep[] = [
  {
    id: 'dashboard-stats',
    target: 'dashboard-stats',
    title: 'Your Dashboard',
    description: 'This is your command center. See your leads, pending actions, and key metrics at a glance.',
    placement: 'bottom',
    route: '/dashboard',
  },
  {
    id: 'new-lead-button',
    target: 'new-lead-button',
    title: 'Create a New Lead',
    description: 'Click here to capture a new customer lead. You can add customer details, business information, and loan requirements.',
    placement: 'bottom',
  },
  {
    id: 'nav-leads',
    target: 'nav-leads',
    title: 'Leads Management',
    description: 'View and manage all your leads here. Use filters to find specific leads quickly.',
    placement: 'right',
  },
  {
    id: 'nav-applications',
    target: 'nav-applications',
    title: 'Applications Tracking',
    description: 'Track loan applications from submission through approval and disbursal.',
    placement: 'right',
  },
  {
    id: 'nav-underwriting',
    target: 'nav-underwriting',
    title: 'Underwriting Queue',
    description: 'Review and process applications assigned to you. Run BRE checks and prepare CAM sheets.',
    placement: 'right',
    roles: ['credit_officer', 'sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'],
  },
  {
    id: 'nav-approvals',
    target: 'nav-approvals',
    title: 'Approvals Queue',
    description: 'Approve or reject applications that need your attention. Handle deviations and counter-offers.',
    placement: 'right',
    roles: ['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'],
  },
  {
    id: 'nav-analytics',
    target: 'nav-analytics',
    title: 'Analytics Dashboard',
    description: 'View performance metrics, conversion rates, and business insights.',
    placement: 'right',
    roles: ['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'],
  },
  {
    id: 'nav-user-management',
    target: 'nav-user-management',
    title: 'User Management',
    description: 'Manage users, departments, designations, and approval matrix settings.',
    placement: 'right',
    roles: ['admin'],
  },
  {
    id: 'user-menu',
    target: 'user-menu',
    title: 'Your Profile',
    description: 'Access your profile settings, preferences, and sign out from here.',
    placement: 'bottom',
  },
];

export function getStepsForRole(roles: AppRole[]): TourStep[] {
  return tourSteps.filter(step => {
    if (!step.roles) return true;
    return step.roles.some(role => roles.includes(role));
  });
}

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  ro: 'As a Relationship Officer, you can capture and manage customer leads, upload documents, and track applications.',
  credit_officer: 'As a Credit Officer, you can process applications, run credit checks, and prepare CAM sheets for approval.',
  sales_manager: 'As a Sales Manager, you can approve applications within your limit, view analytics, and manage your team\'s performance.',
  regional_head: 'As a Regional Head, you can approve higher-value applications, view regional analytics, and oversee operations.',
  zonal_head: 'As a Zonal Head, you have approval authority for large loans and oversight of multiple regions.',
  ceo: 'As CEO, you have the highest approval authority and full visibility into all operations.',
  admin: 'As an Administrator, you can manage users, configure the system, and access all features.',
};
