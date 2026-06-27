import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Plus, Edit, Trash2, ArrowRight, Star, Filter } from 'lucide-react';
import { Product } from '../types';
import { dbService } from '../lib/supabase';

interface ProductViewProps {
  onSelectProduct: (product: Product) => void;
  products?: Product[];
  isAdmin: boolean;
  onRefresh: () => void;
}

const CATEGORIES = ['Semua Kategori', 'Kain Tenun', 'Tas & Aksesori', 'Selendang', 'Dekorasi'];

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function ProductView({ onSelectProduct, products = [], isAdmin, onRefresh }: ProductViewProps) {
  const [searchQuery, setSearchQuery]               = useState('');
  const [activeCategory, setActiveCategory]         = useState('Semua Kategori');
  const [mobileFilterOpen, setMobileFilterOpen]     = useState(false);
  const [editingProduct, setEditingProduct]         = useState<Partial<Product> | null>(null);
  const [isFormOpen, setIsFormOpen]                 = useState(false);
  const [btnSaving, setBtnSaving]                   = useState(false);
  const [formErr, setFormErr]                       = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!isAdmin && p.status === 'nonaktif') return false;
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = activeCategory === 'Semua Kategori' || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, activeCategory, isAdmin]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr('');
    if (!editingProduct?.title || !editingProduct?.price || !editingProduct?.image || !editingProduct?.code) {
      setFormErr('Kolom Nama, Harga, Kode SKU, dan URL Gambar wajib diisi.');
      return;
    }
    setBtnSaving(true);
    try {
      await dbService.saveProduct({
        id: editingProduct.id,
        title: editingProduct.title!,
        category: editingProduct.category || 'Kain Tenun',
        price: Number(editingProduct.price),
        image: editingProduct.image!,
        description: editingProduct.description || '',
        isFeatured: editingProduct.isFeatured || false,
        code: editingProduct.code!,
        dimensions: editingProduct.dimensions || '',
        weaver: editingProduct.weaver || 'Penenun Sumba',
        makingTime: editingProduct.makingTime || '3 Bulan',
        stock: editingProduct.stock !== undefined ? Number(editingProduct.stock) : 5,
      });
      setIsFormOpen(false);
      setEditingProduct(null);
      onRefresh();
    } catch {
      setFormErr('Gagal menyimpan produk ke database.');
    } finally {
      setBtnSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus mahakarya ini dari katalog?')) return;
    await dbService.deleteProduct(id);
    onRefresh();
  };

  return (
    <div id="product-view" className="pt-24 pb-20 animate-fade-in min-h-screen">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* ── Header Katalog ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="section-label">Koleksi Eksklusif</span>
            <h1 className="font-serif font-extrabold text-4xl text-[#1A1A1A] mt-2">Katalog <span className="text-gradient">Tenun</span></h1>
            <p className="mt-3 text-sm text-[#64748B] max-w-lg">Eksplorasi mahakarya tenun ikat yang diciptakan dengan dedikasi tinggi oleh para maestri Sumba.</p>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => { setEditingProduct({ title:'', category:'Kain Tenun', price:1500000, image:'', description:'', isFeatured:false, code:'TIS-NEW'+Math.floor(Math.random()*900+100), dimensions:'200 x 100 cm', weaver:'Mama Penenun', makingTime:'3 Bulan', stock:5 }); setFormErr(''); setIsFormOpen(true); }}
              className="btn-primary flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Registrasi Karya Baru
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Panel Navigasi Filter ── */}
          <div className="lg:w-1/4 flex-shrink-0">
            <div className={`card-base p-6 sticky top-28 ${mobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="font-bold text-[#1A1A1A] flex items-center gap-2"><Filter className="w-4 h-4 text-[#7B1618]"/> Filter</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="text-[#64748B] hover:text-[#1A1A1A]"><X className="w-5 h-5"/></button>
              </div>

              {/* Pencarian */}
              <div className="mb-8">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] mb-3">Pencarian Motif</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B1618]" />
                  <input 
                    type="text" 
                    placeholder="Cari nama atau SKU..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#FFFFFF] border border-[#F1F5F9] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9E8B7A] focus:outline-none focus:border-[#7B1618] transition-colors"
                  />
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] mb-3">Klasifikasi Kategori</label>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeCategory === cat 
                          ? 'bg-[#7B1618]/10 text-[#7B1618] border border-[#7B1618]/20' 
                          : 'text-[#64748B] hover:bg-[#FFFFFF] hover:text-[#1A1A1A] border border-transparent'
                      }`}
                    >
                      {cat}
                      {activeCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-[#7B1618]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden w-full card-base px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold text-[#1A1A1A]"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#7B1618]" /> Buka Panel Filter
            </button>
          </div>

          {/* ── Grid Katalog Produk ── */}
          <div className="lg:w-3/4">
            {filteredProducts.length === 0 ? (
              <div className="card-base py-20 flex flex-col items-center justify-center text-[#64748B] border-dashed">
                <Search className="w-10 h-10 mb-3 opacity-30 text-[#1A1A1A]" />
                <p className="font-mono text-sm tracking-wide">Motif atau produk tidak ditemukan dalam arsip.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => onSelectProduct(p)} 
                    className="card-base group flex flex-col h-full overflow-hidden p-0 relative cursor-pointer"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#F8FAFC]">
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C0808]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {p.isFeatured && (
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-gradient-to-r from-[#7B1618] to-[#9A1F22] text-[#1C0808] text-[8px] sm:text-[9px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-md">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#1C0808]" /> Edisi Spesial
                        </div>
                      )}
 
                      <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="bg-white/95 text-[#1A1A1A] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-between shadow-lg">
                          Analisis Visual <ArrowRight className="w-4 h-4 text-[#7B1618]"/>
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-3.5 sm:p-5 flex-1 flex flex-col border-t border-[#F1F5F9] bg-white">
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="text-[8px] sm:text-[10px] font-mono uppercase tracking-widest text-[#7B1618] truncate">{p.category}</span>
                        <span className="text-[8px] sm:text-[10px] font-mono text-[#64748B] flex-shrink-0">{p.code}</span>
                      </div>
                      <h3 className="font-serif font-bold text-xs sm:text-sm md:text-base text-[#1A1A1A] leading-snug line-clamp-2 mb-3 flex-1">{p.title}</h3>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#F1F5F9]">
                        <p className="font-bold text-xs sm:text-sm md:text-base text-[#7B1618] font-mono">{fmt(p.price)}</p>
                        
                        {isAdmin && (
                          <div className="flex items-center gap-1.5 z-10" onClick={e => e.stopPropagation()}>
                            <button onClick={(e) => { e.stopPropagation(); setEditingProduct({...p}); setIsFormOpen(true); }} className="p-2 bg-[#FFFFFF] hover:bg-[#F1F5F9] rounded-lg text-[#64748B] hover:text-[#1A1A1A] transition-all border border-[#F1F5F9]">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => handleDeleteProduct(p.id, e)} className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 border border-red-100 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Form Modifikasi Produk (Admin) ── */}
      {isFormOpen && editingProduct && isAdmin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setIsFormOpen(false); }}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-5 bg-[#FFFFFF] border-b border-[#F1F5F9] flex-shrink-0">
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">{editingProduct.id ? 'Modifikasi Karya Tenun' : 'Registrasi Produk Baru'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-[#64748B] hover:text-red-600 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {formErr && <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-xl font-bold">{formErr}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Nama Kain *</label>
                  <input type="text" required value={editingProduct.title||''} onChange={e=>setEditingProduct({...editingProduct,title:e.target.value})} className="w-full px-4 py-3 text-sm bg-[#FFFFFF] border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Kode SKU *</label>
                  <input type="text" required value={editingProduct.code||''} onChange={e=>setEditingProduct({...editingProduct,code:e.target.value})} className="w-full px-4 py-3 text-sm bg-[#FFFFFF] border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Klasifikasi</label>
                  <select value={editingProduct.category||'Kain Tenun'} onChange={e=>setEditingProduct({...editingProduct,category:e.target.value})} className="w-full px-4 py-3 text-sm bg-[#FFFFFF] border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors">
                    {CATEGORIES.slice(1).map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Harga Dasar (IDR) *</label>
                  <input type="number" required value={editingProduct.price||''} onChange={e=>setEditingProduct({...editingProduct,price:Number(e.target.value)})} className="w-full px-4 py-3 text-sm bg-[#FFFFFF] border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Akses URL Visual *</label>
                  <input type="url" required value={editingProduct.image||''} onChange={e=>setEditingProduct({...editingProduct,image:e.target.value})} className="w-full px-4 py-3 text-sm bg-[#FFFFFF] border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Filosofi Historis Produk</label>
                  <textarea rows={4} value={editingProduct.description||''} onChange={e=>setEditingProduct({...editingProduct,description:e.target.value})} className="w-full px-4 py-3 text-sm bg-[#FFFFFF] border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors resize-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-[#F1F5F9]">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-ghost !px-6 !py-2.5">Batal</button>
                <button type="submit" disabled={btnSaving} className="btn-primary !px-6 !py-2.5">
                  {btnSaving ? 'Menyinkronkan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}