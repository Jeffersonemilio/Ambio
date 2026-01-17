import { Activity, Thermometer, Droplets, AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '../components/common/Card';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SensorList } from '../components/sensors/SensorList';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { useSensors } from '../hooks/useSensors';
import { useReadings } from '../hooks/useReadings';
import { formatTemperature, formatHumidity } from '../utils/formatters';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { data: sensorsData, isLoading: sensorsLoading, error: sensorsError } = useSensors();
  const { data: readingsData, isLoading: readingsLoading } = useReadings({ limit: 50 });

  if (sensorsLoading) return <Loading />;
  if (sensorsError) return <ErrorMessage message="Erro ao carregar sensores." />;

  const sensors = sensorsData?.data || [];
  const readings = readingsData?.data || [];

  const lowBatterySensors = sensors.filter(s =>
    (s.last_reading?.battery_level || s.battery_level) === 'LOW'
  );

  const avgTemp = sensors.length > 0
    ? sensors.reduce((acc, s) => acc + Number(s.last_reading?.temperature || s.temperature || 0), 0) / sensors.length
    : 0;

  const avgHumidity = sensors.length > 0
    ? sensors.reduce((acc, s) => acc + Number(s.last_reading?.humidity || s.humidity || 0), 0) / sensors.length
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Sensores Ativos"
          value={sensors.length}
          color="bg-blue-500"
        />
        <StatCard
          icon={Thermometer}
          label="Temp. Média"
          value={formatTemperature(avgTemp)}
          color="bg-red-500"
        />
        <StatCard
          icon={Droplets}
          label="Umidade Média"
          value={formatHumidity(avgHumidity)}
          color="bg-cyan-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Bateria Baixa"
          value={lowBatterySensors.length}
          color={lowBatterySensors.length > 0 ? 'bg-orange-500' : 'bg-green-500'}
        />
      </div>

      {readings.length > 0 && (
        <Card>
          <CardHeader title="Leituras Recentes" subtitle="Últimas 50 leituras" />
          <TimeSeriesChart data={readings.slice().reverse()} height={300} />
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sensores</h2>
        <SensorList sensors={sensors.slice(0, 8)} />
      </div>
    </div>
  );
}
