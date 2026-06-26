import React, { useState, useEffect } from 'react';
import { BookOpen, User, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { Article } from '../types';
import { dbService } from '../lib/supabase';

export default function EdukasiView() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Article | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllArticles();
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArticles(); }, []);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return isoString; }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center bg-[#FBF8F4]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#EFE6DA] border-t-[#C8973A] rounded-full animate-spin" />
          <p className="text-sm font-mono text-[#7A6558] animate-pulse tracking-widest uppercase">Memuat Manuskrip...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="edukasi-view" className="pt-28 pb-20 animate-fade-in min-h-screen bg-[#FBF8F4]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {!selected && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-[#EFE6DA] text-[#C8973A] mb-6 shadow-sm">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="font-serif font-extrabold text-4xl md:text-5xl text-[#3D1A0A] mb-6">
              Manuskrip <span className="text-gradient">Edukasi Budaya</span>
            </h1>
            <p className="text-[#7A6558] text-lg leading-relaxed">
              Pusat literatur digital untuk menyelami kedalaman filosofi, sejarah, dan makna simbolis di balik setiap helaian benang tenun Sumba.
            </p>
          </div>
        )}

        {selected ? (
          <article className="max-w-4xl mx-auto card-base bg-white overflow-hidden animate-scale-in p-0 border border-[#EFE6DA]">
            <div className="relative aspect-video bg-[#F5EDE3]">
              <button 
                onClick={() => setSelected(null)}
                className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur border border-[#EFE6DA] px-4 py-2.5 rounded-xl text-[#3D1A0A] hover:text-[#7B1618] flex items-center gap-2 text-xs font-bold uppercase cursor-pointer shadow-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#E0B060] font-bold uppercase tracking-widest mb-4">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {selected.author}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(selected.createdAt)}</span>
                </div>
                <h2 className="font-serif text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-md">{selected.title}</h2>
              </div>
            </div>
            
            <div className="p-8 md:p-12 text-[#5A4538] leading-relaxed space-y-6 text-base md:text-lg whitespace-pre-wrap font-sans">
              {selected.content}
            </div>
          </article>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.length === 0 ? (
              <div className="col-span-full card-base py-20 text-center border-dashed border-[#EFE6DA]">
                <BookOpen className="w-12 h-12 mx-auto text-[#C8973A] mb-4 opacity-50" />
                <p className="text-[#7A6558] font-mono text-sm tracking-widest uppercase">Belum ada manuskrip yang dipublikasikan.</p>
              </div>
            ) : (
              articles.map(art => (
                <article 
                  key={art.id} 
                  onClick={() => { setSelected(art); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="card-base group flex flex-col h-full overflow-hidden cursor-pointer p-0 bg-white"
                >
                  <div className="relative aspect-video overflow-hidden bg-[#F5EDE3]">
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col border-t border-[#EFE6DA]">
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#C8973A] font-bold uppercase tracking-widest mb-3">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {art.author}</span>
                      <span className="w-1 h-1 rounded-full bg-[#EFE6DA]" />
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(art.createdAt)}</span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#3D1A0A] leading-snug mb-3 group-hover:text-[#7B1618] transition-colors">
                      {art.title}
                    </h3>

                    <p className="text-sm text-[#7A6558] line-clamp-3 mb-6 flex-1 leading-relaxed">
                      {art.excerpt}
                    </p>

                    <div className="mt-auto pt-4 border-t border-[#EFE6DA]">
                      <span className="text-xs font-bold text-[#7B1618] flex items-center gap-1 group-hover:gap-2 transition-all">
                        Baca Manuskrip <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}