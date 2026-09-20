export default function StatusBadge({ status }) {
  const statusStr = (status || '').toUpperCase();
  
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';

  if (statusStr === 'SUCCESS') {
    colorClass = 'bg-green-100 text-green-800 border-green-200';
  } else if (statusStr === 'RETRIED') {
    colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else if (statusStr === 'FAILED') {
    colorClass = 'bg-red-100 text-red-800 border-red-200';
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold border ${colorClass}`}>
      {statusStr || 'UNKNOWN'}
    </span>
  );
}
