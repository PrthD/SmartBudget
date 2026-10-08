import { NavLink, useLocation } from 'react-router';
import { Plus, Sparkles } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { LogoMark } from '@/components/common/Logo';
import { useQuickActions } from '@/features/transactions/QuickActions';
import { NAV_ITEMS, SECONDARY_NAV } from './nav';
import { UserMenu } from './UserMenu';

function NavGroup({ items, label }) {
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ to, label: text, icon: Icon, end }) => (
            <SidebarMenuItem key={to}>
              <SidebarMenuButton
                asChild
                tooltip={text}
                isActive={end ? pathname === to : pathname.startsWith(to)}
              >
                <NavLink to={to} end={end} onClick={() => setOpenMobile(false)}>
                  <Icon />
                  <span>{text}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { openTransactionForm, openSmartAdd } = useQuickActions();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/">
                <LogoMark className="size-8" />
                <span className="font-semibold tracking-tight">
                  SmartBudget
                </span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Quick add"
                  onClick={() => openTransactionForm('expense')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <Plus />
                  <span>Quick add</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Smart add" onClick={openSmartAdd}>
                  <Sparkles />
                  <span>Smart add</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavGroup items={NAV_ITEMS} label="Overview" />
        <NavGroup items={SECONDARY_NAV} label="Account" />
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
