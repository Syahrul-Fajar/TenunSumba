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

  const labelCls = "block text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-scale-in border border-[#F1F5F9]">
        
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-white/90 shadow-sm text-[#1A1A1A] rounded-full">
          <X className="w-5 h-5" />
        </button>

        {/* ── Panel Visual Kiri ── */}
        <div className="w-full md:w-2/5 relative flex-shrink-0 bg-[#F8FAFC] min-h-[250px] md:min-h-[450px]">
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
        <div className="w-full md:w-3/5 flex flex-col relative overflow-y-auto custom-scrollbar bg-[#FFFFFF]">
          <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 z-10 w-10 h-10 items-center justify-center text-[#64748B] hover:text-[#7B1618] hover:bg-white border border-[#F1F5F9] rounded-full transition-all bg-[#FFFFFF]">
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 flex flex-col p-8 md:p-10">
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-extrabold text-[#1A1A1A] leading-tight mb-2">{product.title}</h2>
              <div className="mb-6"><span className="text-2xl font-extrabold text-[#7B1618] font-mono">{fmt(product.price)}</span></div>
              
              <p className="text-sm text-[#475569] leading-relaxed mb-4">{product.description}</p>
              
              {product.maknaMotif && (
                <div className="mb-6 p-4 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]">
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] mb-1">Filosofi & Makna Motif</span>
                  <p className="text-xs text-[#475569] leading-relaxed italic">"{product.maknaMotif}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#F1F5F9] flex items-center justify-center text-[#7B1618]"><Ruler className="w-5 h-5" /></div>
                  <div><span className="block text-[10px] font-mono uppercase tracking-widest text-[#64748B]">Dimensi</span><span className="block text-sm font-bold text-[#1A1A1A]">{product.dimensions || '—'}</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#F1F5F9] flex items-center justify-center text-[#7B1618]"><Calendar className="w-5 h-5" /></div>
                  <div><span className="block text-[10px] font-mono uppercase tracking-widest text-[#64748B]">Pengerjaan</span><span className="block text-sm font-bold text-[#1A1A1A]">{product.makingTime}</span></div>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Add to Cart Action */}
            {!isOutOfStock && (
              <div className="flex items-center justify-between p-4 bg-white border border-[#F1F5F9] rounded-xl mt-6">
                <span className={labelCls}>Jumlah Alokasi</span>
                <div className="flex items-center gap-4 bg-[#FFFFFF] rounded-lg p-1 border border-[#F1F5F9]">
                  <button type="button" onClick={() => setQuantity(p => Math.max(1, p - 1))} className="w-8 h-8 flex items-center justify-center font-bold text-[#1A1A1A] hover:text-[#7B1618] transition-colors">−</button>
                  <span className="w-6 text-center font-bold text-[#1A1A1A] text-sm font-mono">{quantity}</span>
                  <button type="button" onClick={() => setQuantity(p => Math.min(product.stock ?? 5, p + 1))} className="w-8 h-8 flex items-center justify-center font-bold text-[#1A1A1A] hover:text-[#7B1618] transition-colors">+</button>
                </div>
              </div>
            )}

            <div className="pt-6 mt-6">
              <button 
                onClick={handleAdd} 
                disabled={isOutOfStock} 
                className={`w-full flex justify-center gap-2 py-4 text-sm font-bold text-white rounded-xl transition-all ${isOutOfStock ? 'bg-[#C8B8A6] cursor-not-allowed' : 'btn-primary'}`}
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