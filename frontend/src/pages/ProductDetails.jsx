import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { getTrackedProduct, getPriceHistory, getScrapeLogs, scrapeProduct } from '../services/api';
import { formatPrice, formatRelativeTime, formatDate } from '../utils/formatters';
import PriceChart from '../components/PriceChart';
import ScrapeLogsTable from '../components/ScrapeLogsTable';
import StockBadge from '../components/StockBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scraping, setScraping] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productRes, historyRes, logsRes] = await Promise.all([
        getTrackedProduct(id),
        getPriceHistory(id),
        getScrapeLogs(id),
      ]);

      setProduct(productRes.data?.data || productRes.data);
      setHistory(historyRes.data?.data || []);
      setLogs(logsRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch product details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleScrape = async () => {
    try {
      setScraping(true);
      const res = await scrapeProduct(id);
      if (res.data?.success) {
        toast.success('Product scraped successfully!');
      } else {
        toast.error(res.data?.error || 'Scrape completed with errors.');
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to scrape product.');
    } finally {
      setScraping(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading product details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!product) return <ErrorMessage message="Product not found." />;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} className="mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Product Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="md:flex">
          <div className="md:w-1/3 p-8 border-b md:border-b-0 md:border-r border-gray-200 flex items-center justify-center bg-gray-50">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-64 object-contain mix-blend-multiply"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-2" />
                No Image
              </div>
            )}
          </div>

          <div className="md:w-2/3 p-6 sm:p-8 flex flex-col">
            <div className="flex justify-between items-start gap-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
                title="View on Store"
              >
                <ExternalLink size={20} />
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 mt-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Price</p>
                <p className="text-3xl font-bold text-gray-900">{formatPrice(product.current_price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Availability</p>
                <StockBadge stock={product.current_stock} />
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                <p className="text-gray-900 font-medium">
                  {product.last_scraped_at ? formatDate(product.last_scraped_at) : 'Never'}
                  {product.last_scraped_at && (
                    <span className="text-gray-500 text-sm ml-2">
                      ({formatRelativeTime(product.last_scraped_at)})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-auto flex pt-4 border-t border-gray-100">
              <button
                onClick={handleScrape}
                disabled={scraping}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
              >
                <RefreshCw size={18} className={scraping ? 'animate-spin' : ''} />
                {scraping ? 'Scraping...' : 'Force Scrape Now'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Price History Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Price History</h2>
        <PriceChart data={history} />
      </div>

      {/* Scrape Logs */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Scrape Logs</h2>
        <ScrapeLogsTable logs={logs} />
      </div>
    </div>
  );
}
