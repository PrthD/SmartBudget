import {
  ArrowDownRight,
  ArrowUpRight,
  LayoutDashboard,
  PiggyBank,
  Settings,
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Expenses', icon: ArrowDownRight },
  { to: '/income', label: 'Income', icon: ArrowUpRight },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
];

export const SECONDARY_NAV = [
  { to: '/settings', label: 'Settings', icon: Settings },
];
