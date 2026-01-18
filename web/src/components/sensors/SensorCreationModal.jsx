import { useState, useEffect } from 'react';
import { Radio, Building2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { useCreateSensor } from '../../hooks/useSensors';
import { useCompanies } from '../../hooks/useCompanies';
import { useAuth } from '../../hooks/useAuth';

export function SensorCreationModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    description: '',
    companyId: '',
  });
  const [errors, setErrors] = useState({});

  const { user } = useAuth();
  const createSensor = useCreateSensor();
  const { data: companiesData } = useCompanies({ limit: 100, isActive: 'true' });

  const isAmbioUser = user?.userType === 'ambio';
  const companies = companiesData?.data || [];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        serialNumber: '',
        name: '',
        description: '',
        companyId: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number e obrigatorio';
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.serialNumber.trim())) {
      newErrors.serialNumber = 'Apenas letras, numeros, _ e -';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const data = {
        serialNumber: formData.serialNumber.trim(),
      };

      if (formData.name.trim()) {
        data.name = formData.name.trim();
      }

      if (formData.description.trim()) {
        data.description = formData.description.trim();
      }

      if (isAmbioUser && formData.companyId) {
        data.companyId = formData.companyId;
      }

      await createSensor.mutateAsync(data);

      onSuccess?.();
      onClose();
    } catch (error) {
      if (error.message?.includes('ja existe') || error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        setErrors({ serialNumber: 'Este serial number ja esta cadastrado' });
      } else {
        setErrors({ submit: error.message || 'Erro ao criar sensor' });
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Sensor" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        <Input
          label="Serial Number"
          icon={Radio}
          placeholder="Ex: SN-2024-001"
          value={formData.serialNumber}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, serialNumber: e.target.value }));
            if (errors.serialNumber) setErrors(prev => ({ ...prev, serialNumber: undefined }));
          }}
          error={errors.serialNumber}
          required
        />

        <Input
          label="Nome (opcional)"
          placeholder="Ex: Sensor Camara Fria 01"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descricao (opcional)
          </label>
          <textarea
            placeholder="Descricao adicional do sensor..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {isAmbioUser && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4" />
              Atribuir a Empresa (opcional)
            </label>
            <Select
              value={formData.companyId}
              onChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
              options={companies.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Deixar sem atribuicao"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se nao selecionar, o sensor ficara disponivel para atribuicao posterior.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={createSensor.isPending}>
            Criar Sensor
          </Button>
        </div>
      </form>
    </Modal>
  );
}
