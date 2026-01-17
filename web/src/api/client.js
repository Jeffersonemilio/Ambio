import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from '../utils/storage';
import { refresh } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers = [];
}

async function handleTokenRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken) => {
        if (newToken) {
          resolve(newToken);
        } else {
          reject(new Error('Refresh failed'));
        }
      });
    });
  }

  isRefreshing = true;

  try {
    const result = await refresh(refreshToken);
    setAccessToken(result.accessToken);
    onTokenRefreshed(result.accessToken);
    return result.accessToken;
  } catch (error) {
    onRefreshFailed();
    clearTokens();
    window.location.href = '/login';
    throw error;
  } finally {
    isRefreshing = false;
  }
}

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && !options._retry) {
    try {
      const newToken = await handleTokenRefresh();
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        _retry: true,
      });
    } catch {
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = new Error(`API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function getSensors() {
  return fetchApi('/api/sensors');
}

export function getSensor(serialNumber) {
  return fetchApi(`/api/sensors/${serialNumber}`);
}

export function getReadings(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.sensor_id) searchParams.set('sensor_id', params.sensor_id);
  if (params.start_date) searchParams.set('start_date', params.start_date);
  if (params.end_date) searchParams.set('end_date', params.end_date);
  if (params.page) searchParams.set('page', params.page);
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.sort_by) searchParams.set('sort_by', params.sort_by);
  if (params.sort_order) searchParams.set('sort_order', params.sort_order);

  const query = searchParams.toString();
  return fetchApi(`/api/readings${query ? `?${query}` : ''}`);
}

export function getReadingStats(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.sensor_id) searchParams.set('sensor_id', params.sensor_id);
  if (params.interval) searchParams.set('interval', params.interval);
  if (params.start_date) searchParams.set('start_date', params.start_date);
  if (params.end_date) searchParams.set('end_date', params.end_date);

  const query = searchParams.toString();
  return fetchApi(`/api/readings/stats${query ? `?${query}` : ''}`);
}
