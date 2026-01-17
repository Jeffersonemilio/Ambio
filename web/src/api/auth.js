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

export async function login(email, password) {
  return authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function refresh(refreshToken) {
  return authFetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logout(refreshToken) {
  return authFetch('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getMe() {
  return authFetch('/api/auth/me', {
    method: 'GET',
  });
}

export async function forgotPassword(email) {
  return authFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token, newPassword) {
  return authFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}
