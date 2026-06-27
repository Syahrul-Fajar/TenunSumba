import React, { useState, useEffect } from 'react';
import { X, Calendar, ShoppingBag, Ruler } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      setQuantity(1);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  if (!product) return null;
  const isOutOfStock = (product.stock ?? 5) <= 0;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  const labelCls = "block text-[10px] font-mono font-bold uppercase tracking-widest text-[#7A6558] mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-scale-in border border-[#EFE6DA]">
        
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-white/90 shadow-sm text-[#3D1A0A] rounded-full">
          <X className="w-5 h-5" />
        </button>

        {/* ── Panel Visual Kiri ── */}
        <div className="w-full md:w-2/5 relative flex-shrink-0 bg-[#F5EDE3] min-h-[250px] md:min-h-[450px]">
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

          <div className="flex-1 flex flex-col p-8 md:p-10">
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-extrabold text-[#3D1A0A] leading-tight mb-2">{product.title}</h2>
              <div className="mb-6"><span className="text-2xl font-extrabold text-[#7B1618] font-mono">{fmt(product.price)}</span></div>
              
              <p className="text-sm text-[#5A4538] leading-relaxed mb-4">{product.description}</p>
              
              {product.maknaMotif && (
                <div className="mb-6 p-4 bg-[#F2EDE4] rounded-xl border border-[#E0D5C3]">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#7A6558] mb-1">Filosofi & Makna Motif</span>
                  <p className="text-xs text-[#5A4538] leading-relaxed italic">"{product.maknaMotif}"</p>
                </div>
              )}

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

            {/* Quantity Selector & Add to Cart Action */}
            {!isOutOfStock && (
              <div className="flex items-center justify-between p-4 bg-white border border-[#EFE6DA] rounded-xl mt-6">
                <span className={labelCls}>Jumlah Alokasi</span>
                <div className="flex items-center gap-4 bg-[#FBF8F4] rounded-lg p-1 border border-[#EFE6DA]">
                  <button type="button" onClick={() => setQuantity(p => Math.max(1, p - 1))} className="w-8 h-8 flex items-center justify-center font-bold text-[#3D1A0A] hover:text-[#7B1618] transition-colors">−</button>
                  <span className="w-6 text-center font-bold text-[#3D1A0A] text-sm font-mono">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(p => Math.min(product.stock ?? 5, p + 1))} className="w-8 h-8 flex items-center justify-center font-bold text-[#3D1A0A] hover:text-[#7B1618] transition-colors">+</button>
                </div>
              </div>
            )}

            <div className="pt-6 mt-6">
              <button 
                onClick={handleAdd} 
                disabled={isOutOfStock} 
                className={`w-full flex justify-center gap-2 py-4 text-sm font-bold text-white rounded-xl transition-all ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'btn-primary'}`}
              >
                <ShoppingBag className="w-5 h-5" /> {isOutOfStock ? 'Stok Habis' : 'Masukkan ke Keranjang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}