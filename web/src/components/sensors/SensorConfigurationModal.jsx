import { useState, useEffect } from 'react';
import { Thermometer, Droplets, MapPin, Bell } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Loading } from '../common/Loading';
import { useSensorConfiguration, useUpdateSensorConfiguration } from '../../hooks/useSensors';

export function SensorConfigurationModal({ isOpen, onClose, sensor, onSuccess }) {
  const { data: config, isLoading } = useSensorConfiguration(sensor?.id);
  const updateConfig = useUpdateSensorConfiguration();

  const [formData, setFormData] = useState({
    installationLocation: '',
    temperatureMin: '',
    temperatureMax: '',
    humidityMin: '',
    humidityMax: '',
    alertsEnabled: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (config) {
      setFormData({
        installationLocation: config.installation_location || '',
        temperatureMin: config.temperature_min ?? '',
        temperatureMax: config.temperature_max ?? '',
        humidityMin: config.humidity_min ?? '',
        humidityMax: config.humidity_max ?? '',
        alertsEnabled: config.alerts_enabled ?? true,
      });
    }
  }, [config]);

  // Reset form when modal opens with new sensor
  useEffect(() => {
    if (isOpen && !config) {
      setFormData({
        installationLocation: '',
        temperatureMin: '',
        temperatureMax: '',
        humidityMin: '',
        humidityMax: '',
        alertsEnabled: true,
      });
      setErrors({});
    }
  }, [isOpen, config]);

  const validate = () => {
    const newErrors = {};

    const tempMin = formData.temperatureMin !== '' ? parseFloat(formData.temperatureMin) : null;
    const tempMax = formData.temperatureMax !== '' ? parseFloat(formData.temperatureMax) : null;
    const humMin = formData.humidityMin !== '' ? parseFloat(formData.humidityMin) : null;
    const humMax = formData.humidityMax !== '' ? parseFloat(formData.humidityMax) : null;

    if (tempMin !== null && tempMax !== null && tempMin >= tempMax) {
      newErrors.temperatureMin = 'Deve ser menor que a maxima';
    }

    if (humMin !== null && humMax !== null && humMin >= humMax) {
      newErrors.humidityMin = 'Deve ser menor que a maxima';
    }

    if (humMin !== null && (humMin < 0 || humMin > 100)) {
      newErrors.humidityMin = 'Deve estar entre 0 e 100%';
    }

    if (humMax !== null && (humMax < 0 || humMax > 100)) {
      newErrors.humidityMax = 'Deve estar entre 0 e 100%';
    }

    if (tempMin !== null && (tempMin < -50 || tempMin > 100)) {
      newErrors.temperatureMin = 'Deve estar entre -50 e 100';
    }

    if (tempMax !== null && (tempMax < -50 || tempMax > 100)) {
      newErrors.temperatureMax = 'Deve estar entre -50 e 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await updateConfig.mutateAsync({
        sensorId: sensor.id,
        config: {
          installationLocation: formData.installationLocation || null,
          temperatureMin: formData.temperatureMin !== '' ? parseFloat(formData.temperatureMin) : null,
          temperatureMax: formData.temperatureMax !== '' ? parseFloat(formData.temperatureMax) : null,
          humidityMin: formData.humidityMin !== '' ? parseFloat(formData.humidityMin) : null,
          humidityMax: formData.humidityMax !== '' ? parseFloat(formData.humidityMax) : null,
          alertsEnabled: formData.alertsEnabled,
        },
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configuracao:', error);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target?.type === 'checkbox' ? e.target.checked : e.target?.value ?? e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!sensor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Sensor" size="md">
      {isLoading ? (
        <Loading />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info do Sensor */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Sensor</p>
            <p className="font-mono font-semibold">{sensor.serial_number}</p>
            {sensor.name && <p className="text-sm text-gray-600">{sensor.name}</p>}
          </div>

          {/* Local de Instalacao */}
          <Input
            label="Local de Instalacao"
            icon={MapPin}
            placeholder="Ex: Camera Fria 01, Almoxarifado B"
            value={formData.installationLocation}
            onChange={handleChange('installationLocation')}
          />

          {/* Limites de Temperatura */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              Limites de Temperatura (C)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.1"
                placeholder="Minima"
                value={formData.temperatureMin}
                onChange={handleChange('temperatureMin')}
                error={errors.temperatureMin}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Maxima"
                value={formData.temperatureMax}
                onChange={handleChange('temperatureMax')}
                error={errors.temperatureMax}
              />
            </div>
          </div>

          {/* Limites de Umidade */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              Limites de Umidade (%)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Minima"
                value={formData.humidityMin}
                onChange={handleChange('humidityMin')}
                error={errors.humidityMin}
              />
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="Maxima"
                value={formData.humidityMax}
                onChange={handleChange('humidityMax')}
                error={errors.humidityMax}
              />
            </div>
          </div>

          {/* Toggle de Alertas */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium">Alertas Habilitados</p>
                <p className="text-sm text-gray-500">
                  Receber notificacoes quando os limites forem ultrapassados
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.alertsEnabled}
                onChange={handleChange('alertsEnabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Botoes */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={updateConfig.isPending}>
              Salvar Configuracao
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
