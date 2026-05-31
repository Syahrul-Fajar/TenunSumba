import React from 'react';
import { Target, Award, Eye, Navigation, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';

interface HomeViewProps {
  setCurrentTab: (tab: 'home' | 'produk' | 'kontak' | 'admin') => void;
  onSelectProduct: (product: Product) => void;
  products?: Product[];
}

export default function HomeView({ setCurrentTab, onSelectProduct, products: propProducts = [] }: HomeViewProps) {
  const [localProducts, setLocalProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    if (!propProducts || propProducts.length === 0) {
      import('../lib/supabase').then(({ dbService }) => {
        dbService.getAllProducts().then((list) => {
          setLocalProducts(list);
        });
      });
    }
  }, [propProducts]);

  const activeProducts = propProducts && propProducts.length > 0 ? propProducts : localProducts;

  // Grab the 4 featured products
  const featuredProducts = React.useMemo(() => {
    const featured = activeProducts.filter((p) => p.isFeatured);
    return featured.length > 0 ? featured.slice(0, 4) : activeProducts.slice(0, 4);
  }, [activeProducts]);

  return (
    <div id="home-view" className="animate-fade-in">
      
      {/* 1. HERO BANNER SECTION */}
      <section 
        id="home-hero" 
        className="relative h-[85vh] min-h-[500px] flex items-center justify-center bg-zinc-900 border-b border-brand-cream-dark mt-16 overflow-hidden"
      >
        {/* Absolute high-fidelity background image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=80" 
            alt="Traditional Sumba Weaving Craftsmen" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-40 scale-105"
          />
          {/* Subtle warm gradient overlay to replicate image tone */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
        </div>

        {/* Hero content aligned in absolute center */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white flex flex-col items-center">
          <span className="text-brand-gold text-xs font-mono tracking-widest uppercase font-bold mb-4 flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Tradisi Adat Marapu Sumba
          </span>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-3">
            Warisan Tenun Sumba
          </h2>
          <p className="font-serif text-xl sm:text-3xl text-brand-gold font-medium tracking-wide mb-5">
            CD Seraphine Weetebula
          </p>
          <p className="text-sm sm:text-lg text-[#E3D8D0] font-light max-w-2xl tracking-wide mb-8">
            "Melestarikan Nilai Budaya Sumba, Memberdayakan Ekonomi Perempuan Adat secara Berkelanjutan"
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              id="hero-explore-btn"
              onClick={() => { setCurrentTab('produk'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-8 py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-brown-dark font-sans text-sm font-semibold uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2"
            >
              <span>Jelajahi Produk Kami</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-contact-btn"
              onClick={() => { setCurrentTab('kontak'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-8 py-3.5 bg-transparent hover:bg-white/10 text-white border border-white/40 hover:border-white font-sans text-sm font-semibold uppercase tracking-wider rounded-lg transition-colors duration-200"
            >
              Hubungi Balai Tenun
            </button>
          </div>
        </div>

        {/* Elegant scroll invitation badge */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-[#C5B5AA] text-xs font-mono uppercase tracking-widest animate-bounce">
          <span>Gulir Ke Bawah</span>
          <div className="w-0.5 h-6 bg-brand-gold" />
        </div>
      </section>

      {/* 2. TENTANG KAMI SECTION */}
      <section id="home-about" className="py-20 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Side: Large decorative frame containing a deep brown handwoven ikat layout */}
            <div className="col-span-1 lg:col-span-6 flex justify-center">
              <div className="relative group max-w-md lg:max-w-none w-full">
                {/* Visual shadow border decor */}
                <div className="absolute -inset-2 bg-brand-gold/20 rounded-2xl -rotate-1 group-hover:rotate-0 transition-transform duration-300 pointer-events-none" />
                <div className="absolute -inset-1 border border-brand-gold/60 rounded-2xl rotate-1 group-hover:rotate-0 transition-transform duration-300 pointer-events-none" />
                <div className="relative rounded-xl overflow-hidden shadow-xl aspect-4/3 bg-brand-brown-dark">
                  <img 
                    src="https://images.unsplash.com/photo-1551250936-3190e2108db9?auto=format&fit=crop&w=800&q=80" 
                    alt="Detail Benang Kain Tenun Sumba" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Right Side: Curated layout matching the exact image mockup */}
            <div className="col-span-1 lg:col-span-6 space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-mono font-bold tracking-widest text-brand-gold block">
                  Tentang Kami
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-brown-dark tracking-tight leading-tight">
                  Balai Tenun Seraphine
                </h3>
              </div>
              
              <div className="text-gray-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Balai Tenun CD Seraphine dari asuntusmisa Weetebula berkomitmen menyatukan seni tradisi murni dengan pemberdayaan hidup perempuan Sumba Barat Daya. Kami membimbing perajin terampil agar tetap menjaga keaslian proses pembuatan selembar kain pusaka.
                </p>
                <p>
                  Kain tenun Sumba bukanlah sekadar tekstil biasa; ia adalah rekaman kehidupan, lambang spiritual Marapu, serta jembatan tradisi kuno. Setiap pakan dan lungsin dirangkai perlahan menggunakan katun pintal tangan lokal dan ekstrak pigmen pewarna tumbuhan organik murni.
                </p>
              </div>

              {/* Exact Styled Stat Box containing "50+ Penenun Terlatih" with deep brown text & gold bordered design */}
              <div className="pt-4">
                <div className="border-2 border-brand-gold/60 rounded-xl p-5 bg-white shadow-sm inline-flex items-center gap-6 max-w-sm">
                  <span className="font-serif text-4xl sm:text-5xl font-extrabold text-[#B01818] flex-shrink-0">
                    50+
                  </span>
                  <div>
                    <h5 className="font-serif text-lg font-bold text-brand-brown-dark leading-tight">
                      Penenun Terlatih
                    </h5>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      Perempuan adat yang diberdayakan menjaga kelestarian peradaban kain ikat Sumba.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 3. VISI & MISI SECTION */}
      <section id="home-vision-mission" className="py-20 bg-[#F0EDE6] border-y border-brand-cream-dark/55">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          {/* Header block with Visi & Misi detail */}
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest text-[#B01818] uppercase">
              Aksara Komitmen Kami
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#B01818]">
              Visi & Misi: Balai Tenun CD Seraphine Weetebula
            </h3>
            <p className="text-sm italic text-gray-600 max-w-xl mx-auto px-4 border-l-4 border-brand-gold py-1">
              "Menyatukan dedikasi seni tradisi tenun ikat Sumba dengan pilar kemandirian ekonomi perempuan adat yang bermartabat tinggi."
            </p>
          </div>

          {/* Grid of the 3 cards corresponding exactly to Tujuan, Misi, Visi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Tujuan */}
            <div className="bg-white rounded-xl p-6 md:p-8 text-left border border-brand-cream-dark shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#FFF5F5] flex items-center justify-center text-[#B01818] mb-6 border border-brand-cream-dark">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-xl font-bold text-brand-brown-dark mb-4">Tujuan</h4>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
                <li className="flex gap-2 items-start">
                  <span className="text-brand-gold font-bold">•</span>
                  <span>Mengenalkan keapikan dan keluhuran filosofi tenun ikat Sumba ke seluruh Nusantara hingga kancah global.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-brand-gold font-bold">•</span>
                  <span>Memastikan keberlanjutan regenerasi ilmu pemintalan ikat alami bagi remaja perempuan Sumba Barat Daya.</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Misi */}
            <div className="bg-white rounded-xl p-6 md:p-8 text-left border border-brand-cream-dark shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#FFF5F5] flex items-center justify-center text-[#B01818] mb-6 border border-brand-cream-dark">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-xl font-bold text-brand-brown-dark mb-4">Misi</h4>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
                <li className="flex gap-2 items-start">
                  <span className="text-brand-gold font-bold">•</span>
                  <span>Menginisiasi program pelatihan tenun komprehensif berkala bebas biaya bagi kaum perempuan rentan.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-brand-gold font-bold">•</span>
                  <span>Menyediakan akses bahan katun pintal tangan lokal dan wadah pemasaran langsung bebas tengkulak.</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Visi */}
            <div className="bg-white rounded-xl p-6 md:p-8 text-left border border-brand-cream-dark shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#FFF5F5] flex items-center justify-center text-[#B01818] mb-6 border border-brand-cream-dark">
                <Eye className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-xl font-bold text-brand-brown-dark mb-4">Visi</h4>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-650">
                <li className="flex gap-2 items-start">
                  <span className="text-brand-gold font-bold">•</span>
                  <span>Menjadi wadah pelestari warisan budaya tenun ikat Sumba terdepan dengan mengutamakan kesejahteraan penenun.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="text-brand-gold font-bold">•</span>
                  <span>Dihargai secara luas dalam mendukung konservasi lingkungan hidup lewat pelestarian kebun pewarna organik lokal.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 4. FEATURED PRODUCTS SECTION */}
      <section id="home-featured" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="space-y-2">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#B01818] block">Galeri Karya Terbaik</span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-brand-brown-dark">Featured Products</h3>
            <div className="w-16 h-1 bg-brand-gold mx-auto rounded-full mt-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {featuredProducts.map((p) => (
              <div key={p.id} className="group relative flex flex-col justify-start">
                
                {/* Image card wrapper targeting Screenshot 1's "Lihat Detail" overlaid buttons */}
                <div className="relative aspect-3/4 bg-brand-cream-dark rounded-xl overflow-hidden shadow-md group">
                  <img 
                    src={p.image} 
                    alt={p.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay background on hover and action trigger */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                    <button
                      id={`featured-detail-btn-${p.id}`}
                      onClick={() => onSelectProduct(p)}
                      className="px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-brown-dark text-xs font-semibold tracking-wider uppercase rounded shadow hover:scale-105 transition-all duration-200"
                    >
                      Lihat Detail
                    </button>
                  </div>
                  
                  {/* Static banner code overlay */}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-sm text-[10px] font-mono font-bold text-[#E7DFD5] rounded">
                    {p.code}
                  </div>
                </div>

                {/* Sub-label text under card matching the first screenshot */}
                <div className="mt-4 space-y-1">
                  <h4 className="font-serif text-md font-bold text-brand-brown-dark tracking-tight line-clamp-1 group-hover:text-brand-brown transition-colors">
                    {p.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-sans">{p.category}</span>
                    <span className="text-[#B01818] font-semibold">Rp {p.price.toLocaleString('id-ID')}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Action button to switch to Product Tab directly */}
          <div className="pt-6">
            <button
              id="view-all-products-btn"
              onClick={() => { setCurrentTab('produk'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-8 py-3.5 bg-brand-brown hover:bg-brand-brown-dark text-white font-sans text-sm font-semibold uppercase tracking-wider rounded-lg shadow-md hover:scale-[1.02] transition-all"
            >
              Lihat Semua Produk
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}
