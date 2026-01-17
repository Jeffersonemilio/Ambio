import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SensorStatsOverview } from '../../components/dashboard/StatsOverview';
import { RecentReadingsChart } from '../../components/dashboard/RecentReadingsChart';
import { SensorList } from '../../components/sensors/SensorList';
import { useSensorsWithFilters } from '../../hooks/useSensors';
import { useCompany } from '../../hooks/useCompanies';

export function CompanyDashboard({ companyId, showHeader = false, companyName }) {
  const { data: sensorsData, isLoading: sensorsLoading, error: sensorsError } = useSensorsWithFilters({
    companyId,
    limit: 100,
  });

  const { data: company } = useCompany(showHeader ? companyId : null);

  if (sensorsLoading) return <Loading />;
  if (sensorsError) return <ErrorMessage message="Erro ao carregar sensores." />;

  const sensors = sensorsData?.data || [];
  const displayName = companyName || company?.name;

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName || 'Empresa'}</h1>
            <p className="text-sm text-gray-500">
              {sensors.length} sensor{sensors.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
      )}

      {!showHeader && (
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      )}

      <SensorStatsOverview sensors={sensors} />

      {sensors.length > 0 && (
        <RecentReadingsChart
          sensorId={sensors[0]?.serial_number}
          limit={50}
          title="Leituras Recentes"
        />
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sensores</h2>
        <SensorList sensors={sensors} />
      </div>
    </div>
  );
}
