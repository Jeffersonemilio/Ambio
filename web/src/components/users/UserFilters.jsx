import { SearchInput } from '../common/SearchInput';
import { Select } from '../common/Select';

const userTypeOptions = [
  { value: 'ambio', label: 'Ambio' },
  { value: 'company', label: 'Empresa' },
];

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'analyst', label: 'Analista' },
  { value: 'support', label: 'Suporte' },
  { value: 'user', label: 'Usuário' },
];

const statusOptions = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' },
];

export function UserFilters({
  filters,
  onFilterChange,
  showUserType = true,
  companies = [],
}) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const companyOptions = companies.map((company) => ({
    value: company.id,
    label: company.name,
  }));

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <SearchInput
          value={filters.search || ''}
          onChange={(value) => handleChange('search', value)}
          placeholder="Buscar por nome ou email..."
        />
      </div>

      {showUserType && (
        <div className="w-40">
          <Select
            value={filters.userType || ''}
            onChange={(value) => handleChange('userType', value)}
            options={userTypeOptions}
            placeholder="Tipo"
          />
        </div>
      )}

      {filters.userType === 'company' && companies.length > 0 && (
        <div className="w-48">
          <Select
            value={filters.companyId || ''}
            onChange={(value) => handleChange('companyId', value)}
            options={companyOptions}
            placeholder="Empresa"
          />
        </div>
      )}

      <div className="w-40">
        <Select
          value={filters.role || ''}
          onChange={(value) => handleChange('role', value)}
          options={roleOptions}
          placeholder="Role"
        />
      </div>

      <div className="w-32">
        <Select
          value={filters.isActive !== undefined ? String(filters.isActive) : ''}
          onChange={(value) => handleChange('isActive', value === '' ? undefined : value)}
          options={statusOptions}
          placeholder="Status"
        />
      </div>
    </div>
  );
}
