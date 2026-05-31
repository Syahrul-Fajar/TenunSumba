import React from 'react';
import { Search, SlidersHorizontal, RefreshCw, X, ChevronDown } from 'lucide-react';
import { Product, FilterState } from '../types';
import { PRODUCTS } from '../data/products';

interface ProductViewProps {
  onSelectProduct: (product: Product) => void;
  products?: Product[];
}

export default function ProductView({ onSelectProduct, products: propProducts = [] }: ProductViewProps) {
  // 1. Interactive States
  const [localProducts, setLocalProducts] = React.useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [priceRange, setPriceRange] = React.useState<number>(5000000); // 5 Million maximum slider
  const [sortBy, setSortBy] = React.useState<string>('popular'); // popular | price-low | price-high
  
  // Mobile filter drawer toggle
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);

  const categories = ['Kain Tenun', 'Tas & Aksesori', 'Selendang', 'Dekorasi'];

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

  // 2. Multi-Filter Logic
  const filteredProducts = React.useMemo(() => {
    let result = [...activeProducts];

    // Filter by Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) => 
          p.title.toLowerCase().includes(query) || 
          p.description.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query)
      );
    }

    // Filter by Selected Categories
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // Filter by Maximum Price
    result = result.filter((p) => p.price <= priceRange);

    // Sort the resulting selection
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } // 'popular' retains original featured sorting sequence

    return result;
  }, [searchQuery, selectedCategories, priceRange, sortBy]);

  // Handler for category selection checkbox
  const handleCategoryChange = (cat: string) => {
    setSelectedCategories((prev) => 
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  // Reset all filters in one click
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange(5000000);
    setSortBy('popular');
  };

  return (
    <div id="product-view" className="animate-fade-in mt-16">
      
      {/* A. PRODUCT VIEW HERO SECTION */}
      <section 
        id="product-catalog-hero" 
        className="relative h-[45vh] min-h-[300px] flex items-center justify-center bg-stone-900 overflow-hidden"
      >
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1400&q=80" 
            alt="Handcrafted local textiles banner" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-[#6A0F0F]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5]/90 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-xl mx-auto px-4 mt-6">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-2 dropdown-shadow">
            Tenun Product Catalog
          </h2>
          <p className="text-sm sm:text-md text-[#F4ECE3] tracking-wide font-sans font-medium">
            Jelajahi Keindahan & Kompleksitas Warisan Sumba
          </p>
        </div>
      </section>

      {/* B. DYNAMIC CLASSIFIED CATALOG WRAPPER */}
      <section id="catalog-main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* Mobile Search/Filter Quick Action Row */}
        <div className="md:hidden flex gap-2 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari motif, penenun, kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
            />
          </div>
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="p-2.5 bg-brand-brown hover:bg-brand-brown-dark text-white rounded-lg flex items-center justify-center"
            aria-label="Filter"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* =================== LEFT COLUMN SIDEBAR (DESKTOP) =================== */}
          <aside className="hidden md:block col-span-1 space-y-8 bg-white/60 p-6 rounded-xl border border-brand-cream-dark shadow-sm">
            
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider">Cari Produk</label>
              <div className="relative">
                <Search className="absolute top-2.5 left-2.5 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold"
                />
              </div>
            </div>

            {/* Kategori Filters */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-brand-brown-dark tracking-wide border-b border-brand-cream-dark pb-1.5 uppercase font-mono text-[11px]">
                Kategori
              </h4>
              <div className="space-y-2.5">
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:text-brand-brown transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryChange(cat)}
                      className="w-4.5 h-4.5 accent-brand-brown rounded border-gray-300 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Harga Slider Filter */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-brand-brown-dark tracking-wide border-b border-brand-cream-dark pb-1.5 uppercase font-mono text-[11px]">
                Harga Maksimal
              </h4>
              <div className="space-y-2">
                <input 
                  type="range"
                  min="400000"
                  max="5000000"
                  step="100000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full h-1.5 bg-brand-cream-dark rounded-lg appearance-none cursor-pointer accent-brand-brown"
                />
                <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                  <span>Rp 400.000</span>
                  <span className="font-bold text-brand-brown">Rp {priceRange.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Urutkan Berdasarkan Filter */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-brand-brown-dark tracking-wide border-b border-brand-cream-dark pb-1.5 uppercase font-mono text-[11px]">
                Urutkan Berdasarkan
              </h4>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm appearance-none bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold text-gray-700 cursor-pointer pr-10"
                >
                  <option value="popular">Popularitas (Default)</option>
                  <option value="price-low">Harga: Terendah</option>
                  <option value="price-high">Harga: Tertinggi</option>
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-brand-gold text-brand-brown hover:bg-brand-cream text-xs font-semibold tracking-wide uppercase rounded-lg transition-colors duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>

          </aside>

          {/* =================== RIGHT COLUMN: PRODUCT GRID =================== */}
          <main className="col-span-1 md:col-span-3 space-y-6">
            
            {/* Catalog Info Bar */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 py-2 border-b border-brand-cream-dark">
              <div>
                Menampilkan <span className="font-bold text-brand-brown-dark">{filteredProducts.length}</span> produk
              </div>
              <div className="hidden sm:block">
                Sumbu Warisan Tenun • CD Seraphine
              </div>
            </div>

            {/* Empty State when zero matches found */}
            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-xl py-16 px-4 text-center border border-brand-cream-dark shadow-sm">
                <Search className="w-12 h-12 text-brand-gold/50 mx-auto mb-4" />
                <h4 className="font-serif text-lg font-bold text-brand-brown-dark">Tidak Ada Produk Cocok</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Coba ubah rentang harga Anda, batalkan pilihan kategori filter, atau gunakan query pencarian lainnya.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-5 py-2 bg-[#B01818] text-white text-xs font-medium tracking-wide uppercase rounded-lg hover:bg-[#8E1212]"
                >
                  Tampilkan Semua Produk
                </button>
              </div>
            )}

            {/* Product Cards Grid Structure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((p) => (
                <div 
                  key={p.id} 
                  className="group relative flex flex-col justify-between bg-white rounded-xl border border-brand-cream-dark/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Image Card Top, hover overlays "Lihat Detail" */}
                  <div className="relative aspect-4/5 bg-brand-cream-dark overflow-hidden group">
                    <img 
                      src={p.image} 
                      alt={p.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-brown-dark text-xs font-semibold tracking-wider uppercase rounded shadow transition-all duration-200"
                      >
                        Lihat Detail
                      </button>
                    </div>

                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#B01818]/80 text-[10px] font-mono font-bold text-white rounded">
                      {p.code}
                    </div>
                  </div>

                  {/* Body Text Meta & Pricing */}
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h4 className="font-serif text-[15px] font-bold text-[#B01818] leading-tight line-clamp-1 group-hover:text-[#8E1212] transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-sans mt-0.5">{p.category}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-brand-cream-dark/50 mt-3">
                      <div className="text-[15px] font-sans font-bold text-[#B01818]">
                        Rp {p.price.toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {p.makingTime}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </main>

        </div>
      </section>

      {/* =================== MOBILE FILTER EXTRA PANEL (SLIDE UP / OPEN DRAWER) =================== */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:hidden p-4">
          <div className="bg-white rounded-t-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto relative">
            
            <button 
              onClick={() => setMobileFilterOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-gray-100 hover:bg-gray-250 text-gray-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-[#B01818] border-b border-brand-cream-dark pb-2">Filter Produk</h3>

            {/* Kategori */}
            <div className="space-y-3">
              <label className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider">Kategori</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <label key={cat} className="flex items-center gap-2 p-2 bg-[#FAF6F2] rounded border border-brand-cream-dark text-xs text-gray-600 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryChange(cat)}
                      className="w-4.5 h-4.5 accent-brand-brown rounded"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Harga Slider */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider">Harga Maksimal</label>
              <input 
                type="range"
                min="400000"
                max="5000000"
                step="100000"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1.5 bg-brand-cream-dark rounded-lg cursor-pointer accent-brand-brown"
              />
              <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                <span>Rp 400.000</span>
                <span className="font-bold text-brand-brown">Rp {priceRange.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* SortBy */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-mono font-bold text-gray-400 tracking-wider">Urutkan</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-brand-cream-dark rounded-lg text-gray-700"
              >
                <option value="popular">Popularitas (Default)</option>
                <option value="price-low">Harga: Terendah</option>
                <option value="price-high">Harga: Tertinggi</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { handleResetFilters(); setMobileFilterOpen(false); }}
                className="flex-grow py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold uppercase rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-grow py-2.5 bg-[#B01818] hover:bg-[#8E1212] text-white text-xs font-semibold uppercase rounded-lg"
              >
                Terapkan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
