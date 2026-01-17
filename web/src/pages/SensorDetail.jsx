import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Thermometer, Droplets, Battery, Settings, MapPin } from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { BatteryBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { ReadingsTable } from '../components/readings/ReadingsTable';
import { SensorConfigurationModal } from '../components/sensors/SensorConfigurationModal';
import { useSensor, useSensorConfiguration } from '../hooks/useSensors';
import { useReadings } from '../hooks/useReadings';
import { formatTemperature, formatHumidity, formatDate } from '../utils/formatters';

export function SensorDetail() {
  const { serialNumber } = useParams();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const { data: sensorData, isLoading: sensorLoading, error: sensorError } = useSensor(serialNumber);
  const { data: configData } = useSensorConfiguration(sensorData?.id);
  const { data: readingsData, isLoading: readingsLoading } = useReadings({
    sensor_id: serialNumber,
    limit: 100,
    sort_by: 'received_at',
    sort_order: 'desc',
  });

  if (sensorLoading) return <Loading />;
  if (sensorError) return <ErrorMessage message="Erro ao carregar sensor." />;

  const sensor = sensorData;
  const readings = readingsData?.data || [];
  const hasConfiguration = configData?.configured;

  if (!sensor) {
    return <ErrorMessage message="Sensor não encontrado." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/sensors"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sensor.serial_number}</h1>
            {sensor.last_reading_at && (
              <p className="text-sm text-gray-500">
                Ultima leitura: {formatDate(sensor.last_reading_at)}
              </p>
            )}
          </div>
        </div>
        {sensor.company_id && (
          <Button variant="secondary" onClick={() => setConfigModalOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Thermometer className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Temperatura</p>
              <p className="text-2xl font-bold">
                {formatTemperature(sensor.last_temperature)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Droplets className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Umidade</p>
              <p className="text-2xl font-bold">
                {formatHumidity(sensor.last_humidity)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Battery className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bateria</p>
              <BatteryBadge level={sensor.last_battery_level || 'UNKNOWN'} />
            </div>
          </div>
        </Card>
      </div>

      {readings.length > 0 && (
        <Card>
          <CardHeader title="Histórico" subtitle="Últimas 100 leituras" />
          <TimeSeriesChart data={readings.slice().reverse()} height={350} />
        </Card>
      )}

      {hasConfiguration && (
        <Card>
          <CardHeader
            title="Configuracao"
            subtitle={configData?.installation_location || 'Local nao definido'}
          />
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Local</p>
                <p className="text-sm font-medium">{configData?.installation_location || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-xs text-gray-500">Temperatura</p>
                <p className="text-sm font-medium">
                  {configData?.temperature_min != null && configData?.temperature_max != null
                    ? `${configData.temperature_min}C - ${configData.temperature_max}C`
                    : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-gray-500">Umidade</p>
                <p className="text-sm font-medium">
                  {configData?.humidity_min != null && configData?.humidity_max != null
                    ? `${configData.humidity_min}% - ${configData.humidity_max}%`
                    : '-'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Alertas</p>
              <p className={`text-sm font-medium ${configData?.alerts_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                {configData?.alerts_enabled ? 'Habilitados' : 'Desabilitados'}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Leituras Recentes" />
        {readingsLoading ? (
          <Loading />
        ) : (
          <ReadingsTable readings={readings.slice(0, 20)} />
        )}
      </Card>

      <SensorConfigurationModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        sensor={sensor}
      />
    </div>
  );
}
