import { Card, CardHeader } from '../common/Card';
import { Loading } from '../common/Loading';
import { TimeSeriesChart } from '../charts/TimeSeriesChart';
import { useReadings } from '../../hooks/useReadings';

export function RecentReadingsChart({ sensorId, limit = 50, title = 'Leituras Recentes' }) {
  const { data: readingsData, isLoading } = useReadings({
    sensor_id: sensorId,
    limit,
    sort_by: 'received_at',
    sort_order: 'desc',
  });

  const readings = readingsData?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader title={title} subtitle={`Últimas ${limit} leituras`} />
        <div className="h-[300px] flex items-center justify-center">
          <Loading />
        </div>
      </Card>
    );
  }

  if (readings.length === 0) {
    return (
      <Card>
        <CardHeader title={title} subtitle={`Últimas ${limit} leituras`} />
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          Nenhuma leitura encontrada.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={title} subtitle={`Últimas ${limit} leituras`} />
      <TimeSeriesChart data={readings.slice().reverse()} height={300} />
    </Card>
  );
}
