import { useQuery } from '@tanstack/react-query';
import {
  getAlerts,
  getAlertById,
  getAlertNotifications,
  getAlertStatistics,
} from '../api/alerts';

/**
 * Hook para listar alertas com filtros e paginacao
 */
export function useAlerts(params = {}) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => getAlerts(params),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}

/**
 * Hook para alertas ativos (atalho comum)
 */
export function useActiveAlerts(params = {}) {
  return useAlerts({ ...params, status: 'active' });
}

/**
 * Hook para buscar um alerta especifico
 */
export function useAlert(id) {
  return useQuery({
    queryKey: ['alert', id],
    queryFn: () => getAlertById(id),
    enabled: !!id,
  });
}

/**
 * Hook para historico de notificacoes de um alerta
 */
export function useAlertNotifications(alertId) {
  return useQuery({
    queryKey: ['alert-notifications', alertId],
    queryFn: () => getAlertNotifications(alertId),
    enabled: !!alertId,
  });
}

/**
 * Hook para estatisticas de alertas
 */
export function useAlertStatistics(params = {}) {
  return useQuery({
    queryKey: ['alert-statistics', params],
    queryFn: () => getAlertStatistics(params),
  });
}
