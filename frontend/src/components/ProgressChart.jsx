// Line chart for values over time (weight, waist, body fat ...)
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatShortDate, formatNumber } from '../utils/format';

export default function ProgressChart({ data, dataKey, unit = '', color = '#1f9d6b', height = 260, name }) {
  const points = (data || []).filter((row) => row[dataKey] !== null && row[dataKey] !== undefined);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-mist text-sm text-ink-soft" style={{ height }}>
        No entries with this measurement yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="#e8eeeb" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12, fill: '#7d8c85' }} tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12, fill: '#7d8c85' }} tickLine={false} axisLine={false} allowDecimals={false} width={48} />
        <Tooltip
          labelFormatter={(value) => formatShortDate(value)}
          formatter={(value) => [`${formatNumber(value, 1)} ${unit}`, name || dataKey]}
          contentStyle={{ borderRadius: 10, border: '1px solid #dde6e1', fontSize: 13 }}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
