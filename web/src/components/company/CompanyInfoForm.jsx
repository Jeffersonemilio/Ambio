import { useState } from 'react';
import { Building2, Mail, Phone, Calendar } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { InfoField, InfoFieldGroup } from '../common/InfoField';

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCnpj(cnpj) {
  if (!cnpj) return '-';
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function CompanyInfoForm({ company, canEdit, onSave, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
  });
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Nome da empresa é obrigatório');
      return;
    }

    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Erro ao salvar');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: company?.name || '',
      email: company?.email || '',
      phone: company?.phone || '',
    });
    setError(null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome da Empresa"
          value={formData.name}
          onChange={handleChange('name')}
          icon={Building2}
          placeholder="Razão social"
          autoFocus
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange('email')}
          icon={Mail}
          placeholder="contato@empresa.com"
        />

        <Input
          label="Telefone"
          value={formData.phone}
          onChange={handleChange('phone')}
          icon={Phone}
          placeholder="(11) 99999-9999"
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

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
    <div className="space-y-4">
      <InfoFieldGroup>
        <InfoField
          label="Nome"
          value={company?.name}
          icon={Building2}
          editable={canEdit}
          onEdit={() => setIsEditing(true)}
        />
        <InfoField
          label="CNPJ"
          value={formatCnpj(company?.cnpj)}
          icon={Building2}
        />
        <InfoField
          label="Email"
          value={company?.email || '-'}
          icon={Mail}
        />
        <InfoField
          label="Telefone"
          value={company?.phone || '-'}
          icon={Phone}
        />
        <InfoField
          label="Cadastrado em"
          value={formatDate(company?.createdAt)}
          icon={Calendar}
        />
      </InfoFieldGroup>

      {canEdit && !isEditing && (
        <Button variant="secondary" onClick={() => setIsEditing(true)}>
          Editar informações
        </Button>
      )}
    </div>
  );
}
