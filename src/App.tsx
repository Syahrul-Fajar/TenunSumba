/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ProductView from './components/ProductView';
import ContactView from './components/ContactView';
import AdminView from './components/AdminView';
import ProductDetailModal from './components/ProductDetailModal';
import { Product } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = React.useState<'home' | 'produk' | 'kontak' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  
  // Center unified states for instant synchronization
  const [products, setProducts] = React.useState<Product[]>([]);

  const refreshCatalog = React.useCallback(async () => {
    try {
      const { dbService } = await import('./lib/supabase');
      const list = await dbService.getAllProducts();
      setProducts(list);
    } catch (err) {
      console.error('Failed to sync catalog at root level:', err);
    }
  }, []);

  // Fetch initial data on mount
  React.useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  // URL Path is the single source of truth for navigation state
  React.useEffect(() => {
    const handleNavigationSync = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      
      if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        setCurrentTab('admin');
      } else if (path === '/produk' || hash === '#/produk' || hash === '#produk') {
        setCurrentTab('produk');
      } else if (path === '/kontak' || hash === '#/kontak' || hash === '#kontak') {
        setCurrentTab('kontak');
      } else {
        if (path === '/' && !hash) {
          setCurrentTab('home');
        }
      }
    };

    // Run once on load
    handleNavigationSync();

    // Listen to direct URL modification activities
    window.addEventListener('popstate', handleNavigationSync);
    window.addEventListener('hashchange', handleNavigationSync);
    return () => {
      window.removeEventListener('popstate', handleNavigationSync);
      window.removeEventListener('hashchange', handleNavigationSync);
    };
  }, []);

  // Sync tab choices back to URL in an elegant way
  const changeTab = (tab: 'home' | 'produk' | 'kontak' | 'admin') => {
    setCurrentTab(tab);
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    // Update history only if it's different and not the hash routing
    const pathMapping: Record<string, string> = {
      home: '/',
      produk: '/produk',
      kontak: '/kontak',
      admin: '/admin'
    };
    
    const targetPath = pathMapping[tab] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  return (
    <div id="app-root" className="min-h-screen flex flex-col justify-between bg-brand-cream text-stone-800 font-sans selection:bg-brand-gold selection:text-brand-brown-dark transition-colors duration-500">
      
      {/* Dynamic Navigation Header */}
      <Header currentTab={currentTab} setCurrentTab={changeTab} />

      {/* Main Reactive Content Area */}
      <main className="flex-grow">
        {currentTab === 'home' && (
          <HomeView 
            setCurrentTab={changeTab} 
            onSelectProduct={(p) => setSelectedProduct(p)} 
            products={products}
          />
        )}
        
        {currentTab === 'produk' && (
          <ProductView 
            onSelectProduct={(p) => setSelectedProduct(p)} 
            products={products}
          />
        )}
        
        {currentTab === 'kontak' && (
          <ContactView />
        )}

        {currentTab === 'admin' && (
          <AdminView onRefresh={refreshCatalog} />
        )}
      </main>

      {/* Dynamic Pop-up Product Detail Modal Overlay */}
      <ProductDetailModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      {/* Shared Deep Brown Footer */}
      <Footer setCurrentTab={changeTab} />

    </div>
  );
}
