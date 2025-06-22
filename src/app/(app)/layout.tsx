
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
  ArrowRightLeft,
  PieChart,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useStore, notify } from '@/lib/store';
import React from 'react';

const navItems = [
  { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { href: '/recruitment', label: 'Recrutement', icon: Users },
  { href: '/personnel', label: 'Gestion du Personnel', icon: Briefcase },
  { href: '/mouvement', label: 'Mouvement', icon: ArrowRightLeft },
  { href: '/reports', label: 'Rapports', icon: PieChart },
  { href: '/settings', label: 'Paramètres Généraux', icon: Settings, roles: ['superadmin', 'admin'] },
  { href: '/admin', label: 'Panneau Admin', icon: Shield, roles: ['superadmin', 'admin'] },
];

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Tableau de Bord',
  '/recruitment': 'Recrutement',
  '/personnel': 'Gestion du Personnel',
  '/mouvement': 'Mouvement',
  '/reports': 'Rapports',
  '/settings': 'Paramètres Généraux',
  '/admin': 'Panneau Admin',
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { store, isLoaded } = useStore();
  const { currentUser } = store;
  const pageTitle = pageTitles[pathname] || 'Tableau de Bord';

  React.useEffect(() => {
    // If there's no current user when data is loaded, redirect to login page.
    if (isLoaded && !currentUser) {
      router.push('/login');
    }
  }, [isLoaded, currentUser, router]);

  const handleLogout = () => {
    store.currentUser = null;
    notify();
    // The useEffect above will handle the redirect.
  };

  const accessibleNavItems = navItems.filter(item => {
    if (!item.roles) return true; // public item
    if (!currentUser) return false; // if no user, hide role-based item
    return item.roles.includes(currentUser.role);
  });

  // Show a loading screen until data is loaded from the database
  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }
  
  // Don't render anything until the redirection check has happened
  if (!currentUser) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
          <h1 className="text-2xl font-semibold tracking-tight">Gestion de Carrière</h1>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {accessibleNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton variant="outline" onClick={handleLogout}>
                <LogOut />
                <span>Déconnexion</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h2 className="text-xl font-semibold" id="currentTabTitle">
              {pageTitle}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="https://placehold.co/40x40.png"
                  alt="@user"
                  data-ai-hint="person"
                />
                <AvatarFallback>{currentUser?.name.charAt(0) ?? 'U'}</AvatarFallback>
              </Avatar>
              <span
                id="userDisplayName"
                className="text-sm font-medium hidden md:block"
              >
                {currentUser?.name ?? 'Utilisateur'}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
