import React from 'react';
import { Phone, Mail, Globe, MapPin, Instagram, Youtube, Facebook } from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: 'home' | 'produk' | 'kontak' | 'admin') => void;
}

export default function Footer({ setCurrentTab }: FooterProps) {
  return (
    <footer id="app-footer" className="bg-[#7A1010] text-[#FFF0F0] pt-16 pb-8 border-t-4 border-brand-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 bg-no-repeat bg-right-bottom pb-16">
          
          {/* Brand/About Column */}
          <div className="flex flex-col space-y-5">
            <button
              onClick={() => { setCurrentTab('home'); window.scrollTo({ top:0, behavior: 'smooth' }); }}
              className="flex items-center gap-3 text-left focus:outline-none group self-start"
            >
              <div className="w-12 h-12 bg-[#FFF0F0] rounded-md flex items-center justify-center text-[#7A1010] p-2 shadow-md">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                  <path d="M50,5 L95,50 L50,95 L5,50 Z" stroke="currentColor" strokeWidth="5" fill="none" />
                  <path d="M50,15 L85,50 L50,85 L15,50 Z" stroke="currentColor" strokeWidth="4" fill="none" />
                  <rect x="42" y="42" width="16" height="16" transform="rotate(45 50 50)" />
                  <line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="4" />
                  <line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" strokeWidth="4" />
                </svg>
              </div>
              <div>
                <h4 className="font-serif text-xl font-bold tracking-tight text-white">
                  CD Seraphine Weetebula
                </h4>
                <p className="text-xs font-mono tracking-widest text-brand-gold uppercase">
                  Warisan Tenun Sumba
                </p>
              </div>
            </button>
            <p className="text-sm text-[#E8CBCB] leading-relaxed max-w-sm">
              Kami melestarikan warisan tenun ikat Sumba warisan leluhur dengan memberdayakan komunitas perempuan lokal melalui karya seni bertenaga tinggi, berkelanjutan, dan bermartabat tinggi.
            </p>
            
            {/* Social Media Row */}
            <div className="pt-2">
              <span className="block text-xs uppercase tracking-wider text-brand-gold font-bold mb-3">Sosial Media</span>
              <div className="flex space-x-3">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#7A1212] border border-[#8E1A1A] hover:bg-brand-gold hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#7A1212] border border-[#8E1A1A] hover:bg-brand-gold hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#7A1212] border border-[#8E1A1A] hover:bg-brand-gold hover:text-white transition-colors"
                  aria-label="Youtube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Contact Info */}
          <div className="flex flex-col space-y-5">
            <h4 className="font-serif text-lg font-semibold text-white tracking-wide border-b border-[#8E1A1A] pb-2">
              Kontak Kami
            </h4>
            <ul className="space-y-4 text-sm text-[#E8CBCB]">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0" />
                <span>
                  Jln. Bulgur, No. 12, Langgalero, Tamboloka, Sumba Barat Daya (SBD), Nusa Tenggara Timur (NTT), Indonesia
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-gold flex-shrink-0" />
                <a href="tel:+6289542177309" className="hover:text-brand-gold transition-colors">
                  +62 895-4217-7309
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-gold flex-shrink-0" />
                <a href="mailto:balaitenunseraphine@gmail.com" className="hover:text-brand-gold transition-colors">
                  balaitenunseraphine@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-brand-gold flex-shrink-0" />
                <span>www.cseraphine.com</span>
              </li>
            </ul>
          </div>

          {/* Opening and Empowerment Mission */}
          <div className="flex flex-col space-y-5">
            <h4 className="font-serif text-lg font-semibold text-white tracking-wide border-b border-[#8E1A1A] pb-2">
              Jam Operasional & Kunjungan
            </h4>
            <p className="text-sm text-[#E8CBCB] leading-relaxed">
              Balai Tenun dibuka untuk kunjungan belajar, lokakarya memilin benang, dan pewarnaan alami.
            </p>
            <div className="bg-[#7A1414] p-4 rounded border border-[#6E1414]">
              <div className="flex justify-between text-xs font-mono text-brand-gold uppercase font-bold mb-1">
                <span>Senin - Sabtu</span>
                <span>08:00 - 17:00 WITA</span>
              </div>
              <p className="text-xs text-[#D9B8B8]">
                Kunjungan rombongan harap melakukan konfirmasi minimal 2 hari sebelumnya melalui Kontak kami.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright stripe */}
        <div className="pt-8 mt-8 border-t border-[#8E1A1A] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans text-[#C9A0A0]">
          <p>© 2026 Balai Tenun CD Seraphine Weetebula. Hak Cipta Dilindungi.</p>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-end">
            <button onClick={() => { setCurrentTab('home'); window.scrollTo({ top:0 }); }} className="hover:text-[#F3ECE4] cursor-pointer">Beranda</button>
            <button onClick={() => { setCurrentTab('produk'); window.scrollTo({ top:0 }); }} className="hover:text-[#F3ECE4] cursor-pointer">Katalog Produk</button>
            <button onClick={() => { setCurrentTab('kontak'); window.scrollTo({ top:0 }); }} className="hover:text-[#F3ECE4] cursor-pointer">Kontak & Alamat</button>
          </div>
        </div>

      </div>
    </footer>
  );
}
