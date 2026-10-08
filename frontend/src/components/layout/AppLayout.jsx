import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { QuickActionsProvider } from '@/features/transactions/QuickActions';
import { OnboardingDialog } from '@/features/settings/OnboardingDialog';
import { AppSidebar } from './AppSidebar';
import { CommandMenu } from './CommandMenu';
import { ThemeToggle } from './ThemeToggle';

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

/** The signed-in shell: sidebar, header, global dialogs and the page. */
export function AppLayout() {
  return (
    <QuickActionsProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-[orientation=vertical]:h-4"
            />
            <div className="ml-auto flex items-center gap-2">
              <CommandMenu />
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 lg:p-8">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </SidebarInset>
        <OnboardingDialog />
      </SidebarProvider>
    </QuickActionsProvider>
  );
}
