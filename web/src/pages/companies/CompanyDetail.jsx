import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { useCompany, useCompanyUsers, useCompanySensors } from '../../hooks/useCompanies';
import { formatDate, formatTemperature, formatHumidity } from '../../utils/formatters';

export function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usersPagination, setUsersPagination] = useState({ limit: 10, offset: 0 });
  const [sensorsPagination, setSensorsPagination] = useState({ limit: 10, offset: 0 });

  const { data: company, isLoading, error } = useCompany(id);
  const { data: usersData, isLoading: usersLoading } = useCompanyUsers(id, usersPagination);
  const { data: sensorsData, isLoading: sensorsLoading } = useCompanySensors(id, sensorsPagination);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Erro ao carregar empresa." />;
  if (!company) return <ErrorMessage message="Empresa não encontrada." />;

  const users = usersData?.data || [];
  const usersTotal = usersData?.total || 0;
  const sensors = sensorsData?.data || [];
  const sensorsTotal = sensorsData?.total || 0;

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

  const sensorColumns = [
    {
      key: 'serial_number',
      label: 'Serial',
      render: (row) => (
        <Link
          to={`/sensors/${row.serial_number}`}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          {row.serial_number}
        </Link>
      ),
    },
    {
      key: 'name',
      label: 'Nome',
      render: (row) => row.name || '-',
    },
    {
      key: 'last_temperature',
      label: 'Temp.',
      render: (row) => formatTemperature(row.last_temperature),
    },
    {
      key: 'last_humidity',
      label: 'Umidade',
      render: (row) => formatHumidity(row.last_humidity),
    },
    {
      key: 'last_reading_at',
      label: 'Última leitura',
      render: (row) =>
        row.last_reading_at ? formatDate(row.last_reading_at) : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/companies"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Usuários</p>
              <p className="text-2xl font-bold">{usersTotal}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Radio className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sensores</p>
              <p className="text-2xl font-bold">{sensorsTotal}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg ${
                company.is_active ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Building2
                className={`w-6 h-6 ${
                  company.is_active ? 'text-green-600' : 'text-gray-600'
                }`}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold">
                {company.is_active ? 'Ativa' : 'Inativa'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {(company.email || company.phone || company.address) && (
        <Card>
          <CardHeader title="Informações de Contato" />
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {company.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{company.email}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{company.phone}</span>
              </div>
            )}
            {company.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{company.address}</span>
              </div>
            )}
          </div>
        </Card>
      )}

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

      <Card>
        <CardHeader
          title="Sensores"
          subtitle={`${sensorsTotal} sensor${sensorsTotal !== 1 ? 'es' : ''}`}
        />
        {sensorsLoading ? (
          <div className="p-8">
            <Loading />
          </div>
        ) : (
          <>
            <Table
              columns={sensorColumns}
              data={sensors}
              emptyMessage="Nenhum sensor atribuído."
            />
            <Pagination
              total={sensorsTotal}
              limit={sensorsPagination.limit}
              offset={sensorsPagination.offset}
              onChange={(offset) =>
                setSensorsPagination((prev) => ({ ...prev, offset }))
              }
            />
          </>
        )}
      </Card>
    </div>
  );
}
