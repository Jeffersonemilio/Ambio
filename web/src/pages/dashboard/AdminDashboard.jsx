import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { AdminStatsOverview } from '../../components/dashboard/StatsOverview';
import { CompaniesGrid } from '../../components/companies/CompaniesGrid';
import { useCompanies } from '../../hooks/useCompanies';

export function AdminDashboard() {
  const { data: companiesData, isLoading, error } = useCompanies({ limit: 100 });

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Erro ao carregar empresas." />;

  const companies = companiesData?.data || [];
  const totalCompanies = companiesData?.total || companies.length;

  // Calculate totals from companies
  const totalSensors = companies.reduce((acc, c) => acc + (c.sensor_count || 0), 0);
  const totalUsers = companies.reduce((acc, c) => acc + (c.user_count || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <AdminStatsOverview
        companies={companies}
        sensors={totalSensors}
        users={totalUsers}
      />

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Empresas</h2>
        <CompaniesGrid companies={companies} />
      </div>
    </div>
  );
}
