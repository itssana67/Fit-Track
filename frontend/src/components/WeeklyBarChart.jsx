// Bar chart for the last 7 days (workouts, calories consumed, calories burned)
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { formatNumber, formatShortDate } from '../utils/format';

export default function WeeklyBarChart({ data, dataKey, color, unit, name, target, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -4, bottom: 0 }}>
        <CartesianGrid stroke="#e8eeeb" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#7d8c85' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#7d8c85' }} tickLine={false} axisLine={false} allowDecimals={false} width={48} tickFormatter={(v) => formatNumber(v)} />
        <Tooltip
          cursor={{ fill: '#f2f6f4' }}
          labelFormatter={(_, payload) => formatShortDate(payload?.[0]?.payload?.date)}
          formatter={(value) => [`${formatNumber(value)} ${unit}`, name]}
          contentStyle={{ borderRadius: 10, border: '1px solid #dde6e1', fontSize: 13 }}
        />
        {target ? <ReferenceLine y={target} stroke="#7d8c85" strokeDasharray="4 4" label={{ value: 'Target', fontSize: 11, fill: '#7d8c85', position: 'insideTopRight' }} /> : null}
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
