import { useQuery } from '@tanstack/react-query';
import { getSensors, getSensor } from '../api/client';

export function useSensors() {
  return useQuery({
    queryKey: ['sensors'],
    queryFn: getSensors,
    refetchInterval: 30000,
  });
}

export function useSensor(serialNumber) {
  return useQuery({
    queryKey: ['sensor', serialNumber],
    queryFn: () => getSensor(serialNumber),
    enabled: !!serialNumber,
  });
}
