import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ConfirmProvider } from '@/components/common/ConfirmDialog';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { queryClient } from '@/lib/queryClient';
import { router } from './router';

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider delayDuration={300}>
            <ConfirmProvider>
              <RouterProvider router={router} />
              <Toaster richColors closeButton position="bottom-right" />
            </ConfirmProvider>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
