import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, uploadAvatar, removeAvatar, changePassword } from '../api/profile';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Atualizar os dados do usuário no cache de auth
      queryClient.setQueryData(['auth', 'me'], (oldData) => {
        if (!oldData) return data;
        return { ...oldData, ...data };
      });
      // Invalidar para garantir dados frescos
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
      // Atualizar avatar no cache
      queryClient.setQueryData(['auth', 'me'], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, ...data.user };
      });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: (data) => {
      // Remover avatar do cache
      queryClient.setQueryData(['auth', 'me'], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, ...data.user };
      });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      changePassword(currentPassword, newPassword),
  });
}
