import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Radio, Building2, Plus } from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Table } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { SearchInput } from '../../components/common/SearchInput';
import { Select } from '../../components/common/Select';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SensorConfigurationModal } from '../../components/sensors/SensorConfigurationModal';
import { SensorCreationModal } from '../../components/sensors/SensorCreationModal';
import { useUnassignedSensors, useAssignSensor } from '../../hooks/useSensors';
import { useCompanies } from '../../hooks/useCompanies';
import { formatDate } from '../../utils/formatters';

export function SensorAssignment() {
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [assignDialog, setAssignDialog] = useState({ open: false });
  const [configModal, setConfigModal] = useState({ open: false, sensor: null });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: sensorsData, isLoading, error } = useUnassignedSensors({
    search,
    ...pagination,
  });

  const { data: companiesData } = useCompanies({ limit: 100, isActive: 'true' });
  const assignSensor = useAssignSensor();

  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  const handleSelectChange = (ids) => {
    setSelectedSensors(ids);
  };

  const handleAssignClick = () => {
    if (selectedSensors.length === 0 || !selectedCompany) return;
    setAssignDialog({ open: true });
  };

  const confirmAssign = async () => {
    try {
      const results = await Promise.all(
        selectedSensors.map((sensorId) =>
          assignSensor.mutateAsync({ sensorId, companyId: selectedCompany })
        )
      );

      // Se atribuiu apenas 1 sensor, abrir modal de configuracao
      if (selectedSensors.length === 1 && results[0]) {
        const assignedSensor = results[0];
        setConfigModal({ open: true, sensor: assignedSensor });
      }

      setSelectedSensors([]);
      setSelectedCompany('');
      setAssignDialog({ open: false });
    } catch (err) {
      console.error('Erro ao atribuir sensores:', err);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Erro ao carregar sensores." />;

  const sensors = sensorsData?.data || [];
  const total = sensorsData?.total || 0;
  const companies = companiesData?.data || [];

  const companyOptions = companies.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const selectedCompanyName = companies.find((c) => c.id === selectedCompany)?.name;

  const columns = [
    {
      key: 'serial_number',
      label: 'Serial Number',
      render: (row) => (
        <span className="font-mono font-medium">{row.serial_number}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nome',
      render: (row) => row.name || '-',
    },
    {
      key: 'reading_count',
      label: 'Leituras',
      render: (row) => row.reading_count || 0,
    },
    {
      key: 'last_reading_at',
      label: 'Última Leitura',
      render: (row) =>
        row.last_reading_at ? formatDate(row.last_reading_at) : 'Nunca',
    },
    {
      key: 'created_at',
      label: 'Cadastro',
      render: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/sensors"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Atribuição de Sensores
            </h1>
            <p className="text-sm text-gray-500">
              {total} sensor{total !== 1 ? 'es' : ''} não atribuído{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Sensor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Radio className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sensores Selecionados</p>
              <p className="text-2xl font-bold">{selectedSensors.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Atribuir para</p>
              <Select
                value={selectedCompany}
                onChange={setSelectedCompany}
                options={companyOptions}
                placeholder="Selecione a empresa"
              />
            </div>
          </div>
        </Card>
      </div>

      {selectedSensors.length > 0 && selectedCompany && (
        <div className="flex justify-end">
          <Button onClick={handleAssignClick}>
            Atribuir {selectedSensors.length} sensor{selectedSensors.length !== 1 ? 'es' : ''}
          </Button>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-gray-200">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por serial number..."
          />
        </div>

        <Table
          columns={columns}
          data={sensors}
          selectable
          selectedIds={selectedSensors}
          onSelectChange={handleSelectChange}
          emptyMessage="Nenhum sensor não atribuído encontrado."
        />

        <Pagination
          total={total}
          limit={pagination.limit}
          offset={pagination.offset}
          onChange={handlePageChange}
        />
      </Card>

      <ConfirmDialog
        isOpen={assignDialog.open}
        onConfirm={confirmAssign}
        onCancel={() => setAssignDialog({ open: false })}
        title="Atribuir sensores"
        message={`Tem certeza que deseja atribuir ${selectedSensors.length} sensor${selectedSensors.length !== 1 ? 'es' : ''} para a empresa "${selectedCompanyName}"?`}
        confirmText="Atribuir"
        variant="warning"
        isLoading={assignSensor.isPending}
      />

      <SensorConfigurationModal
        isOpen={configModal.open}
        onClose={() => setConfigModal({ open: false, sensor: null })}
        sensor={configModal.sensor}
      />

      <SensorCreationModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
