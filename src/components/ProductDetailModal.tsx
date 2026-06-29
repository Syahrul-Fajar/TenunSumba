import React, { useState, useEffect } from 'react';
import { X, Calendar, ShoppingBag, Ruler, Star, Send } from 'lucide-react';
import { Product, CustomSize, Review, User } from '../types';
import { dbService } from '../lib/supabase';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, ukuran?: string) => void;
  currentUser?: User | null;
}

const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function ProductDetailModal({ product, onClose, onAddToCart, currentUser }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [sizes, setSizes] = useState<CustomSize[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isBuyer, setIsBuyer] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newKomentar, setNewKomentar] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
      setQuantity(1);
      setSelectedSize('');
      setNewRating(5);
      setNewKomentar('');
      
      dbService.getSizesByProduct(Number(product.id)).then(list => {
        if (list && list.length > 0) {
          setSizes(list);
          setSelectedSize(list[0].ukuran);
        } else {
          setSizes([{ id_size: 0, id_produk: Number(product.id), ukuran: 'All Size', harga_tambahan: 0 }]);
          setSelectedSize('All Size');
        }
      });
      
      dbService.getReviewsByProduct(Number(product.id)).then(list => setReviews(list));
      
      if (currentUser) {
        dbService.hasUserPurchasedProduct(currentUser.id_user, Number(product.id)).then(purchased => {
          setIsBuyer(purchased);
        });
      } else {
        setIsBuyer(false);
      }
      
    } else {
      document.body.style.overflow = '';
      setSizes([]);
      setReviews([]);
      setIsBuyer(false);
    }
  }, [product, currentUser]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !currentUser || !isBuyer) return;
    setSubmittingReview(true);
    try {
      await dbService.saveReview({
        id_produk: Number(product.id),
        id_user: currentUser.id_user,
        rating: newRating,
        komentar: newKomentar
      });
      // Refresh reviews
      const updatedReviews = await dbService.getReviewsByProduct(Number(product.id));
      setReviews(updatedReviews);
      setNewKomentar('');
      setNewRating(5);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim ulasan');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!product) return null;
  const isOutOfStock = (product.stock ?? 5) <= 0;

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedSize || undefined);
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
            </div>

            {/* Pilihan Ukuran */}
            {sizes.length > 0 && !isOutOfStock && (
              <div className="mt-6">
                <span className={labelCls}>Pilih Ukuran</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sizes.map(size => (
                    <button
                      key={size.id_size}
                      onClick={() => setSelectedSize(size.ukuran)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        selectedSize === size.ukuran 
                          ? 'bg-[#7B1618] text-white border-[#7B1618]' 
                          : 'bg-white text-[#64748B] border-[#F1F5F9] hover:border-[#7B1618] hover:text-[#7B1618]'
                      }`}
                    >
                      {size.ukuran}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {/* ── SEKSI ULASAN (REVIEWS) ── */}
            <div className="px-6 py-8 border-t border-[#F1F5F9] bg-[#F8FAFC]">
              <h4 className="font-serif font-bold text-xl text-[#1A1A1A] mb-6 flex items-center gap-2">
                Ulasan Pelanggan <span className="text-sm font-sans font-normal text-gray-500">({reviews.length})</span>
              </h4>

              {/* Form Ulasan (Hanya untuk pembeli) */}
              <div className="mb-8 p-5 bg-white rounded-2xl shadow-sm border border-[#F1F5F9]">
                {!currentUser ? (
                  <p className="text-sm text-gray-500 text-center py-2">Silakan Login untuk memberikan ulasan.</p>
                ) : !isBuyer ? (
                  <p className="text-sm text-amber-600 text-center py-2 font-medium bg-amber-50 rounded-xl">Anda hanya dapat memberikan ulasan pada produk yang telah Anda beli.</p>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Rating Bintang</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className={`p-1 transition-colors ${newRating >= star ? 'text-amber-400' : 'text-gray-200'}`}
                          >
                            <Star className="w-8 h-8 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Tulis Pengalaman Anda</label>
                      <textarea 
                        required
                        rows={3} 
                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl text-sm focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition-all resize-none"
                        placeholder="Bagaimana kualitas bahan dan tenunannya?"
                        value={newKomentar}
                        onChange={e => setNewKomentar(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={submittingReview}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#1A1A1A] hover:bg-black text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" /> {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                    </button>
                  </form>
                )}
              </div>

              {/* Daftar Ulasan */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4 italic">Belum ada ulasan untuk karya tenun ini.</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id_review} className="p-5 bg-white rounded-2xl border border-[#F1F5F9] shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-[#1A1A1A]">{r.nama_user}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(r.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={`w-3.5 h-3.5 ${r.rating >= star ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      {r.komentar && (
                        <p className="text-sm text-gray-600 mt-3 leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9]">"{r.komentar}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* ── AKHIR SEKSI ULASAN ── */}
          </div>
        </div>
      </div>
    </div>
  );
}