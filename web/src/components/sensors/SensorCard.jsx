import { Link } from 'react-router-dom';
import { Thermometer, Droplets, Battery, Clock } from 'lucide-react';
import { Card } from '../common/Card';
import { BatteryBadge } from '../common/Badge';
import { formatTemperature, formatHumidity, formatRelativeTime } from '../../utils/formatters';

export function SensorCard({ sensor }) {
  const temperature = sensor.last_temperature ?? sensor.temperature;
  const humidity = sensor.last_humidity ?? sensor.humidity;
  const batteryLevel = sensor.last_battery_level ?? sensor.battery_level;
  const readingAt = sensor.last_reading_at ?? sensor.received_at;

  return (
    <Link to={`/sensors/${sensor.serial_number}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 truncate">{sensor.serial_number}</h3>
          <BatteryBadge level={batteryLevel} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">Temperatura:</span>
            <span className="font-medium">{formatTemperature(temperature)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">Umidade:</span>
            <span className="font-medium">{formatHumidity(humidity)}</span>
          </div>

          {readingAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatRelativeTime(readingAt)}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
