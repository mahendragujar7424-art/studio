
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  User as UserIcon,
  Briefcase,
  UserCheck,
  X,
  History,
  CreditCard,
  Receipt,
  Send,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { ROLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ href, icon: Icon, children, active, onClick }: SidebarLinkProps) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}
  >
    <Icon className={cn("h-5 w-5", active ? "" : "group-hover:scale-110 transition-transform")} />
    <span className="font-medium">{children}</span>
  </Link>
);

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-16 w-16 bg-primary/20 rounded-3xl mx-auto flex items-center justify-center font-bold text-2xl text-primary/40">C</div>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const role = profile?.role;

  // Dynamic Navigation Configuration based on User Role
  const getNavigation = () => {
    const common = [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard }
    ];

    if (role === ROLES.ADMIN) {
      return [
        ...common,
        { name: 'User Management', href: '/dashboard/users', icon: UserCheck },
        { name: 'All Projects', href: '/dashboard/tasks', icon: CheckSquare },
        { name: 'Teams', href: '/dashboard/teams', icon: Briefcase },
        { name: 'Financials', href: '/dashboard/financials', icon: CreditCard },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ];
    }

    if (role === ROLES.DEVELOPER) {
      return [
        ...common,
        { name: 'My Tasks', href: '/dashboard/tasks', icon: CheckSquare },
        { name: 'Project Timeline', href: '/dashboard/updates', icon: History },
        { name: 'Submit Update', href: '/dashboard/updates', icon: Send },
        { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
      ];
    }

    if (role === ROLES.CLIENT) {
      return [
        ...common,
        { name: 'Project Progress', href: '/dashboard/tasks', icon: CheckSquare },
        { name: 'Activity Log', href: '/dashboard/updates', icon: History },
        { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
        { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ];
    }

    return common;
  };

  const navItems = getNavigation();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-[40] md:hidden backdrop-blur-sm transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[50] w-72 bg-white border-r transition-transform duration-300 ease-in-out md:translate-x-0 shadow-2xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20">
                C
              </div>
              <span className="text-xl font-bold tracking-tight">CloudCRM</span>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((link) => (
              <SidebarLink 
                key={link.name} 
                href={link.href} 
                icon={link.icon}
                active={pathname === link.href}
                onClick={() => setIsSidebarOpen(false)}
              >
                {link.name}
              </SidebarLink>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t">
            <div className="flex items-center gap-3 px-2 mb-6">
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/5 text-primary font-bold">
                  {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">{profile?.name || user?.email}</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{role || 'Authenticating...'}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl px-4 py-3 transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:pl-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-white/80 backdrop-blur-md px-6 border-b md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <span className="text-lg font-bold">CloudCRM</span>
        </header>

        <div className={cn(
          "p-6 md:p-10 max-w-7xl mx-auto w-full flex-1 transition-all duration-500",
          isProfileLoading ? "opacity-50 blur-[2px]" : "opacity-100 blur-0"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
