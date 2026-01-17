import { SensorCard } from './SensorCard';
import { Loading } from '../common/Loading';

export function SensorList({ sensors, basePath = '/sensors', isLoading, emptyMessage = 'Nenhum sensor encontrado.' }) {
  if (isLoading) {
    return <Loading />;
  }

  if (!sensors || sensors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sensors.map((sensor) => (
        <SensorCard key={sensor.serial_number} sensor={sensor} basePath={basePath} />
      ))}
    </div>
  );
}
