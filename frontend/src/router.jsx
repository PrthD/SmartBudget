import { createBrowserRouter, Navigate } from 'react-router';
import { RouteError } from '@/components/common/RouteError';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { GuestOnly, RequireAuth } from '@/features/auth/guards';

// Each page is its own chunk, loaded on first visit.
const page = (load, name) => async () => ({ Component: (await load())[name] });

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: '/login',
                lazy: page(
                  () => import('@/features/auth/AuthForm'),
                  'LoginPage'
                ),
              },
              {
                path: '/signup',
                lazy: page(
                  () => import('@/features/auth/AuthForm'),
                  'RegisterPage'
                ),
              },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            // The signed-in shell (and its dialogs/forms) loads after sign-in.
            lazy: page(
              () => import('@/components/layout/AppLayout'),
              'AppLayout'
            ),
            children: [
              {
                index: true,
                lazy: page(
                  () => import('@/features/dashboard/DashboardPage'),
                  'DashboardPage'
                ),
              },
              {
                path: '/expenses',
                lazy: page(
                  () => import('@/features/transactions/TransactionsPage'),
                  'ExpensesPage'
                ),
              },
              {
                path: '/income',
                lazy: page(
                  () => import('@/features/transactions/TransactionsPage'),
                  'IncomePage'
                ),
              },
              {
                path: '/savings',
                lazy: page(
                  () => import('@/features/savings/SavingsPage'),
                  'SavingsPage'
                ),
              },
              {
                path: '/settings',
                lazy: page(
                  () => import('@/features/settings/SettingsPage'),
                  'SettingsPage'
                ),
              },
              // v1 URLs keep working.
              {
                path: '/expense',
                element: <Navigate to="/expenses" replace />,
              },
              {
                path: '/profile',
                element: <Navigate to="/settings" replace />,
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
