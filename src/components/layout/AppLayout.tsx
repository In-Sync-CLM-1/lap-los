import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu,
  Plus,
  Bell,
  ChevronRight,
  ClipboardList,
  UserCheck,
  UserCog,
  Link2,
  Copy,
  ExternalLink,
  Check,
  FileBarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/types/database';
import { NetworkStatus } from './NetworkStatus';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { generateReferralUrl } from '@/lib/referral-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import loanSyncLogo from '@/assets/loan-sync-logo.png';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  tourId?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, tourId: 'nav-dashboard' },
  { label: 'Leads', href: '/leads', icon: Users, tourId: 'nav-leads' },
  { label: 'Applications', href: '/applications', icon: FileText, tourId: 'nav-applications' },
  { label: 'Underwriting', href: '/underwriting', icon: ClipboardList, roles: ['credit_officer', 'sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'], tourId: 'nav-underwriting' },
  { label: 'Approvals', href: '/approvals', icon: UserCheck, roles: ['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'], tourId: 'nav-approvals' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'], tourId: 'nav-analytics' },
  { label: 'Reports', href: '/reports', icon: FileBarChart2, roles: ['sales_manager', 'regional_head', 'zonal_head', 'ceo', 'admin'], tourId: 'nav-reports' },
  { label: 'User Management', href: '/admin/users', icon: UserCog, roles: ['admin'], tourId: 'nav-user-management' },
];

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user, profile, primaryRole, signOut, hasRole, isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch referral code
  useEffect(() => {
    const fetchReferralCode = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();
      
      if (data?.referral_code) {
        setReferralCode(data.referral_code);
      }
    };

    fetchReferralCode();
  }, [user?.id]);

  const referralUrl = referralCode ? generateReferralUrl(referralCode) : '';

  const handleCopyLink = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role as any));
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-2">
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
        
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setIsSidebarOpen(false)}
            data-tour={item.tourId}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all touch-target',
              isActive 
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
            {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden lg:flex h-screen w-64 flex-col gradient-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="flex items-center justify-center px-4 py-5 border-b border-sidebar-border">
          <img 
            src={loanSyncLogo} 
            alt="Loan-Sync" 
            className="h-12 object-contain"
          />
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <NavContent />
        </div>
        
        {/* User Profile */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-sidebar-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {profile ? getInitials(profile.full_name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {primaryRole ? ROLE_LABELS[primaryRole] : 'No Role'}
              </p>
            </div>
          </div>
          
          {/* Referral Link Button */}
          {referralCode && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-3 gap-2 text-sidebar-foreground hover:bg-sidebar-accent">
                  <Link2 className="w-4 h-4" />
                  My Referral Link
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="top" align="start">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Share Your Referral Link</h4>
                  <div className="flex gap-2">
                    <Input 
                      value={referralUrl} 
                      readOnly 
                      className="text-xs h-9"
                    />
                    <Button 
                      size="icon" 
                      variant="outline"
                      className="h-9 w-9 shrink-0"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => window.open(referralUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => navigate('/settings')}
                    >
                      View QR Code
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Mobile Menu Button */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="touch-target">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 gradient-sidebar border-sidebar-border">
                <div className="flex items-center justify-center px-4 py-5 border-b border-sidebar-border">
                  <img 
                    src={loanSyncLogo} 
                    alt="Loan-Sync" 
                    className="h-12 object-contain"
                  />
                </div>
                <div className="py-4">
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Page Title - Hidden on mobile, could show breadcrumb */}
            <div className="hidden lg:block" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Add Lead Button */}
              <Button 
                size="sm" 
                className="gap-2"
                onClick={() => navigate('/leads/new')}
                data-tour="new-lead-button"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Lead</span>
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative touch-target">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2" data-tour="user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {profile ? getInitials(profile.full_name) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                      {profile?.full_name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{profile?.full_name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {primaryRole ? ROLE_LABELS[primaryRole] : 'No Role'}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 safe-area-inset">
          <Outlet />
        </main>
        
        {/* Network Status Indicator */}
        <NetworkStatus />
        
        {/* PWA Install Banner */}
        <PWAInstallBanner />
        
        {/* Onboarding Tour */}
        <OnboardingTour />
      </div>
    </div>
  );
}
