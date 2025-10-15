import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Calendar,
  Settings,
  LogOut,
  Building2,
  UserCircle,
  ChevronUp,
  CheckSquare,
  Target,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ProfileModal } from '@/components/ProfileModal';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'operacional'],
  },
  {
    title: 'Meu Dia',
    url: '/my-day',
    icon: Target,
    roles: ['admin', 'operacional'],
  },
  {
    title: 'Projetos',
    url: '/projects',
    icon: FolderOpen,
    roles: ['admin', 'operacional'],
  },
  {
    title: 'Tarefas',
    url: '/tasks',
    icon: CheckSquare,
    roles: ['admin', 'operacional'],
  },
  {
    title: 'Timeline',
    url: '/timeline',
    icon: BarChart3,
    roles: ['admin', 'operacional'],
  },
  {
    title: 'Reuniões',
    url: '/meetings',
    icon: Calendar,
    roles: ['admin', 'operacional'],
  },
  {
    title: 'Clientes',
    url: '/clients',
    icon: Users,
    roles: ['admin', 'operacional'],
  },
  {
    title: 'Configurações',
    url: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
];

export function AppSidebar() {
  const { profile, signOut } = useAuth();

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-accent text-accent-foreground font-medium'
      : 'hover:bg-accent/50';

  const filteredItems = navigationItems.filter(item =>
    item.roles.includes(profile?.role || 'operacional')
  );

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Gestão de Projetos</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {profile?.nome?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium">{profile?.nome || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'operacional'}</p>
                </div>
              </div>
              <ChevronUp className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-56">
            <ProfileModal>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <UserCircle className="h-4 w-4 mr-2" />
                Ver Perfil
              </DropdownMenuItem>
            </ProfileModal>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}