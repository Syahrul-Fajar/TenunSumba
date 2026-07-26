import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ProductView from './components/ProductView';
import EdukasiView from './components/EdukasiView';
import ContactView from './components/ContactView';
import AdminView from './components/AdminView';
import ProductDetailModal from './components/ProductDetailModal';
import AuthModal from './components/AuthModal';
import { Product, User, Notifikasi, Wishlist, Alamat, Order } from './types';
import { dbService, isSupabaseConfigured, supabase } from './lib/supabase';

type Tab = 'home' | 'produk' | 'edukasi' | 'kontak' | 'admin';

import { X, Trash2, ShoppingBag, CheckCircle2, AlertCircle, Tag, Heart, Bell, Check, UserCog } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  ukuran?: string;
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

  // Promo Code States
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ kode: string; diskon: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // User Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('seraphine_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Wishlist States
  const [wishlistItems, setWishlistItems] = useState<Wishlist[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Notification Drawer States
  const [userNotifs, setUserNotifs] = useState<Notifikasi[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Profile Modal States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'profil' | 'pesanan' | 'alamat'>('profil');
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [profileForm, setProfileForm] = useState({ nama_lengkap: '', no_telepon: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Address States (for checkout)
  const [userAlamat, setUserAlamat] = useState<Alamat[]>([]);
  const [selectedAlamatId, setSelectedAlamatId] = useState<number | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('seraphine_user', JSON.stringify(user));
    syncKeranjangFromDB(user.id_user);
    checkNotif(user.id_user);
    loadWishlist(user.id_user);
    loadAlamat(user.id_user);
    setProfileForm({ nama_lengkap: user.nama_lengkap, no_telepon: user.no_telepon || '' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('seraphine_user');
    setCartItems([]);
    localStorage.removeItem('seraphine_cart');
    setWishlistItems([]);
    setUserNotifs([]);
    setUnreadNotifCount(0);
    setUserAlamat([]);
    setSelectedAlamatId(null);
  };

  const checkNotif = async (userId: number) => {
    const notifs = await dbService.getNotifikasiUser(userId);
    setUnreadNotifCount(notifs.filter(n => !n.is_read).length);
  };

  // ── Wishlist Handlers ──
  const loadWishlist = async (userId: number) => {
    const items = await dbService.getWishlistByUser(userId);
    setWishlistItems(items);
  };

  const handleToggleWishlist = async (productId: number) => {
    if (!currentUser) return;
    const exists = wishlistItems.some(w => w.id_produk === productId);
    if (exists) {
      await dbService.removeFromWishlist(currentUser.id_user, productId);
    } else {
      await dbService.addToWishlist(currentUser.id_user, productId);
    }
    await loadWishlist(currentUser.id_user);
  };

  // ── Notification Handlers ──
  const loadNotifs = async (userId: number) => {
    const notifs = await dbService.getNotifikasiUser(userId);
    setUserNotifs(notifs);
    setUnreadNotifCount(notifs.filter(n => !n.is_read).length);
  };

  const handleOpenNotif = async () => {
    if (currentUser) await loadNotifs(currentUser.id_user);
    setIsNotifOpen(true);
  };

  const handleMarkRead = async (id: number) => {
    await dbService.markNotifikasiRead(id);
    if (currentUser) await loadNotifs(currentUser.id_user);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await dbService.markAllNotifikasiRead(currentUser.id_user);
    await loadNotifs(currentUser.id_user);
  };

  const handleDeleteNotif = async (id: number) => {
    await dbService.deleteNotifikasi(id);
    if (currentUser) await loadNotifs(currentUser.id_user);
  };

  // ── Profile Handlers ──
  const handleOpenProfile = async () => {
    if (currentUser) {
      setProfileForm({ nama_lengkap: currentUser.nama_lengkap, no_telepon: currentUser.no_telepon || '' });
      setProfileMsg('');
      const orders = await dbService.getUserOrders(currentUser.id_user);
      setUserOrders(orders);
    }
    setProfileTab('profil');
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await dbService.updateUserProfile(currentUser.id_user, {
        nama_lengkap: profileForm.nama_lengkap,
        no_telepon: profileForm.no_telepon
      });
      const updated = { ...currentUser, nama_lengkap: profileForm.nama_lengkap, no_telepon: profileForm.no_telepon };
      setCurrentUser(updated);
      sessionStorage.setItem('seraphine_user', JSON.stringify(updated));
      setProfileMsg('Profil berhasil diperbarui!');
    } catch {
      setProfileMsg('Gagal memperbarui profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Address Handlers ──
  const loadAlamat = async (userId: number) => {
    const list = await dbService.getAlamatByUser(userId);
    setUserAlamat(list);
    const def = list.find(a => a.is_default);
    if (def) setSelectedAlamatId(def.id_alamat);
  };

  const selectAlamatForCheckout = (alamat: Alamat) => {
    setSelectedAlamatId(alamat.id_alamat);
    setCheckoutForm({
      name: alamat.penerima,
      phone: alamat.no_hp,
      address: `${alamat.alamat_lengkap}, ${alamat.kelurahan}, ${alamat.kecamatan}, ${alamat.kota}, ${alamat.provinsi} ${alamat.kode_pos}`
    });
  };

  // Sync Keranjang dari DB saat login
  const syncKeranjangFromDB = async (userId: number) => {
    const dbCart = await dbService.getKeranjang(userId);
    if (dbCart.length > 0) {
      // Map DB cart to local CartItem structure
      const newCartItems: CartItem[] = dbCart.map(item => ({
        product: { id: item.id_produk.toString(), title: item.nama_produk!, price: item.harga!, image: item.gambar!, category: '', description: '', isFeatured: false, code: '', weaver: '', makingTime: '' },
        quantity: item.jumlah,
        ukuran: item.ukuran
      }));
      setCartItems(newCartItems);
      localStorage.setItem('seraphine_cart', JSON.stringify(newCartItems));
    }
  };

  // Load cart from LocalStorage on mount (or DB if logged in)
  useEffect(() => {
    if (currentUser) {
      syncKeranjangFromDB(currentUser.id_user);
      checkNotif(currentUser.id_user);
      loadWishlist(currentUser.id_user);
      loadAlamat(currentUser.id_user);
      setProfileForm({ nama_lengkap: currentUser.nama_lengkap, no_telepon: currentUser.no_telepon || '' });
    } else {
      try {
        const stored = localStorage.getItem('seraphine_cart');
        if (stored) setCartItems(JSON.parse(stored));
      } catch (err) {
        console.error('Gagal memuat keranjang belanja:', err);
      }
    }
  }, []);

  // Save cart to LocalStorage on changes
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    if (!currentUser) {
      try {
        localStorage.setItem('seraphine_cart', JSON.stringify(items));
      } catch (err) {
        console.error('Gagal menyimpan keranjang belanja:', err);
      }
    }
  };

  const addToCart = async (product: Product, qty: number, ukuran?: string) => {
    const existingIdx = cartItems.findIndex(item => item.product.id === product.id && item.ukuran === ukuran);
    const updated = [...cartItems];
    let newQty = qty;
    if (existingIdx !== -1) {
      const maxStock = product.stock ?? 5;
      newQty = Math.min(maxStock, updated[existingIdx].quantity + qty);
      updated[existingIdx].quantity = newQty;
    } else {
      updated.push({ product, quantity: qty, ukuran });
    }
    
    saveCart(updated);
    
    if (currentUser) {
      await dbService.upsertKeranjang({ id_user: currentUser.id_user, id_produk: Number(product.id), jumlah: newQty, ukuran });
    }
    setIsCartOpen(true); // Auto-open cart drawer for feedback!
  };

  const removeFromCart = async (productId: string, ukuran?: string) => {
    const updated = cartItems.filter(item => !(item.product.id === productId && item.ukuran === ukuran));
    saveCart(updated);
    if (currentUser) {
      await dbService.removeFromKeranjang(currentUser.id_user, Number(productId), ukuran);
    }
  };

  const updateCartQuantity = async (productId: string, qty: number, ukuran?: string) => {
    let finalQty = qty;
    const updated = cartItems.map(item => {
      if (item.product.id === productId && item.ukuran === ukuran) {
        const maxStock = item.product.stock ?? 5;
        finalQty = Math.max(1, Math.min(maxStock, qty));
        return { ...item, quantity: finalQty };
      }
      return item;
    });
    saveCart(updated);
    if (currentUser) {
      await dbService.upsertKeranjang({ id_user: currentUser.id_user, id_produk: Number(productId), jumlah: finalQty, ukuran });
    }
  };

  const clearCart = async () => {
    saveCart([]);
    setIsCheckoutMode(false);
    setCheckoutForm({ name: '', phone: '', address: '' });
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
    setPromoSuccess('');
    if (currentUser) {
      await dbService.clearKeranjangDB(currentUser.id_user);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoSuccess('');
    try {
      const promo = await dbService.verifyPromo(promoInput.trim());
      if (promo) {
        setAppliedPromo({ kode: promo.kode_promo, diskon: promo.diskon });
        setPromoSuccess(`Promo "${promo.kode_promo}" berhasil! Diskon ${promo.diskon}%`);
      } else {
        setPromoError('Kode promo tidak valid atau sudah kadaluarsa.');
        setAppliedPromo(null);
      }
    } catch {
      setPromoError('Gagal memvalidasi promo.');
    } finally {
      setPromoLoading(false);
    }
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
    
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const diskonNominal = appliedPromo ? Math.round(subtotal * appliedPromo.diskon / 100) : 0;
    const totalPrice = subtotal - diskonNominal;
    const orderItems = cartItems.map(item => ({
      productId: item.product.id,
      productTitle: item.product.title,
      productCode: item.product.code,
      price: item.product.price,
      quantity: item.quantity
    }));

    try {
      const order = await dbService.createOrder({
        customerName: checkoutForm.name,
        customerEmail: currentUser?.email || '—',
        customerPhone: checkoutForm.phone,
        customerAddress: checkoutForm.address,
        items: orderItems,
        totalPrice,
        status: 'menunggu',
        promoKode: appliedPromo?.kode,
        diskon: diskonNominal,
        id_user: currentUser?.id_user
      } as any);

      // Auto-create pembayaran record
      if (order && order.id) {
        try {
          await dbService.savePembayaran({
            id_pesanan: Number(order.id),
            metode: 'Transfer Bank',
            status: 'menunggu',
            jumlah: totalPrice
          });
        } catch (payErr) {
          console.warn('Pembayaran record creation failed (non-critical):', payErr);
        }
      }
      
      setOrderSuccess(true);
      refreshCatalog();
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
  const subtotalCartPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const diskonNominal = appliedPromo ? Math.round(subtotalCartPrice * appliedPromo.diskon / 100) : 0;
  const totalCartPrice = subtotalCartPrice - diskonNominal;
  const isPublicView = currentTab !== 'admin';

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#1A1A1A] font-sans selection:bg-[#7B1618] selection:text-white transition-colors duration-300">
      
      {isPublicView && (
        <Header
          currentTab={currentTab}
          setCurrentTab={changeTab}
          cartCount={totalCartCount}
          onOpenCart={() => { setIsCartOpen(true); setIsCheckoutMode(false); }}
          currentUser={currentUser}
          unreadNotifCount={unreadNotifCount}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onOpenNotif={handleOpenNotif}
          wishlistCount={wishlistItems.length}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          onOpenProfile={handleOpenProfile}
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />

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
        currentUser={currentUser}
        onToggleWishlist={handleToggleWishlist}
        wishlistProductIds={wishlistItems.map(w => w.id_produk)}
      />

      {isPublicView && <Footer setCurrentTab={changeTab} />}

      {/* ── Slide-Over Drawer: Keranjang Belanja ── */}
      {isCartOpen && (
        <>
          <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-fade-in" />
          <div className="fixed inset-y-0 right-0 z-[200] w-full max-w-md bg-[#FFFFFF] border-l border-[#F1F5F9] shadow-2xl flex flex-col animate-slide-in">
            
            {/* Header Drawer */}
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#7B1618]" />
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">
                  {isCheckoutMode ? 'Verifikasi Pengiriman' : 'Keranjang Belanja'}
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="text-[#64748B] hover:text-[#7B1618]"><X className="w-5 h-5"/></button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {orderSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 animate-scale-in">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-[#1A1A1A] mb-2">Pemesanan Sukses!</h4>
                  <p className="text-xs text-[#64748B] max-w-xs mx-auto">
                    Karya tenun eksklusif Anda telah dipesan. Kami akan segera menghubungi Anda melalui WhatsApp. Jendela ini akan tertutup otomatis.
                  </p>
                </div>
              ) : isCheckoutMode ? (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <button 
                    type="button" 
                    onClick={() => setIsCheckoutMode(false)} 
                    className="flex items-center gap-1.5 text-xs font-bold text-[#7B1618] hover:text-[#7B1618] uppercase tracking-wider mb-2"
                  >
                    &larr; Kembali ke Keranjang
                  </button>
                  <p className="text-xs text-[#64748B] mb-4">Lengkapi informasi berikut untuk melanjutkan pengiriman mahakarya Anda.</p>

                  {orderError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {orderError}
                    </div>
                  )}

                  {/* Saved Addresses */}
                  {currentUser && userAlamat.length > 0 && (
                    <div>
                      <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Pilih Alamat Tersimpan</label>
                      <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                        {userAlamat.map(a => (
                          <button
                            key={a.id_alamat}
                            type="button"
                            onClick={() => selectAlamatForCheckout(a)}
                            className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                              selectedAlamatId === a.id_alamat
                                ? 'border-[#7B1618] bg-[#7B1618]/5'
                                : 'border-[#F1F5F9] hover:border-[#7B1618]/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#1A1A1A]">{a.label || a.penerima}</span>
                              {a.is_default && <span className="text-[8px] font-mono bg-[#7B1618]/10 text-[#7B1618] px-1.5 py-0.5 rounded">Default</span>}
                            </div>
                            <p className="text-[#64748B] mt-0.5 truncate">{a.alamat_lengkap}, {a.kota}</p>
                          </button>
                        ))}
                      </div>
                      <div className="my-3 flex items-center gap-2 text-[9px] text-[#64748B]">
                        <div className="flex-1 border-t border-[#F1F5F9]" />
                        <span>atau isi manual</span>
                        <div className="flex-1 border-t border-[#F1F5F9]" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Nama Penerima Lengkap *</label>
                    <input 
                      type="text" 
                      required 
                      value={checkoutForm.name} 
                      onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors"
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">WhatsApp / Nomor Telepon Aktif *</label>
                    <input 
                      type="tel" 
                      required 
                      value={checkoutForm.phone} 
                      onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Alamat Lengkap Pengiriman *</label>
                    <textarea 
                      required 
                      rows={3}
                      value={checkoutForm.address} 
                      onChange={e => setCheckoutForm({...checkoutForm, address: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors resize-none"
                      placeholder="Contoh: Jl. Diponegoro No. 45, Kecamatan Tambolaka, Kabupaten Sumba Barat Daya, NTT"
                    />
                  </div>
                  {/* Promo Code Input */}
                  <div>
                    <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Kode Promo (Opsional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: SUMBA20"
                        value={promoInput}
                        onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); setPromoSuccess(''); }}
                        disabled={!!appliedPromo}
                        className="flex-1 px-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors font-mono uppercase"
                      />
                      {appliedPromo ? (
                        <button type="button" onClick={() => { setAppliedPromo(null); setPromoInput(''); setPromoSuccess(''); setPromoError(''); }} className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl">Hapus</button>
                      ) : (
                        <button type="button" onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()} className="px-3 py-2 bg-[#7B1618] text-white text-xs font-bold rounded-xl disabled:opacity-50">
                          {promoLoading ? '...' : <Tag className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    {promoError && <p className="mt-1 text-[10px] text-red-600 font-semibold">{promoError}</p>}
                    {promoSuccess && <p className="mt-1 text-[10px] text-emerald-700 font-semibold">{promoSuccess}</p>}
                  </div>
                </form>
              ) : cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-[#64748B]">
                  <ShoppingBag className="w-12 h-12 mb-3 opacity-25" />
                  <p className="text-sm font-medium">Keranjang belanja Anda masih kosong.</p>
                  <button onClick={() => { setIsCartOpen(false); changeTab('produk'); }} className="mt-4 text-xs font-bold uppercase text-[#7B1618] hover:text-[#7B1618] underline">Mulai Belanja</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={`${item.product.id}-${item.ukuran || 'default'}`} className="flex gap-4 p-3.5 bg-white border border-[#F1F5F9] rounded-2xl shadow-sm">
                      <img src={item.product.image} alt={item.product.title} className="w-16 h-16 object-cover rounded-xl bg-[#F8FAFC]" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-mono text-gray-400 uppercase">{item.product.code}</span>
                        <h4 className="font-serif font-bold text-xs text-[#1A1A1A] truncate">{item.product.title}</h4>
                        {item.ukuran && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-[#64748B] text-[10px] font-mono font-bold rounded">
                            {item.ukuran}
                          </span>
                        )}
                        <p className="font-mono text-xs font-bold text-[#7B1618] mt-1">{formatPrice(item.product.price)}</p>
                        
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center bg-[#FFFFFF] border border-[#F1F5F9] rounded-lg p-0.5">
                            <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.ukuran)} className="w-6 h-6 flex items-center justify-center text-xs font-bold">-</button>
                            <span className="w-6 text-center font-bold text-xs text-[#1A1A1A]">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.ukuran)} className="w-6 h-6 flex items-center justify-center text-xs font-bold">+</button>
                          </div>
                          
                          <button onClick={() => removeFromCart(item.product.id, item.ukuran)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
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
              <div className="p-5 bg-white border-t border-[#F1F5F9] space-y-4">
                {appliedPromo && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatPrice(subtotalCartPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                      <span>Diskon {appliedPromo.kode} ({appliedPromo.diskon}%)</span>
                      <span className="font-mono">- {formatPrice(diskonNominal)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748B]">Total Pembayaran</span>
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

      {/* ── Slide-Over Drawer: Wishlist ── */}
      {isWishlistOpen && (
        <>
          <div onClick={() => setIsWishlistOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-fade-in" />
          <div className="fixed inset-y-0 right-0 z-[200] w-full max-w-md bg-[#FFFFFF] border-l border-[#F1F5F9] shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Wishlist</h3>
                <span className="text-xs text-[#64748B]">({wishlistItems.length})</span>
              </div>
              <button onClick={() => setIsWishlistOpen(false)} className="text-[#64748B] hover:text-[#7B1618]"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-[#64748B]">
                  <Heart className="w-12 h-12 mb-3 opacity-25" />
                  <p className="text-sm font-medium">Wishlist Anda masih kosong.</p>
                  <button onClick={() => { setIsWishlistOpen(false); changeTab('produk'); }} className="mt-4 text-xs font-bold uppercase text-[#7B1618] underline">Jelajahi Katalog</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {wishlistItems.map(w => (
                    <div key={w.id_wishlist} className="flex gap-4 p-3.5 bg-white border border-[#F1F5F9] rounded-2xl shadow-sm">
                      {w.gambar && <img src={w.gambar} alt={w.nama_produk || ''} className="w-16 h-16 object-cover rounded-xl bg-[#F8FAFC]" />}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-xs text-[#1A1A1A] truncate">{w.nama_produk}</h4>
                        {w.harga && <p className="font-mono text-xs font-bold text-[#7B1618] mt-1">{formatPrice(w.harga)}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => {
                              const prod = products.find(p => Number(p.id) === w.id_produk);
                              if (prod) { setSelectedProduct(prod); setIsWishlistOpen(false); }
                            }}
                            className="text-[10px] font-bold text-[#7B1618] underline"
                          >
                            Lihat Produk
                          </button>
                          <button onClick={() => handleToggleWishlist(w.id_produk)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors ml-auto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Slide-Over Drawer: Notifikasi ── */}
      {isNotifOpen && (
        <>
          <div onClick={() => setIsNotifOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-fade-in" />
          <div className="fixed inset-y-0 right-0 z-[200] w-full max-w-md bg-[#FFFFFF] border-l border-[#F1F5F9] shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#7B1618]" />
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Notifikasi</h3>
                {unreadNotifCount > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadNotifCount} baru</span>}
              </div>
              <button onClick={() => setIsNotifOpen(false)} className="text-[#64748B] hover:text-[#7B1618]"><X className="w-5 h-5" /></button>
            </div>
            {unreadNotifCount > 0 && (
              <div className="px-5 py-2 border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-[#7B1618] uppercase tracking-wider">Tandai Semua Dibaca</button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {userNotifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-[#64748B]">
                  <Bell className="w-12 h-12 mb-3 opacity-25" />
                  <p className="text-sm font-medium">Belum ada notifikasi.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userNotifs.map(n => (
                    <div key={n.id_notifikasi} className={`p-4 rounded-xl border transition-all ${n.is_read ? 'bg-white border-[#F1F5F9]' : 'bg-[#7B1618]/5 border-[#7B1618]/20'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs text-[#1A1A1A] flex-1">{n.pesan}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!n.is_read && (
                            <button onClick={() => handleMarkRead(n.id_notifikasi)} className="p-1 text-[#7B1618] hover:bg-[#7B1618]/10 rounded" title="Tandai dibaca">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteNotif(n.id_notifikasi)} className="p-1 text-gray-400 hover:text-red-600 rounded" title="Hapus">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] text-[#64748B] font-mono mt-1">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modal: Akun Saya (Profil, Pesanan, Alamat) ── */}
      {isProfileOpen && currentUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-scale-in border border-[#F1F5F9] flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserCog className="w-6 h-6 text-[#7B1618]" />
                <h3 className="font-serif text-xl font-bold text-[#1A1A1A]">Akun Saya</h3>
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="p-2 text-[#64748B] hover:text-[#7B1618] hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex px-6 border-b border-[#F1F5F9] shrink-0 gap-6">
              <button onClick={() => setProfileTab('profil')} className={`py-4 text-sm font-bold border-b-2 transition-colors ${profileTab === 'profil' ? 'border-[#7B1618] text-[#7B1618]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Profil</button>
              <button onClick={() => setProfileTab('pesanan')} className={`py-4 text-sm font-bold border-b-2 transition-colors ${profileTab === 'pesanan' ? 'border-[#7B1618] text-[#7B1618]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Riwayat Pesanan</button>
              <button onClick={() => setProfileTab('alamat')} className={`py-4 text-sm font-bold border-b-2 transition-colors ${profileTab === 'alamat' ? 'border-[#7B1618] text-[#7B1618]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Daftar Alamat</button>
            </div>

            <div className="p-6 overflow-y-auto">
              {profileTab === 'profil' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md mx-auto">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Email</label>
                    <input type="email" disabled value={currentUser.email} className="w-full px-4 py-2.5 text-sm bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl text-[#64748B]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Nama Lengkap</label>
                    <input type="text" required value={profileForm.nama_lengkap} onChange={e => setProfileForm({ ...profileForm, nama_lengkap: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">No. Telepon</label>
                    <input type="tel" value={profileForm.no_telepon} onChange={e => setProfileForm({ ...profileForm, no_telepon: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors" placeholder="081234567890" />
                  </div>
                  {profileMsg && <p className={`text-xs font-semibold ${profileMsg.includes('berhasil') ? 'text-emerald-600' : 'text-red-600'}`}>{profileMsg}</p>}
                  <button type="submit" disabled={savingProfile} className="w-full btn-primary py-3 text-xs tracking-wider uppercase font-bold disabled:opacity-50 mt-4">
                    {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </form>
              )}

              {profileTab === 'pesanan' && (
                <div className="space-y-4">
                  {userOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">Belum ada riwayat pesanan.</div>
                  ) : (
                    userOrders.map(order => (
                      <div key={order.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-gray-400">Order ID: {order.id.slice(0, 8)}</span>
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${order.status === 'selesai' ? 'bg-emerald-100 text-emerald-700' : order.status === 'dibatalkan' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.status || 'MENUNGGU'}
                          </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {order.items?.map((it: any, i: number) => (
                            <div key={i} className="py-2 flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-gray-900">{it.productTitle}</p>
                                <p className="text-xs text-gray-500">{it.quantity} x Rp {it.price.toLocaleString('id-ID')}</p>
                              </div>
                              <p className="text-sm font-bold text-[#7B1618]">Rp {(it.quantity * it.price).toLocaleString('id-ID')}</p>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-sm text-gray-500">Total Belanja</span>
                          <span className="text-base font-bold text-[#7B1618]">Rp {order.totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {profileTab === 'alamat' && (
                <div className="space-y-4">
                  {userAlamat.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">Belum ada alamat tersimpan.</div>
                  ) : (
                    userAlamat.map(a => (
                      <div key={a.id_alamat} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow relative">
                        {a.is_default && <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Utama</span>}
                        <h4 className="font-bold text-sm text-gray-900 mb-1">{a.label || 'Alamat'}</h4>
                        <p className="text-sm font-semibold text-gray-700">{a.penerima} - {a.no_telepon}</p>
                        <p className="text-xs text-gray-500 mt-1">{a.alamat_lengkap}</p>
                        <p className="text-xs text-gray-500">{a.kota}, {a.provinsi} {a.kode_pos}</p>
                      </div>
                    ))
                  )}
                  {/* For simplicity, we don't implement full add/edit address form here, rely on checkout for now or a simple placeholder */}
                  <div className="text-center mt-4">
                    <p className="text-xs text-gray-400">Tambahkan alamat baru pada saat proses Checkout.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}