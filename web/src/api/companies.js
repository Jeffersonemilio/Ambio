import { fetchApi } from './client';

export function getCompanies(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.isActive !== undefined) searchParams.set('isActive', params.isActive);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.offset) searchParams.set('offset', params.offset);

  const query = searchParams.toString();
  return fetchApi(`/api/companies${query ? `?${query}` : ''}`);
}

export function getCompany(id) {
  return fetchApi(`/api/companies/${id}`);
}

export function createCompany(data) {
  return fetchApi('/api/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateCompany(id, data) {
  return fetchApi(`/api/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteCompany(id) {
  return fetchApi(`/api/companies/${id}`, {
    method: 'DELETE',
  });
}

export function getCompanyUsers(companyId, params = {}) {
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.set('limit', params.limit);
  if (params.offset) searchParams.set('offset', params.offset);

  const query = searchParams.toString();
  return fetchApi(`/api/companies/${companyId}/users${query ? `?${query}` : ''}`);
}

export function getCompanySensors(companyId, params = {}) {
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.set('limit', params.limit);
  if (params.offset) searchParams.set('offset', params.offset);

  const query = searchParams.toString();
  return fetchApi(`/api/sensors?companyId=${companyId}${query ? `&${query}` : ''}`);
}
