export default function StockBadge({ stock }) {
  const stockStr = (stock || '').toLowerCase();
  
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
  let text = stock || 'Unknown';

  if (stockStr.includes('in stock') || stockStr === 'available' || stockStr === 'true') {
    colorClass = 'bg-green-100 text-green-800 border-green-200';
    text = 'In Stock';
  } else if (stockStr.includes('out of stock') || stockStr === 'unavailable' || stockStr === 'false') {
    colorClass = 'bg-red-100 text-red-800 border-red-200';
    text = 'Out of Stock';
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {text}
    </span>
  );
}
