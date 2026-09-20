import { formatDate, formatDuration, formatPrice } from '../utils/formatters';
import StatusBadge from './StatusBadge';
import StockBadge from './StockBadge';

export default function ScrapeLogsTable({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No scrape logs available yet.</p>
      </div>
    );
  }

  // Sort logs by newest first using created_at from DB schema
  const sortedLogs = [...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempt</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedLogs.map((log, idx) => (
            <tr key={log.id || idx} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {formatDate(log.created_at)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {log.attempt_number || 1}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <StatusBadge status={log.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                {log.price != null ? formatPrice(log.price) : '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {log.stock ? <StockBadge stock={log.stock} /> : '-'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDuration(log.response_time_ms)}
              </td>
              <td className="px-4 py-3 text-sm text-red-600 truncate max-w-xs" title={log.error_message}>
                {log.error_message || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
