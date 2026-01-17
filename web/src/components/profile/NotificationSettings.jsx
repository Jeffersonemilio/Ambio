import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { ToggleSwitch, ToggleSwitchGroup } from '../common/ToggleSwitch';
import { Button } from '../common/Button';

const defaultPreferences = {
  notifications: {
    sensor_alerts: true,
    periodic_reports: true,
    system_updates: false,
  },
};

export function NotificationSettings({
  preferences,
  onSave,
  isSaving = false,
}) {
  const [localPreferences, setLocalPreferences] = useState(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Sincronizar com preferências recebidas
  useEffect(() => {
    if (preferences?.notifications) {
      setLocalPreferences({
        notifications: {
          ...defaultPreferences.notifications,
          ...preferences.notifications,
        },
      });
    }
  }, [preferences]);

  const handleToggle = (key, value) => {
    setLocalPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    try {
      await onSave(localPreferences);
      setHasChanges(false);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao salvar preferências');
    }
  };

  const notifications = localPreferences.notifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gray-700">
        <Bell className="h-5 w-5" />
        <h3 className="font-medium">Notificações por Email</h3>
      </div>

      <ToggleSwitchGroup
        description="Configure quais notificações deseja receber por email."
      >
        <ToggleSwitch
          checked={notifications.sensor_alerts}
          onChange={(value) => handleToggle('sensor_alerts', value)}
          label="Alertas de sensores"
          description="Receba alertas quando sensores apresentarem problemas ou valores anormais."
        />

        <ToggleSwitch
          checked={notifications.periodic_reports}
          onChange={(value) => handleToggle('periodic_reports', value)}
          label="Relatórios periódicos"
          description="Receba resumos semanais com estatísticas dos seus sensores."
        />

        <ToggleSwitch
          checked={notifications.system_updates}
          onChange={(value) => handleToggle('system_updates', value)}
          label="Atualizações do sistema"
          description="Receba informações sobre novas funcionalidades e melhorias."
        />
      </ToggleSwitchGroup>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Preferências salvas com sucesso!
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
      >
        {isSaving ? 'Salvando...' : 'Salvar preferências'}
      </Button>
    </div>
  );
}
