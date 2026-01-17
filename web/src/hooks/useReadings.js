import { useQuery } from '@tanstack/react-query';
import { getReadings, getReadingStats } from '../api/client';

export function useReadings(params = {}) {
  return useQuery({
    queryKey: ['readings', params],
    queryFn: () => getReadings(params),
    refetchInterval: 30000,
  });
}

export function useReadingStats(params = {}) {
  return useQuery({
    queryKey: ['readingStats', params],
    queryFn: () => getReadingStats(params),
    enabled: !!params.sensor_id || params.interval,
  });
}
