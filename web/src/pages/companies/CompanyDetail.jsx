import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Users,
  Radio,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Table } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { StatCard } from '../../components/common/StatCard';
import { SensorStatsOverview } from '../../components/dashboard/StatsOverview';
import { RecentReadingsChart } from '../../components/dashboard/RecentReadingsChart';
import { SensorList } from '../../components/sensors/SensorList';
import { useCompany, useCompanyUsers, useCompanySensors } from '../../hooks/useCompanies';

export function CompanyDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('sensors');
  const [usersPagination, setUsersPagination] = useState({ limit: 10, offset: 0 });

  const { data: company, isLoading, error } = useCompany(id);
  const { data: usersData, isLoading: usersLoading } = useCompanyUsers(id, usersPagination);
  const { data: sensorsData, isLoading: sensorsLoading } = useCompanySensors(id, { limit: 100 });

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Erro ao carregar empresa." />;
  if (!company) return <ErrorMessage message="Empresa não encontrada." />;

  const users = usersData?.data || [];
  const usersTotal = usersData?.total || 0;
  const sensors = sensorsData?.data || [];
  const sensorsTotal = sensorsData?.total || sensors.length;

  const userColumns = [
    {
      key: 'name',
      label: 'Nome',
      render: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => {
        const roles = {
          super_admin: 'Super Admin',
          admin: 'Admin',
          analyst: 'Analista',
          support: 'Suporte',
          user: 'Usuário',
        };
        return roles[row.role] || row.role;
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Link
          to={`/users/${row.id}`}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Editar
        </Link>
      ),
    },
  ];

  const tabs = [
    { id: 'sensors', label: 'Sensores', count: sensorsTotal },
    { id: 'users', label: 'Usuários', count: usersTotal },
    { id: 'info', label: 'Informações' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            {company.cnpj && (
              <p className="text-sm text-gray-500">CNPJ: {company.cnpj}</p>
            )}
          </div>
        </div>
        <Link to={`/companies/${id}/edit`}>
          <Button variant="secondary">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Radio}
          label="Sensores"
          value={sensorsTotal}
          iconBgColor="bg-blue-500"
        />
        <StatCard
          icon={Users}
          label="Usuários"
          value={usersTotal}
          iconBgColor="bg-green-500"
        />
        <StatCard
          icon={Building2}
          label="Status"
          value={company.is_active ? 'Ativa' : 'Inativa'}
          iconBgColor={company.is_active ? 'bg-green-500' : 'bg-gray-500'}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'sensors' && (
        <div className="space-y-6">
          <SensorStatsOverview sensors={sensors} />

          {sensors.length > 0 && (
            <RecentReadingsChart
              sensorId={sensors[0]?.serial_number}
              limit={50}
              title="Leituras Recentes"
            />
          )}

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sensores ({sensorsTotal})
            </h2>
            <SensorList sensors={sensors} isLoading={sensorsLoading} />
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader
            title="Usuários"
            subtitle={`${usersTotal} usuário${usersTotal !== 1 ? 's' : ''}`}
          />
          {usersLoading ? (
            <div className="p-8">
              <Loading />
            </div>
          ) : (
            <>
              <Table
                columns={userColumns}
                data={users}
                emptyMessage="Nenhum usuário cadastrado."
              />
              <Pagination
                total={usersTotal}
                limit={usersPagination.limit}
                offset={usersPagination.offset}
                onChange={(offset) =>
                  setUsersPagination((prev) => ({ ...prev, offset }))
                }
              />
            </>
          )}
        </Card>
      )}

      {activeTab === 'info' && (
        <Card>
          <CardHeader title="Informações de Contato" />
          <div className="p-4 space-y-4">
            {company.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{company.email}</p>
                </div>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{company.phone}</p>
                </div>
              </div>
            )}
            {company.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Endereço</p>
                  <p className="font-medium">{company.address}</p>
                </div>
              </div>
            )}
            {!company.email && !company.phone && !company.address && (
              <p className="text-gray-500">Nenhuma informação de contato cadastrada.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
