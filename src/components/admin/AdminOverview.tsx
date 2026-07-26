import React from 'react';
import { TrendingUp, ShoppingCart, Package, AlertCircle, Database } from 'lucide-react';
import { Product, Order } from '../../types';

interface AdminOverviewProps {
  metrics: any;
  orders: Order[];
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
  normalizeOrderStatus: (status: string | undefined) => string;
  STATUS_PESANAN: any;
  setAdminTab: (tab: string) => void;
  handleUpdateStock: (product: Product, newStock: number) => void;
  StatCard: React.FC<any>;
}

export default function AdminOverview({
  metrics,
  orders,
  formatPrice,
  formatDate,
  normalizeOrderStatus,
  STATUS_PESANAN,
  setAdminTab,
  handleUpdateStock,
  StatCard
}: AdminOverviewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* TIER 1: METRIK BENTO (Highlight Data Finansial) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div>
          <StatCard 
            accent 
            label="Valuasi Stok" 
            value={formatPrice(metrics.totalValuation)} 
            sub="Kapitalisasi aset katalog" 
            icon={<span className="font-mono font-bold text-sm select-none">Rp</span>}
          />
        </div>
        <div>
          <StatCard 
            label="Pendapatan Sukses" 
            value={formatPrice(metrics.completedRevenue)} 
            sub="Dari transaksi selesai" 
            icon={<TrendingUp className="w-5 h-5"/>} 
          />
        </div>
        <div>
          <StatCard 
            label="Pesanan Aktif" 
            value={metrics.activeOrders} 
            sub={`${orders.length} total pesanan`} 
            icon={<ShoppingCart className="w-5 h-5"/>} 
          />
        </div>
        <div>
          <StatCard 
            label="Total Karya" 
            value={metrics.totalProducts} 
            sub="Koleksi katalog aktif" 
            icon={<Package className="w-5 h-5"/>} 
          />
        </div>
      </div>

      {/* TIER 2: PANEL BENTO UTAMA (Operasional) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Panel Restock */}
        <div className="bg-white rounded-[24px] border border-[#F1F5F9] p-6 shadow-sm flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-maroon" /> Peringatan Stok
            </h3>
            <span className="text-[10px] font-bold bg-rose-100 text-maroon px-2.5 py-1 rounded-full">
              {metrics.lowStockProducts.length} Kritis
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {metrics.lowStockProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <Package className="w-10 h-10 opacity-20" />
                <p className="text-xs font-mono uppercase tracking-widest text-center mt-2">Kuantitas Stok<br/>Terjaga Aman</p>
              </div>
            ) : (
              metrics.lowStockProducts.map((p: Product) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-2xl border border-[#F1F5F9] hover:border-maroon/30 transition-colors">
                  <img src={p.image} className="w-12 h-14 object-cover rounded-xl border border-[#F1F5F9] flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-bold text-sm text-stone-900 truncate">{p.title}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.code}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md text-[10px]">
                      Stok: {p.stock ?? 5}
                    </span>
                    <button onClick={() => handleUpdateStock(p, (p.stock ?? 5) + 5)} className="px-2.5 py-1 bg-white border border-[#F1F5F9] hover:bg-emerald-50 hover:border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold transition-all shadow-sm">
                      +5 Unit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Panel Transaksi */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#F1F5F9] p-6 shadow-sm flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-maroon" /> Antrean Pesanan Terbaru
            </h3>
            {orders.length > 0 && (
              <button onClick={() => setAdminTab('orders')} className="text-[10px] font-bold text-maroon hover:text-maroon-dark transition-colors font-mono uppercase tracking-wider bg-maroon/5 hover:bg-maroon/10 px-3 py-1.5 rounded-lg">
                Lihat Semua Pesanan &rarr;
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                <ShoppingCart className="w-12 h-12 opacity-20" />
                <p className="text-xs font-mono uppercase tracking-widest mt-2">Belum ada transaksi terekam</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.slice(0, 6).map(o => {
                  const statusConfig = STATUS_PESANAN[normalizeOrderStatus(o.status)] || STATUS_PESANAN.MENUNGGU_PEMBAYARAN;
                  return (
                    <div key={o.id} className="p-4 rounded-2xl border border-[#F1F5F9] bg-white/30 hover:bg-white hover:shadow-sm transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <span className={`inline-flex text-[9px] font-bold font-mono px-2 py-1 rounded-md border ${statusConfig.cls}`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{formatDate(o.createdAt)}</span>
                      </div>
                      <p className="font-bold text-sm text-stone-900 truncate" title={o.customerName}>{o.customerName}</p>
                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-[#F1F5F9]">
                          <div className="text-[10px] text-[#64748B] font-mono truncate max-w-[180px]">
                            {o.items && o.items.length > 0 ? (
                              <span>
                                {o.items[0].productCode} ({o.items[0].quantity}x)
                                {o.items.length > 1 && ` +${o.items.length - 1} item`}
                              </span>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-maroon">{formatPrice(o.totalPrice)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
