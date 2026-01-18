import { useState } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Pagination } from '../components/common/Pagination';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertFilters } from '../components/alerts/AlertFilters';
import { AlertStats } from '../components/alerts/AlertStats';
import { AlertDetailModal } from '../components/alerts/AlertDetailModal';
import { useAlerts, useAlertStatistics } from '../hooks/useAlerts';
import { useSensors } from '../hooks/useSensors';

const ITEMS_PER_PAGE = 12;

export function Alerts() {
  const [filters, setFilters] = useState({
    status: '',
    violationType: '',
    sensorId: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(0);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // Buscar alertas
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
  } = useAlerts({
    ...filters,
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
  });

  // Buscar estatisticas
  const { data: statsData, isLoading: statsLoading } = useAlertStatistics({
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  // Buscar sensores para filtro
  const { data: sensorsData } = useSensors();

  const alerts = alertsData?.data || [];
  const total = alertsData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const sensors = sensorsData?.data || [];

  const activeCount = (statsData?.data || [])
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + parseInt(s.count, 10), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Bell className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
            <p className="text-sm text-gray-500">
              Monitore violacoes de limites dos sensores
            </p>
          </div>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-red-700">
              {activeCount} alerta{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <AlertStats data={statsData?.data} isLoading={statsLoading} />

      {/* Filters */}
      <AlertFilters
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setPage(0); // Reset page when filters change
        }}
        sensors={sensors}
      />

      {/* Content */}
      {alertsLoading ? (
        <Loading />
      ) : alertsError ? (
        <ErrorMessage message={alertsError.message} />
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum alerta encontrado</h3>
          <p className="text-gray-500">
            {Object.values(filters).some(v => v)
              ? 'Tente ajustar os filtros de busca'
              : 'Seus sensores estao funcionando dentro dos limites configurados'}
          </p>
        </div>
      ) : (
        <>
          {/* Grid de alertas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onClick={() => setSelectedAlertId(alert.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                currentPage={page + 1}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p - 1)}
              />
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes */}
      {selectedAlertId && (
        <AlertDetailModal
          alertId={selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
        />
      )}
    </div>
  );
}
