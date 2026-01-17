import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SearchInput } from '../../components/common/SearchInput';
import { Select } from '../../components/common/Select';
import { CompaniesTable } from '../../components/companies/CompaniesTable';
import { useCompanies, useUpdateCompany, useDeleteCompany } from '../../hooks/useCompanies';

const statusOptions = [
  { value: 'true', label: 'Ativas' },
  { value: 'false', label: 'Inativas' },
];

export function CompaniesList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, company: null });
  const [toggleDialog, setToggleDialog] = useState({ open: false, company: null });

  const { data: companiesData, isLoading, error } = useCompanies({
    ...filters,
    ...pagination,
    sortBy,
    sortOrder,
  });

  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleSearchChange = (search) => {
    setFilters((prev) => ({ ...prev, search }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handleStatusChange = (isActive) => {
    setFilters((prev) => ({
      ...prev,
      isActive: isActive === '' ? undefined : isActive,
    }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  const handleView = (company) => {
    navigate(`/companies/${company.id}`);
  };

  const handleEdit = (company) => {
    navigate(`/companies/${company.id}/edit`);
  };

  const handleToggleActive = (company) => {
    setToggleDialog({ open: true, company });
  };

  const confirmToggleActive = async () => {
    if (!toggleDialog.company) return;

    try {
      await updateCompany.mutateAsync({
        id: toggleDialog.company.id,
        data: { isActive: !toggleDialog.company.is_active },
      });
      setToggleDialog({ open: false, company: null });
    } catch (err) {
      console.error('Erro ao atualizar empresa:', err);
    }
  };

  const handleDelete = (company) => {
    setDeleteDialog({ open: true, company });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.company) return;

    try {
      await deleteCompany.mutateAsync(deleteDialog.company.id);
      setDeleteDialog({ open: false, company: null });
    } catch (err) {
      console.error('Erro ao excluir empresa:', err);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Erro ao carregar empresas." />;

  const companies = companiesData?.data || [];
  const total = companiesData?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-500">
            {total} empresa{total !== 1 ? 's' : ''} cadastrada{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/companies/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                value={filters.search || ''}
                onChange={handleSearchChange}
                placeholder="Buscar por nome ou CNPJ..."
              />
            </div>
            <div className="w-32">
              <Select
                value={filters.isActive !== undefined ? String(filters.isActive) : ''}
                onChange={handleStatusChange}
                options={statusOptions}
                placeholder="Status"
              />
            </div>
          </div>
        </div>

        <CompaniesTable
          companies={companies}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />

        <Pagination
          total={total}
          limit={pagination.limit}
          offset={pagination.offset}
          onChange={handlePageChange}
        />
      </Card>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, company: null })}
        title="Excluir empresa"
        message={`Tem certeza que deseja excluir a empresa "${deleteDialog.company?.name}"? Todos os usuários e sensores associados serão desvinculados.`}
        confirmText="Excluir"
        isLoading={deleteCompany.isPending}
      />

      <ConfirmDialog
        isOpen={toggleDialog.open}
        onConfirm={confirmToggleActive}
        onCancel={() => setToggleDialog({ open: false, company: null })}
        title={toggleDialog.company?.is_active ? 'Desativar empresa' : 'Ativar empresa'}
        message={
          toggleDialog.company?.is_active
            ? `Tem certeza que deseja desativar a empresa "${toggleDialog.company?.name}"? Os usuários não poderão mais acessar o sistema.`
            : `Tem certeza que deseja ativar a empresa "${toggleDialog.company?.name}"?`
        }
        confirmText={toggleDialog.company?.is_active ? 'Desativar' : 'Ativar'}
        variant={toggleDialog.company?.is_active ? 'danger' : 'warning'}
        isLoading={updateCompany.isPending}
      />
    </div>
  );
}
