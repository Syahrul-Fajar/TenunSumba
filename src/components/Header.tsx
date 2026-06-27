import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';

type Tab = 'home' | 'produk' | 'edukasi' | 'kontak' | 'admin';

interface HeaderProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
  cartCount: number;
  onOpenCart: () => void;
}

const NAV = [
  { id: 'home' as const, label: 'Beranda' },
  { id: 'produk' as const, label: 'Katalog' },
  { id: 'edukasi' as const, label: 'Edukasi' },
  { id: 'kontak' as const, label: 'Kontak' },
];

export default function Header({ currentTab, setCurrentTab, cartCount, onOpenCart }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 48);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (tab: Tab) => {
    setCurrentTab(tab);
    setOpen(false);
  };

  // Evaluasi Logika Visual: Transparan hanya di Beranda paling atas
  const isTransparentDark = currentTab === 'home' && !scrolled;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isTransparentDark
          ? 'bg-transparent py-6'
          : 'bg-[#FFFFFF]/95 backdrop-blur-md shadow-sm border-b border-[#F1F5F9] py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        
        {/* Identitas Brand */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 group focus:outline-none cursor-pointer"
        >
          <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <img src="/favicon.png" alt="Logo Seraphine" className="w-full h-full object-contain" />
          </div>
          <div className="text-left">
            <span className={`block font-serif text-[15px] font-bold leading-tight transition-colors duration-200 ${isTransparentDark ? 'text-white drop-shadow-md' : 'text-[#1A1A1A]'}`}>
              Seraphine
            </span>
            <span className={`block text-[9px] font-mono uppercase tracking-[0.2em] leading-tight ${isTransparentDark ? 'text-[#9A1F22]' : 'text-[#7B1618]'}`}>
              Weetebula · NTT
            </span>
          </div>
        </button>

        {/* Navigasi Desktop */}
        <nav className="hidden md:flex items-center gap-2">
          {NAV.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`relative px-4 py-2 text-[13px] font-bold rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'text-[#7B1618] bg-[#7B1618]/10'
                    : isTransparentDark
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : 'text-[#64748B] hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button onClick={() => handleNav('kontak')} className="ml-4 btn-primary">
            Hubungi Kami
          </button>
          
          <button
            onClick={onOpenCart}
            className={`relative ml-2 p-2.5 rounded-xl transition-all hover:scale-105 cursor-pointer ${
              isTransparentDark ? 'text-white hover:bg-white/10' : 'text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#7B1618] text-white text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-4 h-4 shadow border border-[#FFFFFF]">
                {cartCount}
              </span>
            )}
          </button>
        </nav>

        {/* Toggle Mobile & Cart */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onOpenCart}
            className={`relative p-2.5 rounded-xl transition-colors cursor-pointer ${
              isTransparentDark ? 'text-white hover:bg-white/10' : 'text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#7B1618] text-white text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-4 h-4 shadow border border-[#FFFFFF]">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setOpen(!open)}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
              isTransparentDark ? 'text-white hover:bg-white/10' : 'text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
            }`}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Panel Navigasi Mobile */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#FFFFFF] border-b border-[#F1F5F9] px-5 py-4 space-y-2 shadow-xl">
          {NAV.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#7B1618] text-white' 
                    : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1A1A1A]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-[#7B1618]' : 'bg-[#7B1618]/50'}`} />
                {item.label}
              </button>
            );
          })}
          <div className="pt-4 mt-2 border-t border-[#F1F5F9]">
             <button onClick={() => handleNav('kontak')} className="w-full btn-primary py-3">
               Hubungi Kami
             </button>
          </div>
        </div>
      )}
    </header>
  );
}