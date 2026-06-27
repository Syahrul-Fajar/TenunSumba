import React, { useMemo } from 'react';
import { ArrowRight, Award, Heart, Leaf, ShieldCheck, Star } from 'lucide-react';
import { Product } from '../types';

interface HomeViewProps {
  setCurrentTab: (tab: 'home' | 'produk' | 'edukasi' | 'kontak' | 'admin') => void;
  onSelectProduct: (product: Product) => void;
  products?: Product[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export default function HomeView({ setCurrentTab, onSelectProduct, products = [] }: HomeViewProps) {
  const featured = useMemo(() => {
    const f = products.filter(p => p.isFeatured);
    return (f.length > 0 ? f : products).slice(0, 4);
  }, [products]);

  const stats = [
    { value: '50+',  label: 'Penenun Terlatih' },
    { value: '200+', label: 'Karya Diproduksi' },
    { value: '15+',  label: 'Tahun Berpengalaman' },
    { value: '100%', label: 'Bahan Alami' },
  ];

  const values = [
    { icon: <Leaf className="w-6 h-6" />,        title: 'Bahan Alami',           desc: 'Pewarna alami dari tumbuhan lokal Sumba yang ramah lingkungan dan tahan lama.' },
    { icon: <Heart className="w-6 h-6" />,       title: 'Berdayakan Perempuan',  desc: 'Setiap karya menjadi sumber penghidupan para Mama penenun dan keluarganya.' },
    { icon: <ShieldCheck className="w-6 h-6" />, title: 'Keaslian Terjamin',     desc: 'Setiap kain dilengkapi sertifikat keaslian dan informasi lengkap penenunnya.' },
    { icon: <Award className="w-6 h-6" />,       title: 'Kualitas Premium',      desc: 'Ditenun dengan teknik tradisional yang diwariskan turun-temurun berabad-abad.' },
  ];

  return (
    <div id="home-view" className="animate-fade-in pb-20">
      
      {/* ── Lapisan Hero (Dipertahankan Gelap untuk Kontras Gambar) ── */}
      <section className="relative flex items-center justify-center min-h-screen overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 bg-black">
          <img 
            src="/tenun_sumba_hero.png" 
            alt="Tenun Ikat Sumba Background" 
            className="w-full h-full object-cover opacity-35 object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-[#FBF8F4]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase mb-8 text-[#E0B060] bg-white/10 px-5 py-2.5 rounded-full tracking-widest border border-white/20 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#E0B060] animate-pulse" />
            Sentra Kerajinan Tangan Sumba, NTT
          </div>
          
          <h1 className="font-serif font-extrabold text-white leading-tight mb-6 text-5xl md:text-7xl drop-shadow-lg">
            Warisan Leluhur<br />
            <span className="text-gradient">Tenun Ikat Sumba</span>
          </h1>
          
          <p className="mb-10 max-w-2xl mx-auto font-light text-gray-200 text-lg md:text-xl leading-relaxed drop-shadow">
            Setiap helai benang merekam epik mitologi leluhur. Mahakarya tenun ikat tradisional — dirajut eksklusif dengan keahlian tinggi oleh para maestri Sumba.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setCurrentTab('produk')} className="btn-primary">
              Eksplorasi Katalog <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentTab('edukasi')} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold text-sm rounded-xl transition-all cursor-pointer backdrop-blur-sm">
              Pelajari Makna Motif
            </button>
          </div>
        </div>
      </section>

      {/* ── Lapisan Metrik (Bento Stats) ── */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 relative z-20 -mt-16">
        <div className="card-base bg-white p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center shadow-lg">
          {stats.map((s, i) => (
            <div key={i} className="py-2">
              <p className="font-serif font-extrabold text-4xl text-[#7B1618] mb-2">{s.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#7A6558]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Lapisan Nilai Fundamental ── */}
      <section className="py-28 bg-[#FBF8F4]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <span className="section-label">Komitmen Balai</span>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#3D1A0A] mt-3">Kualitas <span className="text-gradient">Autentik</span></h2>
            <p className="mt-4 max-w-lg mx-auto text-[#7A6558]">Proses penciptaan dikurasi ketat dengan mempertahankan pakem murni tradisi.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="card-base p-8 text-center group bg-white">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-[#7B1618]/5 border border-[#7B1618]/10 text-[#C8973A] group-hover:scale-110 group-hover:bg-[#7B1618] group-hover:text-white transition-all duration-300">
                  {v.icon}
                </div>
                <h3 className="font-serif font-bold text-lg text-[#3D1A0A] mb-3">{v.title}</h3>
                <p className="text-sm text-[#7A6558] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lapisan Mahakarya Pilihan ── */}
      <section className="py-20 bg-white border-t border-[#EFE6DA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
            <div>
              <span className="section-label">Kurasi Spesial</span>
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-[#3D1A0A] mt-3">Karya <span className="text-gradient">Unggulan</span></h2>
            </div>
            <button onClick={() => setCurrentTab('produk')} className="btn-ghost">
              Lihat Seluruh Koleksi <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {featured.length === 0 ? (
            <div className="card-base p-20 text-center text-[#7A6558] font-mono animate-pulse border-dashed">
              Menyinkronkan Database Motif...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featured.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => onSelectProduct(p)} 
                  className="card-base group cursor-pointer flex flex-col h-full overflow-hidden p-0"
                >
                  <div className="relative overflow-hidden aspect-[4/5] bg-[#F5EDE3]">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                    />
                    
                    {p.isFeatured && (
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-gradient-to-r from-[#C8973A] to-[#E0B060] text-[#1C0808] text-[8px] sm:text-[9px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1 sm:gap-1.5 shadow-md">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#1C0808]" /> Premium
                      </div>
                    )}
                    
                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="bg-white/90 backdrop-blur text-[#3D1A0A] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-between shadow-lg">
                        Lihat Detail <ArrowRight className="w-4 h-4 text-[#7B1618]"/>
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3.5 sm:p-6 flex-1 flex flex-col bg-white">
                    <span className="text-[8px] sm:text-[10px] font-mono uppercase tracking-widest text-[#C8973A] mb-1.5">{p.category}</span>
                    <h3 className="font-serif font-bold text-xs sm:text-sm md:text-base text-[#3D1A0A] leading-snug line-clamp-2 mb-3 flex-1">{p.title}</h3>
                    <div className="pt-3 border-t border-[#EFE6DA] flex justify-between items-center">
                      <p className="font-bold text-xs sm:text-sm md:text-base text-[#7B1618] font-mono">{fmt(p.price)}</p>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#FBF8F4] flex items-center justify-center group-hover:bg-[#7B1618] group-hover:text-white transition-colors text-[#7B1618]">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}