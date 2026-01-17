import { useState } from 'react';
import { Users, Plus, Edit2, UserX, UserCheck, Search } from 'lucide-react';
import { Button } from '../common/Button';
import { CompanyUserModal } from './CompanyUserModal';

const roleLabels = {
  admin: 'Administrador',
  analyst: 'Analista',
  user: 'Usuário',
};

const roleBadgeColors = {
  admin: 'bg-purple-100 text-purple-700',
  analyst: 'bg-blue-100 text-blue-700',
  user: 'bg-gray-100 text-gray-700',
};

function UserRow({ user, canEdit, onEdit }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            roleBadgeColors[user.role] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {roleLabels[user.role] || user.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 text-sm ${
            user.isActive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {user.isActive ? (
            <>
              <UserCheck className="w-4 h-4" />
              Ativo
            </>
          ) : (
            <>
              <UserX className="w-4 h-4" />
              Inativo
            </>
          )}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {canEdit && (
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Editar usuário"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

export function CompanyUsersManager({
  users,
  isLoading,
  canEdit,
  onCreateUser,
  onUpdateUser,
  isCreating,
  isUpdating,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users?.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => u.isActive).length || 0,
    admins: users?.filter((u) => u.role === 'admin').length || 0,
    analysts: users?.filter((u) => u.role === 'analyst').length || 0,
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    if (editingUser) {
      await onUpdateUser({ userId: editingUser.id, data });
    } else {
      await onCreateUser(data);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-semibold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-500">Ativos</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-semibold text-purple-600">{stats.admins}</div>
          <div className="text-sm text-gray-500">Admins</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-semibold text-blue-600">{stats.analysts}</div>
          <div className="text-sm text-gray-500">Analistas</div>
        </div>
      </div>

      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {canEdit && (
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-1" />
            Novo Usuário
          </Button>
        )}
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500">Carregando usuários...</p>
        </div>
      ) : filteredUsers?.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers?.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  canEdit={canEdit}
                  onEdit={handleOpenEdit}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <CompanyUserModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        user={editingUser}
        onSave={handleSave}
        isSaving={isCreating || isUpdating}
      />
    </div>
  );
}
