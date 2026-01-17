import { SensorCard } from './SensorCard';

export function SensorList({ sensors }) {
  if (!sensors || sensors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhum sensor encontrado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sensors.map((sensor) => (
        <SensorCard key={sensor.serial_number} sensor={sensor} />
      ))}
    </div>
  );
}
