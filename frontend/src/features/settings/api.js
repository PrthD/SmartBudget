import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { invalidateFinancialData, keys, queryClient } from '@/lib/queryClient';

const setUser = (user) => queryClient.setQueryData(keys.me, user);

export function useUpdateProfile({ successMessage = 'Settings saved' } = {}) {
  return useMutation({
    mutationFn: (values) => api.patch('/users/me', values),
    onSuccess: (user, values) => {
      setUser(user);
      if (successMessage) toast.success(successMessage);
      // Time zone/currency change how every figure is computed and shown.
      if (values.preferences) {
        invalidateFinancialData();
        queryClient.invalidateQueries({ queryKey: keys.insights });
        queryClient.invalidateQueries({ queryKey: ['ai-status'] });
      }
    },
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: (values) => api.put('/users/me/email', values),
    onSuccess: (user) => {
      setUser(user);
      toast.success('Email updated');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (values) => api.put('/auth/password', values),
    onSuccess: () =>
      toast.success('Password changed. Other devices were signed out.'),
  });
}

export function useAvatar() {
  return useMutation({
    mutationFn: (dataUrl) =>
      dataUrl
        ? api.put('/users/me/avatar', { dataUrl })
        : api.delete('/users/me/avatar'),
    onSuccess: (user, dataUrl) => {
      setUser(user);
      toast.success(dataUrl ? 'Photo updated' : 'Photo removed');
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password) => api.delete('/users/me', { password }),
  });
}

export const exportData = () => api.get('/users/me/export');
