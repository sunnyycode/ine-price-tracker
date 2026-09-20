import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex flex-col sm:flex-row items-center gap-4 my-4">
      <div className="flex items-center text-red-700 shrink-0">
        <AlertCircle size={24} className="mr-2" />
        <span className="font-medium">Error</span>
      </div>
      <p className="text-red-700 flex-1">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors whitespace-nowrap"
        >
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      )}
    </div>
  );
}
