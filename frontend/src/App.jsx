import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SearchProducts from './pages/SearchProducts';
import ProductDetails from './pages/ProductDetails';

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<SearchProducts />} />
          <Route path="/products/:id" element={<ProductDetails />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
