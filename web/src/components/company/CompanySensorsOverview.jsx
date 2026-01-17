import { Link } from 'react-router-dom';
import { Radio, Wifi, WifiOff, ArrowRight } from 'lucide-react';

export function CompanySensorsOverview({ sensors, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-100 rounded-lg p-4 h-20" />
          <div className="bg-gray-100 rounded-lg p-4 h-20" />
          <div className="bg-gray-100 rounded-lg p-4 h-20" />
        </div>
      </div>
    );
  }

  const total = sensors?.length || 0;
  const online = sensors?.filter((s) => s.isOnline).length || 0;
  const offline = total - online;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <div className="text-3xl font-semibold text-gray-900">{total}</div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Online</span>
          </div>
          <div className="text-3xl font-semibold text-green-600">{online}</div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <WifiOff className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Offline</span>
          </div>
          <div className="text-3xl font-semibold text-red-600">{offline}</div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Sensores online</span>
            <span>{Math.round((online / total) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(online / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent sensors preview */}
      {sensors && sensors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Sensores recentes
          </h4>
          <div className="space-y-2">
            {sensors.slice(0, 5).map((sensor) => (
              <div
                key={sensor.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sensor.isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-gray-900">{sensor.name}</span>
                </div>
                <span className="text-xs text-gray-500">{sensor.serialNumber}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link to sensors page */}
      <Link
        to="/sensors"
        className="flex items-center justify-center gap-2 py-3 text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        Ver todos os sensores
        <ArrowRight className="w-4 h-4" />
      </Link>

      {total === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Radio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>Nenhum sensor cadastrado</p>
        </div>
      )}
    </div>
  );
}
