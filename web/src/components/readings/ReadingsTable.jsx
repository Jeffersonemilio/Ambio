import { Link } from 'react-router-dom';
import { BatteryBadge } from '../common/Badge';
import { formatDate, formatTemperature, formatHumidity } from '../../utils/formatters';

export function ReadingsTable({ readings }) {
  if (!readings || readings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhuma leitura encontrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600">Sensor</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Temperatura</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Umidade</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Bateria</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={reading.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <Link
                  to={`/sensors/${reading.serial_number}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {reading.serial_number}
                </Link>
              </td>
              <td className="py-3 px-4">{formatTemperature(reading.temperature)}</td>
              <td className="py-3 px-4">{formatHumidity(reading.humidity)}</td>
              <td className="py-3 px-4">
                <BatteryBadge level={reading.battery_level} />
              </td>
              <td className="py-3 px-4 text-gray-500">{formatDate(reading.received_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
