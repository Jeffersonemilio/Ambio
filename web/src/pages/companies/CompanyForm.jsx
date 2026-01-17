import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useCompany, useCreateCompany, useUpdateCompany } from '../../hooks/useCompanies';

export function CompanyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: companyData, isLoading, error } = useCompany(id);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (companyData) {
      setFormData({
        name: companyData.name || '',
        cnpj: companyData.cnpj || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        address: companyData.address || '',
      });
    }
  }, [companyData]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.cnpj && !/^\d{14}$/.test(formData.cnpj.replace(/\D/g, ''))) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCNPJ = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  };

  const handleCNPJChange = (e) => {
    const formatted = formatCNPJ(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 14) {
      handleChange('cnpj', formatted);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const data = {
      name: formData.name,
      cnpj: formData.cnpj.replace(/\D/g, '') || null,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
    };

    try {
      if (isEditing) {
        await updateCompany.mutateAsync({ id, data });
      } else {
        await createCompany.mutateAsync(data);
      }
      navigate('/companies');
    } catch (err) {
      console.error('Erro ao salvar empresa:', err);
      setErrors({ submit: err.message || 'Erro ao salvar empresa' });
    }
  };

  if (isEditing && isLoading) return <Loading />;
  if (isEditing && error) return <ErrorMessage message="Erro ao carregar empresa." />;

  const isSubmitting = createCompany.isPending || updateCompany.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/companies"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
          </h1>
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
              label="Nome da Empresa"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              required
            />

            <Input
              label="CNPJ"
              value={formData.cnpj}
              onChange={handleCNPJChange}
              error={errors.cnpj}
              placeholder="00.000.000/0000-00"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
            />

            <Input
              label="Telefone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(00) 00000-0000"
            />

            <div className="md:col-span-2">
              <Input
                label="Endereço"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link to="/companies">
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
                  {isEditing ? 'Salvar' : 'Criar Empresa'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
