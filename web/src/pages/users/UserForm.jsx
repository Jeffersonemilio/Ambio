import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useUser, useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useCompanies } from '../../hooks/useCompanies';
import { useAuth } from '../../hooks/useAuth';

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'analyst', label: 'Analista' },
  { value: 'support', label: 'Suporte' },
  { value: 'user', label: 'Usuário' },
];

const userTypeOptions = [
  { value: 'ambio', label: 'Ambio' },
  { value: 'company', label: 'Empresa' },
];

export function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isEditing = !!id;

  const { data: userData, isLoading: userLoading, error: userError } = useUser(id);
  const { data: companiesData } = useCompanies({ limit: 100 });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: 'company',
    companyId: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});

  const isAmbioUser = currentUser?.userType === 'ambio';

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        userType: userData.user_type || 'company',
        companyId: userData.company_id || '',
        role: userData.role || 'user',
      });
    }
  }, [userData]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.role) {
      newErrors.role = 'Role é obrigatório';
    }

    if (formData.userType === 'company' && !formData.companyId) {
      newErrors.companyId = 'Empresa é obrigatória para usuários de empresa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Se mudar para tipo Ambio, limpar companyId
    if (field === 'userType' && value === 'ambio') {
      setFormData((prev) => ({ ...prev, [field]: value, companyId: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const data = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      userType: formData.userType,
      companyId: formData.userType === 'company' ? formData.companyId : null,
    };

    try {
      if (isEditing) {
        await updateUser.mutateAsync({ id, data });
      } else {
        await createUser.mutateAsync(data);
      }
      navigate('/users');
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      setErrors({ submit: err.message || 'Erro ao salvar usuário' });
    }
  };

  if (isEditing && userLoading) return <Loading />;
  if (isEditing && userError) return <ErrorMessage message="Erro ao carregar usuário." />;

  const companies = companiesData?.data || [];
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const isSubmitting = createUser.isPending || updateUser.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/users"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </h1>
          {!isEditing && (
            <p className="text-sm text-gray-500">
              Uma senha temporária será enviada por email
            </p>
          )}
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              required
              disabled={isEditing}
            />

            {isAmbioUser && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Usuário
                </label>
                <Select
                  value={formData.userType}
                  onChange={(value) => handleChange('userType', value)}
                  options={userTypeOptions}
                />
              </div>
            )}

            {formData.userType === 'company' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Empresa <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.companyId}
                  onChange={(value) => handleChange('companyId', value)}
                  options={companyOptions}
                  placeholder="Selecione a empresa"
                />
                {errors.companyId && (
                  <p className="text-sm text-red-600">{errors.companyId}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.role}
                onChange={(value) => handleChange('role', value)}
                options={roleOptions}
              />
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link to="/users">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Salvar' : 'Criar Usuário'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
