import { useState } from 'react';
import { Card, CardHeader } from '../components/common/Card';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ReadingsTable } from '../components/readings/ReadingsTable';
import { Pagination } from '../components/readings/Pagination';
import { useReadings } from '../hooks/useReadings';

export function Readings() {
  const [page, setPage] = useState(1);
  const [sensorFilter, setSensorFilter] = useState('');
  const limit = 20;

  const { data, isLoading, error } = useReadings({
    page,
    limit,
    sensor_id: sensorFilter || undefined,
    sort_by: 'received_at',
    sort_order: 'desc',
  });

  if (error) return <ErrorMessage message="Erro ao carregar leituras." />;

  const readings = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Leituras</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Filtrar por sensor..."
          value={sensorFilter}
          onChange={(e) => {
            setSensorFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <Card>
        <CardHeader
          title="Histórico de Leituras"
          subtitle={`${pagination.total} leituras encontradas`}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <ReadingsTable readings={readings} />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
