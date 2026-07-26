import React, { useState } from 'react';
import { Plus, Star, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, CustomSize } from '../../types';

interface AdminProductsProps {
  products: Product[];
  sizesList: CustomSize[];
  setEditSizes: (sizes: string[]) => void;
  setEditProd: (prod: any) => void;
  setFormErr: (err: string) => void;
  setIsFormOpen: (open: boolean) => void;
  handleDeleteProd: (id: string) => void;
  formatPrice: (price: number | undefined) => string;
}

export default function AdminProducts({
  products,
  sizesList,
  setEditSizes,
  setEditProd,
  setFormErr,
  setIsFormOpen,
  handleDeleteProd,
  formatPrice
}: AdminProductsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const currentProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
        <p className="text-sm text-stone-700 font-medium">Registrasi Entri Katalog: <span className="font-bold text-maroon">{products.length} produk</span></p>
        <button onClick={() => { 
          setEditSizes([]); 
          setEditProd({ title:'', category:'Kain Tenun', price: undefined, image:'', description:'', isFeatured:false, code:'TIS-NEW'+Math.floor(Math.random()*900+100), weaver:'Mama Penenun', stock: 1 }); 
          setFormErr(''); 
          setIsFormOpen(true); 
        }} className="px-4 py-2 bg-maroon hover:bg-maroon-dark text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Tambah Entri Kain
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                <th className="p-4 text-center w-24">Visual</th>
                <th className="p-4">Karya Tenun</th>
                <th className="p-4 w-28">Kategori</th>
                <th className="p-4 w-32">Harga Satuan</th>
                <th className="p-4 w-20 text-center">Stok</th>
                <th className="p-4 w-28">Kode SKU</th>
                <th className="p-4 w-32">Penenun</th>
                <th className="p-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark/40">
              {products.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-gray-400 text-sm">Arsip kosong. Sila entri kain pertama.</td></tr>
              ) : currentProducts.map(p => (
                <tr key={p.id} className="hover:bg-white/30 transition-colors">
                  <td className="p-4">
                    <div className="w-14 h-18 mx-auto rounded-lg overflow-hidden border border-[#F1F5F9] bg-stone-50">
                      <img src={p.image} loading="lazy" className="w-full h-full object-cover" alt="" />
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-serif font-bold text-stone-900 text-sm leading-tight">{p.title}</p>
                    {p.isFeatured && <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded mt-1"><Star className="w-2.5 h-2.5"/>Featured</span>}
                  </td>
                  <td className="p-4"><span className="px-2 py-0.5 text-[10px] font-mono font-bold text-maroon bg-rose-50 border border-rose-200 rounded">{p.category}</span></td>
                  <td className="p-4 font-bold text-maroon text-sm">{formatPrice(p.price)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-lg font-mono font-bold text-xs ${p.stock === 0 ? 'bg-red-100 text-red-800' : (p.stock ?? 5) <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{p.stock ?? 5}</span>
                  </td>
                  <td className="p-4 font-mono font-bold text-gray-500 text-xs">{p.code}</td>
                  <td className="p-4 text-stone-700 text-xs truncate max-w-[110px]">{p.weaver}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { 
                        setEditSizes(sizesList.filter(s => s.id_produk === Number(p.id)).map(s => s.ukuran)); 
                        setEditProd({...p}); 
                        setFormErr(''); 
                        setIsFormOpen(true); 
                      }} className="p-1.5 bg-gray-100 text-gray-600 hover:text-stone-900 rounded-lg"><Edit className="w-3.5 h-3.5"/></button>
                      <button onClick={() => handleDeleteProd(p.id)} className="p-1.5 bg-gray-100 text-gray-600 hover:text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#F1F5F9] bg-stone-50 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-[#F1F5F9] text-gray-600 hover:text-maroon disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-[#F1F5F9] text-gray-600 hover:text-maroon disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
