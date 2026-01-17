const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
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
