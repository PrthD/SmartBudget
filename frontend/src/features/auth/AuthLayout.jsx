import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { BarChart3, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

const HIGHLIGHTS = [
  {
    icon: BarChart3,
    title: 'See where it goes',
    text: 'Budgets, recurring bills and cash flow in one view.',
  },
  {
    icon: Sparkles,
    title: 'Insights that help',
    text: 'Plain-language briefings and natural-language entry.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    text: 'Your data stays yours — export or delete it any time.',
  },
];

// While the user types their credentials, fetch the signed-in app in the
// background so the post-login transition is instant.
const prefetchApp = () => {
  import('@/components/layout/AppLayout');
  import('@/features/dashboard/DashboardPage');
};

export function AuthLayout() {
  useEffect(() => {
    const id =
      'requestIdleCallback' in window
        ? requestIdleCallback(prefetchApp)
        : setTimeout(prefetchApp, 1500);
    return () =>
      'cancelIdleCallback' in window
        ? cancelIdleCallback(id)
        : clearTimeout(id);
  }, []);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col p-6 md:p-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </div>
      <div className="bg-primary text-primary-foreground relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center lg:p-14">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-black/10 blur-3xl" />
        <div className="relative max-w-md space-y-10">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            Budgeting that keeps up with your life.
          </h2>
          <ul className="space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-primary-foreground/75 text-sm">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
