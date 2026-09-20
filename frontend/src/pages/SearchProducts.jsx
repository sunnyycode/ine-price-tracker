import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchProducts, getTrackedProducts, trackProduct } from '../services/api';
import SearchResultCard from '../components/SearchResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function SearchProducts() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trackedIds, setTrackedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackingIds, setTrackingIds] = useState(new Set());
  const [searched, setSearched] = useState(false);

  const searchTimeoutRef = useRef(null);

  // Fetch already tracked products to show "Already Tracked" state
  useEffect(() => {
    getTrackedProducts()
      .then(res => {
        const ids = new Set((res.data?.data || []).map(p => p.store_product_id));
        setTrackedIds(ids);
      })
      .catch(err => console.error('Failed to fetch tracked products:', err));
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 2) {
      setLoading(true);
      setError(null);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await searchProducts(query);
          setResults(res.data?.data || res.data?.products || []);
          setSearched(true);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to search products.');
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setSearched(false);
      setLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const handleTrack = async (product) => {
    const storeProductId = product.storeProductId || product.store_product_id || product.url;
    try {
      setTrackingIds(prev => new Set(prev).add(storeProductId));
      await trackProduct({
        storeProductId,
        name: product.name,
        url: product.url,
        imageUrl: product.image || product.imageUrl || product.image_url,
      });
      toast.success(`Now tracking "${product.name}"!`);
      setTrackedIds(prev => new Set(prev).add(storeProductId));
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Product is already being tracked.');
        setTrackedIds(prev => new Set(prev).add(storeProductId));
      } else {
        toast.error(err.response?.data?.error || 'Failed to track product.');
      }
    } finally {
      setTrackingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(storeProductId);
        return newSet;
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Search Products</h2>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-4 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-lg shadow-sm"
          placeholder="Search for laptops, phones, electronics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            onClick={() => setQuery('')}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner text="Searching products from the store..." />
      ) : searched && results.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
          <SearchIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No results found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((product, idx) => {
            const pid = product.storeProductId || product.store_product_id || product.url;
            return (
              <SearchResultCard
                key={pid || idx}
                product={product}
                onTrack={handleTrack}
                isTracking={trackingIds.has(pid)}
                isTracked={trackedIds.has(pid)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
