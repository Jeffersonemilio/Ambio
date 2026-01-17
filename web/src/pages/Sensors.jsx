import { useState } from 'react';
import { Search } from 'lucide-react';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SensorList } from '../components/sensors/SensorList';
import { useSensors } from '../hooks/useSensors';

export function Sensors() {
  const [search, setSearch] = useState('');
  const [batteryFilter, setBatteryFilter] = useState('all');
  const { data, isLoading, error } = useSensors();

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Erro ao carregar sensores." />;

  const sensors = data?.data || [];

  const filteredSensors = sensors.filter((sensor) => {
    const batteryLevel = sensor.last_reading?.battery_level || sensor.battery_level;
    const matchesSearch = sensor.serial_number.toLowerCase().includes(search.toLowerCase());
    const matchesBattery = batteryFilter === 'all' || batteryLevel === batteryFilter;
    return matchesSearch && matchesBattery;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sensores</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número de série..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={batteryFilter}
          onChange={(e) => setBatteryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as baterias</option>
          <option value="HIGH">Bateria Alta</option>
          <option value="MEDIUM">Bateria Média</option>
          <option value="LOW">Bateria Baixa</option>
        </select>
      </div>

      <SensorList sensors={filteredSensors} />
    </div>
  );
}
