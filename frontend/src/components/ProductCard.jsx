import { Link } from 'react-router-dom';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { formatPrice, formatRelativeTime } from '../utils/formatters';
import StockBadge from './StockBadge';

export default function ProductCard({ product, onScrape, isScraping }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-center bg-gray-50 h-48">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain mix-blend-multiply"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/400x400?text=No+Image';
            }}
          />
        ) : (
          <div className="text-gray-400">No Image</div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 min-h-[3rem]" title={product.name}>
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-4 mt-auto">
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(product.current_price)}
          </div>
          <StockBadge stock={product.current_stock} />
        </div>
        
        <div className="text-xs text-gray-500 mb-4 flex justify-between">
          <span>Updated: {product.last_scraped_at ? formatRelativeTime(product.last_scraped_at) : 'Never'}</span>
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
            <ExternalLink size={12} className="mr-1" /> Store
          </a>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Link 
            to={`/products/${product.id}`}
            className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors text-center"
          >
            Details
          </Link>
          <button 
            onClick={() => onScrape(product.id)}
            disabled={isScraping}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {isScraping ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              'Scrape Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
