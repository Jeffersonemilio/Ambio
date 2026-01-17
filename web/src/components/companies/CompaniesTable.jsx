import { Edit, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Table } from '../common/Table';
import { formatDate } from '../../utils/formatters';

export function CompaniesTable({
  companies,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  const columns = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.cnpj && (
            <div className="text-sm text-gray-500">{row.cnpj}</div>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contato',
      render: (row) => (
        <div>
          {row.email && <div className="text-sm">{row.email}</div>}
          {row.phone && <div className="text-sm text-gray-500">{row.phone}</div>}
        </div>
      ),
    },
    {
      key: 'user_count',
      label: 'Usuários',
      render: (row) => row.user_count || 0,
    },
    {
      key: 'sensor_count',
      label: 'Sensores',
      render: (row) => row.sensor_count || 0,
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
          {row.is_active ? 'Ativa' : 'Inativa'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Cadastro',
      render: (row) => formatDate(row.created_at),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-40',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
            title="Ver detalhes"
          >
            <Eye className="w-4 h-4" />
          </button>
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
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
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
    },
  ];

  return (
    <Table
      columns={columns}
      data={companies}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyMessage="Nenhuma empresa encontrada."
    />
  );
}
