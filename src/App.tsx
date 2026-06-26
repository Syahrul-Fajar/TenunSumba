import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ProductView from './components/ProductView';
import EdukasiView from './components/EdukasiView';
import ContactView from './components/ContactView';
import AdminView from './components/AdminView';
import ProductDetailModal from './components/ProductDetailModal';
import { Product } from './types';
import { dbService } from './lib/supabase';

type Tab = 'home' | 'produk' | 'edukasi' | 'kontak' | 'admin';

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const refreshCatalog = useCallback(async () => {
    try {
      const list = await dbService.getAllProducts();
      setProducts(list);
    } catch (err) {
      console.error('Gagal sinkronisasi katalog:', err);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
    
    const handleNavSync = () => {
      const path = window.location.pathname.replace('/', '') || 'home';
      if (['home', 'produk', 'edukasi', 'kontak', 'admin'].includes(path)) {
        setCurrentTab(path as Tab);
      }
    };
    
    handleNavSync();
    window.addEventListener('popstate', handleNavSync);
    return () => window.removeEventListener('popstate', handleNavSync);
  }, [refreshCatalog]);

  const changeTab = (tab: Tab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
    const targetPath = tab === 'home' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  const isPublicView = currentTab !== 'admin';

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-[#FBF8F4] text-[#3D1A0A] font-sans selection:bg-[#C8973A] selection:text-white transition-colors duration-300">
      
      {isPublicView && <Header currentTab={currentTab} setCurrentTab={changeTab} />}

      <main className="flex-grow flex flex-col">
        {currentTab === 'home' && <HomeView setCurrentTab={changeTab} onSelectProduct={setSelectedProduct} products={products} />}
        {currentTab === 'produk' && <ProductView onSelectProduct={setSelectedProduct} products={products} isAdmin={isAdmin} onRefresh={refreshCatalog} />}
        {currentTab === 'edukasi' && <EdukasiView />}
        {currentTab === 'kontak' && <ContactView />}
        {currentTab === 'admin' && <AdminView onRefresh={refreshCatalog} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />}
      </main>

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {isPublicView && <Footer setCurrentTab={changeTab} />}
      
    </div>
  );
}