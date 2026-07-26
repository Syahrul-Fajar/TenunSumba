import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Article } from '../../types';

interface AdminArticlesProps {
  articles: Article[];
  setEditArt: (art: any) => void;
  setArtErr: (err: string) => void;
  setIsArtFormOpen: (open: boolean) => void;
  formatDate: (dateStr: string) => string;
  handleDeleteArt: (id: string) => void;
}

export default function AdminArticles({
  articles,
  setEditArt,
  setArtErr,
  setIsArtFormOpen,
  formatDate,
  handleDeleteArt
}: AdminArticlesProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
        <p className="text-sm text-stone-700 font-medium">Koleksi Artikel Budaya: <strong className="text-maroon">{articles.length} entri</strong></p>
        <button onClick={() => { setEditArt({ title:'', excerpt:'', content:'', image:'', author:'Admin Seraphine', slug:'' }); setArtErr(''); setIsArtFormOpen(true); }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase rounded-xl shadow flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4"/> Rilis Artikel Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map(art => (
          <div key={art.id} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden hover:shadow-md">
            <img src={art.image} className="w-full h-40 object-cover" alt="" />
            <div className="p-4">
              <p className="font-serif font-bold text-stone-900 text-base leading-tight mb-1">{art.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{art.excerpt}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono font-bold text-[#7B1618] uppercase">{art.author}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{formatDate(art.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => { setEditArt({...art}); setArtErr(''); setIsArtFormOpen(true); }} className="p-1.5 bg-gray-100 rounded-lg hover:text-stone-900 text-gray-600"><Edit className="w-3.5 h-3.5"/></button>
                  <button onClick={() => handleDeleteArt(art.id)} className="p-1.5 bg-gray-100 rounded-lg hover:text-red-600 text-gray-600"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
