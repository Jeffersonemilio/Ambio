import { fetchApi } from './client';

export function getUsers(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.userType) searchParams.set('userType', params.userType);
  if (params.companyId) searchParams.set('companyId', params.companyId);
  if (params.role) searchParams.set('role', params.role);
  if (params.isActive !== undefined) searchParams.set('isActive', params.isActive);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.offset) searchParams.set('offset', params.offset);

  const query = searchParams.toString();
  return fetchApi(`/api/users${query ? `?${query}` : ''}`);
}

export function getUser(id) {
  return fetchApi(`/api/users/${id}`);
}

export function createUser(data) {
  return fetchApi('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUser(id, data) {
  return fetchApi(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteUser(id) {
  return fetchApi(`/api/users/${id}`, {
    method: 'DELETE',
  });
}
