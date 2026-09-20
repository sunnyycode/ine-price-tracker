import { Plus, Check } from 'lucide-react';
import { formatPrice } from '../utils/formatters';
import StockBadge from './StockBadge';

export default function SearchResultCard({ product, onTrack, isTracking, isTracked }) {
  const imageUrl = product.image_url || product.image;
  const displayUrl = (() => {
    try { return new URL(product.url).hostname; }
    catch { return product.url; }
  })();

  return (
    <div className="flex bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="w-32 h-32 flex-shrink-0 bg-gray-50 border-r border-gray-100 flex items-center justify-center p-2">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain mix-blend-multiply"
          />
        ) : (
          <div className="text-gray-400 text-xs text-center">No Image</div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-medium text-gray-900 truncate mb-1" title={product.name}>
            {product.name}
          </h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
            <StockBadge stock={product.stock} />
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500 truncate mr-2" title={product.url}>
            {displayUrl}
          </span>
          <button
            onClick={() => onTrack(product)}
            disabled={isTracking || isTracked}
            className={`flex items-center py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
              isTracked 
                ? 'bg-green-100 text-green-800 cursor-default' 
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70'
            }`}
          >
            {isTracked ? (
              <>
                <Check size={16} className="mr-1.5" />
                Tracked
              </>
            ) : isTracking ? (
              'Tracking...'
            ) : (
              <>
                <Plus size={16} className="mr-1.5" />
                Track
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
