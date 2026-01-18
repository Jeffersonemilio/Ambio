import { AlertTriangle, CheckCircle, Clock, Bell } from 'lucide-react';
import { StatCard } from '../common/StatCard';

export function AlertStats({ data = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // Agregar estatisticas
  const stats = {
    active: 0,
    resolved: 0,
    exhausted: 0,
    total: 0,
  };

  data.forEach(item => {
    const count = parseInt(item.count, 10) || 0;
    stats.total += count;
    if (item.status === 'active') stats.active += count;
    else if (item.status === 'resolved') stats.resolved += count;
    else if (item.status === 'exhausted') stats.exhausted += count;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Alertas Ativos"
        value={stats.active}
        icon={AlertTriangle}
        iconColor="text-red-500"
        trend={stats.active > 0 ? 'up' : null}
        trendColor={stats.active > 0 ? 'text-red-500' : null}
      />
      <StatCard
        title="Resolvidos"
        value={stats.resolved}
        icon={CheckCircle}
        iconColor="text-green-500"
      />
      <StatCard
        title="Esgotados"
        value={stats.exhausted}
        icon={Clock}
        iconColor="text-yellow-500"
      />
      <StatCard
        title="Total"
        value={stats.total}
        icon={Bell}
        iconColor="text-blue-500"
      />
    </div>
  );
}
