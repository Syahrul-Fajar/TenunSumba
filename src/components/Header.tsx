import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

type Tab = 'home' | 'produk' | 'edukasi' | 'kontak' | 'admin';

interface HeaderProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
}

const NAV = [
  { id: 'home' as const, label: 'Beranda' },
  { id: 'produk' as const, label: 'Katalog' },
  { id: 'edukasi' as const, label: 'Edukasi' },
  { id: 'kontak' as const, label: 'Kontak' },
];

export default function Header({ currentTab, setCurrentTab }: HeaderProps) {
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
          : 'bg-[#FBF8F4]/95 backdrop-blur-md shadow-sm border-b border-[#EFE6DA] py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        
        {/* Identitas Brand */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-3 group focus:outline-none cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 bg-gradient-to-br from-[#7B1618] to-[#5A0E10]">
            <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
              <path d="M20 5 L35 20 L20 35 L5 20 Z" stroke="#C8973A" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M20 12 L28 20 L20 28 L12 20 Z" fill="#C8973A" fillOpacity="0.4"/>
              <circle cx="20" cy="20" r="2.5" fill="#E0B060"/>
            </svg>
          </div>
          <div className="text-left">
            <span className={`block font-serif text-[15px] font-bold leading-tight transition-colors duration-200 ${isTransparentDark ? 'text-white drop-shadow-md' : 'text-[#3D1A0A]'}`}>
              CD Seraphine
            </span>
            <span className={`block text-[9px] font-mono uppercase tracking-[0.2em] leading-tight ${isTransparentDark ? 'text-[#E0B060]' : 'text-[#C8973A]'}`}>
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
                      : 'text-[#7A6558] hover:text-[#3D1A0A] hover:bg-[#3D1A0A]/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button onClick={() => handleNav('kontak')} className="ml-4 btn-primary">
            Hubungi Kami
          </button>
        </nav>

        {/* Toggle Mobile */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden p-2.5 rounded-xl transition-colors cursor-pointer ${
            isTransparentDark ? 'text-white hover:bg-white/10' : 'text-[#3D1A0A] hover:bg-[#3D1A0A]/5'
          }`}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Panel Navigasi Mobile */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#FBF8F4] border-b border-[#EFE6DA] px-5 py-4 space-y-2 shadow-xl">
          {NAV.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#7B1618] text-white' 
                    : 'text-[#7A6558] hover:bg-[#EFE6DA] hover:text-[#3D1A0A]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-[#C8973A]' : 'bg-[#C8973A]/50'}`} />
                {item.label}
              </button>
            );
          })}
          <div className="pt-4 mt-2 border-t border-[#EFE6DA]">
             <button onClick={() => handleNav('kontak')} className="w-full btn-primary py-3">
               Hubungi Kami
             </button>
          </div>
        </div>
      )}
    </header>
  );
}