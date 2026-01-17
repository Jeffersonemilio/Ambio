import { getAccessToken } from '../utils/storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function authFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    ...options.headers,
  };

  // Não adicionar Content-Type para FormData (upload de arquivo)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

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

// Profile
export async function updateProfile(data) {
  return authFetch('/api/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Avatar
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  return authFetch('/api/auth/me/avatar', {
    method: 'POST',
    body: formData,
  });
}

export async function removeAvatar() {
  return authFetch('/api/auth/me/avatar', {
    method: 'DELETE',
  });
}

// Password
export async function changePassword(currentPassword, newPassword) {
  return authFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// Preferences
export async function getPreferences() {
  return authFetch('/api/auth/me/preferences', {
    method: 'GET',
  });
}

export async function updatePreferences(preferences) {
  return authFetch('/api/auth/me/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}
