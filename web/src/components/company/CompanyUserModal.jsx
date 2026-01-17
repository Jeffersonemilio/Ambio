import { useState } from 'react';
import { X, User, Mail } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

const roleOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'analyst', label: 'Analista' },
  { value: 'user', label: 'Usuário' },
];

function getInitialFormData(user) {
  if (user) {
    return {
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      isActive: user.isActive !== false,
    };
  }
  return {
    name: '',
    email: '',
    role: 'user',
    isActive: true,
  };
}

export function CompanyUserModal({ isOpen, onClose, user, onSave, isSaving }) {
  const isEditing = !!user;
  const [formData, setFormData] = useState(() => getInitialFormData(user));
  const [error, setError] = useState(null);

  // Reset form when user changes (modal opens with different user)
  const [prevUser, setPrevUser] = useState(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setFormData(getInitialFormData(user));
    setError(null);
  }

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!isEditing && !formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    try {
      if (isEditing) {
        await onSave({
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
        });
      } else {
        await onSave({
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao salvar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <Input
              label="Nome"
              value={formData.name}
              onChange={handleChange('name')}
              icon={User}
              placeholder="Nome completo"
              autoFocus
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              icon={Mail}
              placeholder="email@empresa.com"
              disabled={isEditing}
            />
            {isEditing && (
              <p className="text-xs text-gray-500 -mt-2">
                O email não pode ser alterado
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Função
              </label>
              <select
                value={formData.role}
                onChange={handleChange('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleChange('isActive')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Usuário ativo
                </label>
              </div>
            )}

            {!isEditing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                Uma senha temporária será enviada para o email informado.
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Usuário'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
