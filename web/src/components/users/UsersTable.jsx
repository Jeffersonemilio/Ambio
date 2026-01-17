import { Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Table } from '../common/Table';
import { formatDate } from '../../utils/formatters';

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  analyst: 'Analista',
  support: 'Suporte',
  user: 'Usuário',
};

const userTypeLabels = {
  ambio: 'Ambio',
  company: 'Empresa',
};

export function UsersTable({
  users,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onToggleActive,
  showCompany = true,
}) {
  const columns = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'user_type',
      label: 'Tipo',
      render: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.user_type === 'ambio'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {userTypeLabels[row.user_type] || row.user_type}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => roleLabels[row.role] || row.role,
    },
  ];

  if (showCompany) {
    columns.push({
      key: 'company_name',
      label: 'Empresa',
      render: (row) => row.company_name || '-',
    });
  }

  columns.push(
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
      key: 'last_login_at',
      label: 'Último acesso',
      render: (row) =>
        row.last_login_at ? formatDate(row.last_login_at) : 'Nunca',
    },
    {
      key: 'actions',
      label: '',
      className: 'w-32',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleActive(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            title={row.is_active ? 'Desativar' : 'Ativar'}
          >
            {row.is_active ? (
              <UserX className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-red-600"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }
  );

  return (
    <Table
      columns={columns}
      data={users}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyMessage="Nenhum usuário encontrado."
    />
  );
}
