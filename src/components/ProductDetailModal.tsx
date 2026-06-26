import React, { useState, useEffect } from 'react';
import { X, Calendar, ShoppingBag, Sparkles, ArrowRight, ArrowLeft, Send, Package, CheckCircle2, Ruler, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { dbService } from '../lib/supabase';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const [isOrdering, setIsOrdering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', quantity: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsOrdering(false);
      setOrderSuccess(false);
      setFormData({ name: '', email: '', phone: '', address: '', quantity: 1 });
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  if (!product) return null;
  const isOutOfStock = (product.stock ?? 5) <= 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      setError('Harap lengkapi entri wajib.'); return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await dbService.createOrder({
        customerName: formData.name, customerEmail: formData.email || '-', customerPhone: formData.phone,
        customerAddress: formData.address, productId: product.id, productTitle: product.title,
        productCode: product.code, price: product.price, quantity: formData.quantity,
        totalPrice: product.price * formData.quantity, status: 'baru'
      });
      setOrderSuccess(true);
      setTimeout(() => onClose(), 4000);
    } catch (err) {
      setError('Gagal merekam pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-3 text-sm bg-white border border-[#EFE6DA] rounded-xl text-[#3D1A0A] focus:outline-none focus:border-[#C8973A] transition-colors";
  const labelCls = "block text-[10px] font-mono font-bold uppercase tracking-widest text-[#7A6558] mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-scale-in border border-[#EFE6DA]">
        
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-white/90 shadow-sm text-[#3D1A0A] rounded-full">
          <X className="w-5 h-5" />
        </button>

        {/* ── Panel Visual Kiri ── */}
        <div className="w-full md:w-2/5 relative flex-shrink-0 bg-[#F5EDE3]">
          <img src={product.image} alt={product.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <div className="absolute top-6 left-6 flex flex-col gap-2">
            <span className="inline-flex px-3 py-1 bg-white/95 text-[#7B1618] rounded-full text-[10px] font-mono font-bold uppercase tracking-widest shadow-sm">
              {product.category}
            </span>
          </div>
          <div className="absolute bottom-6 left-6 right-6 text-white text-sm font-mono tracking-wide">
            SKU: {product.code}
          </div>
        </div>

        {/* ── Panel Konten Kanan ── */}
        <div className="w-full md:w-3/5 flex flex-col relative overflow-y-auto custom-scrollbar bg-[#FBF8F4]">
          <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 z-10 w-10 h-10 items-center justify-center text-[#7A6558] hover:text-[#7B1618] hover:bg-white border border-[#EFE6DA] rounded-full transition-all bg-[#FBF8F4]">
            <X className="w-5 h-5" />
          </button>

          {orderSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#3D1A0A] mb-3">Pesanan Terkonfirmasi!</h2>
              <p className="text-[#7A6558] max-w-md mx-auto mb-6 text-sm">
                Sistem telah merekam permintaan Anda. Jendela ini akan otomatis tertutup.
              </p>
            </div>
          ) : isOrdering ? (
            <div className="flex-1 p-8 flex flex-col">
              <button onClick={() => setIsOrdering(false)} className="self-start flex items-center gap-2 text-xs font-bold text-[#C8973A] hover:text-[#7B1618] uppercase tracking-widest mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              
              <h2 className="font-serif text-2xl font-bold text-[#3D1A0A] mb-1">Formulir Akuisisi</h2>
              <p className="text-sm text-[#7A6558] mb-6">Verifikasi identitas pengiriman untuk mahakarya ini.</p>

              {error && <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

              <form onSubmit={handleOrderSubmit} className="space-y-4 flex-1 flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nama Lengkap *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp Aktif *</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Alamat Pengiriman *</label>
                  <textarea name="address" required rows={2} value={formData.address} onChange={handleChange} className={`${inputCls} resize-none`} />
                </div>
                <div className="flex items-center justify-between p-4 bg-white border border-[#EFE6DA] rounded-xl">
                  <span className={labelCls}>Kuantitas Unit</span>
                  <div className="flex items-center gap-4 bg-[#FBF8F4] rounded-lg p-1 border border-[#EFE6DA]">
                    <button type="button" onClick={() => setFormData(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))} className="w-8 h-8 flex items-center justify-center font-bold">−</button>
                    <span className="w-6 text-center font-bold text-[#3D1A0A] text-sm font-mono">{formData.quantity}</span>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, quantity: Math.min(product.stock ?? 5, p.quantity + 1) }))} className="w-8 h-8 flex items-center justify-center font-bold">+</button>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-[#EFE6DA]">
                  <div className="flex justify-between mb-4"><span className="text-sm font-bold text-[#7A6558]">Total Pembayaran</span><span className="text-xl font-bold text-[#7B1618] font-mono">{fmt(product.price * formData.quantity)}</span></div>
                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-sm">{isSubmitting ? 'Memproses...' : 'Konfirmasi Pesanan'}</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-8 md:p-10">
              <div className="flex-1">
                <h2 className="font-serif text-3xl font-extrabold text-[#3D1A0A] leading-tight mb-2">{product.title}</h2>
                <div className="mb-6"><span className="text-2xl font-extrabold text-[#7B1618] font-mono">{fmt(product.price)}</span></div>
                <p className="text-sm text-[#5A4538] leading-relaxed mb-6">{product.description}</p>
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#EFE6DA]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EFE6DA] flex items-center justify-center text-[#C8973A]"><Ruler className="w-5 h-5" /></div>
                    <div><span className="block text-[10px] font-mono uppercase tracking-widest text-[#7A6558]">Dimensi</span><span className="block text-sm font-bold text-[#3D1A0A]">{product.dimensions || '—'}</span></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#EFE6DA] flex items-center justify-center text-[#C8973A]"><Calendar className="w-5 h-5" /></div>
                    <div><span className="block text-[10px] font-mono uppercase tracking-widest text-[#7A6558]">Pengerjaan</span><span className="block text-sm font-bold text-[#3D1A0A]">{product.makingTime}</span></div>
                  </div>
                </div>
              </div>
              <div className="pt-6 mt-6">
                <button onClick={() => setIsOrdering(true)} disabled={isOutOfStock} className={`w-full flex justify-center gap-2 py-4 text-sm font-bold text-white rounded-xl transition-all ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}>
                  <ShoppingBag className="w-5 h-5" /> {isOutOfStock ? 'Stok Habis' : 'Inisiasi Transaksi'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}