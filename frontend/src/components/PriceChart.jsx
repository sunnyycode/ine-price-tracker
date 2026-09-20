import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '../utils/formatters';

export default function PriceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">No price history yet. Scrape the product to start collecting data.</p>
      </div>
    );
  }

  // Format data for chart - use scraped_at from DB schema
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.scraped_at).toLocaleDateString(),
    formattedTime: new Date(item.scraped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-semibold text-gray-800 mb-1">
            {new Date(item.scraped_at).toLocaleString()}
          </p>
          <p className="text-blue-600 font-bold">
            {formatPrice(item.price)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Stock: {item.stock || 'Unknown'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickMargin={10}
            minTickGap={30}
          />
          <YAxis
            tickFormatter={(value) => `$${value}`}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: '#DBEAFE', strokeWidth: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
