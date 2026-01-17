import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyCompany,
  updateMyCompany,
  getMyCompanyUsers,
  createMyCompanyUser,
  updateMyCompanyUser,
} from '../api/myCompany';

// Hook para obter dados da empresa
export function useMyCompany() {
  return useQuery({
    queryKey: ['myCompany'],
    queryFn: getMyCompany,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para atualizar dados da empresa
export function useUpdateMyCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCompany'] });
    },
  });
}

// Hook para listar usuários da empresa
export function useMyCompanyUsers(params = {}) {
  return useQuery({
    queryKey: ['myCompanyUsers', params],
    queryFn: () => getMyCompanyUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para criar usuário na empresa
export function useCreateMyCompanyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMyCompanyUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCompanyUsers'] });
    },
  });
}

// Hook para atualizar usuário da empresa
export function useUpdateMyCompanyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }) => updateMyCompanyUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCompanyUsers'] });
    },
  });
}
