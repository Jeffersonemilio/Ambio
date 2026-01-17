import { getAccessToken } from '../utils/storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function authFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || `API error: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// My Company
export async function getMyCompany() {
  return authFetch('/api/companies/my-company', {
    method: 'GET',
  });
}

export async function updateMyCompany(data) {
  return authFetch('/api/companies/my-company', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// My Company Users
export async function getMyCompanyUsers(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.offset) searchParams.set('offset', params.offset);

  const query = searchParams.toString();
  return authFetch(`/api/companies/my-company/users${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

export async function createMyCompanyUser(data) {
  return authFetch('/api/companies/my-company/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMyCompanyUser(userId, data) {
  return authFetch(`/api/companies/my-company/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
