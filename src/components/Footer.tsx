import React from 'react';
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react';

type Tab = 'home' | 'produk' | 'edukasi' | 'kontak' | 'admin';

interface FooterProps {
  setCurrentTab: (tab: Tab) => void;
}

export default function Footer({ setCurrentTab }: FooterProps) {
  const go = (tab: Tab) => { 
    setCurrentTab(tab); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const links = [
    { label: 'Beranda',  tab: 'home'    as Tab },
    { label: 'Produk',   tab: 'produk'  as Tab },
    { label: 'Edukasi',  tab: 'edukasi' as Tab },
    { label: 'Kontak',   tab: 'kontak'  as Tab },
  ];

  return (
    <footer id="app-footer" className="mt-auto border-t border-white/10 bg-black/40 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Kolom Identitas Brand */}
          <div className="md:col-span-1 space-y-5">
            <button onClick={() => go('home')} className="flex items-center gap-3 group focus:outline-none cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B1618] to-[#5A0E10] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(123,22,24,0.3)]">
                <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
                  <path d="M20 4 L36 20 L20 36 L4 20 Z" stroke="#C8973A" strokeWidth="2.5" />
                  <path d="M20 10 L30 20 L20 30 L10 20 Z" fill="#C8973A" fillOpacity="0.3"/>
                  <circle cx="20" cy="20" r="3" fill="#C8973A"/>
                </svg>
              </div>
              <div className="text-left">
                <span className="block font-serif text-base font-bold leading-tight text-white">CD Seraphine</span>
                <span className="block text-[10px] font-mono text-[#E0B060] uppercase tracking-widest">Tenun Ikat Sumba</span>
              </div>
            </button>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Melestarikan warisan budaya tenun ikat Sumba sambil memberdayakan perempuan penenun lokal melalui karya otentik berkualitas tinggi.
            </p>
            <div className="flex gap-3 pt-1">
              {[
                { href: '#', icon: <Facebook className="w-4 h-4"/>, label: 'Facebook' },
                { href: '#', icon: <Instagram className="w-4 h-4"/>, label: 'Instagram' },
                { href: 'https://wa.me/6289542177009', icon: <MessageCircle className="w-4 h-4"/>, label: 'WhatsApp' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-gray-400 hover:border-[#C8973A] hover:text-[#C8973A] hover:bg-[#C8973A]/10 transition-all shadow-sm">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Kolom Navigasi */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-500">Akses Cepat</h4>
            <ul className="space-y-3">
              {links.map(l => (
                <li key={l.tab}>
                  <button onClick={() => go(l.tab)} className="text-sm text-gray-400 hover:text-[#E0B060] transition-colors flex items-center gap-2 group cursor-pointer">
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#E0B060] transition-colors shadow-[0_0_5px_rgba(224,176,96,0)] group-hover:shadow-[0_0_5px_rgba(224,176,96,0.5)]" />
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom Kontak */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-500">Hubungi Balai</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C8973A] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400 leading-relaxed">
                  Jln. Bulgur No. 12, Langgalero,<br/>Tambolaka, Sumba Barat Daya, NTT
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C8973A] flex-shrink-0" />
                <a href="tel:+6289542177009" className="text-sm text-gray-400 hover:text-[#E0B060] transition-colors font-mono">
                  +62 895-4217-7009
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C8973A] flex-shrink-0" />
                <a href="mailto:balaitenunseraphine@gmail.com" className="text-sm text-gray-400 hover:text-[#E0B060] transition-colors font-mono break-all">
                  balaitenunseraphine@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Baris Hak Cipta */}
      <div className="border-t border-white/5 py-5 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-mono tracking-wide">
          <p>© {new Date().getFullYear()} CD Seraphine Weetebula. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">Ditenun dengan <span className="text-red-500">❤</span> di Sumba, Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}