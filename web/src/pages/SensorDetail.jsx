import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Thermometer, Droplets, Battery } from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { BatteryBadge } from '../components/common/Badge';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { ReadingsTable } from '../components/readings/ReadingsTable';
import { useSensor } from '../hooks/useSensors';
import { useReadings } from '../hooks/useReadings';
import { formatTemperature, formatHumidity, formatDate } from '../utils/formatters';

export function SensorDetail() {
  const { serialNumber } = useParams();
  const { data: sensorData, isLoading: sensorLoading, error: sensorError } = useSensor(serialNumber);
  const { data: readingsData, isLoading: readingsLoading } = useReadings({
    sensor_id: serialNumber,
    limit: 100,
    sort_by: 'received_at',
    sort_order: 'desc',
  });

  if (sensorLoading) return <Loading />;
  if (sensorError) return <ErrorMessage message="Erro ao carregar sensor." />;

  const sensor = sensorData?.data;
  const readings = readingsData?.data || [];

  if (!sensor) {
    return <ErrorMessage message="Sensor não encontrado." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/sensors"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{sensor.serial_number}</h1>
          {sensor.last_reading && (
            <p className="text-sm text-gray-500">
              Última leitura: {formatDate(sensor.last_reading.received_at)}
            </p>
          )}
        </div>
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
                {formatTemperature(sensor.last_reading?.temperature || 0)}
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
                {formatHumidity(sensor.last_reading?.humidity || 0)}
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
              <BatteryBadge level={sensor.last_reading?.battery_level || 'UNKNOWN'} />
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

      <Card>
        <CardHeader title="Leituras Recentes" />
        {readingsLoading ? (
          <Loading />
        ) : (
          <ReadingsTable readings={readings.slice(0, 20)} />
        )}
      </Card>
    </div>
  );
}
