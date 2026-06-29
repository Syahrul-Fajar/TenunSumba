import React from 'react';
import { Mail, Phone, MapPin, MessageCircle, Clock, CheckCircle2, Heart, Sparkles } from 'lucide-react';

export default function ContactView() {
  return (
    <div id="contact-view" className="animate-fade-in pt-24 pb-20 min-h-screen bg-[#FAF7F3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-label">Saluran Komunikasi</span>
          <h1 className="font-serif font-extrabold text-4xl md:text-5xl text-[#1C0808] mt-3 mb-6">
            Hubungi <span className="text-gradient">Balai Tenun</span>
          </h1>
          <p className="text-[#5A4538] text-base md:text-lg leading-relaxed">
            Pintu kami selalu terbuka untuk konsultasi motif, pemesanan kustom, kunjungan kultural, maupun kemitraan pelestarian budaya.
          </p>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* Left Panel: Contact Information */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-[#EFE6DA] rounded-3xl p-8 shadow-sm">
              <h2 className="font-serif text-2xl font-bold text-[#1C0808] mb-8 border-b border-[#EFE6DA] pb-4">Akses Langsung</h2>
              <div className="space-y-8">
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7B1618]/10 flex items-center justify-center text-[#7B1618] flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8973A] mb-1">Pusat Karya</h3>
                    <p className="text-[#5A4538] leading-relaxed text-sm md:text-base">
                      Jln. Bulgur No. 12, Langgalero,<br/>Tambolaka, Sumba Barat Daya, NTT
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7B1618]/10 flex items-center justify-center text-[#7B1618] flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8973A] mb-1">Telepon & WhatsApp</h3>
                    <p className="text-[#5A4538] text-sm md:text-base font-mono">+62 895-4217-7309</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7B1618]/10 flex items-center justify-center text-[#7B1618] flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#C8973A] mb-1">Waktu Operasional</h3>
                    <p className="text-[#5A4538] text-sm md:text-base leading-relaxed">
                      Senin - Sabtu: 08:00 - 17:00 WITA<br/>
                      <span className="text-[#7B1618] font-bold text-xs">Ahad: Menerima kunjungan dengan reservasi</span>
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Quick Consult */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-[#EFE6DA] rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="bg-gradient-to-br from-[#7B1618] to-[#5A0E10] px-8 py-8 text-white">
                <h2 className="font-serif text-2xl font-bold mb-2">Konsultasi Langsung</h2>
                <p className="text-[#FBF8F4]/80 text-sm">Diskusikan pesanan kustom, pre-order kain motif adat, atau rencana kunjungan Anda secara instan bersama tim kami.</p>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between gap-6">
                
                {/* Benefits / Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#C8973A] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#5A4538] leading-relaxed"><strong>Respons Cepat WhatsApp:</strong> Hubungi admin kami untuk respon instan dalam waktu kurang dari 30 menit.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#C8973A] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#5A4538] leading-relaxed"><strong>Pesanan Kustom & Ukuran:</strong> Sesuaikan warna alam, dimensi kain, atau mintalah pengerjaan oleh penenun favorit Anda.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-[#C8973A] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#5A4538] leading-relaxed"><strong>Pemberdayaan Sosial:</strong> 100% dari transaksi pesanan kustom Anda disalurkan langsung kepada kelompok ibu-ibu penenun.</p>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#EFE6DA]">
                  <a 
                    href="https://wa.me/6289542177309" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold rounded-2xl shadow-md transition-all duration-200"
                  >
                    <MessageCircle className="w-5 h-5" /> Chat via WhatsApp
                  </a>
                  <a 
                    href="mailto:balaitenunseraphine@gmail.com" 
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 bg-[#7B1618] hover:bg-[#5A0E10] text-white text-sm font-bold rounded-2xl shadow-md transition-all duration-200"
                  >
                    <Mail className="w-5 h-5" /> Hubungi via Email
                  </a>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}