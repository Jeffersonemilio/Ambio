import { Filter, X } from 'lucide-react';
import { Select } from '../common/Select';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativos' },
  { value: 'resolved', label: 'Resolvidos' },
  { value: 'exhausted', label: 'Esgotados' },
];

const VIOLATION_OPTIONS = [
  { value: 'temperature_min', label: 'Temperatura baixa' },
  { value: 'temperature_max', label: 'Temperatura alta' },
  { value: 'humidity_min', label: 'Umidade baixa' },
  { value: 'humidity_max', label: 'Umidade alta' },
];

export function AlertFilters({ filters, onChange, sensors = [] }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value || '' });
  };

  const clearFilters = () => {
    onChange({
      status: '',
      violationType: '',
      sensorId: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = filters.status || filters.violationType || filters.sensorId || filters.startDate || filters.endDate;

  const sensorOptions = sensors.map(s => ({
    value: s.id,
    label: s.name || s.serial_number,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filtros</span>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <Select
          value={filters.status || ''}
          onChange={(value) => handleChange('status', value)}
          options={STATUS_OPTIONS}
          placeholder="Todos os status"
        />

        <Select
          value={filters.violationType || ''}
          onChange={(value) => handleChange('violationType', value)}
          options={VIOLATION_OPTIONS}
          placeholder="Todos os tipos"
        />

        {sensors.length > 0 && (
          <Select
            value={filters.sensorId || ''}
            onChange={(value) => handleChange('sensorId', value)}
            options={sensorOptions}
            placeholder="Todos os sensores"
          />
        )}

        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className="block w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          placeholder="Data inicio"
        />

        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => handleChange('endDate', e.target.value)}
          className="block w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          placeholder="Data fim"
        />
      </div>
    </div>
  );
}
