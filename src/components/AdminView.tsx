import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Database, Plus, Trash2, Edit, Package, Clock, Mail, Lock,
  AlertCircle, X, RefreshCw, TrendingUp, DollarSign, Users,
  ShoppingCart, MessageSquare, BarChart3, Layers, Eye, Phone, LogOut, Wifi, WifiOff, Star, BookOpen
} from 'lucide-react';
import { Product, Order, Article } from '../types';
import { dbService, isSupabaseConfigured, supabase } from '../lib/supabase';

interface AdminViewProps {
  onRefresh?: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  setCurrentTab?: (tab: 'home' | 'produk' | 'edukasi' | 'kontak' | 'admin') => void;
}

// ─── Utility Formatters ──────────────────────────────────────────────────────
const formatPrice = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDateTime = (s: string) =>
  new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─── Configuration Constants ────────────────────────────────────────────────
const STATUS_PESANAN: Record<string, { label: string; cls: string }> = {
  menunggu:   { label: 'Menunggu',   cls: 'bg-rose-100 text-rose-800 border-rose-200' },
  dikirim:    { label: 'Dikirim',    cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  selesai:    { label: 'Selesai',    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  batal:      { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const STATUS_PESAN: Record<string, { label: string; cls: string }> = {
  baru:   { label: 'Baru',   cls: 'bg-rose-100 text-rose-800' },
  dibaca: { label: 'Dibaca', cls: 'bg-blue-100 text-blue-800' },
  selesai:{ label: 'Selesai',cls: 'bg-emerald-100 text-emerald-800' },
};

// ─── Sub-Component: StatCard (Memoized) ──────────────────────────────────────
const StatCard = React.memo(({
  label, value, sub, icon, accent = false
}: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent?: boolean }) => (
  <div className={`rounded-[24px] p-5 border flex items-start justify-between gap-3 shadow-sm transition-all duration-300 ${accent ? 'bg-maroon border-maroon-dark text-white' : 'bg-white border-cream-dark'}`}>
    <div>
      <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 ${accent ? 'text-rose-200' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-2xl font-serif font-extrabold leading-none ${accent ? 'text-white' : 'text-stone-900'}`}>{value}</p>
      {sub && <p className={`text-[10px] mt-1.5 ${accent ? 'text-rose-200' : 'text-gray-400'}`}>{sub}</p>}
    </div>
    <div className={`p-2.5 rounded-xl flex-shrink-0 ${accent ? 'bg-white/20' : 'bg-cream-dark/40'}`}>
      <div className={accent ? 'text-white' : 'text-maroon'}>{icon}</div>
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

// ─── Sub-Component: TabBtn ───────────────────────────────────────────────────
const TabBtn = ({
  active, onClick, icon, label, badge
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${
      active ? 'bg-maroon text-white shadow-md' : 'text-stone-700 hover:bg-cream-dark/50 hover:text-stone-900'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'}`}>
        {badge}
      </span>
    )}
  </button>
);

// ─── Sub-Component: BottomTabItem ───────────────────────────────────────────
const BottomTabItem = ({
  active, onClick, icon, label, badge
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
      active ? 'text-[#7B1618]' : 'text-[#7A6558]'
    }`}
  >
    <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-[#7B1618]/10' : ''}`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
    </div>
    <span className="text-[8px] font-bold tracking-tight">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute top-1 right-2 bg-[#7B1618] text-white text-[7px] font-bold font-mono px-1 py-0.2 rounded-full min-w-3.5 h-3.5 flex items-center justify-center border border-white">
        {badge}
      </span>
    )}
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminView({ onRefresh, isAdmin, setIsAdmin, setCurrentTab }: AdminViewProps) {
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError]         = useState('');
  const [showPass, setShowPass]           = useState(false);

  type AdminTab = 'overview' | 'products' | 'stock' | 'orders' | 'messages' | 'articles' | 'customers';
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  const [products,  setProducts]  = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [articles,  setArticles]  = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbSource,  setDbSource]  = useState<'Supabase' | 'LocalStorage'>('LocalStorage');

  // Form States
  const [editProd,    setEditProd]    = useState<Partial<Product> | null>(null);
  const [isFormOpen,  setIsFormOpen]  = useState(false);
  const [formErr,     setFormErr]     = useState('');
  const [savingProd,  setSavingProd]  = useState(false);

  const [editArt,       setEditArt]       = useState<Partial<Article> | null>(null);
  const [isArtFormOpen, setIsArtFormOpen] = useState(false);
  const [artErr,        setArtErr]        = useState('');
  const [savingArt,     setSavingArt]     = useState(false);

  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [msgFilter,   setMsgFilter]   = useState<string>('all');

  // ── Data Loader Logic ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodList, inqList, ordList, artList] = await Promise.all([
        dbService.getAllProducts(),
        dbService.getInquiries(),
        dbService.getAllOrders(),
        dbService.getAllArticles(),
      ]);
      setProducts(prodList);
      setInquiries(inqList);
      setOrders(ordList);
      setArticles(artList);
      setDbSource(isSupabaseConfigured ? 'Supabase' : 'LocalStorage');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Data sync execution failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();

    if (!isSupabaseConfigured || !supabase) return;

    // Listen to changes on all relevant tables to make the panel realtime
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produk' }, () => { loadData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesanan' }, () => { loadData(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artikel' }, () => { loadData(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, loadData]);

  // ── Handler Functions ──────────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userLower = adminUsername.trim().toLowerCase();
    const passLower = adminPassword.trim().toLowerCase();
    
    if ((userLower === 'tenunsumba' && passLower === 'tenunsumba') || 
        (userLower === 'admin' && (adminPassword === 'admin' || adminPassword === '1234'))) {
      setIsAdmin(true);
      setAuthError('');
    } else {
      setAuthError('Username atau password salah!');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'product' | 'article') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran berkas terlalu besar. Maksimum batas ukuran adalah 2 MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (field === 'product' && editProd) {
          setEditProd(prev => prev ? { ...prev, image: reader.result as string } : null);
        } else if (field === 'article' && editArt) {
          setEditArt(prev => prev ? { ...prev, image: reader.result as string } : null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    if (!editProd?.title || !editProd?.price || !editProd?.image) {
      setFormErr('Harap isi semua kolom wajib (Nama Kain, Harga, dan Foto Produk)');
      return;
    }
    setSavingProd(true);
    try {
      await dbService.saveProduct({
        id: editProd.id,
        title: editProd.title!,
        category: editProd.category || 'Kain Tenun',
        price: Number(editProd.price),
        image: editProd.image!,
        description: editProd.description || '',
        maknaMotif: editProd.maknaMotif || '',
        status: editProd.status || 'aktif',
        isFeatured: editProd.isFeatured || false,
        code: editProd.code || 'TIS-NEW',
        dimensions: editProd.dimensions || '',
        weaver: editProd.weaver || 'Penenun Sumba',
        makingTime: editProd.makingTime || '3 Bulan',
        stock: editProd.stock !== undefined ? Number(editProd.stock) : 5,
      });
      setIsFormOpen(false);
      setEditProd(null);
      await loadData();
    } catch { 
      setFormErr('Terjadi kesalahan saat menyimpan data ke database.'); 
    } finally { 
      setSavingProd(false); 
    }
  };

  const handleDeleteProd = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini dari katalog?')) return;
    await dbService.deleteProduct(id);
    await loadData();
  };

  const handleUpdateStock = async (p: Product, newStock: number) => {
    const updatedStock = Math.max(0, newStock);
    await dbService.saveProduct({ ...p, stock: updatedStock });
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, stock: updatedStock } : x));
  };

  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    await dbService.updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Hapus catatan pesanan ini?')) return;
    await dbService.deleteOrder(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleUpdateMsgStatus = async (id: string, status: 'baru' | 'dibaca' | 'selesai') => {
    await dbService.updateInquiryStatus(id, status);
    setInquiries(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const handleDeleteMsg = async (id: string) => {
    if (!confirm('Hapus pesan masuk ini?')) return;
    await dbService.deleteInquiry(id);
    setInquiries(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveArt = async (e: React.FormEvent) => {
    e.preventDefault();
    setArtErr('');
    if (!editArt?.title || !editArt?.excerpt || !editArt?.content || !editArt?.image) {
      setArtErr('Harap isi semua kolom wajib (Judul, Ringkasan, Konten, URL Gambar)');
      return;
    }
    setSavingArt(true);
    try {
      await dbService.saveArticle({
        id: editArt.id,
        title: editArt.title!,
        slug: editArt.slug || editArt.title!.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content: editArt.content!,
        excerpt: editArt.excerpt!,
        author: editArt.author || 'Admin',
        image: editArt.image!,
      });
      setIsArtFormOpen(false);
      setEditArt(null);
      await loadData();
    } catch { 
      setArtErr('Terjadi kesalahan saat menyimpan artikel.'); 
    } finally { 
      setSavingArt(false); 
    }
  };

  const handleDeleteArt = async (id: string) => {
    if (!confirm('Hapus artikel ini?')) return;
    await dbService.deleteArticle(id);
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  // ── Memoized Metrics Calculation ───────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalValuation = products.reduce((s, p) => s + p.price * (p.stock ?? 5), 0);
    const completedRevenue = orders.filter(o => o.status === 'selesai').reduce((s, o) => s + o.totalPrice, 0);
    const activeOrders = orders.filter(o => ['menunggu', 'dikirim'].includes(o.status)).length;
    const newMessages = inquiries.filter(m => m.status === 'baru').length;
    const lowStockProducts = products.filter(p => (p.stock ?? 5) <= 2);
    
    return { totalValuation, completedRevenue, activeOrders, newMessages, lowStockProducts };
  }, [products, orders, inquiries]);



  const filteredOrders = useMemo(() => orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter), [orders, orderFilter]);
  const filteredMessages = useMemo(() => msgFilter === 'all' ? inquiries : inquiries.filter(m => m.status === msgFilter), [inquiries, msgFilter]);

  // ── Render View Condition ──────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl text-white animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-maroon rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-serif text-2xl font-bold">Portal Administrasi Balai</h2>
            <p className="text-xs text-brand-gold-light font-mono uppercase tracking-widest mt-1">CD Seraphine Weetebula</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-xs font-semibold text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {authError}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-white/50 mb-2">Nama Pengguna</label>
              <input type="text" required placeholder="Nama Pengguna" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-white/50 mb-2">Kata Sandi</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required placeholder="Kata Sandi" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-gold pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-maroon hover:bg-maroon-dark text-white font-bold text-sm tracking-widest uppercase rounded-xl shadow-lg transition-all cursor-pointer">
              Masuk Dashboard
            </button>
            <button type="button" onClick={() => setCurrentTab && setCurrentTab('home')} className="w-full py-3 bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold text-sm tracking-widest uppercase rounded-xl transition-all cursor-pointer text-center">
              Kembali ke Beranda
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-workspace" className="min-h-screen bg-brand-cream pt-10 pb-24 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Control */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center">
                <img src="/favicon.png" alt="Logo Seraphine" className="w-full h-full object-contain" />
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">Panel Administrasi Balai</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
            <button onClick={loadData} disabled={isLoading} className="p-2.5 bg-white border border-[#EFE6DA] rounded-xl text-stone-500 hover:text-maroon transition-all shadow-sm">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setCurrentTab && setCurrentTab('home')} className="flex items-center gap-2 px-4 py-2.5 bg-maroon hover:bg-maroon-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
              <Eye className="w-3.5 h-3.5" /> Lihat Website
            </button>
            <button onClick={() => setIsAdmin(false)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#EFE6DA] rounded-xl text-xs font-bold text-[#7A6558] hover:text-red-700 transition-all shadow-sm">
              <LogOut className="w-3.5 h-3.5" /> Keluar Sesi
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation (Desktop Only) */}
        <div className="hidden md:flex overflow-x-auto no-scrollbar gap-1.5 bg-white border border-[#EFE6DA] p-2 rounded-2xl shadow-sm mb-8 scroll-smooth">
          <TabBtn active={adminTab==='overview'}  onClick={()=>setAdminTab('overview')}  icon={<BarChart3 className="w-4 h-4"/>}     label="Ringkasan Performa" />
          <TabBtn active={adminTab==='products'}  onClick={()=>setAdminTab('products')}  icon={<Package className="w-4 h-4"/>}       label="Katalog Tenun"  badge={products.length} />
          <TabBtn active={adminTab==='stock'}     onClick={()=>setAdminTab('stock')}     icon={<Layers className="w-4 h-4"/>}        label="Manajemen Stok" />
          <TabBtn active={adminTab==='orders'}    onClick={()=>setAdminTab('orders')}    icon={<ShoppingCart className="w-4 h-4"/>}  label="Manajemen Pesanan" badge={metrics.activeOrders} />
          <TabBtn active={adminTab==='messages'}  onClick={()=>setAdminTab('messages')}  icon={<MessageSquare className="w-4 h-4"/>} label="Konsultasi Masuk" badge={metrics.newMessages} />
          <TabBtn active={adminTab==='articles'}  onClick={()=>setAdminTab('articles')}  icon={<BookOpen className="w-4 h-4"/>}      label="Konten Edukasi" badge={articles.length} />
        </div>

        {/* ── Tab Layout Render Content (Bento Grid) ───────────────────────── */}
        {adminTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* TIER 1: METRIK BENTO (Highlight Data Finansial) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
              <div className="md:col-span-2">
                <StatCard 
                  accent 
                  label="Total Valuasi Stok" 
                  value={formatPrice(metrics.totalValuation)} 
                  sub="Total kapitalisasi aset katalog saat ini" 
                  icon={<span className="font-mono font-bold text-sm select-none">Rp</span>}
                />
              </div>
              <div className="md:col-span-1">
                <StatCard 
                  label="Pendapatan Sukses" 
                  value={formatPrice(metrics.completedRevenue)} 
                  sub="Dari transaksi selesai" 
                  icon={<TrendingUp className="w-5 h-5"/>} 
                />
              </div>
              <div className="md:col-span-1">
                <StatCard 
                  label="Pesanan Aktif" 
                  value={metrics.activeOrders} 
                  sub={`${orders.length} total pesanan`} 
                  icon={<ShoppingCart className="w-5 h-5"/>} 
                />
              </div>
            </div>

            {/* TIER 2: PANEL BENTO UTAMA (Operasional) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Kolom Kiri: Panel Restock (Span 1) */}
              <div className="bg-white rounded-[24px] border border-cream-dark p-6 shadow-sm flex flex-col h-[420px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-maroon" /> Peringatan Stok
                  </h3>
                  <span className="text-[10px] font-bold bg-rose-100 text-maroon px-2.5 py-1 rounded-full">
                    {metrics.lowStockProducts.length} Kritis
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {metrics.lowStockProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                      <Package className="w-10 h-10 opacity-20" />
                      <p className="text-xs font-mono uppercase tracking-widest text-center mt-2">Kuantitas Stok<br/>Terjaga Aman</p>
                    </div>
                  ) : (
                    metrics.lowStockProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-brand-cream/50 rounded-2xl border border-cream-dark hover:border-maroon/30 transition-colors">
                        <img src={p.image} className="w-12 h-14 object-cover rounded-xl border border-cream-dark flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-sm text-stone-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.code}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md text-[10px]">
                            Stok: {p.stock ?? 5}
                          </span>
                          <button onClick={() => handleUpdateStock(p, (p.stock ?? 5) + 5)} className="px-2.5 py-1 bg-white border border-cream-dark hover:bg-emerald-50 hover:border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold transition-all shadow-sm">
                            +5 Unit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Panel Transaksi (Span 2) */}
              <div className="lg:col-span-2 bg-white rounded-[24px] border border-cream-dark p-6 shadow-sm flex flex-col h-[420px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-maroon" /> Antrean Pesanan Terbaru
                  </h3>
                  {orders.length > 0 && (
                    <button onClick={() => setAdminTab('orders')} className="text-[10px] font-bold text-maroon hover:text-maroon-dark transition-colors font-mono uppercase tracking-wider bg-maroon/5 hover:bg-maroon/10 px-3 py-1.5 rounded-lg">
                      Lihat Semua Pesanan &rarr;
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                      <ShoppingCart className="w-12 h-12 opacity-20" />
                      <p className="text-xs font-mono uppercase tracking-widest mt-2">Belum ada transaksi terekam</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orders.slice(0, 6).map(o => {
                        const statusConfig = STATUS_PESANAN[o.status] || STATUS_PESANAN.baru;
                        return (
                          <div key={o.id} className="p-4 rounded-2xl border border-cream-dark bg-brand-cream/30 hover:bg-white hover:shadow-sm transition-all group">
                            <div className="flex justify-between items-start mb-3">
                              <span className={`inline-flex text-[9px] font-bold font-mono px-2 py-1 rounded-md border ${statusConfig.cls}`}>
                                {statusConfig.label}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">{formatDate(o.createdAt)}</span>
                            </div>
                            <p className="font-bold text-sm text-stone-900 truncate" title={o.customerName}>{o.customerName}</p>
                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-[#EFE6DA]">
                                <div className="text-[10px] text-[#7A6558] font-mono truncate max-w-[180px]">
                                  {o.items && o.items.length > 0 ? (
                                    <span>
                                      {o.items[0].productCode} ({o.items[0].quantity}x)
                                      {o.items.length > 1 && ` +${o.items.length - 1} item`}
                                    </span>
                                  ) : (
                                    <span>—</span>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-maroon">{formatPrice(o.totalPrice)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* Render Tab Konten Katalog */}
        {adminTab === 'products' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-cream-dark shadow-sm">
              <p className="text-sm text-stone-700 font-medium">Registrasi Entri Katalog: <span className="font-bold text-maroon">{products.length} produk</span></p>
              <button onClick={() => { setEditProd({ title:'', category:'Kain Tenun', price: undefined, image:'', description:'', isFeatured:false, code:'TIS-NEW'+Math.floor(Math.random()*900+100), dimensions:'200 x 100 cm', weaver:'Mama Penenun', makingTime:'3 Bulan', stock: 1 }); setFormErr(''); setIsFormOpen(true); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" /> Tambah Entri Kain
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-brand-cream text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-cream-dark">
                      <th className="p-4 text-center w-24">Visual</th>
                      <th className="p-4">Karya Tenun</th>
                      <th className="p-4 w-28">Kategori</th>
                      <th className="p-4 w-32">Harga Satuan</th>
                      <th className="p-4 w-20 text-center">Stok</th>
                      <th className="p-4 w-28">Kode SKU</th>
                      <th className="p-4 w-32">Penenun</th>
                      <th className="p-4 w-24 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark/40">
                    {products.length === 0 ? (
                      <tr><td colSpan={8} className="py-16 text-center text-gray-400 text-sm">Arsip kosong. Sila entri kain pertama.</td></tr>
                    ) : products.map(p => (
                      <tr key={p.id} className="hover:bg-brand-cream/30 transition-colors">
                        <td className="p-4">
                          <div className="w-14 h-18 mx-auto rounded-lg overflow-hidden border border-cream-dark">
                            <img src={p.image} className="w-full h-full object-cover" alt="" />
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-serif font-bold text-stone-900 text-sm leading-tight">{p.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{p.dimensions || '—'} • {p.makingTime}</p>
                          {p.isFeatured && <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded mt-1"><Star className="w-2.5 h-2.5"/>Featured</span>}
                        </td>
                        <td className="p-4"><span className="px-2 py-0.5 text-[10px] font-mono font-bold text-maroon bg-rose-50 border border-rose-200 rounded">{p.category}</span></td>
                        <td className="p-4 font-bold text-maroon text-sm">{formatPrice(p.price)}</td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded-lg font-mono font-bold text-xs ${p.stock === 0 ? 'bg-red-100 text-red-800' : (p.stock ?? 5) <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{p.stock ?? 5}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-gray-500 text-xs">{p.code}</td>
                        <td className="p-4 text-stone-700 text-xs truncate max-w-[110px]">{p.weaver}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditProd({...p}); setFormErr(''); setIsFormOpen(true); }} className="p-1.5 bg-gray-100 text-gray-600 hover:text-stone-900 rounded-lg"><Edit className="w-3.5 h-3.5"/></button>
                            <button onClick={() => handleDeleteProd(p.id)} className="p-1.5 bg-gray-100 text-gray-600 hover:text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Render Tab Konten Penyesuaian Stok Cepat */}
        {adminTab === 'stock' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-brand-cream text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-cream-dark">
                      <th className="p-4 w-16">Foto</th>
                      <th className="p-4">Produk</th>
                      <th className="p-4 w-28">SKU</th>
                      <th className="p-4 w-28">Kategori</th>
                      <th className="p-4 w-40 text-center">Kuantitas Terkini</th>
                      <th className="p-4 w-52 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark/40">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-brand-cream/30 transition-colors">
                        <td className="p-4"><img src={p.image} className="w-10 h-12 object-cover rounded-lg border border-cream-dark" alt=""/></td>
                        <td className="p-4">
                          <p className="font-serif font-bold text-stone-900 text-sm">{p.title}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Penenun: {p.weaver}</p>
                        </td>
                        <td className="p-4 font-mono font-bold text-gray-500 text-xs">{p.code}</td>
                        <td className="p-4"><span className="px-2 py-0.5 text-[10px] font-mono font-bold text-maroon bg-rose-50 border border-rose-100 rounded">{p.category}</span></td>
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            <input type="number" min={0} value={p.stock ?? 5} onChange={e => handleUpdateStock(p, Number(e.target.value))} className="w-20 px-3 py-1.5 text-center font-mono font-bold text-sm border border-cream-dark rounded-lg focus:outline-none" />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleUpdateStock(p, (p.stock ?? 5) - 1)} className="px-2.5 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold">−1</button>
                            <button onClick={() => handleUpdateStock(p, (p.stock ?? 5) + 1)} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">+1</button>
                            <button onClick={() => handleUpdateStock(p, (p.stock ?? 5) + 5)} className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">+5</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Konten Manifest Order Pelanggan */}
        {adminTab === 'orders' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-brand-cream text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-cream-dark">
                      <th className="p-4">Pelanggan</th>
                      <th className="p-4">Item Komoditas</th>
                      <th className="p-4 w-32">Total Pricing</th>
                      <th className="p-4 w-32">Timestamp</th>
                      <th className="p-4 w-36">Status Kerja</th>
                      <th className="p-4 w-16 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-dark/40">
                    {filteredOrders.map(o => {
                      const statusConfig = STATUS_PESANAN[o.status] || STATUS_PESANAN.menunggu;
                      return (
                        <tr key={o.id} className="hover:bg-brand-cream/30 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-sm text-stone-900">{o.customerName}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{o.customerEmail}</p>
                            <a href={`https://wa.me/${o.customerPhone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-700 hover:underline font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5"/>{o.customerPhone}
                            </a>
                          </td>
                          <td className="p-4">
                            {o.items && o.items.map((item, idx) => (
                              <div key={idx} className="mb-2 last:mb-0 border-b border-cream-dark/20 pb-1.5 last:pb-0 last:border-b-0">
                                <p className="font-serif font-bold text-sm text-stone-900">{item.productTitle}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{item.productCode} • {item.quantity} pcs</p>
                              </div>
                            ))}
                          </td>
                          <td className="p-4 font-mono font-bold text-maroon text-sm">{formatPrice(o.totalPrice)}</td>
                          <td className="p-4 text-[11px] text-gray-400 font-mono">{formatDateTime(o.createdAt)}</td>
                          <td className="p-4">
                            <select value={o.status} onChange={e => handleUpdateOrderStatus(o.id, e.target.value as Order['status'])} className={`w-full px-2 py-1.5 text-xs font-bold rounded-lg border focus:outline-none cursor-pointer ${statusConfig.cls}`}>
                              {Object.entries(STATUS_PESANAN).map(([v,st]) => <option key={v} value={v}>{st.label}</option>)}
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteOrder(o.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Konten Konsultasi Masuk */}
        {adminTab === 'messages' && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 gap-4">
              {filteredMessages.map(m => {
                const messageStatus = STATUS_PESAN[m.status] || STATUS_PESAN.baru;
                return (
                  <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${m.status === 'baru' ? 'border-rose-200 bg-rose-50/20' : 'border-cream-dark'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-cream rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4.5 h-4.5 text-maroon" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-stone-900">{m.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{m.email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${messageStatus.cls}`}>{messageStatus.label}</span>
                    </div>
                    <p className="text-sm text-stone-700 bg-brand-cream/40 rounded-xl p-3 italic">"{m.message}"</p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {['baru','dibaca','selesai'].map(st => (
                          <button key={st} onClick={() => handleUpdateMsgStatus(m.id, st as any)} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${m.status === st ? 'bg-stone-200 border-stone-400' : 'bg-white text-gray-500'}`}>{st}</button>
                        ))}
                      </div>
                      <button onClick={() => handleDeleteMsg(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Konten Manajemen Artikel Edukasi */}
        {adminTab === 'articles' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-cream-dark shadow-sm">
              <p className="text-sm text-stone-700 font-medium">Koleksi Artikel Budaya: <strong className="text-maroon">{articles.length} entri</strong></p>
              <button onClick={() => { setEditArt({ title:'', excerpt:'', content:'', image:'', author:'Admin Seraphine', slug:'' }); setArtErr(''); setIsArtFormOpen(true); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase rounded-xl shadow flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4"/> Rilis Artikel Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map(art => (
                <div key={art.id} className="bg-white rounded-2xl border border-cream-dark shadow-sm overflow-hidden hover:shadow-md">
                  <img src={art.image} className="w-full h-40 object-cover" alt="" />
                  <div className="p-4">
                    <p className="font-serif font-bold text-stone-900 text-base leading-tight mb-1">{art.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{art.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-mono font-bold text-brand-gold uppercase">{art.author}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{formatDate(art.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditArt({...art}); setArtErr(''); setIsArtFormOpen(true); }} className="p-1.5 bg-gray-100 rounded-lg"><Edit className="w-3.5 h-3.5"/></button>
                        <button onClick={() => handleDeleteArt(art.id)} className="p-1.5 bg-gray-100 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



      </div>

      {/* ── Modal Block: Formulir Produk ─────────────────────────────────── */}
      {isFormOpen && editProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsFormOpen(false); setEditProd(null); }}}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-brand-cream border-b border-cream-dark flex-shrink-0">
              <h3 className="font-serif text-lg font-bold text-stone-900">{editProd.id ? 'Edit Karya Tenun Adat' : 'Registrasi Produk Baru'}</h3>
              <button onClick={() => { setIsFormOpen(false); setEditProd(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveProd} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{formErr}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nama Kain *</label>
                  <input type="text" required placeholder="Contoh: Tenun Sumba Kambera" value={editProd.title||''} onChange={e=>setEditProd({...editProd,title:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Harga Nominal (IDR) *</label>
                  <input type="number" required placeholder="Contoh: 1500000" value={editProd.price||''} onChange={e=>setEditProd({...editProd,price:Number(e.target.value)})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl"/>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Kuantitas Alokasi Stok *</label>
                  <input type="number" required min={0} placeholder="Contoh: 5" value={editProd.stock??5} onChange={e=>setEditProd({...editProd,stock:Number(e.target.value)})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Foto Produk *</label>
                  {editProd.image ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-cream-dark shadow-sm bg-[#F5EDE3]">
                      <img src={editProd.image} className="w-full h-full object-cover" alt="Pratinjau Foto" />
                      <button 
                        type="button" 
                        onClick={() => setEditProd({ ...editProd, image: '' })}
                        className="absolute top-3 right-3 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-cream-dark hover:border-maroon/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-brand-cream/30 hover:bg-brand-cream/50 transition-all text-center">
                      <Plus className="w-6 h-6 text-stone-400 mb-1.5" />
                      <span className="text-xs font-bold text-stone-700">Pilih Foto dari Perangkat</span>
                      <span className="text-[9px] text-gray-400 mt-1">Maksimal ukuran file: 2 MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, 'product')} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Deskripsi & Latar Belakang Produk</label>
                  <textarea rows={3} placeholder="Contoh: Kain tenun khas daerah Sumba Timur dengan tenunan benang alami..." value={editProd.description||''} onChange={e=>setEditProd({...editProd,description:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl resize-none"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Makna Simbolis & Filosofi Motif</label>
                  <textarea rows={3} placeholder="Contoh: Motif Kuda melambangkan keagungan, kepahlawanan, dan kebangsawanan..." value={editProd.maknaMotif||''} onChange={e=>setEditProd({...editProd,maknaMotif:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl resize-none"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Status Publikasi Produk *</label>
                  <select value={editProd.status||'aktif'} onChange={e=>setEditProd({...editProd,status:e.target.value as any})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl">
                    <option value="aktif">Aktif (Ditampilkan di Katalog)</option>
                    <option value="nonaktif">Nonaktif (Diarsipkan)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-cream-dark">
                <button type="button" onClick={() => { setIsFormOpen(false); setEditProd(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button>
                <button type="submit" disabled={savingProd} className="px-5 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase rounded-xl shadow">{savingProd ? 'Memproses...' : 'Simpan Entri'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Block: Formulir Artikel ─────────────────────────────────── */}
      {isArtFormOpen && editArt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsArtFormOpen(false); setEditArt(null); }}}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-brand-cream border-b border-cream-dark flex-shrink-0">
              <h3 className="font-serif text-lg font-bold text-stone-900">{editArt.id ? 'Edit Manuskrip Edukasi' : 'Tulis Artikel Baru'}</h3>
              <button onClick={() => { setIsArtFormOpen(false); setEditArt(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveArt} className="p-6 space-y-4 overflow-y-auto flex-1">
              {artErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{artErr}</div>}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Judul Manuskrip *</label>
                <input type="text" required placeholder="Contoh: Sejarah Makna Motif Kuda Sumba" value={editArt.title||''} onChange={e=>setEditArt({...editArt,title:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl"/>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Foto Sampul Artikel *</label>
                {editArt.image ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-cream-dark shadow-sm bg-[#F5EDE3]">
                    <img src={editArt.image} className="w-full h-full object-cover" alt="Pratinjau Sampul" />
                    <button 
                      type="button" 
                      onClick={() => setEditArt({ ...editArt, image: '' })}
                      className="absolute top-3 right-3 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-cream-dark hover:border-maroon/40 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-brand-cream/30 hover:bg-brand-cream/50 transition-all text-center">
                    <Plus className="w-5 h-5 text-stone-400 mb-1" />
                    <span className="text-xs font-bold text-stone-700">Pilih Foto Sampul</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">Maksimal: 2 MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'article')} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Ringkasan Narasi (Excerpt) *</label>
                <input type="text" required placeholder="Contoh: Ringkasan singkat mengenai sejarah tenun..." value={editArt.excerpt||''} onChange={e=>setEditArt({...editArt,excerpt:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl"/>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Konten Narasi Lengkap *</label>
                <textarea required rows={8} placeholder="Tuliskan seluruh isi kajian filosofis secara komprehensif..." value={editArt.content||''} onChange={e=>setEditArt({...editArt,content:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-cream-dark rounded-xl resize-none"/>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-cream-dark">
                <button type="button" onClick={() => { setIsArtFormOpen(false); setEditArt(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button>
                <button type="submit" disabled={savingArt} className="px-5 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase rounded-xl shadow">{savingArt ? 'Menerbitkan...' : 'Rilis Narasi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar (Mobile Only) */}
      <div className="fixed bottom-0 inset-x-0 z-[140] bg-[#FBF8F4]/95 backdrop-blur-md border-t border-[#EFE6DA] flex md:hidden items-center justify-around py-2 px-1 shadow-[0_-4px_20px_rgba(61,26,10,0.08)]">
        <BottomTabItem active={adminTab==='overview'}  onClick={()=>setAdminTab('overview')}  icon={<BarChart3 />}     label="Ringkasan" />
        <BottomTabItem active={adminTab==='products'}  onClick={()=>setAdminTab('products')}  icon={<Package />}       label="Katalog"   badge={products.length} />
        <BottomTabItem active={adminTab==='stock'}     onClick={()=>setAdminTab('stock')}     icon={<Layers />}        label="Stok" />
        <BottomTabItem active={adminTab==='orders'}    onClick={()=>setAdminTab('orders')}    icon={<ShoppingCart />}  label="Pesanan"   badge={metrics.activeOrders} />
        <BottomTabItem active={adminTab==='messages'}  onClick={()=>setAdminTab('messages')}  icon={<MessageSquare />} label="Chat"      badge={metrics.newMessages} />
        <BottomTabItem active={adminTab==='articles'}  onClick={()=>setAdminTab('articles')}  icon={<BookOpen />}      label="Edukasi"   badge={articles.length} />
      </div>

    </div>
  );
}