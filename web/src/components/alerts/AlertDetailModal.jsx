import { X, Thermometer, Droplets, MapPin, Clock, Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Loading } from '../common/Loading';
import { formatDate, formatRelativeTime, formatTemperature, formatHumidity } from '../../utils/formatters';
import { useAlert, useAlertNotifications } from '../../hooks/useAlerts';

const STATUS_CONFIG = {
  active: { label: 'Ativo', variant: 'danger', icon: AlertTriangle },
  resolved: { label: 'Resolvido', variant: 'success', icon: CheckCircle },
  exhausted: { label: 'Esgotado', variant: 'warning', icon: Clock },
};

const VIOLATION_LABELS = {
  temperature_min: 'Temperatura abaixo do minimo',
  temperature_max: 'Temperatura acima do maximo',
  humidity_min: 'Umidade abaixo do minimo',
  humidity_max: 'Umidade acima do maximo',
};

function formatValue(violationType, value) {
  if (violationType?.startsWith('temperature')) {
    return formatTemperature(value);
  }
  return formatHumidity(value);
}

function NotificationHistory({ alertId }) {
  const { data, isLoading } = useAlertNotifications(alertId);

  if (isLoading) {
    return <Loading />;
  }

  const notifications = data?.data || [];

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Nenhuma notificacao enviada ainda
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
            notif.status === 'sent' ? 'bg-green-50' :
            notif.status === 'failed' ? 'bg-red-50' :
            'bg-gray-50'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            notif.status === 'sent' ? 'bg-green-500' :
            notif.status === 'failed' ? 'bg-red-500' :
            'bg-gray-400'
          }`} />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{notif.recipient_name || notif.recipient_address}</p>
            <p className="text-xs text-gray-500">
              {notif.channel} - Tentativa {notif.attempt_number}
            </p>
          </div>
          <div className="text-right">
            <Badge variant={notif.status === 'sent' ? 'success' : notif.status === 'failed' ? 'danger' : 'default'}>
              {notif.status === 'sent' ? 'Enviado' : notif.status === 'failed' ? 'Falhou' : notif.status}
            </Badge>
            <p className="text-xs text-gray-400 mt-1">
              {notif.sent_at ? formatDate(notif.sent_at) : formatDate(notif.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AlertDetailModal({ alertId, onClose }) {
  const { data: alert, isLoading } = useAlert(alertId);

  if (!alertId) return null;

  const statusConfig = STATUS_CONFIG[alert?.status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  return (
    <Modal onClose={onClose} title="Detalhes do Alerta">
      {isLoading ? (
        <Loading />
      ) : alert ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              alert.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {alert.violation_type?.startsWith('temperature') ? (
                <Thermometer className="h-6 w-6" />
              ) : (
                <Droplets className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {alert.sensor_name || alert.sensor_serial}
              </h2>
              <p className="text-gray-500">{VIOLATION_LABELS[alert.violation_type]}</p>
            </div>
            <Badge variant={statusConfig.variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Valor Lido</p>
              <p className="text-3xl font-bold text-red-600">
                {formatValue(alert.violation_type, alert.actual_value)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Limite Configurado</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatValue(alert.violation_type, alert.threshold_value)}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {alert.sensor_location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Localizacao:</span>
                <span className="font-medium text-gray-900">{alert.sensor_location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Disparado em:</span>
              <span className="font-medium text-gray-900">{formatDate(alert.triggered_at)}</span>
              <span className="text-gray-400">({formatRelativeTime(alert.triggered_at)})</span>
            </div>
            {alert.resolved_at && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">Resolvido em:</span>
                <span className="font-medium text-gray-900">{formatDate(alert.resolved_at)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Notificacoes:</span>
              <span className="font-medium text-gray-900">{alert.notification_count}/3 enviadas</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Origem do limite:</span>
              <Badge variant={alert.threshold_source === 'sensor_config' ? 'info' : 'default'}>
                {alert.threshold_source === 'sensor_config' ? 'Configuracao do sensor' : 'Padrao do sistema'}
              </Badge>
            </div>
          </div>

          {/* Notification History */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Historico de Notificacoes
            </h3>
            <NotificationHistory alertId={alertId} />
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Alerta nao encontrado</p>
      )}
    </Modal>
  );
}
