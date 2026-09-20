import { Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';

export default function SummaryCards({ total, successful, failed, lastScrape }) {
  const cards = [
    {
      title: 'Tracked Products',
      value: total || 0,
      icon: <Package className="w-8 h-8 text-blue-600" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900'
    },
    {
      title: 'Successful Scrapes',
      value: successful || 0,
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-900'
    },
    {
      title: 'Failed Scrapes',
      value: failed || 0,
      icon: <XCircle className="w-8 h-8 text-red-600" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-900'
    },
    {
      title: 'Last Scrape',
      value: lastScrape ? formatRelativeTime(lastScrape) : 'Never',
      icon: <Clock className="w-8 h-8 text-purple-600" />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-900'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className={`${card.bgColor} rounded-xl p-5 border border-white/40 shadow-sm flex items-center gap-4`}>
          <div className="p-3 bg-white/60 rounded-lg shadow-sm">
            {card.icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
