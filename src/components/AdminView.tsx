import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Database, Plus, Trash2, Edit, Package, Clock, Mail, Lock,
  AlertCircle, X, RefreshCw, TrendingUp, DollarSign, Users,
  ShoppingCart, MessageSquare, BarChart3, Layers, Eye, Phone, LogOut, Wifi, WifiOff, Star, BookOpen,
  Tag, MapPin, Percent, CreditCard, Truck, List, Award, Ruler, Menu
} from 'lucide-react';
import { Product, Order, Article, Kategori, Penenun, KelompokPenenun, Promo, Pembayaran, Pengiriman, StokLog, CustomSize, Notifikasi, User } from '../types';
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
  <div className={`rounded-[24px] p-5 border flex items-start justify-between gap-3 shadow-sm transition-all duration-300 ${accent ? 'bg-maroon border-maroon-dark text-white' : 'bg-white border-[#F1F5F9]'}`}>
    <div>
      <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 ${accent ? 'text-rose-200' : 'text-gray-400'}`}>{label}</p>
      <p className={`text-2xl font-serif font-extrabold leading-none ${accent ? 'text-white' : 'text-stone-900'}`}>{value}</p>
      {sub && <p className={`text-[10px] mt-1.5 ${accent ? 'text-rose-200' : 'text-gray-400'}`}>{sub}</p>}
    </div>
    <div className={`p-2.5 rounded-xl flex-shrink-0 ${accent ? 'bg-white/20' : 'bg-[#F1F5F9]/40'}`}>
      <div className={accent ? 'text-white' : 'text-maroon'}>{icon}</div>
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

// ─── Sub-Component: SidebarBtn ─────────────────────────────────────────────
const SidebarBtn = ({
  active, onClick, icon, label, badge
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl transition-all cursor-pointer ${
      active ? 'bg-[#7B1618]/10 text-[#7B1618] font-bold' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-stone-800 font-medium'
    }`}
  >
    <div className="flex items-center gap-3">
      {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      <span className="text-xs">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${active ? 'bg-[#7B1618] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
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

  type AdminTab = 'overview' | 'products' | 'stock' | 'sizes' | 'orders' | 'articles' | 'kategori' | 'penenun' | 'promo' | 'pembayaran' | 'pengiriman' | 'notifications';
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [products,  setProducts]  = useState<Product[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [articles,  setArticles]  = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbSource,  setDbSource]  = useState<'Supabase' | 'LocalStorage'>('LocalStorage');

  // New table states
  const [kategoriList,  setKategoriList]  = useState<Kategori[]>([]);
  const [penenunList,   setPenenunList]   = useState<Penenun[]>([]);
  const [kelompokList,  setKelompokList]  = useState<KelompokPenenun[]>([]);
  const [promoList,     setPromoList]     = useState<Promo[]>([]);
  const [pembayaranList,setPembayaranList]= useState<Pembayaran[]>([]);
  const [pengirimanList,setPengirimanList]= useState<Pengiriman[]>([]);
  const [stokLog,       setStokLog]       = useState<StokLog[]>([]);
  const [sizesList,     setSizesList]     = useState<CustomSize[]>([]);
  const [usersList,     setUsersList]     = useState<User[]>([]);

  // Kategori form
  const [editKategori, setEditKategori] = useState<Partial<Kategori> | null>(null);
  const [isKatFormOpen,setIsKatFormOpen] = useState(false);
  const [katErr, setKatErr] = useState('');
  const [savingKat, setSavingKat] = useState(false);

  // Penenun form
  const [editPenenun, setEditPenenun] = useState<Partial<Penenun> | null>(null);
  const [isPenFormOpen, setIsPenFormOpen] = useState(false);
  const [penErr, setPenErr] = useState('');
  const [savingPen, setSavingPen] = useState(false);

  // Kelompok form
  const [editKelompok, setEditKelompok] = useState<Partial<KelompokPenenun> | null>(null);
  const [isKelFormOpen, setIsKelFormOpen] = useState(false);
  const [kelErr, setKelErr] = useState('');
  const [savingKel, setSavingKel] = useState(false);

  // Promo form
  const [editPromo, setEditPromo] = useState<Partial<Promo> | null>(null);
  const [isPromoFormOpen, setIsPromoFormOpen] = useState(false);
  const [promoErr, setPromoErr] = useState('');
  const [savingPromo, setSavingPromo] = useState(false);

  // Size form
  const [editSize, setEditSize] = useState<Partial<CustomSize> | null>(null);
  const [isSizeFormOpen, setIsSizeFormOpen] = useState(false);
  const [sizeErr, setSizeErr] = useState('');
  const [savingSize, setSavingSize] = useState(false);

  // Notification form
  const [isNotifFormOpen, setIsNotifFormOpen] = useState(false);
  const [notifTargetUserId, setNotifTargetUserId] = useState<number | null>(null);
  const [notifPesan, setNotifPesan] = useState('');
  const [notifTipe, setNotifTipe] = useState('info');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Form States
  const [editProd,    setEditProd]    = useState<Partial<Product> | null>(null);
  const [isFormOpen,  setIsFormOpen]  = useState(false);
  const [formErr,     setFormErr]     = useState('');
  const [savingProd,  setSavingProd]  = useState(false);
  const [editSizes,   setEditSizes]   = useState<string[]>([]);

  const [editArt,       setEditArt]       = useState<Partial<Article> | null>(null);
  const [isArtFormOpen, setIsArtFormOpen] = useState(false);
  const [artErr,        setArtErr]        = useState('');
  const [savingArt,     setSavingArt]     = useState(false);

  const [orderFilter, setOrderFilter] = useState<string>('all');

  // ── Data Loader Logic ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodList, ordList, artList, katList, penList, kelList, promList, bayarList, kirimList, stokList, sizeList] = await Promise.all([
        dbService.getAllProducts(),
        dbService.getAllOrders(),
        dbService.getAllArticles(),
        dbService.getAllKategori(),
        dbService.getAllPenenun(),
        dbService.getAllKelompokPenenun(),
        dbService.getAllPromo(),
        dbService.getAllPembayaran(),
        dbService.getAllPengiriman(),
        dbService.getStokLog(),
        dbService.getAllSizes()
      ]);
      setProducts(prodList);
      setOrders(ordList);
      setArticles(artList);
      setKategoriList(katList);
      setPenenunList(penList);
      setKelompokList(kelList);
      setPromoList(promList);
      setPembayaranList(bayarList);
      setPengirimanList(kirimList);
      setStokLog(stokList);
      setSizesList(sizeList);
      
      // Also fetch users for notification feature if using supabase
      if (isSupabaseConfigured && supabase) {
        const { data: uList } = await supabase.from('users').select('id_user, nama_lengkap, email');
        if (uList) setUsersList(uList as User[]);
      }

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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      const ok = await dbService.checkAdminCredentials(adminUsername, adminPassword);
      if (ok) {
        setIsAdmin(true);
      } else {
        setAuthError('Username atau password salah!');
      }
    } catch (err) {
      setAuthError('Gagal melakukan verifikasi admin.');
    } finally {
      setIsLoading(false);
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
      const saved = await dbService.saveProduct({
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
        weaver: editProd.weaver || 'Penenun Sumba',
        stock: editProd.stock !== undefined ? Number(editProd.stock) : 5,
        id_kategori: editProd.id_kategori || null,
        id_penenun: editProd.id_penenun || null,
      });
      await dbService.syncProductSizes(Number(saved.id), editSizes);
      setIsFormOpen(false);
      setEditProd(null);
      setEditSizes([]);
      await loadData();
    } catch { 
      setFormErr('Terjadi kesalahan saat menyimpan data ke database.'); 
    } finally { 
      setSavingProd(false); 
    }
  };

  const handleDeleteProd = (id: string) => {
    openConfirm(
      'Hapus Karya Tenun',
      'Apakah Anda yakin ingin menghapus karya tenun ini dari katalog secara permanen?',
      async () => {
        await dbService.deleteProduct(id);
        await loadData();
      }
    );
  };

  const handleUpdateStock = async (p: Product, newStock: number) => {
    const oldStock = p.stock ?? 5;
    const updatedStock = Math.max(0, newStock);
    await dbService.saveProduct({ ...p, stock: updatedStock });
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, stock: updatedStock } : x));
    // Log the stok change
    const masuk = updatedStock > oldStock ? updatedStock - oldStock : 0;
    const keluar = updatedStock < oldStock ? oldStock - updatedStock : 0;
    if (masuk > 0 || keluar > 0) {
      await dbService.addStokLog({
        id_produk: Number(p.id),
        jumlah_masuk: masuk,
        jumlah_keluar: keluar,
        keterangan: 'Update manual oleh admin'
      });
    }
  };

  // Kategori handlers
  const handleSaveKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    setKatErr('');
    if (!editKategori?.nama_kategori) { setKatErr('Nama kategori wajib diisi'); return; }
    setSavingKat(true);
    try {
      await dbService.saveKategori({ ...editKategori as Omit<Kategori, 'id_kategori'>, id_kategori: editKategori.id_kategori });
      setIsKatFormOpen(false); setEditKategori(null);
      const updated = await dbService.getAllKategori();
      setKategoriList(updated);
    } catch { setKatErr('Gagal menyimpan kategori.'); }
    finally { setSavingKat(false); }
  };

  const handleDeleteKategori = (id: number) => {
    openConfirm('Hapus Kategori', 'Yakin hapus kategori ini?', async () => {
      await dbService.deleteKategori(id);
      setKategoriList(prev => prev.filter(k => k.id_kategori !== id));
    });
  };

  // Penenun handlers
  const handleSavePenenun = async (e: React.FormEvent) => {
    e.preventDefault();
    setPenErr('');
    if (!editPenenun?.nama) { setPenErr('Nama penenun wajib diisi'); return; }
    setSavingPen(true);
    try {
      await dbService.savePenenun({ ...editPenenun as Omit<Penenun, 'id_penenun'>, id_penenun: editPenenun.id_penenun });
      setIsPenFormOpen(false); setEditPenenun(null);
      const updated = await dbService.getAllPenenun();
      setPenenunList(updated);
    } catch { setPenErr('Gagal menyimpan penenun.'); }
    finally { setSavingPen(false); }
  };

  const handleDeletePenenun = (id: number) => {
    openConfirm('Hapus Penenun', 'Yakin hapus data penenun ini?', async () => {
      await dbService.deletePenenun(id);
      setPenenunList(prev => prev.filter(p => p.id_penenun !== id));
    });
  };

  // Kelompok handlers
  const handleSaveKelompok = async (e: React.FormEvent) => {
    e.preventDefault();
    setKelErr('');
    if (!editKelompok?.nama_kelompok) { setKelErr('Nama kelompok wajib diisi'); return; }
    setSavingKel(true);
    try {
      await dbService.saveKelompokPenenun({ ...editKelompok as Omit<KelompokPenenun, 'id_kelompok'>, id_kelompok: editKelompok.id_kelompok });
      setIsKelFormOpen(false); setEditKelompok(null);
      const updated = await dbService.getAllKelompokPenenun();
      setKelompokList(updated);
    } catch { setKelErr('Gagal menyimpan kelompok.'); }
    finally { setSavingKel(false); }
  };

  const handleDeleteKelompok = (id: number) => {
    openConfirm('Hapus Kelompok Penenun', 'Yakin hapus kelompok penenun ini?', async () => {
      await dbService.deleteKelompokPenenun(id);
      setKelompokList(prev => prev.filter(k => k.id_kelompok !== id));
    });
  };

  // Promo handlers
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoErr('');
    if (!editPromo?.kode_promo || !editPromo?.diskon) { setPromoErr('Kode dan diskon wajib diisi'); return; }
    setSavingPromo(true);
    try {
      await dbService.savePromo({ ...editPromo as Omit<Promo, 'id_promo'>, id_promo: editPromo.id_promo });
      setIsPromoFormOpen(false); setEditPromo(null);
      const updated = await dbService.getAllPromo();
      setPromoList(updated);
    } catch { setPromoErr('Gagal menyimpan promo.'); }
    finally { setSavingPromo(false); }
  };

  const handleDeletePromo = (id: number) => {
    openConfirm('Hapus Promo', 'Yakin hapus kode promo ini?', async () => {
      await dbService.deletePromo(id);
      setPromoList(prev => prev.filter(p => p.id_promo !== id));
    });
  };

  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    await dbService.updateOrderStatus(id, status);
    
    // Auto-notifikasi saat status berubah
    if (status === 'dikirim' || status === 'selesai') {
      const order = orders.find(o => o.id === id);
      if (order) {
        const userMatch = usersList.find(u => u.nama_lengkap.toLowerCase() === order.customerName.toLowerCase());
        if (userMatch) {
          await dbService.createNotifikasi(
            userMatch.id_user,
            `Pesanan Anda #${order.id} telah diupdate menjadi: ${STATUS_PESANAN[status].label}.`,
            status === 'selesai' ? 'success' : 'info'
          );
        }
      }
    }
    
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleDeleteOrder = (id: string) => {
    openConfirm(
      'Hapus Catatan Pesanan',
      'Apakah Anda yakin ingin menghapus catatan pesanan ini secara permanen?',
      async () => {
        await dbService.deleteOrder(id);
        setOrders(prev => prev.filter(o => o.id !== id));
      }
    );
  };

  // Size handlers
  const handleSaveSize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSizeErr('');
    if (!editSize?.id_produk || !editSize?.ukuran) {
      setSizeErr('Produk dan ukuran wajib diisi');
      return;
    }
    setSavingSize(true);
    try {
      await dbService.saveSize({ ...editSize as CustomSize });
      setIsSizeFormOpen(false);
      setEditSize(null);
      await loadData();
    } catch {
      setSizeErr('Gagal menyimpan ukuran');
    } finally {
      setSavingSize(false);
    }
  };

  const handleDeleteSize = (id: number) => {
    openConfirm(
      'Hapus Ukuran',
      'Yakin ingin menghapus ukuran ini?',
      async () => {
        await dbService.deleteSize(id);
        await loadData();
      }
    );
  };

  // Notification handlers
  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTargetUserId || !notifPesan) return;
    setSendingNotif(true);
    try {
      await dbService.createNotifikasi(notifTargetUserId, notifPesan, notifTipe);
      setIsNotifFormOpen(false);
      setNotifPesan('');
      setNotifTargetUserId(null);
      alert('Notifikasi berhasil dikirim');
    } catch {
      alert('Gagal mengirim notifikasi');
    } finally {
      setSendingNotif(false);
    }
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

  const handleDeleteArt = (id: string) => {
    openConfirm(
      'Hapus Manuskrip Edukasi',
      'Apakah Anda yakin ingin menghapus artikel edukasi ini secara permanen?',
      async () => {
        await dbService.deleteArticle(id);
        setArticles(prev => prev.filter(a => a.id !== id));
      }
    );
  };

  // ── Memoized Metrics Calculation ───────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalValuation = products.reduce((s, p) => s + p.price * (p.stock ?? 5), 0);
    const completedRevenue = orders.filter(o => o.status === 'selesai').reduce((s, o) => s + o.totalPrice, 0);
    const activeOrders = orders.filter(o => ['menunggu', 'dikirim'].includes(o.status)).length;
    const lowStockProducts = products.filter(p => (p.stock ?? 5) <= 2);
    
    return { totalValuation, completedRevenue, activeOrders, lowStockProducts, totalProducts: products.length };
  }, [products, orders]);



  const filteredOrders = useMemo(() => orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter), [orders, orderFilter]);

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
            <p className="text-xs text-white/60 font-mono uppercase tracking-widest mt-1">CD Seraphine Weetebula</p>
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
    <div id="admin-workspace" className="min-h-screen bg-[#F8FAFC] flex overflow-hidden">
      
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[90] lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static top-0 left-0 h-screen w-64 bg-white border-r border-[#F1F5F9] z-[100] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        <div className="p-6 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7B1618]/5 rounded-2xl flex items-center justify-center border border-[#7B1618]/10 flex-shrink-0">
              <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-serif text-sm font-extrabold text-stone-900 leading-tight">Panel Admin</h1>
              <p className="text-[9px] font-mono uppercase tracking-widest text-maroon font-bold">Seraphine</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-700 bg-gray-50 p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          <SidebarBtn active={adminTab==='overview'}   onClick={()=>{setAdminTab('overview');setIsSidebarOpen(false);}}   icon={<BarChart3 />}     label="Ringkasan" />
          <SidebarBtn active={adminTab==='products'}   onClick={()=>{setAdminTab('products');setIsSidebarOpen(false);}}   icon={<Package />}       label="Katalog Tenun" badge={products.length} />
          <SidebarBtn active={adminTab==='stock'}      onClick={()=>{setAdminTab('stock');setIsSidebarOpen(false);}}      icon={<Layers />}        label="Manajemen Stok" />
          <SidebarBtn active={adminTab==='orders'}     onClick={()=>{setAdminTab('orders');setIsSidebarOpen(false);}}     icon={<ShoppingCart />}  label="Pesanan" badge={metrics.activeOrders} />
          <SidebarBtn active={adminTab==='articles'}   onClick={()=>{setAdminTab('articles');setIsSidebarOpen(false);}}   icon={<BookOpen />}      label="Edukasi" badge={articles.length} />
          <SidebarBtn active={adminTab==='kategori'}   onClick={()=>{setAdminTab('kategori');setIsSidebarOpen(false);}}   icon={<Tag />}           label="Kategori" badge={kategoriList.length} />
          <SidebarBtn active={adminTab==='penenun'}    onClick={()=>{setAdminTab('penenun');setIsSidebarOpen(false);}}    icon={<Award />}         label="Penenun" badge={penenunList.length} />
          <SidebarBtn active={adminTab==='promo'}      onClick={()=>{setAdminTab('promo');setIsSidebarOpen(false);}}      icon={<Percent />}       label="Promo" badge={promoList.length} />
          <SidebarBtn active={adminTab==='sizes'}      onClick={()=>{setAdminTab('sizes');setIsSidebarOpen(false);}}      icon={<Ruler />}         label="Ukuran Produk" badge={sizesList.length} />
          <SidebarBtn active={adminTab==='pembayaran'} onClick={()=>{setAdminTab('pembayaran');setIsSidebarOpen(false);}} icon={<CreditCard />}    label="Pembayaran" badge={pembayaranList.filter(p=>p.status==='menunggu').length} />
          <SidebarBtn active={adminTab==='pengiriman'} onClick={()=>{setAdminTab('pengiriman');setIsSidebarOpen(false);}} icon={<Truck />}         label="Pengiriman" badge={pengirimanList.filter(p=>p.status_pengiriman==='menunggu').length} />
          <SidebarBtn active={adminTab==='notifications'} onClick={()=>{setAdminTab('notifications');setIsSidebarOpen(false);}} icon={<AlertCircle />} label="Kirim Notifikasi" />
        </div>

        <div className="p-4 border-t border-[#F1F5F9]">
          <button onClick={() => setCurrentTab && setCurrentTab('home')} className="flex items-center gap-3 w-full px-4 py-2.5 text-stone-600 hover:bg-stone-50 rounded-xl transition-colors font-bold text-xs uppercase tracking-wider mb-2">
            <Eye className="w-4 h-4" /> Lihat Website
          </button>
          <button onClick={() => setIsAdmin(false)} className="flex items-center gap-3 w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-xs uppercase tracking-wider">
            <LogOut className="w-4 h-4" /> Keluar Sesi
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#F8FAFC] custom-scrollbar">
        
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-[80] bg-white border-b border-[#F1F5F9] p-4 flex items-center justify-between shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-stone-600 bg-stone-50 rounded-xl">
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-serif font-bold text-stone-900 flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
            Panel Admin
          </div>
          <button onClick={loadData} disabled={isLoading} className="p-2 -mr-2 text-maroon bg-maroon/5 rounded-xl">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto pb-24 lg:pb-8">
          
          {/* Top Actions (Desktop) */}
          <div className="hidden lg:flex items-center justify-between mb-8 bg-white p-5 rounded-2xl border border-[#F1F5F9] shadow-sm">
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                {adminTab === 'overview' ? 'Ringkasan Dashboard' : 
                 adminTab === 'products' ? 'Katalog Tenun' : 
                 adminTab === 'stock' ? 'Manajemen Stok' :
                 adminTab === 'orders' ? 'Pesanan Pelanggan' :
                 adminTab === 'articles' ? 'Edukasi & Jurnal' :
                 adminTab === 'kategori' ? 'Manajemen Kategori' :
                 adminTab === 'penenun' ? 'Data Penenun' :
                 adminTab === 'promo' ? 'Kode Promo' :
                 adminTab === 'sizes' ? 'Ukuran Produk' :
                 adminTab === 'pembayaran' ? 'Pembayaran' :
                 adminTab === 'pengiriman' ? 'Pengiriman' : 'Kirim Notifikasi'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">Kelola data dan pantau aktivitas sistem Seraphine.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadData} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#F1F5F9] hover:bg-stone-50 text-stone-600 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Perbarui Data
              </button>
            </div>
          </div>
          
          {/* ── Tab Layout Render Content (Bento Grid) ───────────────────────── */}
        {adminTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* TIER 1: METRIK BENTO (Highlight Data Finansial) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div>
                <StatCard 
                  accent 
                  label="Valuasi Stok" 
                  value={formatPrice(metrics.totalValuation)} 
                  sub="Kapitalisasi aset katalog" 
                  icon={<span className="font-mono font-bold text-sm select-none">Rp</span>}
                />
              </div>
              <div>
                <StatCard 
                  label="Pendapatan Sukses" 
                  value={formatPrice(metrics.completedRevenue)} 
                  sub="Dari transaksi selesai" 
                  icon={<TrendingUp className="w-5 h-5"/>} 
                />
              </div>
              <div>
                <StatCard 
                  label="Pesanan Aktif" 
                  value={metrics.activeOrders} 
                  sub={`${orders.length} total pesanan`} 
                  icon={<ShoppingCart className="w-5 h-5"/>} 
                />
              </div>
              <div>
                <StatCard 
                  label="Total Karya" 
                  value={metrics.totalProducts} 
                  sub="Koleksi katalog aktif" 
                  icon={<Package className="w-5 h-5"/>} 
                />
              </div>
            </div>

            {/* TIER 2: PANEL BENTO UTAMA (Operasional) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Kolom Kiri: Panel Restock (Span 1) */}
              <div className="bg-white rounded-[24px] border border-[#F1F5F9] p-6 shadow-sm flex flex-col h-[420px]">
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
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-2xl border border-[#F1F5F9] hover:border-maroon/30 transition-colors">
                        <img src={p.image} className="w-12 h-14 object-cover rounded-xl border border-[#F1F5F9] flex-shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-sm text-stone-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.code}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md text-[10px]">
                            Stok: {p.stock ?? 5}
                          </span>
                          <button onClick={() => handleUpdateStock(p, (p.stock ?? 5) + 5)} className="px-2.5 py-1 bg-white border border-[#F1F5F9] hover:bg-emerald-50 hover:border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold transition-all shadow-sm">
                            +5 Unit
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Panel Transaksi (Span 2) */}
              <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#F1F5F9] p-6 shadow-sm flex flex-col h-[420px]">
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
                          <div key={o.id} className="p-4 rounded-2xl border border-[#F1F5F9] bg-white/30 hover:bg-white hover:shadow-sm transition-all group">
                            <div className="flex justify-between items-start mb-3">
                              <span className={`inline-flex text-[9px] font-bold font-mono px-2 py-1 rounded-md border ${statusConfig.cls}`}>
                                {statusConfig.label}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">{formatDate(o.createdAt)}</span>
                            </div>
                            <p className="font-bold text-sm text-stone-900 truncate" title={o.customerName}>{o.customerName}</p>
                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-[#F1F5F9]">
                                <div className="text-[10px] text-[#64748B] font-mono truncate max-w-[180px]">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
              <p className="text-sm text-stone-700 font-medium">Registrasi Entri Katalog: <span className="font-bold text-maroon">{products.length} produk</span></p>
              <button onClick={() => { setEditSizes([]); setEditProd({ title:'', category:'Kain Tenun', price: undefined, image:'', description:'', isFeatured:false, code:'TIS-NEW'+Math.floor(Math.random()*900+100), weaver:'Mama Penenun', stock: 1 }); setFormErr(''); setIsFormOpen(true); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" /> Tambah Entri Kain
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
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
                      <tr key={p.id} className="hover:bg-white/30 transition-colors">
                        <td className="p-4">
                          <div className="w-14 h-18 mx-auto rounded-lg overflow-hidden border border-[#F1F5F9]">
                            <img src={p.image} className="w-full h-full object-cover" alt="" />
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-serif font-bold text-stone-900 text-sm leading-tight">{p.title}</p>
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
                            <button onClick={() => { setEditSizes(sizesList.filter(s => s.id_produk === Number(p.id)).map(s => s.ukuran)); setEditProd({...p}); setFormErr(''); setIsFormOpen(true); }} className="p-1.5 bg-gray-100 text-gray-600 hover:text-stone-900 rounded-lg"><Edit className="w-3.5 h-3.5"/></button>
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
            <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
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
                      <tr key={p.id} className="hover:bg-white/30 transition-colors">
                        <td className="p-4"><img src={p.image} className="w-10 h-12 object-cover rounded-lg border border-[#F1F5F9]" alt=""/></td>
                        <td className="p-4">
                          <p className="font-serif font-bold text-stone-900 text-sm">{p.title}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Penenun: {p.weaver}</p>
                        </td>
                        <td className="p-4 font-mono font-bold text-gray-500 text-xs">{p.code}</td>
                        <td className="p-4"><span className="px-2 py-0.5 text-[10px] font-mono font-bold text-maroon bg-rose-50 border border-rose-100 rounded">{p.category}</span></td>
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            <input type="number" min={0} value={p.stock ?? 5} onChange={e => handleUpdateStock(p, Number(e.target.value))} className="w-20 px-3 py-1.5 text-center font-mono font-bold text-sm border border-[#F1F5F9] rounded-lg focus:outline-none" />
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
            <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
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
                        <tr key={o.id} className="hover:bg-white/30 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-sm text-stone-900">{o.customerName}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{o.customerEmail}</p>
                            <a href={`https://wa.me/${o.customerPhone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-700 hover:underline font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5"/>{o.customerPhone}
                            </a>
                          </td>
                          <td className="p-4">
                            {o.items && o.items.map((item, idx) => (
                              <div key={idx} className="mb-2 last:mb-0 border-b border-[#F1F5F9]/20 pb-1.5 last:pb-0 last:border-b-0">
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



        {/* Tab Konten Manajemen Artikel Edukasi */}
        {adminTab === 'articles' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
              <p className="text-sm text-stone-700 font-medium">Koleksi Artikel Budaya: <strong className="text-maroon">{articles.length} entri</strong></p>
              <button onClick={() => { setEditArt({ title:'', excerpt:'', content:'', image:'', author:'Admin Seraphine', slug:'' }); setArtErr(''); setIsArtFormOpen(true); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase rounded-xl shadow flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4"/> Rilis Artikel Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map(art => (
                <div key={art.id} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden hover:shadow-md">
                  <img src={art.image} className="w-full h-40 object-cover" alt="" />
                  <div className="p-4">
                    <p className="font-serif font-bold text-stone-900 text-base leading-tight mb-1">{art.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{art.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-mono font-bold text-[#7B1618] uppercase">{art.author}</p>
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

      {/* ── Modal Block: Formulir Produk ─────────────────────────────────── */}
      {isFormOpen && editProd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsFormOpen(false); setEditProd(null); }}}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9] flex-shrink-0">
              <h3 className="font-serif text-lg font-bold text-stone-900">{editProd.id ? 'Edit Karya Tenun Adat' : 'Registrasi Produk Baru'}</h3>
              <button onClick={() => { setIsFormOpen(false); setEditProd(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveProd} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{formErr}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nama Kain *</label>
                  <input type="text" required placeholder="Contoh: Tenun Sumba Kambera" value={editProd.title||''} onChange={e=>setEditProd({...editProd,title:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Harga Nominal (IDR) *</label>
                  <input type="number" required placeholder="Contoh: 1500000" value={editProd.price||''} onChange={e=>setEditProd({...editProd,price:Number(e.target.value)})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl"/>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Kuantitas Alokasi Stok *</label>
                  <input type="number" required min={0} placeholder="Contoh: 5" value={editProd.stock??5} onChange={e=>setEditProd({...editProd,stock:Number(e.target.value)})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Kategori Tenun *</label>
                  <select required value={editProd.category||''} onChange={e=>setEditProd({...editProd,category:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl">
                    <option value="">Pilih Kategori...</option>
                    {kategoriList.map(k => (
                      <option key={k.id_kategori} value={k.nama_kategori}>{k.nama_kategori}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Ukuran Produk (Pilih yang tersedia)</label>
                  <div className="flex flex-wrap gap-3 p-3 bg-white border border-[#F1F5F9] rounded-xl">
                    {['S', 'M', 'L', 'XL', 'All Size'].map(uk => (
                      <label key={uk} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editSizes.includes(uk)}
                          onChange={(e) => {
                            if (e.target.checked) setEditSizes(prev => [...prev, uk]);
                            else setEditSizes(prev => prev.filter(s => s !== uk));
                          }}
                          className="w-4 h-4 text-maroon rounded focus:ring-maroon cursor-pointer"
                        />
                        <span className="text-sm text-stone-700 font-medium">{uk}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Foto Produk *</label>
                  {editProd.image ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#F1F5F9] shadow-sm bg-[#F8FAFC]">
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
                    <label className="border-2 border-dashed border-[#F1F5F9] hover:border-maroon/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-white/30 hover:bg-white/50 transition-all text-center">
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
                  <textarea rows={3} placeholder="Contoh: Kain tenun khas daerah Sumba Timur dengan tenunan benang alami..." value={editProd.description||''} onChange={e=>setEditProd({...editProd,description:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl resize-none"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Makna Simbolis & Filosofi Motif</label>
                  <textarea rows={3} placeholder="Contoh: Motif Kuda melambangkan keagungan, kepahlawanan, dan kebangsawanan..." value={editProd.maknaMotif||''} onChange={e=>setEditProd({...editProd,maknaMotif:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl resize-none"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Status Publikasi Produk *</label>
                  <select value={editProd.status||'aktif'} onChange={e=>setEditProd({...editProd,status:e.target.value as any})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl">
                    <option value="aktif">Aktif (Ditampilkan di Katalog)</option>
                    <option value="nonaktif">Nonaktif (Diarsipkan)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button type="button" onClick={() => { setIsFormOpen(false); setEditProd(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button>
                <button type="submit" disabled={savingProd} className="px-5 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase rounded-xl shadow">{savingProd ? 'Memproses...' : 'Simpan Entri'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Block: Formulir Artikel ─────────────────────────────────── */}
      {isArtFormOpen && editArt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsArtFormOpen(false); setEditArt(null); }}}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9] flex-shrink-0">
              <h3 className="font-serif text-lg font-bold text-stone-900">{editArt.id ? 'Edit Manuskrip Edukasi' : 'Tulis Artikel Baru'}</h3>
              <button onClick={() => { setIsArtFormOpen(false); setEditArt(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveArt} className="p-6 space-y-4 overflow-y-auto flex-1">
              {artErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{artErr}</div>}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Judul Manuskrip *</label>
                <input type="text" required placeholder="Contoh: Sejarah Makna Motif Kuda Sumba" value={editArt.title||''} onChange={e=>setEditArt({...editArt,title:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl"/>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Foto Sampul Artikel *</label>
                {editArt.image ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-[#F1F5F9] shadow-sm bg-[#F8FAFC]">
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
                  <label className="border-2 border-dashed border-[#F1F5F9] hover:border-maroon/40 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-white/30 hover:bg-white/50 transition-all text-center">
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
                <input type="text" required placeholder="Contoh: Ringkasan singkat mengenai sejarah tenun..." value={editArt.excerpt||''} onChange={e=>setEditArt({...editArt,excerpt:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl"/>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Konten Narasi Lengkap *</label>
                <textarea required rows={8} placeholder="Tuliskan seluruh isi kajian filosofis secara komprehensif..." value={editArt.content||''} onChange={e=>setEditArt({...editArt,content:e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl resize-none"/>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button type="button" onClick={() => { setIsArtFormOpen(false); setEditArt(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button>
                <button type="submit" disabled={savingArt} className="px-5 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase rounded-xl shadow">{savingArt ? 'Menerbitkan...' : 'Rilis Narasi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ─────── TAB: KATEGORI ─────── */}
      {adminTab === 'kategori' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
            <p className="text-sm text-stone-700 font-medium">Manajemen Kategori Produk: <span className="font-bold text-maroon">{kategoriList.length} kategori</span></p>
            <button onClick={() => { setEditKategori({}); setIsKatFormOpen(true); setKatErr(''); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Tambah Kategori
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm">
            {kategoriList.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><Tag className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada kategori</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                      <th className="p-4 w-24">ID</th>
                      <th className="p-4">Nama Kategori</th>
                      <th className="p-4">Deskripsi</th>
                      <th className="p-4 w-24 text-right">Aksi</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {kategoriList.map(k => (
                    <tr key={k.id_kategori} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{k.id_kategori}</td>
                      <td className="px-4 py-3 font-semibold text-stone-800">{k.nama_kategori}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{k.deskripsi || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => { setEditKategori(k); setIsKatFormOpen(true); setKatErr(''); }} className="p-1.5 hover:bg-amber-50 rounded-lg cursor-pointer"><Edit className="w-3.5 h-3.5 text-amber-600" /></button>
                          <button onClick={() => handleDeleteKategori(k.id_kategori)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── TAB: PENENUN ─────── */}
      {adminTab === 'penenun' && (
        <div className="space-y-6 animate-fade-in">
          {/* Penenun Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
            <p className="text-sm text-stone-700 font-medium">Data Penenun: <span className="font-bold text-maroon">{penenunList.length} penenun</span></p>
            <button onClick={() => { setEditPenenun({}); setIsPenFormOpen(true); setPenErr(''); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Tambah Penenun
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm">
            {penenunList.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><Award className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada data penenun</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                      <th className="p-4 w-20">Foto</th>
                      <th className="p-4">Nama</th>
                      <th className="p-4">Kelompok</th>
                      <th className="p-4">Lokasi Desa</th>
                      <th className="p-4 w-24 text-right">Aksi</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {penenunList.map(p => (
                    <tr key={p.id_penenun} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="px-4 py-3"><div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100">{p.foto ? <img src={p.foto} alt={p.nama} className="w-full h-full object-cover" /> : <Award className="w-5 h-5 m-auto mt-2.5 text-stone-300" />}</div></td>
                      <td className="px-4 py-3 font-semibold text-stone-800">{p.nama}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.nama_kelompok || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.lokasi_desa || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => { setEditPenenun(p); setIsPenFormOpen(true); setPenErr(''); }} className="p-1.5 hover:bg-amber-50 rounded-lg cursor-pointer"><Edit className="w-3.5 h-3.5 text-amber-600" /></button>
                          <button onClick={() => handleDeletePenenun(p.id_penenun)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Kelompok Penenun Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm mt-8">
            <p className="text-sm text-stone-700 font-medium">Kelompok Penenun: <span className="font-bold text-stone-900">{kelompokList.length} kelompok</span></p>
            <button onClick={() => { setEditKelompok({}); setIsKelFormOpen(true); setKelErr(''); }} className="px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Tambah Kelompok
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm">
            {kelompokList.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada kelompok penenun</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                      <th className="p-4">Nama Kelompok</th>
                      <th className="p-4">Lokasi Desa</th>
                      <th className="p-4">Deskripsi</th>
                      <th className="p-4 w-24 text-right">Aksi</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {kelompokList.map(k => (
                    <tr key={k.id_kelompok} className="hover:bg-[#F8FAFC]/50">
                      <td className="px-4 py-3 font-semibold text-stone-800">{k.nama_kelompok}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{k.lokasi_desa || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{k.deskripsi || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => { setEditKelompok(k); setIsKelFormOpen(true); setKelErr(''); }} className="p-1.5 hover:bg-amber-50 rounded-lg cursor-pointer"><Edit className="w-3.5 h-3.5 text-amber-600" /></button>
                          <button onClick={() => handleDeleteKelompok(k.id_kelompok)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── TAB: PROMO ─────── */}
      {adminTab === 'promo' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
            <p className="text-sm text-stone-700 font-medium">Manajemen Kode Promo: <span className="font-bold text-maroon">{promoList.length} promo</span></p>
            <button onClick={() => { setEditPromo({}); setIsPromoFormOpen(true); setPromoErr(''); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Tambah Promo
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm">
            {promoList.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><Percent className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada kode promo</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                      <th className="p-4 w-32">Kode Promo</th>
                      <th className="p-4 w-24">Diskon</th>
                      <th className="p-4 w-32">Berlaku Hingga</th>
                      <th className="p-4">Keterangan</th>
                      <th className="p-4 w-24 text-right">Aksi</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {promoList.map(p => {
                    const isExpired = p.berlaku_hingga ? new Date(p.berlaku_hingga) < new Date() : false;
                    return (
                      <tr key={p.id_promo} className={`hover:bg-[#F8FAFC]/50 transition-colors ${isExpired ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3"><span className="font-mono font-bold text-maroon bg-red-50 px-2 py-1 rounded-lg text-xs">{p.kode_promo}</span></td>
                        <td className="px-4 py-3 font-bold text-emerald-700">{p.diskon}%</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.berlaku_hingga ? new Date(p.berlaku_hingga).toLocaleDateString('id-ID') : '—'} {isExpired && <span className="ml-1 text-red-500 font-bold">(Kadaluarsa)</span>}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.keterangan || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => { setEditPromo(p); setIsPromoFormOpen(true); setPromoErr(''); }} className="p-1.5 hover:bg-amber-50 rounded-lg cursor-pointer"><Edit className="w-3.5 h-3.5 text-amber-600" /></button>
                            <button onClick={() => handleDeletePromo(p.id_promo)} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── TAB: PEMBAYARAN ─────── */}
      {adminTab === 'pembayaran' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
            <p className="text-sm text-stone-700 font-medium">Manajemen Pembayaran: <span className="font-bold text-maroon">{pembayaranList.length} transaksi</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm">
            {pembayaranList.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada data pembayaran</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                      <th className="p-4 w-24">ID Bayar</th>
                      <th className="p-4 w-24">ID Pesanan</th>
                      <th className="p-4">Metode</th>
                      <th className="p-4 w-32">Jumlah</th>
                      <th className="p-4 w-28">Status</th>
                      <th className="p-4 w-32 text-right">Ubah Status</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {pembayaranList.map(b => {
                    const statusCls = { menunggu: 'bg-amber-100 text-amber-800', berhasil: 'bg-emerald-100 text-emerald-800', gagal: 'bg-red-100 text-red-800' };
                    return (
                      <tr key={b.id_pembayaran} className="hover:bg-[#F8FAFC]/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">#{b.id_pembayaran}</td>
                        <td className="px-4 py-3 font-mono text-xs text-maroon">#{b.id_pesanan}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{b.metode || '—'}</td>
                        <td className="px-4 py-3 text-xs font-semibold">{b.jumlah ? new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(b.jumlah) : '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls[b.status]}`}>{b.status}</span></td>
                        <td className="px-4 py-3 text-right">
                          <select value={b.status} onChange={async e => { await dbService.updatePembayaranStatus(b.id_pembayaran, e.target.value as any); const updated = await dbService.getAllPembayaran(); setPembayaranList(updated); }} className="text-xs border border-[#F1F5F9] rounded-lg px-2 py-1 cursor-pointer">
                            <option value="menunggu">menunggu</option>
                            <option value="berhasil">berhasil</option>
                            <option value="gagal">gagal</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── TAB: PENGIRIMAN ─────── */}
      {adminTab === 'pengiriman' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
            <p className="text-sm text-stone-700 font-medium">Manajemen Pengiriman: <span className="font-bold text-maroon">{pengirimanList.length} pengiriman</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm">
            {pengirimanList.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><Truck className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada data pengiriman</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                      <th className="p-4 w-24">ID Kirim</th>
                      <th className="p-4 w-24">ID Pesanan</th>
                      <th className="p-4 w-32">Ekspedisi</th>
                      <th className="p-4">No. Resi</th>
                      <th className="p-4 w-28">Status</th>
                      <th className="p-4 w-64 text-right">Update Resi</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {pengirimanList.map(k => {
                    const statusCls: Record<string,string> = { menunggu:'bg-amber-100 text-amber-800', diproses:'bg-blue-100 text-blue-800', dikirim:'bg-indigo-100 text-indigo-800', tiba:'bg-emerald-100 text-emerald-800' };
                    return (
                      <tr key={k.id_pengiriman} className="hover:bg-[#F8FAFC]/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">#{k.id_pengiriman}</td>
                        <td className="px-4 py-3 font-mono text-xs text-maroon">#{k.id_pesanan}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{k.ekspedisi || '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-stone-800">{k.nomor_resi || '—'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls[k.status_pengiriman] || 'bg-gray-100 text-gray-500'}`}>{k.status_pengiriman}</span></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <input type="text" placeholder="Ekspedisi..." defaultValue={k.ekspedisi||''} id={`ekspedisi-${k.id_pengiriman}`} className="w-20 text-xs border border-[#F1F5F9] rounded-lg px-2 py-1" />
                            <input type="text" placeholder="No. Resi..." defaultValue={k.nomor_resi||''} id={`resi-${k.id_pengiriman}`} className="w-24 text-xs border border-[#F1F5F9] rounded-lg px-2 py-1" />
                            <select defaultValue={k.status_pengiriman} id={`status-${k.id_pengiriman}`} className="text-xs border border-[#F1F5F9] rounded-lg px-1.5 py-1">
                              <option value="menunggu">menunggu</option>
                              <option value="diproses">diproses</option>
                              <option value="dikirim">dikirim</option>
                              <option value="tiba">tiba</option>
                            </select>
                            <button onClick={async () => {
                              const eksp = (document.getElementById(`ekspedisi-${k.id_pengiriman}`) as HTMLInputElement)?.value;
                              const resi = (document.getElementById(`resi-${k.id_pengiriman}`) as HTMLInputElement)?.value;
                              const stat = (document.getElementById(`status-${k.id_pengiriman}`) as HTMLSelectElement)?.value;
                              await dbService.updatePengiriman(k.id_pengiriman, { ekspedisi: eksp, nomor_resi: resi, status_pengiriman: stat as any });
                              const updated = await dbService.getAllPengiriman();
                              setPengirimanList(updated);
                            }} className="px-2 py-1 bg-maroon text-white text-xs font-bold rounded-lg cursor-pointer">Simpan</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── TAB: SIZES ─────── */}
      {adminTab === 'sizes' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
            <p className="text-sm text-stone-700 font-medium">Ukuran Produk: <span className="font-bold text-maroon">{sizesList.length} varian</span></p>
            <button onClick={() => { setEditSize({ id_produk: 0, ukuran: '' }); setIsSizeFormOpen(true); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Tambah Ukuran
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm">
            {sizesList.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><Ruler className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">Belum ada data ukuran custom</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                      <th className="p-4 w-24">ID Produk</th>
                      <th className="p-4">Produk</th>
                      <th className="p-4 w-32">Ukuran</th>
                      <th className="p-4 w-24 text-right">Aksi</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {sizesList.map(s => {
                    const prod = products.find(p => Number(p.id) === s.id_produk);
                    return (
                      <tr key={s.id_size} className="hover:bg-[#F8FAFC]/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">#{s.id_produk}</td>
                        <td className="px-4 py-3 font-bold text-[#1A1A1A]">{prod?.title || 'Produk Tidak Ditemukan'}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-[#F1F5F9] rounded-lg text-xs font-mono font-bold">{s.ukuran}</span></td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteSize(s.id_size)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors bg-white rounded-xl shadow-sm border border-[#F1F5F9]"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────── TAB: NOTIFICATIONS ─────── */}
      {adminTab === 'notifications' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
            <p className="text-sm text-stone-700 font-medium">Kirim Notifikasi Peringatan / Pengumuman</p>
            <button onClick={() => setIsNotifFormOpen(true)} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" /> Buat Notifikasi
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm p-6 text-center text-gray-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Fitur Riwayat Notifikasi belum tersedia di panel ini. Anda dapat membuat dan mengirim notifikasi baru kepada pengguna.</p>
          </div>
        </div>
      )}

      {/* ─────── MODALS: Kategori ─────── */}
      {isKatFormOpen && editKategori && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsKatFormOpen(false); setEditKategori(null); }}}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]"><h3 className="font-serif text-lg font-bold">{editKategori.id_kategori ? 'Edit Kategori' : 'Tambah Kategori'}</h3><button onClick={() => { setIsKatFormOpen(false); setEditKategori(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveKategori} className="p-6 space-y-4">
              {katErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" />{katErr}</div>}
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nama Kategori *</label><input type="text" required placeholder="Contoh: Kain Tenun Ikat" value={editKategori.nama_kategori||''} onChange={e => setEditKategori({...editKategori, nama_kategori: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Deskripsi</label><textarea rows={2} placeholder="Deskripsi singkat kategori..." value={editKategori.deskripsi||''} onChange={e => setEditKategori({...editKategori, deskripsi: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]"><button type="button" onClick={() => { setIsKatFormOpen(false); setEditKategori(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button><button type="submit" disabled={savingKat} className="px-5 py-2 bg-maroon text-white text-xs font-bold uppercase rounded-xl shadow">{savingKat ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── MODALS: Penenun ─────── */}
      {isPenFormOpen && editPenenun && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsPenFormOpen(false); setEditPenenun(null); }}}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]"><h3 className="font-serif text-lg font-bold">{editPenenun.id_penenun ? 'Edit Penenun' : 'Tambah Penenun'}</h3><button onClick={() => { setIsPenFormOpen(false); setEditPenenun(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSavePenenun} className="p-6 space-y-4">
              {penErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" />{penErr}</div>}
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nama Penenun *</label><input type="text" required placeholder="Contoh: Mama Seraphine" value={editPenenun.nama||''} onChange={e => setEditPenenun({...editPenenun, nama: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nama Kelompok</label><input type="text" placeholder="Kelompok Wanno" value={editPenenun.nama_kelompok||''} onChange={e => setEditPenenun({...editPenenun, nama_kelompok: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
                <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Lokasi Desa</label><input type="text" placeholder="Desa Prailiu" value={editPenenun.lokasi_desa||''} onChange={e => setEditPenenun({...editPenenun, lokasi_desa: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
              </div>
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">URL Foto</label><input type="text" placeholder="https://..." value={editPenenun.foto||''} onChange={e => setEditPenenun({...editPenenun, foto: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Bio / Deskripsi</label><textarea rows={3} placeholder="Cerita singkat tentang penenun..." value={editPenenun.bio||''} onChange={e => setEditPenenun({...editPenenun, bio: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]"><button type="button" onClick={() => { setIsPenFormOpen(false); setEditPenenun(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button><button type="submit" disabled={savingPen} className="px-5 py-2 bg-maroon text-white text-xs font-bold uppercase rounded-xl shadow">{savingPen ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── MODALS: Kelompok Penenun ─────── */}
      {isKelFormOpen && editKelompok && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsKelFormOpen(false); setEditKelompok(null); }}}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]"><h3 className="font-serif text-lg font-bold">{editKelompok.id_kelompok ? 'Edit Kelompok' : 'Tambah Kelompok'}</h3><button onClick={() => { setIsKelFormOpen(false); setEditKelompok(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveKelompok} className="p-6 space-y-4">
              {kelErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" />{kelErr}</div>}
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Nama Kelompok *</label><input type="text" required placeholder="Contoh: Kelompok Wanno" value={editKelompok.nama_kelompok||''} onChange={e => setEditKelompok({...editKelompok, nama_kelompok: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Lokasi Desa</label><input type="text" placeholder="Desa Prailiu, Kec. Kambera" value={editKelompok.lokasi_desa||''} onChange={e => setEditKelompok({...editKelompok, lokasi_desa: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Deskripsi</label><textarea rows={2} placeholder="Deskripsi singkat kelompok..." value={editKelompok.deskripsi||''} onChange={e => setEditKelompok({...editKelompok, deskripsi: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]"><button type="button" onClick={() => { setIsKelFormOpen(false); setEditKelompok(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button><button type="submit" disabled={savingKel} className="px-5 py-2 bg-maroon text-white text-xs font-bold uppercase rounded-xl shadow">{savingKel ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── MODALS: Promo ─────── */}
      {isPromoFormOpen && editPromo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsPromoFormOpen(false); setEditPromo(null); }}}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]"><h3 className="font-serif text-lg font-bold">{editPromo.id_promo ? 'Edit Promo' : 'Tambah Kode Promo'}</h3><button onClick={() => { setIsPromoFormOpen(false); setEditPromo(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSavePromo} className="p-6 space-y-4">
              {promoErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" />{promoErr}</div>}
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Kode Promo *</label><input type="text" required placeholder="Contoh: SUMBA20" value={editPromo.kode_promo||''} onChange={e => setEditPromo({...editPromo, kode_promo: e.target.value.toUpperCase()})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl font-mono font-bold uppercase" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Diskon (%) *</label><input type="number" required min={1} max={100} placeholder="Contoh: 20" value={editPromo.diskon||''} onChange={e => setEditPromo({...editPromo, diskon: Number(e.target.value)})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
                <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Berlaku Hingga</label><input type="date" value={editPromo.berlaku_hingga||''} onChange={e => setEditPromo({...editPromo, berlaku_hingga: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
              </div>
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Keterangan</label><input type="text" placeholder="Contoh: Promo Hari Kemerdekaan" value={editPromo.keterangan||''} onChange={e => setEditPromo({...editPromo, keterangan: e.target.value})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]"><button type="button" onClick={() => { setIsPromoFormOpen(false); setEditPromo(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button><button type="submit" disabled={savingPromo} className="px-5 py-2 bg-maroon text-white text-xs font-bold uppercase rounded-xl shadow">{savingPromo ? 'Menyimpan...' : 'Simpan Promo'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── MODALS: Sizes ─────── */}
      {isSizeFormOpen && editSize && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) { setIsSizeFormOpen(false); setEditSize(null); }}}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]"><h3 className="font-serif text-lg font-bold">Tambah Ukuran</h3><button onClick={() => { setIsSizeFormOpen(false); setEditSize(null); }} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveSize} className="p-6 space-y-4">
              {sizeErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" />{sizeErr}</div>}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Produk *</label>
                <select required value={editSize.id_produk||''} onChange={e => setEditSize({...editSize, id_produk: Number(e.target.value)})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl">
                  <option value="">Pilih Produk...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Ukuran *</label><input type="text" required placeholder="Contoh: S, M, L, XL" value={editSize.ukuran||''} onChange={e => setEditSize({...editSize, ukuran: e.target.value.toUpperCase()})} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl font-mono" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]"><button type="button" onClick={() => { setIsSizeFormOpen(false); setEditSize(null); }} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button><button type="submit" disabled={savingSize} className="px-5 py-2 bg-maroon text-white text-xs font-bold uppercase rounded-xl shadow">{savingSize ? 'Menyimpan...' : 'Simpan Ukuran'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── MODALS: Notifications ─────── */}
      {isNotifFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setIsNotifFormOpen(false); }}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-white border-b border-[#F1F5F9]"><h3 className="font-serif text-lg font-bold">Kirim Notifikasi</h3><button onClick={() => setIsNotifFormOpen(false)} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSendNotif} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Target Pengguna *</label>
                <select required value={notifTargetUserId||''} onChange={e => setNotifTargetUserId(Number(e.target.value))} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl">
                  <option value="">Pilih Pengguna...</option>
                  {usersList.map(u => <option key={u.id_user} value={u.id_user}>{u.nama_lengkap} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Tipe *</label>
                <select required value={notifTipe} onChange={e => setNotifTipe(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl">
                  <option value="info">Informasi</option>
                  <option value="success">Sukses</option>
                  <option value="warning">Peringatan</option>
                </select>
              </div>
              <div><label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1.5">Pesan *</label><textarea required rows={3} placeholder="Pesan notifikasi..." value={notifPesan} onChange={e => setNotifPesan(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl resize-none" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]"><button type="button" onClick={() => setIsNotifFormOpen(false)} className="px-4 py-2 bg-gray-100 text-stone-700 text-xs font-bold uppercase rounded-xl">Batal</button><button type="submit" disabled={sendingNotif} className="px-5 py-2 bg-maroon text-white text-xs font-bold uppercase rounded-xl shadow">{sendingNotif ? 'Mengirim...' : 'Kirim Notifikasi'}</button></div>
            </form>
          </div>
        </div>
      )}

        </div>
      </main>

      {/* ── Modal Block: Konfirmasi Profesional ── */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal(null)}>
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-scale-in border border-[#F1F5F9]" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">{confirmModal.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setConfirmModal(null)} 
                  className="flex-1 py-2.5 bg-[#FFFFFF] border border-[#F1F5F9] text-xs font-bold text-[#64748B] rounded-xl hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} 
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-xs font-bold text-white rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}