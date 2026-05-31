import React from 'react';
import { Menu, X, CheckSquare } from 'lucide-react';

interface HeaderProps {
  currentTab: 'home' | 'produk' | 'kontak' | 'admin';
  setCurrentTab: (tab: 'home' | 'produk' | 'kontak' | 'admin') => void;
}

export default function Header({ currentTab, setCurrentTab }: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'produk', label: 'Produk' },
    { id: 'kontak', label: 'Kontak' },
  ] as const;

  return (
    <header 
      id="app-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-md py-3' 
          : 'bg-white py-4 border-b border-brand-cream-dark'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand */}
          <button 
            id="brand-logo-btn"
            onClick={() => { setCurrentTab('home'); window.scrollTo(0, 0); }}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            {/* Elegant Golden Traditional Sumba Weaving Pattern Symbol */}
            <div className="w-10 h-10 flex-shrink-0 bg-brand-brown-dark rounded-md flex items-center justify-center text-brand-gold p-1.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                {/* Traditional geometric pattern */}
                <path d="M50,5 L95,50 L50,95 L5,50 Z" stroke="currentColor" strokeWidth="4" fill="none" />
                <path d="M50,15 L85,50 L50,85 L15,50 Z" stroke="currentColor" strokeWidth="3" fill="none" />
                <rect x="42" y="42" width="16" height="16" transform="rotate(45 50 50)" />
                <line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="3" />
                <line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" strokeWidth="3" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-tight text-brand-brown-dark leading-tight">
                CD Seraphine
              </h1>
              <p className="text-xs font-sans tracking-widest text-brand-brown uppercase -mt-0.5">
                Weetebula
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}-desktop`}
                onClick={() => {
                  setCurrentTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`relative py-2 font-sans text-sm font-medium tracking-wide uppercase transition-colors duration-200 ${
                  currentTab === item.id 
                    ? 'text-brand-brown' 
                    : 'text-gray-600 hover:text-brand-brown-light'
                }`}
              >
                {item.label}
                {currentTab === item.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden">
            <button
              id="mobile-menu-btn"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-brand-brown-dark hover:text-brand-brown hover:bg-brand-cream rounded-md transition duration-150"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div id="mobile-menu-panel" className="md:hidden bg-white border-b border-brand-cream-dark shadow-inner">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}-mobile`}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`block w-full text-left px-4 py-3 rounded-md text-base font-medium uppercase tracking-wide transition-colors ${
                  currentTab === item.id
                    ? 'bg-brand-cream text-brand-brown border-l-4 border-brand-gold'
                    : 'text-gray-650 hover:bg-brand-cream/50 hover:text-brand-brown'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
