import React from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit, 
  Inbox, 
  Package, 
  Sparkles, 
  Clock, 
  Mail, 
  Lock, 
  Eye, 
  AlertCircle, 
  X, 
  RefreshCw,
  TrendingUp,
  User,
  Heart
} from 'lucide-react';
import { Product } from '../types';
import { dbService, isSupabaseConfigured } from '../lib/supabase';

interface AdminViewProps {
  onRefresh?: () => void;
}

export default function AdminView({ onRefresh }: AdminViewProps) {
  // Access and Auth states
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [adminUsername, setAdminUsername] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  
  // Tab within Admin Panel: 'overview' | 'products' | 'inquiries'
  const [adminTab, setAdminTab] = React.useState<'overview' | 'products' | 'inquiries'>('overview');
  
  // Data lists loading
  const [products, setProducts] = React.useState<Product[]>([]);
  const [inquiries, setInquiries] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [databaseSource, setDatabaseSource] = React.useState<'Supabase' | 'LocalStorage'>('LocalStorage');

  // Product form states
  const [editingProduct, setEditingProduct] = React.useState<Partial<Product> | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const [btnSaving, setBtnSaving] = React.useState(false);

  // Copy success feedback state
  const [sqlCopied, setSqlCopied] = React.useState(false);

  // Load all records
  const loadData = async () => {
    setIsLoading(true);
    try {
      const prodList = await dbService.getAllProducts();
      const inqList = await dbService.getInquiries();
      setProducts(prodList);
      setInquiries(inqList);
      setDatabaseSource(isSupabaseConfigured ? 'Supabase' : 'LocalStorage');
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Load data admin error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Handle credentials authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const isTenunSumba = adminUsername.trim().toLowerCase() === 'tenunsumba' && adminPassword === 'Tenunsumba';
    const isLegacyAdmin = (adminUsername.trim() === 'admin' && adminPassword === 'admin') || (adminUsername.trim() === 'admin' && adminPassword === '1234') || (adminUsername.trim() === '' && adminPassword === '1234');
    
    if (isTenunSumba || isLegacyAdmin) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Username atau Password salah!');
    }
  };

  // SQL Script template for copy paste inside the setup hub
  const supabaseSQL = `-- 1. BUAT TABLE PRODUCTS SECARA OTOMATIS
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    is_featured BOOLEAN DEFAULT false,
    code TEXT UNIQUE NOT NULL,
    dimensions TEXT,
    weaver TEXT,
    making_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REFILL DATA PERTAMA KALI UNTUK PRODUCTS
INSERT INTO public.products (id, title, category, price, image, description, is_featured, code, dimensions, weaver, making_time) 
VALUES 
('1', 'Tenun Ikat Sumba Motif Kuda', 'Kain Tenun', 2500000, 'https://images.unsplash.com/photo-1551250936-3190e2108db9?auto=format&fit=crop&w=600&q=80', 'Kain Tenun Ikat Sumba asli dengan motif Kuda Sumba melambangkan keanggunan dan status sosial.', true, 'TIS-KUD0A', '240 x 110 cm', 'Mama Seraphine Weetebula', '6 Bulan')
ON CONFLICT (id) DO NOTHING;

-- 2. BUAT TABLE INQUIRIES
CREATE TABLE IF NOT EXISTS public.inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    product_title TEXT,
    product_code TEXT,
    status TEXT DEFAULT 'baru', -- 'baru' | 'dibaca' | 'selesai'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS) AGAR AMAN
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- BUAT POLICY SUPAYA SEMUA ORANG BISA VIEW & INSERT PESAN
CREATE POLICY "Public Read Access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.inquiries FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Full Admin Access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Admin Access" ON public.inquiries FOR ALL USING (true) WITH CHECK (true);
`;

  const copySQL = () => {
    navigator.clipboard.writeText(supabaseSQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  // Product save submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    const p = editingProduct;
    if (!p?.title || !p?.price || !p?.image || !p?.code) {
      setFormError('Harap isi semua input wajib (Nama, Harga, Kode, URL Gambar)');
      return;
    }

    setBtnSaving(true);
    try {
      await dbService.saveProduct({
        id: p.id,
        title: p.title,
        category: p.category || 'Kain Tenun',
        price: Number(p.price),
        image: p.image,
        description: p.description || '',
        isFeatured: p.isFeatured || false,
        code: p.code,
        dimensions: p.dimensions || '',
        weaver: p.weaver || 'Mama Seraphine',
        makingTime: p.makingTime || '1 Bulan'
      });
      setIsFormOpen(false);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      setFormError('Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setBtnSaving(false);
    }
  };

  // Product delete
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini dari katalog?')) {
      await dbService.deleteProduct(id);
      loadData();
    }
  };

  // Inquiry update status
  const handleUpdateInquiryStatus = async (id: string, stat: 'baru' | 'dibaca' | 'selesai') => {
    await dbService.updateInquiryStatus(id, stat);
    loadData();
  };

  // Inquiry delete
  const handleDeleteInquiry = async (id: string) => {
    if (confirm('Hapus pesan pelanggan ini?')) {
      await dbService.deleteInquiry(id);
      loadData();
    }
  };

  // Open creation modal tool
  const openNewProductForm = () => {
    setEditingProduct({
      title: '',
      category: 'Kain Tenun',
      price: 1500000,
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80',
      description: '',
      isFeatured: false,
      code: 'TIS-NEW' + Math.floor(Math.random() * 900 + 100),
      dimensions: '200 x 100 cm',
      weaver: 'Mama Penenun',
      makingTime: '3 Bulan'
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // Open editing modal tool
  const openEditProductForm = (p: Product) => {
    setEditingProduct({ ...p });
    setFormError('');
    setIsFormOpen(true);
  };

  // Calculate high-fidelity dashboard metrics
  const totalValuation = products.reduce((sum, p) => sum + p.price, 0);
  const featuredCount = products.filter((p) => p.isFeatured).length;
  const newInquiriesCount = inquiries.filter((inq) => inq.status === 'baru').length;
  const totalWeavers = Array.from(new Set(products.map((p) => p.weaver || 'Seraphine'))).length;

  if (!isAuthenticated) {
    return (
      <div id="admin-login-screen" className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 pt-24 pb-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-brand-cream-dark p-8 shadow-xl text-center flex flex-col items-center">
          
          {/* Logo Frame & Sumba pattern icons banner */}
          <div className="w-16 h-16 bg-[#B01818] rounded-2xl flex items-center justify-center text-white p-2 shadow-md mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
              <path d="M50,5 L95,50 L50,95 L5,50 Z" stroke="currentColor" strokeWidth="5" fill="none" />
              <path d="M50,15 L85,50 L50,85 L15,50 Z" stroke="currentColor" strokeWidth="4" fill="none" />
              <rect x="42" y="42" width="16" height="16" transform="rotate(45 50 50)" />
              <line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="4" />
              <line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" strokeWidth="4" />
            </svg>
          </div>

          <h3 className="font-serif text-2xl font-bold text-brand-brown-dark">
            Portal Admin Balai Tenun
          </h3>
          <p className="text-xs text-brand-gold font-mono uppercase tracking-widest mt-1 mb-6">
            CD Seraphine Weetebula
          </p>

          <div className="bg-[#FAF6F2] py-3.5 px-4 rounded-lg border border-brand-cream-dark text-xs text-gray-600 text-left mb-6 w-full">
            <div className="flex gap-2 items-start text-[#B01818] font-bold mb-1">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Verifikasi Akses Admin</span>
            </div>
            Masukkan username dan password administrator untuk mengelola status database Supabase, mengubah katalog tenun, dan membaca pesan masuk.
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="text-left">
              <label htmlFor="admin-username-input" className="block text-xs font-mono font-bold uppercase text-gray-405 mb-1">
                Username Admin
              </label>
              <input 
                type="text"
                required
                id="admin-username-input"
                placeholder="Masukkan Username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#FAF6F2] border border-brand-cream-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold focus:bg-white transition-all text-brand-brown-dark font-medium"
              />
            </div>

            <div className="text-left">
              <label htmlFor="admin-password-input" className="block text-xs font-mono font-bold uppercase text-gray-450 mb-1">
                Password Admin
              </label>
              <input 
                type="password"
                required
                id="admin-password-input"
                placeholder="Masukkan Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#FAF6F2] border border-brand-cream-dark rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold focus:bg-white transition-all text-brand-brown-dark font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#B01818] hover:bg-[#8E1212] text-white font-sans text-xs font-bold tracking-widest uppercase rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Masuk Dashboard
            </button>

            <span className="block text-[10px] text-gray-400">
              *Petunjuk Pengujian: Gunakan <strong className="text-stone-700">Tenunsumba</strong> / <strong className="text-stone-705">Tenunsumba</strong>
            </span>

          </form>

        </div>
      </div>
    );
  }

  return (
    <div id="admin-workspace" className="min-h-screen bg-[#FCFAF7] pt-24 pb-16 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= HEADER BRAND BAR ================= */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-brand-cream-dark shadow-sm mb-8">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-brown-dark rounded-xl flex items-center justify-center text-brand-gold p-1.5 shadow">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-brand-brown-dark leading-none">
                  Admin Workplace
                </h2>
                {databaseSource === 'Supabase' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Supabase Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    Sandbox Local
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Panel integrasi data ikat tenun CD Seraphine Sumba
              </p>
            </div>
          </div>

          {/* Tab Navigation buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-[#FAF6F2] p-1 rounded-xl border border-brand-cream-dark">
            <button
              id="admin-tab-overview"
              onClick={() => setAdminTab('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${adminTab === 'overview' ? 'bg-[#B01818] text-white shadow-xs' : 'text-gray-600 hover:text-brand-brown'}`}
            >
              Ringkasan
            </button>
            <button
              id="admin-tab-products"
              onClick={() => setAdminTab('products')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${adminTab === 'products' ? 'bg-[#B01818] text-white shadow-xs' : 'text-gray-600 hover:text-brand-brown'}`}
            >
              Katalog Tenun ({products.length})
            </button>
            <button
              id="admin-tab-inquiries"
              onClick={() => setAdminTab('inquiries')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${adminTab === 'inquiries' ? 'bg-[#B01818] text-white shadow-xs' : 'text-gray-600 hover:text-brand-brown'}`}
            >
              Pesan Masuk ({newInquiriesCount} Baru)
            </button>

          </div>

          {/* Lock Action */}
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="px-3.5 py-1.5 text-xs bg-gray-150 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl self-end md:self-auto flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Panel</span>
          </button>

        </div>

        {/* ================= TAB CONTENT Area ================= */}

        {/* A. OVERVIEW MODULE */}
        {adminTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Supabase status warning ribbon if sandbox is active */}
            {databaseSource === 'LocalStorage' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 leading-normal text-xs sm:text-sm shadow-inner">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold flex items-center gap-1.5">
                    Modul Database Supabase Belum Terkoneksi
                  </h4>
                  <p className="text-amber-700 text-xs mt-1">
                    Saat ini Anda sedang menggunakan <strong>Sanbox Local Mock Storage</strong>. Data yang Anda tambahkan, ubah, atau hapus hanya tersimpan di browser Anda. Klik tab <strong>"Supabase SQL"</strong> untuk melihat tutorial setup cepat & mengunggah kode tabel dalam 2 menit!
                  </p>
                </div>
              </div>
            )}

            {/* STATS DECOR WIDGETS BENTO GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-brand-cream-dark shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-405 font-mono font-bold uppercase block">Katalog Produk</span>
                  <p className="text-3xl font-serif font-extrabold text-brand-brown-dark mt-1">{products.length}</p>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1">✓ {featuredCount} Unggulan</span>
                </div>
                <div className="w-10 h-10 bg-brand-cream-dark rounded-xl flex items-center justify-center text-[#B01818]">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-brand-cream-dark shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-405 font-mono font-bold uppercase block">Pesan Masuk Baru</span>
                  <p className="text-3xl font-serif font-extrabold text-[#B01818] mt-1">{newInquiriesCount}</p>
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">total {inquiries.length} pesan</span>
                </div>
                <div className="w-10 h-10 bg-brand-cream-dark rounded-xl flex items-center justify-center text-[#B01818]">
                  <Inbox className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-brand-cream-dark shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-405 font-mono font-bold uppercase block">Jumlah Penenun</span>
                  <p className="text-3xl font-serif font-extrabold text-brand-brown-dark mt-1">{totalWeavers}</p>
                  <span className="text-[10px] text-[#B01818] font-bold block mt-1">Perempuan Sumba Barat</span>
                </div>
                <div className="w-10 h-10 bg-brand-cream-dark rounded-xl flex items-center justify-center text-[#B01818]">
                  <User className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-brand-cream-dark shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-405 font-mono font-bold uppercase block">Estimasi Valuasi</span>
                  <p className="text-xl sm:text-2xl font-sans font-extrabold text-[#B01818] mt-2">
                    Rp {totalValuation.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium block mt-1">nilai aset aktif</span>
                </div>
                <div className="w-10 h-10 bg-brand-cream-dark rounded-xl flex items-center justify-center text-[#B01818]">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* RETROSPECTIVE ACTIVITY BLOCK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Box: Recent Inquiries */}
              <div className="bg-white rounded-2xl border border-brand-cream-dark p-6 shadow-sm col-span-1 lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-md font-bold text-stone-800">Pesan Pelanggan Terbaru</h3>
                  <button onClick={() => setAdminTab('inquiries')} className="text-xs text-brand-brown hover:underline font-bold">Semua</button>
                </div>

                <div className="divide-y divide-gray-100">
                  {inquiries.slice(0, 3).map((inq, i) => (
                    <div key={inq.id || i} className="py-3 first:pt-0 last:pb-0 flex justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-stone-700">
                          <span>{inq.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${inq.status === 'baru' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {inq.status}
                          </span>
                        </div>
                        <p className="text-[#8B847C] font-mono mt-0.5 truncate max-w-xs">{inq.email}</p>
                        <p className="text-gray-600 mt-1 italic line-clamp-1">"{inq.message}"</p>
                      </div>
                      <span className="text-gray-400 font-mono text-[10px] text-right">
                        {new Date(inq.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  ))}

                  {inquiries.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">Belum ada pesan masuk.</div>
                  )}
                </div>
              </div>

              {/* Right Box: Sumba Traditional Craft Stewardship Tips */}
              <div className="bg-[#FAF6F2] rounded-2xl border border-brand-cream-dark p-6 col-span-1 lg:col-span-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-md font-bold text-[#8E1212] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                    Pelestarian Warisan
                  </h3>
                  <p className="text-xs text-stone-605 leading-relaxed">
                    Setiap kain merupakan representasi dari kosmologi peninggalan leluhur Marapu. Saat merilis produk baru:
                  </p>
                  <ul className="text-[11px] text-stone-500 mt-2 space-y-1.5">
                    <li>• Cantumkan <strong>nama perajin (Mama)</strong> yang memilin benang & mengikat pola.</li>
                    <li>• Sebutkan <strong>durasi pembuatannya</strong> (contoh: 4 Bulan atau 8 Bulan) untuk mengedukasi pembeli mengapa nilai seninya sangat tinggi.</li>
                    <li>• Pastikan format kode konsisten agar mudah diklasifikasi.</li>
                  </ul>
                </div>
                
                <div className="pt-4 border-t border-brand-cream-dark/50 mt-4 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#A69784] font-medium font-mono uppercase">CD Seraphine SBDNTT</span>
                  <div className="flex gap-1 text-red-500">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* B. DETAILED CATALOG MANAGER */}
        {adminTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-brand-cream-dark shadow-sm">
              <div className="text-sm text-gray-600 font-sans font-medium">
                Katalog Produk Aktif: <span className="font-bold text-brand-brown-dark">{products.length} item</span>
              </div>
              <button
                onClick={openNewProductForm}
                className="px-4 py-2 bg-[#B01818] hover:bg-[#8E1212] text-white text-xs font-bold tracking-wide uppercase rounded-lg shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            </div>

            {/* List Table wrapper of products */}
            <div className="bg-white rounded-2xl border border-brand-cream-dark shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-brand-cream/50 text-xs text-brand-brown font-mono font-bold uppercase tracking-wider border-b border-brand-cream-dark">
                    <th className="p-4 w-28 text-center">Gambar</th>
                    <th className="p-4">Kombu / Detail Karya</th>
                    <th className="p-4 w-32">Kategori</th>
                    <th className="p-4 w-36">Harga</th>
                    <th className="p-4 w-32">Aset Code</th>
                    <th className="p-4 w-24">Penenun</th>
                    <th className="p-4 w-28 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm text-stone-700">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-brand-cream/10 transition-colors">
                      <td className="p-4">
                        <div className="w-16 h-20 rounded-md overflow-hidden bg-gray-100 border border-brand-cream">
                          <img 
                            src={p.image} 
                            alt={p.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <h4 className="font-serif font-bold text-brand-brown-dark -mb-0.5">{p.title}</h4>
                          <span className="text-[10px] text-gray-400 font-serif block">
                            Durasi: {p.makingTime} • Dimensi: {p.dimensions || '-'}
                          </span>
                          {p.isFeatured && (
                            <span className="inline-block mt-1 text-[9px] bg-amber-100 text-[#763e18] font-bold px-1.5 py-0.2 rounded font-sans uppercase">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-[10px] font-mono font-bold text-[#B01818] bg-[#FFF5F5] rounded border">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-[#B01818]">
                        Rp {p.price.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-500">
                        {p.code}
                      </td>
                      <td className="p-4 font-medium text-stone-600 max-w-[120px] truncate">
                        {p.weaver}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProductForm(p)}
                            className="p-1.5 bg-gray-100 hover:bg-brand-gold/25 text-gray-700 hover:text-[#763e18] rounded-md"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">
                        Memuat data katalog produk atau kosong...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* C. INQUIRIES CUSTOMER MESSAGES */}
        {adminTab === 'inquiries' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-white p-4 rounded-xl border border-brand-cream-dark shadow-sm text-sm text-gray-650 flex justify-between items-center">
              <span>Total Pesan Konsultasi Masuk: <strong className="text-brand-brown-dark">{inquiries.length} pesan</strong></span>
              <span className="text-xs text-gray-400 font-mono font-bold">Inquiry System CRM</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {inquiries.map((inq, idx) => (
                <div 
                  key={inq.id || idx} 
                  className={`bg-white rounded-2xl p-6 border ${inq.status === 'baru' ? 'border-brand-gold' : 'border-brand-cream-dark'} shadow-sm space-y-4 relative`}
                >
                  {/* Status Indicator Bar */}
                  <div className="absolute top-0 inset-x-0 h-1.5 rounded-t-2.5xl pointer-events-none" style={{
                    backgroundColor: inq.status === 'baru' ? '#D4702E' : inq.status === 'dibaca' ? '#8E1212' : '#d1c7bd'
                  }} />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-lg font-bold text-brand-brown-dark">{inq.name}</h4>
                        <span className={`text-[10px] font-mono font-bold uppercase py-0.5 px-2 rounded-full ${
                          inq.status === 'baru' 
                            ? 'bg-rose-100 text-rose-800' 
                            : inq.status === 'dibaca' 
                            ? 'bg-indigo-100 text-indigo-805' 
                            : 'bg-emerald-100 text-emerald-805'
                        }`}>
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">
                        Email: <a href={`mailto:${inq.email}`} className="text-blue-700 hover:underline">{inq.email}</a> • Terkirim: {new Date(inq.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Status modify buttons */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="text-[10px] font-mono text-gray-400 font-bold uppercase mr-1">Tandai:</span>
                      
                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, 'baru')}
                        className={`px-2 py-1 text-[10px] rounded font-semibold ${inq.status === 'baru' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Baru
                      </button>

                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, 'dibaca')}
                        className={`px-2 py-1 text-[10px] rounded font-semibold ${inq.status === 'dibaca' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Dibaca
                      </button>

                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, 'selesai')}
                        className={`px-2 py-1 text-[10px] rounded font-semibold ${inq.status === 'selesai' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Selesai
                      </button>

                      <button
                        onClick={() => handleDeleteInquiry(inq.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Hapus Pesan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subjek & Message Body */}
                  <div className="bg-[#FAF8F5] p-4 rounded-xl border border-brand-cream-dark/50 text-xs sm:text-sm text-gray-705">
                    <div className="font-bold text-brand-brown-dark font-sans mb-1">
                      Subjek: {inq.subject || '(Tidak ada subjek)'}
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {inq.message}
                    </p>
                  </div>

                  {/* Attachment metadata product reference */}
                  {(inq.product_title || inq.product_code) && (
                    <div className="p-3 bg-brand-cream/40 rounded-lg text-[11px] text-[#B01818] flex items-center justify-between border border-brand-cream-dark/30">
                      <span>Referensi Halaman Detail Produk: <strong>{inq.product_title}</strong></span>
                      <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border">{inq.product_code}</span>
                    </div>
                  )}

                </div>
              ))}

              {inquiries.length === 0 && (
                <div className="bg-white rounded-xl py-12 text-center text-gray-400 border border-brand-cream-dark shadow-sm">
                  Belum ada pesan masuk dari pengunjung website.
                </div>
              )}
            </div>

          </div>
        )}


      </div>

      {/* ========================================================================= */}
      {/* ===================== EDIT/CREATE PRODUCT INLINE MODAL ===================== */}
      {/* ========================================================================= */}
      {isFormOpen && editingProduct && (
        <div id="product-form-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            id="product-form-surface" 
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden relative animate-fade-in max-h-[90vh] overflow-y-auto"
          >
            
            <div className="p-5 bg-brand-cream/80 border-b border-brand-cream-dark flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-brand-brown-dark">
                {editingProduct.id ? 'Edit Detail Karya Tenun' : 'Tambah Karya Tenun Baru'}
              </h3>
              <button 
                onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}
                className="p-1 text-gray-500 hover:text-red-650"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 md:space-y-5">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-lg font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Title */}
                <div>
                  <label htmlFor="form-prod-title" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Nama Karya *
                  </label>
                  <input 
                    type="text" 
                    id="form-prod-title"
                    required
                    placeholder="Contoh: Tenun Sumba Kambera"
                    value={editingProduct.title || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-800"
                  />
                </div>

                {/* Code */}
                <div>
                  <label htmlFor="form-prod-code" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Kode Produk *
                  </label>
                  <input 
                    type="text" 
                    id="form-prod-code"
                    required
                    placeholder="Contoh: TIS-KAM07"
                    value={editingProduct.code || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, code: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-805"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="form-prod-category" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Kategori Tenun *
                  </label>
                  <select
                    id="form-prod-category"
                    value={editingProduct.category || 'Kain Tenun'}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-800"
                  >
                    <option value="Kain Tenun">Kain Tenun</option>
                    <option value="Tas & Aksesori">Tas & Aksesori</option>
                    <option value="Selendang">Selendang</option>
                    <option value="Dekorasi">Dekorasi</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="form-prod-price" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Harga (IDR Rupiah) *
                  </label>
                  <input 
                    type="number" 
                    id="form-prod-price"
                    required
                    placeholder="Contoh: 1500000"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-805"
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label htmlFor="form-prod-image" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    URL Gambar Karya (Unsplash / Hotlinks) *
                  </label>
                  <input 
                    type="url" 
                    id="form-prod-image"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-805"
                  />
                </div>

                {/* Weaver (Mama) */}
                <div>
                  <label htmlFor="form-prod-weaver" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Penenun (Mama Adat)
                  </label>
                  <input 
                    type="text" 
                    id="form-prod-weaver"
                    placeholder="Contoh: Mama Seraphine Weetebula"
                    value={editingProduct.weaver || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, weaver: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-805"
                  />
                </div>

                {/* Making Time */}
                <div>
                  <label htmlFor="form-prod-makingtime" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Durasi Pengerjaan
                  </label>
                  <input 
                    type="text" 
                    id="form-prod-makingtime"
                    placeholder="Contoh: 3 Bulan / 4 Minggu"
                    value={editingProduct.makingTime || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, makingTime: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-850"
                  />
                </div>

                {/* Dimensions */}
                <div>
                  <label htmlFor="form-prod-dimensions" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Ukuran (Dimensi)
                  </label>
                  <input 
                    type="text" 
                    id="form-prod-dimensions"
                    placeholder="Contoh: 240 x 110 cm"
                    value={editingProduct.dimensions || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, dimensions: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-850"
                  />
                </div>

                {/* Featured Checkbox toggle */}
                <div className="flex items-center gap-2 pt-5">
                  <input 
                    type="checkbox" 
                    id="form-prod-featured"
                    checked={editingProduct.isFeatured || false}
                    onChange={(e) => setEditingProduct({...editingProduct, isFeatured: e.target.checked})}
                    className="w-4.5 h-4.5 accent-brand-brown cursor-pointer"
                  />
                  <label htmlFor="form-prod-featured" className="text-xs uppercase font-mono font-bold text-gray-600 block cursor-pointer">
                    Set Sebagai Unggulan (Featured)
                  </label>
                </div>

                {/* Description input */}
                <div className="md:col-span-2">
                  <label htmlFor="form-prod-description" className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Naskah Filosofi Detail Karya / Deskripsi
                  </label>
                  <textarea 
                    id="form-prod-description"
                    rows={4}
                    placeholder="Tuliskan latar belakang budaya atau makna geometris motif di tenun ini..."
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-805 resize-none"
                  />
                </div>

              </div>

              {/* Save or cancel buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-brand-cream-dark/50">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold tracking-wide uppercase rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={btnSaving}
                  className="px-5 py-2 bg-[#B01818] hover:bg-[#8E1212] text-white text-xs font-bold tracking-wide uppercase rounded-lg"
                >
                  {btnSaving ? 'Menyimpan...' : 'Simpan Detail'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
