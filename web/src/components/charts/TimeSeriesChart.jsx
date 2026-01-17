import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TimeSeriesChart({ data, showTemperature = true, showHumidity = true, height = 300 }) {
  const formatXAxis = (tickItem) => {
    return format(new Date(tickItem), 'HH:mm', { locale: ptBR });
  };

  const formatTooltipLabel = (label) => {
    return format(new Date(label), 'dd/MM HH:mm', { locale: ptBR });
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="received_at"
          tickFormatter={formatXAxis}
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis yAxisId="temp" stroke="#ef4444" fontSize={12} />
        <YAxis yAxisId="hum" orientation="right" stroke="#3b82f6" fontSize={12} />
        <Tooltip
          labelFormatter={formatTooltipLabel}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend />
        {showTemperature && (
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temperature"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Temperatura (°C)"
          />
        )}
        {showHumidity && (
          <Line
            yAxisId="hum"
            type="monotone"
            dataKey="humidity"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Umidade (%)"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
