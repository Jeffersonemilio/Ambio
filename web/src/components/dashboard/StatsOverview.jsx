import { Activity, Thermometer, Droplets, AlertTriangle, Building2, Users, Radio } from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { formatTemperature, formatHumidity } from '../../utils/formatters';

export function SensorStatsOverview({ sensors = [] }) {
  const lowBatterySensors = sensors.filter(s =>
    (s.last_battery_level || s.battery_level) === 'LOW'
  );

  const sensorsWithTemp = sensors.filter(s => {
    const temp = s.last_temperature ?? s.temperature;
    return temp != null && !isNaN(Number(temp));
  });

  const avgTemp = sensorsWithTemp.length > 0
    ? sensorsWithTemp.reduce((acc, s) => acc + Number(s.last_temperature ?? s.temperature ?? 0), 0) / sensorsWithTemp.length
    : null;

  const sensorsWithHumidity = sensors.filter(s => {
    const hum = s.last_humidity ?? s.humidity;
    return hum != null && !isNaN(Number(hum));
  });

  const avgHumidity = sensorsWithHumidity.length > 0
    ? sensorsWithHumidity.reduce((acc, s) => acc + Number(s.last_humidity ?? s.humidity ?? 0), 0) / sensorsWithHumidity.length
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Activity}
        label="Sensores Ativos"
        value={sensors.length}
        iconBgColor="bg-blue-500"
      />
      <StatCard
        icon={Thermometer}
        label="Temp. Média"
        value={avgTemp != null ? formatTemperature(avgTemp) : '--'}
        iconBgColor="bg-red-500"
      />
      <StatCard
        icon={Droplets}
        label="Umidade Média"
        value={avgHumidity != null ? formatHumidity(avgHumidity) : '--'}
        iconBgColor="bg-cyan-500"
      />
      <StatCard
        icon={AlertTriangle}
        label="Bateria Baixa"
        value={lowBatterySensors.length}
        iconBgColor={lowBatterySensors.length > 0 ? 'bg-orange-500' : 'bg-green-500'}
      />
    </div>
  );
}

export function AdminStatsOverview({ companies = [], sensors = [], users = [] }) {
  const totalSensors = typeof sensors === 'number' ? sensors : sensors.length;
  const totalUsers = typeof users === 'number' ? users : users.length;
  const totalCompanies = typeof companies === 'number' ? companies : companies.length;
  const activeCompanies = typeof companies === 'number'
    ? companies
    : companies.filter(c => c.is_active).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Building2}
        label="Empresas Ativas"
        value={activeCompanies}
        iconBgColor="bg-purple-500"
      />
      <StatCard
        icon={Radio}
        label="Total de Sensores"
        value={totalSensors}
        iconBgColor="bg-blue-500"
      />
      <StatCard
        icon={Users}
        label="Total de Usuários"
        value={totalUsers}
        iconBgColor="bg-green-500"
      />
      <StatCard
        icon={Activity}
        label="Empresas Total"
        value={totalCompanies}
        iconBgColor="bg-gray-500"
      />
    </div>
  );
}
