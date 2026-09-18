import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AdminListPage } from './pages/AdminListPage';
import { AdminAddPage } from './pages/AdminAddPage';
import { AdminEditPage } from './pages/AdminEditPage';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/admin" element={<AdminListPage />} />
            <Route path="/admin/add" element={<AdminAddPage />} />
            <Route path="/admin/edit/:id" element={<AdminEditPage />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4">
            E-Commerce Storefront
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
