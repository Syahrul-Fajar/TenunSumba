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
import { dbService, isSupabaseConfigured, supabase } from './lib/supabase';

type Tab = 'home' | 'produk' | 'edukasi' | 'kontak' | 'admin';

import { X, Trash2, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('seraphine_admin_auth') === 'true';
  });

  const handleSetIsAdmin = (val: boolean) => {
    setIsAdmin(val);
    if (val) {
      sessionStorage.setItem('seraphine_admin_auth', 'true');
    } else {
      sessionStorage.removeItem('seraphine_admin_auth');
    }
  };

  const [products, setProducts] = useState<Product[]>([]);
  
  // Shopping Cart States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  
  // Checkout Form States
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', address: '' });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Load cart from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('seraphine_cart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Gagal memuat keranjang belanja:', err);
    }
  }, []);

  // Save cart to LocalStorage on changes
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem('seraphine_cart', JSON.stringify(items));
    } catch (err) {
      console.error('Gagal menyimpan keranjang belanja:', err);
    }
  };

  const addToCart = (product: Product, qty: number) => {
    const existingIdx = cartItems.findIndex(item => item.product.id === product.id);
    const updated = [...cartItems];
    if (existingIdx !== -1) {
      const maxStock = product.stock ?? 5;
      updated[existingIdx].quantity = Math.min(maxStock, updated[existingIdx].quantity + qty);
    } else {
      updated.push({ product, quantity: qty });
    }
    saveCart(updated);
    setIsCartOpen(true); // Auto-open cart drawer for feedback!
  };

  const removeFromCart = (productId: string) => {
    const updated = cartItems.filter(item => item.product.id !== productId);
    saveCart(updated);
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    const updated = cartItems.map(item => {
      if (item.product.id === productId) {
        const maxStock = item.product.stock ?? 5;
        return { ...item, quantity: Math.max(1, Math.min(maxStock, qty)) };
      }
      return item;
    });
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
    setIsCheckoutMode(false);
    setCheckoutForm({ name: '', phone: '', address: '' });
  };

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
    
    let channel: any;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('public-products-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'produk' }, () => {
          refreshCatalog();
        })
        .subscribe();
    }
    
    const handleNavSync = () => {
      const path = window.location.pathname.replace('/', '') || 'home';
      if (['home', 'produk', 'edukasi', 'kontak', 'admin'].includes(path)) {
        setCurrentTab(path as Tab);
      }
    };
    
    handleNavSync();
    window.addEventListener('popstate', handleNavSync);
    return () => {
      window.removeEventListener('popstate', handleNavSync);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshCatalog]);

  const changeTab = (tab: Tab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
    const targetPath = tab === 'home' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address) {
      setOrderError('Harap lengkapi seluruh kolom pengiriman wajib.');
      return;
    }
    setIsSubmittingOrder(true);
    setOrderError('');
    
    const totalPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const orderItems = cartItems.map(item => ({
      productId: item.product.id,
      productTitle: item.product.title,
      productCode: item.product.code,
      price: item.product.price,
      quantity: item.quantity
    }));

    try {
      await dbService.createOrder({
        customerName: checkoutForm.name,
        customerEmail: '—',
        customerPhone: checkoutForm.phone,
        customerAddress: checkoutForm.address,
        items: orderItems,
        totalPrice,
        status: 'menunggu'
      });
      
      setOrderSuccess(true);
      refreshCatalog(); // Refresh catalog to deduct stock
      setTimeout(() => {
        setIsCartOpen(false);
        setOrderSuccess(false);
        clearCart();
      }, 4000);
    } catch (err) {
      setOrderError('Gagal mengirimkan pesanan ke server database.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isPublicView = currentTab !== 'admin';

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-[#FBF8F4] text-[#3D1A0A] font-sans selection:bg-[#C8973A] selection:text-white transition-colors duration-300">
      
      {isPublicView && (
        <Header 
          currentTab={currentTab} 
          setCurrentTab={changeTab} 
          cartCount={totalCartCount} 
          onOpenCart={() => { setIsCartOpen(true); setIsCheckoutMode(false); }} 
        />
      )}

      <main className="flex-grow flex flex-col">
        {currentTab === 'home' && <HomeView setCurrentTab={changeTab} onSelectProduct={setSelectedProduct} products={products} />}
        {currentTab === 'produk' && <ProductView onSelectProduct={setSelectedProduct} products={products} isAdmin={isAdmin} onRefresh={refreshCatalog} />}
        {currentTab === 'edukasi' && <EdukasiView />}
        {currentTab === 'kontak' && <ContactView />}
        {currentTab === 'admin' && <AdminView onRefresh={refreshCatalog} isAdmin={isAdmin} setIsAdmin={handleSetIsAdmin} setCurrentTab={changeTab} />}
      </main>

      <ProductDetailModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onAddToCart={addToCart} 
      />

      {isPublicView && <Footer setCurrentTab={changeTab} />}

      {/* ── Slide-Over Drawer: Keranjang Belanja ── */}
      {isCartOpen && (
        <>
          <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-fade-in" />
          <div className="fixed inset-y-0 right-0 z-[200] w-full max-w-md bg-[#FBF8F4] border-l border-[#EFE6DA] shadow-2xl flex flex-col animate-slide-in">
            
            {/* Header Drawer */}
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#EFE6DA]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#7B1618]" />
                <h3 className="font-serif text-lg font-bold text-[#3D1A0A]">
                  {isCheckoutMode ? 'Verifikasi Pengiriman' : 'Keranjang Belanja'}
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-[#7A6558] hover:text-[#7B1618]"><X className="w-5 h-5"/></button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {orderSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 animate-scale-in">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-[#3D1A0A] mb-2">Pemesanan Sukses!</h4>
                  <p className="text-xs text-[#7A6558] max-w-xs mx-auto">
                    Karya tenun eksklusif Anda telah dipesan. Kami akan segera menghubungi Anda melalui WhatsApp. Jendela ini akan tertutup otomatis.
                  </p>
                </div>
              ) : isCheckoutMode ? (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <button 
                    type="button" 
                    onClick={() => setIsCheckoutMode(false)} 
                    className="flex items-center gap-1.5 text-xs font-bold text-[#C8973A] hover:text-[#7B1618] uppercase tracking-wider mb-2"
                  >
                    &larr; Kembali ke Keranjang
                  </button>
                  <p className="text-xs text-[#7A6558] mb-4">Lengkapi informasi berikut untuk melanjutkan pengiriman mahakarya Anda.</p>
                  
                  {orderError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {orderError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#7A6558] mb-1.5">Nama Penerima Lengkap *</label>
                    <input 
                      type="text" 
                      required 
                      value={checkoutForm.name} 
                      onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#EFE6DA] rounded-xl text-[#3D1A0A] focus:outline-none focus:border-[#C8973A] transition-colors"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#7A6558] mb-1.5">WhatsApp / Nomor Telepon Aktif *</label>
                    <input 
                      type="tel" 
                      required 
                      value={checkoutForm.phone} 
                      onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#EFE6DA] rounded-xl text-[#3D1A0A] focus:outline-none focus:border-[#C8973A] transition-colors"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#7A6558] mb-1.5">Alamat Lengkap Pengiriman *</label>
                    <textarea 
                      required 
                      rows={4}
                      value={checkoutForm.address} 
                      onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#EFE6DA] rounded-xl text-[#3D1A0A] focus:outline-none focus:border-[#C8973A] transition-colors resize-none"
                      placeholder="Contoh: Jl. Diponegoro No. 45, Kecamatan Tambolaka, Kabupaten Sumba Barat Daya, NTT"
                    />
                  </div>
                </form>
              ) : cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-[#7A6558]">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-25" />
                  <p className="text-sm font-medium">Keranjang belanja Anda masih kosong.</p>
                  <button onClick={() => { setIsCartOpen(false); changeTab('produk'); }} className="mt-4 text-xs font-bold uppercase text-[#7B1618] hover:text-[#C8973A] underline">Mulai Belanja</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.product.id} className="flex gap-4 p-3.5 bg-white border border-[#EFE6DA] rounded-2xl shadow-sm">
                      <img src={item.product.image} alt={item.product.title} className="w-16 h-16 object-cover rounded-xl bg-[#F5EDE3]" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-mono text-gray-400 uppercase">{item.product.code}</span>
                        <h4 className="font-serif font-bold text-xs text-[#3D1A0A] truncate">{item.product.title}</h4>
                        <p className="font-mono text-xs font-bold text-[#7B1618] mt-1">{formatPrice(item.product.price)}</p>
                        
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center bg-[#FBF8F4] border border-[#EFE6DA] rounded-lg p-0.5">
                            <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-xs font-bold">-</button>
                            <span className="w-6 text-center font-bold text-xs text-[#3D1A0A]">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-xs font-bold">+</button>
                          </div>
                          
                          <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary / Checkout Trigger */}
            {cartItems.length > 0 && !orderSuccess && (
              <div className="p-5 bg-white border-t border-[#EFE6DA] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#7A6558]">Total Pembayaran</span>
                  <span className="text-lg font-bold text-[#7B1618] font-mono">{formatPrice(totalCartPrice)}</span>
                </div>
                
                {isCheckoutMode ? (
                  <button 
                    onClick={handleCheckoutSubmit} 
                    disabled={isSubmittingOrder} 
                    className="w-full btn-primary py-4 text-xs tracking-wider uppercase font-bold"
                  >
                    {isSubmittingOrder ? 'Memproses Pesanan...' : 'Konfirmasi Pesanan WhatsApp'}
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsCheckoutMode(true)} 
                    className="w-full btn-primary py-4 text-xs tracking-wider uppercase font-bold"
                  >
                    Lanjut ke Pembayaran
                  </button>
                )}
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}