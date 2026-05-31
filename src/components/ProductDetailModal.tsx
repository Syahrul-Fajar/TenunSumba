import React from 'react';
import { X, Calendar, ShoppingBag, Sparkles, MoveRight } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  if (!product) return null;

  // Format currency
  const formatPrice = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Generate customized WhatsApp text link
  const generateWhatsAppLink = (prod: Product) => {
    const phoneNumber = '6289542177309'; // Configured from mock UI
    const text = encodeURIComponent(
      `Halo Balai Tenun CD Seraphine Weetebula, saya tertarik dengan produk:\n\n*Nama:* ${prod.title}\n*Kode:* ${prod.code}\n*Harga:* ${formatPrice(prod.price)}\n*Penenun:* ${prod.weaver}\n\nApakah stok produk ini masih tersedia atau bisa dipesan secara pre-order? Terima kasih!`
    );
    return `https://wa.me/${phoneNumber}?text=${text}`;
  };

  const trackWhatsAppInquiry = () => {
    import('../lib/supabase').then(({ dbService }) => {
      dbService.sendInquiry({
        name: 'Pengunjung Web (WhatsApp)',
        email: 'via-whatsapp@seraphine.org',
        subject: `Konsultasi: ${product.title}`,
        message: `Pengunjung mengklik tombol tanya WhatsApp langsung untuk karya tenun pakan Sumba "${product.title}" dengan kode ${product.code}. Hubungi segera.`,
        product_title: product.title,
        product_code: product.code
      });
    });
  };

  return (
    <div id="product-detail-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      <div 
        id="product-detail-surface" 
        className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto"
      >
        {/* Close Button Pin */}
        <button 
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full focus:outline-none transition-all duration-200"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Dynamic Product Image with golden accent border */}
        <div className="w-full md:w-1/2 h-72 md:h-[500px] relative bg-brand-cream-dark border-r border-brand-cream-dark">
          <img 
            src={product.image} 
            alt={product.title} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 text-xs font-mono font-bold tracking-widest bg-[#B01818]/90 text-white uppercase rounded shadow-sm border border-brand-gold/50">
              {product.category}
            </span>
          </div>
        </div>

        {/* Right Side: Curated Product Metadata */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-[#FDFBF9]">
          <div>
            <div className="text-xs font-mono text-brand-gold font-bold tracking-wider mb-1">
              {product.code}
            </div>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-brand-brown-dark leading-tight mb-2">
              {product.title}
            </h3>
            <div className="text-xl md:text-2xl font-sans font-bold text-[#B01818] mb-4">
              {formatPrice(product.price)}
            </div>

            {/* Divider */}
            <hr className="border-brand-cream-dark my-4" />

            <h4 className="text-xs uppercase tracking-widest text-[#7A5050] font-bold mb-2">
              Deskripsi Karya
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Cultural Information Grid Section */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              
              <div className="bg-[#FFF5F5] p-3 rounded-lg border border-[#EAD5D5]">
                <div className="flex items-center gap-1.5 text-xs text-brand-gold font-bold uppercase mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Penenun</span>
                </div>
                <div className="text-xs text-[#5A1010] font-medium truncate">
                  {product.weaver}
                </div>
              </div>

              <div className="bg-[#FAF6F2] p-3 rounded-lg border border-brand-cream-dark">
                <div className="flex items-center gap-1.5 text-xs text-brand-gold font-bold uppercase mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Durasi Pembuatan</span>
                </div>
                <div className="text-xs text-brand-brown-dark font-medium">
                  {product.makingTime}
                </div>
              </div>

              {product.dimensions && (
                <div className="col-span-2 bg-[#FAF6F2] p-3 rounded-lg border border-brand-cream-dark">
                  <div className="text-xs text-brand-gold font-bold uppercase mb-1">
                    Dimensi Kain / Ukuran
                  </div>
                  <div className="text-xs text-brand-brown-dark font-medium">
                    {product.dimensions}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Inquiry Options Footer Trigger */}
          <div className="mt-4 flex flex-col gap-2">
            <a
              id="whatsapp-inquiry-btn"
              href={generateWhatsAppLink(product)}
              onClick={trackWhatsAppInquiry}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-[#B01818] hover:bg-[#8E1212] text-white font-sans text-sm font-semibold tracking-wide uppercase rounded-lg shadow-md transition-all duration-200"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Hubungi via WhatsApp</span>
              <MoveRight className="w-4 h-4" />
            </a>
            
            <p className="text-[10px] text-center text-gray-400">
              *Pembelian diproses secara langsung dengan perajin demi memberdayakan kesejahteraan perajin lokal Sumba 100%.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
