import React, { useState, useMemo } from 'react';
import { Phone, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Order, DetailPesanan } from '../../types';
import { dbService } from '../../lib/supabase';

interface AdminOrdersProps {
  orders: Order[];
  STATUS_PESANAN: any;
  normalizeOrderStatus: (status: string | undefined) => string;
  handleUpdateOrderStatus: (id: string, newStatus: string) => void;
  expandedOrderId: string | null;
  toggleOrderDetail: (id: string) => void;
  orderDetails: DetailPesanan[];
  setOrderDetails: React.Dispatch<React.SetStateAction<DetailPesanan[]>>;
  openConfirm: (title: string, message: string, onConfirm: () => void) => void;
  handleDeleteOrder: (id: string) => void;
  formatPrice: (price: number | undefined) => string;
  formatDateTime: (dateStr: string) => string;
}

export default function AdminOrders({
  orders,
  STATUS_PESANAN,
  normalizeOrderStatus,
  handleUpdateOrderStatus,
  expandedOrderId,
  toggleOrderDetail,
  orderDetails,
  setOrderDetails,
  openConfirm,
  handleDeleteOrder,
  formatPrice,
  formatDateTime
}: AdminOrdersProps) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterStatus !== 'all') {
      result = result.filter(o => normalizeOrderStatus(o.status) === filterStatus);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(o => 
        (o.customerName && o.customerName.toLowerCase().includes(lower)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(lower)) ||
        (o.id && o.id.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [orders, filterStatus, searchTerm]);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#F1F5F9] shadow-sm">
        <div className="flex gap-2 w-full md:w-auto">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-[#F8FAFC] border border-[#F1F5F9] rounded-lg text-xs font-bold text-stone-700 outline-none w-full md:w-auto focus:border-maroon/30 transition-colors">
            <option value="all">Semua Status</option>
            {Object.entries(STATUS_PESANAN).map(([v,st]: [string, any]) => <option key={v} value={v}>{st.label}</option>)}
          </select>
          <input type="text" placeholder="Cari ID/Nama/Email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-2 bg-[#F8FAFC] border border-[#F1F5F9] rounded-lg text-xs w-full md:w-64 outline-none focus:border-maroon/30 transition-colors" />
        </div>
        <p className="text-xs text-gray-400 font-mono">Menampilkan {filteredOrders.length} dari {orders.length} pesanan</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-white text-[10px] font-mono font-bold uppercase tracking-wider text-stone-700 border-b border-[#F1F5F9]">
                <th className="p-4 w-48">Pelanggan</th>
                <th className="p-4">Item Pembelian</th>
                <th className="p-4 w-32">Total Transaksi</th>
                <th className="p-4 w-36">Waktu Masuk</th>
                <th className="p-4 w-40">Status Pesanan</th>
                <th className="p-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark/40">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">Tidak ada transaksi yang cocok.</td></tr>
              ) : (
                filteredOrders.map(o => {
                  const statusConfig = STATUS_PESANAN[o.status] || STATUS_PESANAN.menunggu;
                  return (
                    <React.Fragment key={o.id}>
                    <tr className="hover:bg-white/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-sm text-stone-900">{o.customerName}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{o.customerEmail}</p>
                        <a href={`https://wa.me/${o.customerPhone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-700 hover:underline font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5"/>{o.customerPhone}
                        </a>
                      </td>
                      <td className="p-4">
                        {o.items && o.items.map((item, idx) => (
                          <div key={idx} className="mb-2 last:mb-0 border-b border-[#F1F5F9]/20 pb-1.5 last:pb-0 last:border-b-0">
                            <p className="font-serif font-bold text-sm text-stone-900">{item.productTitle}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{item.productCode} • {item.quantity} pcs</p>
                          </div>
                        ))}
                      </td>
                      <td className="p-4 font-mono font-bold text-maroon text-sm">{formatPrice(o.totalPrice)}</td>
                      <td className="p-4 text-[11px] text-gray-400 font-mono">{formatDateTime(o.createdAt)}</td>
                      <td className="p-4">
                        <select value={normalizeOrderStatus(o.status)} onChange={e => handleUpdateOrderStatus(o.id, e.target.value)} className={`w-full px-2 py-1.5 text-xs font-bold rounded-lg border focus:outline-none cursor-pointer ${statusConfig.cls}`}>
                          {Object.entries(STATUS_PESANAN).map(([v,st]: [string, any]) => <option key={v} value={v}>{st.label}</option>)}
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => toggleOrderDetail(o.id)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg" title="Detail Item">
                            {expandedOrderId === o.id ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                          </button>
                          <button onClick={() => handleDeleteOrder(o.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === o.id && (
                      <tr><td colSpan={6} className="bg-[#F8FAFC] px-6 py-4">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">Detail Item Pesanan</p>
                        {orderDetails.length === 0 ? <p className="text-xs text-gray-400">Memuat...</p> : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="text-[10px] font-mono font-bold uppercase text-gray-400 border-b border-gray-200">
                                <th className="py-2 pr-4">Produk</th>
                                <th className="py-2 pr-4 w-20">Jumlah</th>
                                <th className="py-2 pr-4 w-28">Harga Satuan</th>
                                <th className="py-2 w-16">Custom</th>
                                <th className="py-2 w-16 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {orderDetails.map(d => (
                              <tr key={d.id_detail}>
                                <td className="py-2 pr-4 text-xs font-semibold">{d.nama_produk || `#${d.id_produk}`}</td>
                                <td className="py-2 pr-4 text-xs">{d.jumlah}</td>
                                <td className="py-2 pr-4 text-xs font-mono">{formatPrice(d.harga_satuan)}</td>
                                <td className="py-2 text-xs">{d.is_custom ? <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">Ya</span> : '—'}</td>
                                <td className="py-2 text-right">
                                  <button onClick={() => openConfirm('Hapus Item', 'Hapus item ini dari pesanan?', async () => { 
                                    await dbService.deleteDetailPesanan(d.id_detail); 
                                    setOrderDetails((prev: any) => prev.filter((x: any) => x.id_detail !== d.id_detail)); 
                                  })} className="p-1 hover:bg-red-50 rounded">
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            </tbody>
                          </table>
                        )}
                      </td></tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
