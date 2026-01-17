import { useState } from 'react';
import { User, Mail, Building2, Calendar, Clock } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { InfoField, InfoFieldGroup } from '../common/InfoField';

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PersonalInfoForm({
  user,
  onSave,
  isSaving = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError('Nome deve ter no mínimo 2 caracteres');
      return;
    }

    try {
      await onSave({ name: name.trim() });
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Erro ao salvar');
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setError(null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={User}
          error={error}
          placeholder="Seu nome completo"
          autoFocus
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <InfoFieldGroup>
      <InfoField
        label="Nome"
        value={user?.name}
        icon={User}
        editable
        onEdit={() => setIsEditing(true)}
      />
      <InfoField
        label="Email"
        value={user?.email}
        icon={Mail}
      />
      {user?.companyName && (
        <InfoField
          label="Empresa"
          value={user.companyName}
          icon={Building2}
        />
      )}
      <InfoField
        label="Membro desde"
        value={formatDate(user?.createdAt)}
        icon={Calendar}
      />
      <InfoField
        label="Último acesso"
        value={formatDate(user?.lastLoginAt)}
        icon={Clock}
      />
    </InfoFieldGroup>
  );
}
