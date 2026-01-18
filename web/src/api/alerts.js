import { fetchApi } from './client';

/**
 * Busca alertas com filtros e paginacao
 */
export function getAlerts(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.companyId) searchParams.set('companyId', params.companyId);
  if (params.sensorId) searchParams.set('sensorId', params.sensorId);
  if (params.status) searchParams.set('status', params.status);
  if (params.violationType) searchParams.set('violationType', params.violationType);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.offset) searchParams.set('offset', params.offset);

  const query = searchParams.toString();
  return fetchApi(`/api/alerts${query ? `?${query}` : ''}`);
}

/**
 * Busca um alerta pelo ID
 */
export function getAlertById(id) {
  return fetchApi(`/api/alerts/${id}`);
}

/**
 * Busca historico de notificacoes de um alerta
 */
export function getAlertNotifications(alertId) {
  return fetchApi(`/api/alerts/${alertId}/notifications`);
}

/**
 * Busca estatisticas de alertas
 */
export function getAlertStatistics(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.companyId) searchParams.set('companyId', params.companyId);
  if (params.sensorId) searchParams.set('sensorId', params.sensorId);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const query = searchParams.toString();
  return fetchApi(`/api/alerts/statistics${query ? `?${query}` : ''}`);
}
