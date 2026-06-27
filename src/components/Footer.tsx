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
    <footer id="app-footer" className="mt-auto border-t border-[#7B1618]/20 bg-[#2D0607] backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Kolom Identitas Brand */}
          <div className="md:col-span-1 space-y-5">
            <button onClick={() => go('home')} className="flex items-center gap-3 group focus:outline-none cursor-pointer">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/favicon.png" alt="Logo Seraphine" className="w-full h-full object-contain" />
              </div>
              <div className="text-left">
                <span className="block font-serif text-base font-bold leading-tight text-white">CD Seraphine</span>
                <span className="block text-[10px] font-mono text-[#9A1F22] uppercase tracking-widest">Tenun Ikat Sumba</span>
              </div>
            </button>
            <p className="text-sm text-[#B5A595] leading-relaxed max-w-xs">
              Melestarikan warisan budaya tenun ikat Sumba sambil memberdayakan perempuan penenun lokal melalui karya otentik berkualitas tinggi.
            </p>
            <div className="flex gap-3 pt-1">
              {[
                { href: '#', icon: <Facebook className="w-4 h-4"/>, label: 'Facebook' },
                { href: '#', icon: <Instagram className="w-4 h-4"/>, label: 'Instagram' },
                { href: 'https://wa.me/6289542177009', icon: <MessageCircle className="w-4 h-4"/>, label: 'WhatsApp' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-[#B5A595] hover:border-[#7B1618] hover:text-[#7B1618] hover:bg-[#7B1618]/10 transition-all shadow-sm">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Kolom Navigasi */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#9E8B7A]">Akses Cepat</h4>
            <ul className="space-y-3">
              {links.map(l => (
                <li key={l.tab}>
                  <button onClick={() => go(l.tab)} className="text-sm text-[#B5A595] hover:text-[#9A1F22] transition-colors flex items-center gap-2 group cursor-pointer">
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-[#9A1F22] transition-colors shadow-[0_0_5px_rgba(224,176,96,0)] group-hover:shadow-[0_0_5px_rgba(224,176,96,0.5)]" />
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom Kontak */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#9E8B7A]">Hubungi Balai</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#7B1618] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#B5A595] leading-relaxed">
                  Jln. Bulgur No. 12, Langgalero,<br/>Tambolaka, Sumba Barat Daya, NTT
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#7B1618] flex-shrink-0" />
                <a href="tel:+6289542177009" className="text-sm text-[#B5A595] hover:text-[#9A1F22] transition-colors font-mono">
                  +62 895-4217-7009
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#7B1618] flex-shrink-0" />
                <a href="mailto:balaitenunseraphine@gmail.com" className="text-sm text-[#B5A595] hover:text-[#9A1F22] transition-colors font-mono break-all">
                  balaitenunseraphine@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Baris Hak Cipta */}
      <div className="border-t border-white/5 py-5 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#9E8B7A] font-mono tracking-wide">
          <p>© {new Date().getFullYear()} CD Seraphine Weetebula. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">Ditenun dengan <span className="text-red-500">❤</span> di Sumba, Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}