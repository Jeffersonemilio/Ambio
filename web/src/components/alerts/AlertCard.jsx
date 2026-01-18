import { AlertTriangle, Thermometer, Droplets, Clock, MapPin, Bell } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { formatDate, formatRelativeTime, formatTemperature, formatHumidity } from '../../utils/formatters';

const VIOLATION_LABELS = {
  temperature_min: 'Temperatura abaixo do minimo',
  temperature_max: 'Temperatura acima do maximo',
  humidity_min: 'Umidade abaixo do minimo',
  humidity_max: 'Umidade acima do maximo',
};

const VIOLATION_SHORT = {
  temperature_min: 'Temp. Baixa',
  temperature_max: 'Temp. Alta',
  humidity_min: 'Umid. Baixa',
  humidity_max: 'Umid. Alta',
};

const STATUS_CONFIG = {
  active: { label: 'Ativo', variant: 'danger' },
  resolved: { label: 'Resolvido', variant: 'success' },
  exhausted: { label: 'Esgotado', variant: 'warning' },
};

function getViolationIcon(violationType) {
  if (violationType?.startsWith('temperature')) {
    return <Thermometer className="h-5 w-5" />;
  }
  return <Droplets className="h-5 w-5" />;
}

function formatValue(violationType, value) {
  if (violationType?.startsWith('temperature')) {
    return formatTemperature(value);
  }
  return formatHumidity(value);
}

export function AlertCard({ alert, onClick }) {
  const statusConfig = STATUS_CONFIG[alert.status] || STATUS_CONFIG.active;
  const violationLabel = VIOLATION_SHORT[alert.violation_type] || alert.violation_type;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        alert.status === 'active' ? 'border-l-4 border-l-red-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              alert.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {getViolationIcon(alert.violation_type)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {alert.sensor_name || alert.sensor_serial}
              </h3>
              <p className="text-sm text-gray-500">{violationLabel}</p>
            </div>
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Valor lido</p>
            <p className={`text-lg font-bold ${alert.status === 'active' ? 'text-red-600' : 'text-gray-900'}`}>
              {formatValue(alert.violation_type, alert.actual_value)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Limite</p>
            <p className="text-lg font-bold text-gray-900">
              {formatValue(alert.violation_type, alert.threshold_value)}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1 text-sm text-gray-500">
          {alert.sensor_location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{alert.sensor_location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatRelativeTime(alert.triggered_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" />
            <span>{alert.notification_count}/3 notificacoes enviadas</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AlertCardCompact({ alert, onClick }) {
  const statusConfig = STATUS_CONFIG[alert.status] || STATUS_CONFIG.active;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
        alert.status === 'active' ? 'border-red-200 bg-red-50' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className={`p-1.5 rounded ${
        alert.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
      }`}>
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {alert.sensor_name || alert.sensor_serial}
        </p>
        <p className="text-xs text-gray-500">
          {VIOLATION_SHORT[alert.violation_type]} - {formatValue(alert.violation_type, alert.actual_value)}
        </p>
      </div>
      <div className="text-right">
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(alert.triggered_at)}</p>
      </div>
    </div>
  );
}
