import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSensors,
  getSensor,
  getSensorsWithFilters,
  assignSensor,
  unassignSensor,
  getSensorConfiguration,
  updateSensorConfiguration,
  createSensor,
} from '../api/client';

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

export function useSensorsWithFilters(params = {}) {
  return useQuery({
    queryKey: ['sensors', params],
    queryFn: () => getSensorsWithFilters(params),
  });
}

export function useUnassignedSensors(params = {}) {
  return useQuery({
    queryKey: ['sensors', 'unassigned', params],
    queryFn: () => getSensorsWithFilters({ ...params, unassigned: 'true' }),
  });
}

export function useAssignSensor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sensorId, companyId }) => assignSensor(sensorId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
    },
  });
}

export function useUnassignSensor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unassignSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
    },
  });
}

export function useSensorConfiguration(sensorId) {
  return useQuery({
    queryKey: ['sensor-configuration', sensorId],
    queryFn: () => getSensorConfiguration(sensorId),
    enabled: !!sensorId,
  });
}

export function useUpdateSensorConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sensorId, config }) => updateSensorConfiguration(sensorId, config),
    onSuccess: (_, { sensorId }) => {
      queryClient.invalidateQueries({ queryKey: ['sensor-configuration', sensorId] });
      queryClient.invalidateQueries({ queryKey: ['sensor', sensorId] });
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
    },
  });
}

export function useCreateSensor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensors'] });
    },
  });
}
