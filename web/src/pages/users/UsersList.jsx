import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { UserFilters } from '../../components/users/UserFilters';
import { UsersTable } from '../../components/users/UsersTable';
import { useUsers, useUpdateUser, useDeleteUser } from '../../hooks/useUsers';
import { useCompanies } from '../../hooks/useCompanies';
import { useAuth } from '../../hooks/useAuth';

export function UsersList() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [toggleDialog, setToggleDialog] = useState({ open: false, user: null });

  const isAmbioUser = currentUser?.userType === 'ambio';

  const { data: usersData, isLoading, error } = useUsers({
    ...filters,
    ...pagination,
    sortBy,
    sortOrder,
  });

  const { data: companiesData } = useCompanies({ limit: 100 });
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  const handleEdit = (user) => {
    navigate(`/users/${user.id}`);
  };

  const handleToggleActive = (user) => {
    setToggleDialog({ open: true, user });
  };

  const confirmToggleActive = async () => {
    if (!toggleDialog.user) return;

    try {
      await updateUser.mutateAsync({
        id: toggleDialog.user.id,
        data: { isActive: !toggleDialog.user.is_active },
      });
      setToggleDialog({ open: false, user: null });
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  };

  const handleDelete = (user) => {
    setDeleteDialog({ open: true, user });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.user) return;

    try {
      await deleteUser.mutateAsync(deleteDialog.user.id);
      setDeleteDialog({ open: false, user: null });
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Erro ao carregar usuários." />;

  const users = usersData?.data || [];
  const total = usersData?.total || 0;
  const companies = companiesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">
            {total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/users/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <UserFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            showUserType={isAmbioUser}
            companies={companies}
          />
        </div>

        <UsersTable
          users={users}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          showCompany={isAmbioUser}
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
        onCancel={() => setDeleteDialog({ open: false, user: null })}
        title="Excluir usuário"
        message={`Tem certeza que deseja excluir o usuário "${deleteDialog.user?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={deleteUser.isPending}
      />

      <ConfirmDialog
        isOpen={toggleDialog.open}
        onConfirm={confirmToggleActive}
        onCancel={() => setToggleDialog({ open: false, user: null })}
        title={toggleDialog.user?.is_active ? 'Desativar usuário' : 'Ativar usuário'}
        message={
          toggleDialog.user?.is_active
            ? `Tem certeza que deseja desativar o usuário "${toggleDialog.user?.name}"? Ele não poderá mais acessar o sistema.`
            : `Tem certeza que deseja ativar o usuário "${toggleDialog.user?.name}"?`
        }
        confirmText={toggleDialog.user?.is_active ? 'Desativar' : 'Ativar'}
        variant={toggleDialog.user?.is_active ? 'danger' : 'warning'}
        isLoading={updateUser.isPending}
      />
    </div>
  );
}
