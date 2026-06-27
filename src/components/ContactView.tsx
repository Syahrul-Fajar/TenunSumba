import React, { useState } from 'react';
import { Mail, Phone, MapPin, Instagram, MessageCircle, Facebook, Send, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { ContactMessage } from '../types';

export default function ContactView() {
  const [formData, setFormData] = useState<ContactMessage>({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setBusy(true);
    setError('');
    try {
      const { dbService } = await import('../lib/supabase');
      await dbService.sendInquiry({
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'Konsultasi Tenun Ikat',
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 8000);
    } catch {
      setError('Terjadi kesalahan. Coba hubungi kami via WhatsApp.');
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 text-sm bg-white border border-[#F1F5F9] rounded-xl focus:outline-none focus:border-[#7B1618] transition-all text-[#1A1A1A] placeholder-[#9E8B7A]';

  return (
    <div id="contact-view" className="animate-fade-in pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="section-label">Saluran Komunikasi</span>
          <h1 className="font-serif font-extrabold text-4xl md:text-5xl text-[#1A1A1A] mt-3 mb-6">
            Hubungi <span className="text-gradient">Balai Tenun</span>
          </h1>
          <p className="text-[#64748B] text-base md:text-lg leading-relaxed">
            Pintu kami selalu terbuka untuk konsultasi motif, pemesanan kustom, kunjungan kultural, maupun kemitraan pelestarian budaya.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* ── Panel Informasi Kontak ── */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card-base p-8">
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-8 border-b border-[#F1F5F9] pb-4">Akses Langsung</h2>
              <div className="space-y-8 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#7B1618]/10 flex items-center justify-center text-[#7B1618] flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#7B1618] mb-1">Pusat Karya</h3>
                    <p className="text-[#64748B] leading-relaxed text-sm md:text-base">
                      Jln. Bulgur No. 12, Langgalero,<br/>Tambolaka, Sumba Barat Daya, NTT
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#7B1618]/10 flex items-center justify-center text-[#7B1618] flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#7B1618] mb-1">Telepon & WhatsApp</h3>
                    <p className="text-[#64748B] text-sm md:text-base font-mono">+62 895-4217-7009</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#7B1618]/10 flex items-center justify-center text-[#7B1618] flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#7B1618] mb-1">Waktu Operasional</h3>
                    <p className="text-[#64748B] text-sm md:text-base leading-relaxed">
                      Senin - Sabtu: 08:00 - 17:00 WITA<br/>
                      <span className="text-[#7B1618] text-xs">Ahad: Menerima kunjungan dengan reservasi</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#F1F5F9] pt-6">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#7B1618] mb-4">Jejaring Media Sosial</h3>
                <div className="flex flex-wrap gap-3">
                  <a href="https://wa.me/6289542177009" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-3 bg-[#25D366]/10 text-[#1DA851] hover:bg-[#25D366]/20 rounded-xl text-sm font-bold transition-colors">
                    <MessageCircle className="w-4 h-4" /> Chat WhatsApp
                  </a>
                  <a href="mailto:balaitenunseraphine@gmail.com" className="flex items-center gap-2 px-5 py-3 bg-[#FFFFFF] text-[#64748B] hover:text-[#1A1A1A] rounded-xl text-sm font-bold border border-[#F1F5F9] transition-colors">
                    <Mail className="w-4 h-4 text-[#7B1618]" /> Kirim Email
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ── Panel Formulir Pesan ── */}
          <div className="lg:col-span-7 card-base overflow-hidden relative">
            {submitted && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="font-serif text-3xl font-bold text-[#1A1A1A] mb-3">Pesan Diterima</h3>
                <p className="text-[#64748B] mb-6">Manifest korespondensi Anda telah terekam ke sistem administrasi kami. Kami akan merespons melalui kontak Anda segera.</p>
                <button onClick={() => setSubmitted(false)} className="btn-ghost">Kirim Pesan Lainnya</button>
              </div>
            )}

            <div className="bg-gradient-to-r from-[#7B1618] to-[#5A0E10] px-8 py-6 text-white">
              <h2 className="font-serif text-2xl font-bold">Kirim Pesan</h2>
              <p className="text-white/80 text-sm mt-1">Isi formulir di bawah ini dan kami akan merespons dalam 1×24 jam</p>
            </div>

            <div className="p-8">
              {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] mb-2">Nama Lengkap *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputCls} placeholder="Contoh: Farsy Suminu" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] mb-2">Alamat Email *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputCls} placeholder="nama@email.com" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] mb-2">Subjek Topik</label>
                  <select name="subject" value={formData.subject} onChange={handleChange} className={inputCls}>
                    <option value="Konsultasi Tenun Ikat">Konsultasi Tenun Ikat</option>
                    <option value="Informasi Pre-Order">Informasi Pre-Order Kain</option>
                    <option value="Kunjungan & Edukasi">Reservasi Kunjungan Edukasi</option>
                    <option value="Lainnya">Lainnya / Pertanyaan Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#64748B] mb-2">Pesan & Pertanyaan *</label>
                  <textarea name="message" required rows={5} value={formData.message} onChange={handleChange} className={`${inputCls} resize-none`} placeholder="Tuliskan detail pertanyaan Anda..." />
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <button type="submit" disabled={busy} className="btn-primary w-full md:w-auto px-8">
                    {busy ? <><Loader2 className="w-5 h-5 animate-spin"/> Mengirim...</> : <><Send className="w-4 h-4" /> Kirim Pesan</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}