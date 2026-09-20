import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Package } from 'lucide-react';
import { getTrackedProducts, scrapeProduct } from '../services/api';
import SummaryCards from '../components/SummaryCards';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrapingIds, setScrapingIds] = useState(new Set());
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, lastScrape: null });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTrackedProducts();
      const productList = res.data?.data || [];
      setProducts(productList);

      // Calculate stats from product data
      const withPrice = productList.filter(p => p.current_price !== null);
      const withoutPrice = productList.filter(p => p.last_scraped_at && p.current_price === null);

      // Find latest scrape time
      const scrapeTimes = productList
        .map(p => p.last_scraped_at)
        .filter(Boolean)
        .map(date => new Date(date).getTime());

      const lastScrape = scrapeTimes.length > 0
        ? new Date(Math.max(...scrapeTimes)).toISOString()
        : null;

      setStats({
        total: productList.length,
        successful: withPrice.length,
        failed: withoutPrice.length,
        lastScrape,
      });
    } catch (err) {
      const detail = err.response?.data?.error || err.message || 'Failed to fetch tracked products.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleScrape = async (id) => {
    try {
      setScrapingIds(prev => new Set(prev).add(id));
      const res = await scrapeProduct(id);
      if (res.data?.success) {
        toast.success('Product scraped successfully!');
      } else {
        toast.error(res.data?.error || 'Scrape completed with errors');
      }
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to scrape product.');
    } finally {
      setScrapingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (loading) return <LoadingSpinner text="Loading your dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProducts} />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <Link
          to="/search"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      <SummaryCards {...stats} />

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No products tracked yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start tracking products to monitor their prices and stock availability over time.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Search and Add Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onScrape={handleScrape}
              isScraping={scrapingIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
