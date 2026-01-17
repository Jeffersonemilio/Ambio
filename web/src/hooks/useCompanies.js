import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyUsers,
  getCompanySensors,
} from '../api/companies';

export function useCompanies(params = {}) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => getCompanies(params),
  });
}

export function useCompany(id) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => getCompany(id),
    enabled: !!id,
  });
}

export function useCompanyUsers(companyId, params = {}) {
  return useQuery({
    queryKey: ['companies', companyId, 'users', params],
    queryFn: () => getCompanyUsers(companyId, params),
    enabled: !!companyId,
  });
}

export function useCompanySensors(companyId, params = {}) {
  return useQuery({
    queryKey: ['companies', companyId, 'sensors', params],
    queryFn: () => getCompanySensors(companyId, params),
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateCompany(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', id] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
