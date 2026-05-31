import React from 'react';
import { Mail, Phone, MapPin, Instagram, MessageCircle, Facebook, Send, CheckCircle, Navigation, Map, Layers } from 'lucide-react';
import { ContactMessage } from '../types';

export default function ContactView() {
  const [formData, setFormData] = React.useState<ContactMessage>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [mapType, setMapType] = React.useState<'terrain' | 'satellite'>('terrain');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setBusy(true);
    try {
      const { dbService } = await import('../lib/supabase');
      await dbService.sendInquiry({
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'Konsultasi Tenun Ikat',
        message: formData.message
      });
      setBusy(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Auto-clear message notification after 5 seconds
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      console.error('Failed to submit contact inquiry:', err);
      setBusy(false);
    }
  };

  return (
    <div id="contact-view" className="animate-fade-in mt-16">
      
      {/* 1. CONTACT HERO BANNER */}
      <section 
        id="contact-hero" 
        className="relative h-[45vh] min-h-[300px] flex items-center justify-center bg-stone-900 overflow-hidden"
      >
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=1400&q=80" 
            alt="Handmade weaving loom wooden strings" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-50 object-bottom"
          />
          <div className="absolute inset-0 bg-[#6A0F0F]/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5]/90 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-xl mx-auto px-4 mt-6">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-2 dropdown-shadow">
            Hubungi Kami
          </h2>
          <p className="text-sm sm:text-md text-[#F4ECE3] tracking-wide font-sans font-medium">
            Jalin Silaturahmi dengan Komunitas Perajin Sumba Barat Daya
          </p>
        </div>
      </section>

      {/* 2. FORM & INFO CARDS WRAPPER */}
      <section className="py-16 sm:py-24 bg-[#FCFAF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* LEFT COLUMN: INTERACTIVE FORM CARD */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-2xl p-6 sm:p-10 border border-brand-cream-dark shadow-sm">
              
              <h3 className="font-serif text-2xl font-bold text-brand-brown-dark mb-2">
                Kirimkan Pesan
              </h3>
              <p className="text-sm text-gray-500 mb-8">
                Isi formulir di bawah ini untuk berkonsultasi mengenai pemesanan khusus, kemitraan, atau kunjungan lokakarya tenun.
              </p>

              {submitted && (
                <div className="mb-6 p-4 bg-emerald-55 border border-emerald-200 text-emerald-850 rounded-lg flex items-start gap-3 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-sm">Pesan Berhasil Terkirim</h5>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Terima kasih sudah menghubungi Balai Tenun CD Seraphine. Pesan Anda telah kami terima dan akan segera dibalas oleh tim kami via email atau telepon.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label htmlFor="name-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8A7F73] mb-1.5">
                    Nama Lengkap
                  </label>
                  <input 
                    type="text" 
                    id="name-input"
                    name="name" 
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Masukkan nama Anda"
                    className="w-full px-4 py-3 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-gray-800 transition-all placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8A7F73] mb-1.5">
                    Alamat Email
                  </label>
                  <input 
                    type="email" 
                    id="email-input"
                    name="email" 
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="emailanda@example.com"
                    className="w-full px-4 py-3 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-gray-800 transition-all placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label htmlFor="subject-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8A7F73] mb-1.5">
                    Subjek Keperluan
                  </label>
                  <input 
                    type="text" 
                    id="subject-input"
                    name="subject" 
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Pemesanan Pre-order Kain / Kerjasama"
                    className="w-full px-4 py-3 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-gray-800 transition-all placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label htmlFor="message-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#8A7F73] mb-1.5">
                    Isi Pesan Anda
                  </label>
                  <textarea 
                    id="message-input"
                    name="message" 
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tuliskan detail pesan Anda di sini..."
                    className="w-full px-4 py-3 text-sm bg-white border border-brand-cream-dark rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-gold focus:border-brand-gold text-gray-800 transition-all placeholder:text-gray-300 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-brand-brown hover:bg-brand-brown-dark text-white font-sans text-xs font-bold tracking-widest uppercase rounded-lg shadow transition-all duration-200 disabled:opacity-50"
                >
                  {busy ? (
                    <span>Mengirimkan...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Pesan</span>
                    </>
                  )}
                </button>

              </form>

            </div>

            {/* RIGHT COLUMN: CONTACT CHANNELS & INTERACTIVE SUMBA MAP */}
            <div className="col-span-1 lg:col-span-6 space-y-8 flex flex-col justify-between">
              
              {/* Contact Info Items Row */}
              <div className="space-y-6">
                
                {/* Alamat */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[#B01818] shadow-sm border border-brand-cream-dark flex-shrink-0">
                    <MapPin className="w-5 h-5 hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-serif text-[17px] font-bold text-brand-brown-dark mb-0.5">Alamat Balai Tenun</h4>
                    <p className="text-sm text-gray-600 leading-relaxed max-w-md">
                      Jln. Bulgur, No. 12, Kel. Langgalero, Kec. Kota Tamboloka, Kab. Sumba Barat Daya (SBD), Nusa Tenggara Timur (NTT), Indonesia
                    </p>
                  </div>
                </div>

                {/* Telepon */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[#B01818] shadow-sm border border-brand-cream-dark flex-shrink-0">
                    <Phone className="w-5 h-5 hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-serif text-[17px] font-bold text-brand-brown-dark mb-0.5">Nomor Handphone / WhatsApp</h4>
                    <p className="text-sm text-gray-600 font-mono">
                      +62 895-4217-7309
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[#B01818] shadow-sm border border-brand-cream-dark flex-shrink-0">
                    <Mail className="w-5 h-5 hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h4 className="font-serif text-[17px] font-bold text-brand-brown-dark mb-0.5">Alamat Surat Elektronik</h4>
                    <p className="text-sm text-blue-800 font-medium">
                      balaitenunseraphine@gmail.com
                    </p>
                  </div>
                </div>

              </div>

              {/* Large social media direct container box (Screenshot 3 brown container with Instagram, WhatsApp, Facebook logos) */}
              <div className="p-6 bg-[#B01818] rounded-2xl border border-brand-gold/45 text-white shadow-md flex items-center justify-between">
                <div>
                  <h5 className="font-serif text-lg font-bold leading-tight">Hubungan Sosial Media</h5>
                  <p className="text-xs text-brand-cream-dark mt-0.5 leading-normal max-w-xs">
                    Sapa dan pantau dokumentasi harian mama perajin melalui saluran eksternal kami.
                  </p>
                </div>
                <div className="flex gap-3">
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-[#B01818] hover:bg-brand-gold hover:text-white transition-all scale-100 hover:scale-105"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a 
                    href="https://wa.me/6289542177309" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-[#B01818] hover:bg-brand-gold hover:text-white transition-all scale-100 hover:scale-105"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </a>
                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-[#B01818] hover:bg-brand-gold hover:text-white transition-all scale-100 hover:scale-105"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-6 h-6" />
                  </a>
                </div>
              </div>

              {/* HIGH FIDELITY INTERACTIVE SUMBA NT MAP EMBED/REPLICON */}
              <div className="border border-brand-cream-dark rounded-2xl overflow-hidden shadow-md bg-stone-100">
                <div className="p-3 bg-white border-b border-brand-cream-dark flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#B01818] fill-current" />
                    <div>
                      <h6 className="font-bold text-gray-800 -mb-0.5">Tamboloka, Sumba, NTT</h6>
                      <span className="text-[10px] text-gray-400">Jln. Bulgur, No. 12</span>
                    </div>
                  </div>
                  
                  {/* Interactive Map/Satellite Mode Selector */}
                  <div className="flex rounded-md border border-gray-200 overflow-hidden bg-gray-50 p-0.5">
                    <button 
                      onClick={() => setMapType('terrain')}
                      className={`px-2 py-1 text-[10px] rounded transition-colors ${mapType === 'terrain' ? 'bg-[#B01818] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Kars
                    </button>
                    <button 
                      onClick={() => setMapType('satellite')}
                      className={`px-2 py-1 text-[10px] rounded transition-colors ${mapType === 'satellite' ? 'bg-[#B01818] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Satelit
                    </button>
                  </div>
                </div>

                {/* Simulated Maps Canvas with Land, Roads, Sea and dynamic Pin */}
                <div className="h-60 relative overflow-hidden select-none">
                  {mapType === 'terrain' ? (
                    // Terrain Vector-like View
                    <div className="absolute inset-0 bg-emerald-50/70 p-4 transition-all duration-300">
                      
                      {/* Sea Water (Upper North Pesisir) */}
                      <div className="absolute top-0 inset-x-0 h-16 bg-sky-150 border-b-2 border-dashed border-sky-300 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-sky-800 tracking-wider">LAUT FLORES</span>
                      </div>

                      {/* Main road lines intersecting */}
                      <svg className="absolute inset-0 w-full h-full text-stone-200 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 0,110 Q 150,80 200,140 T 400,160" stroke="#FCE8B2" strokeWidth="8" fill="none" />
                        <path d="M 0,110 Q 150,80 200,140 T 400,160" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" />
                        
                        <path d="M 180,0 Q 200,100 220,240" stroke="#FCE8B2" strokeWidth="6" fill="none" />
                        <path d="M 180,0 Q 200,100 220,240" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
                      </svg>

                      {/* Landmark labels matching the screenshot */}
                      <div className="absolute top-20 left-12 text-[9px] font-sans font-bold text-emerald-800 bg-emerald-100/80 px-1 py-0.5 rounded leading-none">
                        Sampiuniya
                      </div>
                      <div className="absolute top-36 left-4 font-sans text-[8px] text-gray-450 uppercase tracking-widest leading-none">
                        Sumba Barat Daya
                      </div>
                      <div className="absolute top-24 right-4 text-[9px] font-sans font-bold text-emerald-800 bg-emerald-100/80 px-1 py-0.5 rounded leading-none">
                        Bambiang
                      </div>
                      <div className="absolute top-28 left-40 text-[9px] font-sans font-medium text-blue-800 bg-blue-100/80 px-1 py-0.5 rounded leading-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                        Renuin Sedan
                      </div>
                      <div className="absolute bottom-10 right-16 text-[9px] font-sans font-bold text-emerald-800 bg-emerald-100/80 px-1 py-0.5 rounded leading-none">
                        Rustiama
                      </div>
                      <div className="absolute bottom-4 left-36 font-sans text-[9px] text-stone-400 font-bold uppercase tracking-wider">
                        TOSARDANYA
                      </div>

                      {/* Weetebula Core center town */}
                      <div className="absolute top-32 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xs text-brand-brown-dark font-sans font-bold">
                        Tamboloka
                      </div>

                      {/* Red Pin Anchor */}
                      <div className="absolute top-[140px] left-[200px] -translate-x-1/2 -translate-y-full flex flex-col items-center z-10">
                        {/* Red visual pulse halo */}
                        <div className="w-6 h-6 rounded-full bg-red-400 animate-ping absolute -top-1 pointer-events-none" />
                        {/* Pin body */}
                        <div className="relative group text-center cursor-pointer">
                          <MapPin className="w-8 h-8 text-red-600 drop-shadow-md fill-current" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full pb-1 pointer-events-none opacity-100 w-28 transition-transform">
                            <div className="bg-[#7A1010] border border-brand-gold text-white text-[9px] p-1.5 rounded-lg shadow-lg font-bold">
                              Balai CD Seraphine
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  ) : (
                    // Satellite Orthographic Image Mock
                    <div className="absolute inset-0 bg-stone-900 transition-all duration-300">
                      <img 
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80" 
                        alt="Satellite pattern" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-80 mix-blend-luminosity scale-110"
                      />
                      <div className="absolute inset-0 bg-green-950/20" />
                      
                      {/* Intersecting fluorescent road lines overlay */}
                      <svg className="absolute inset-0 w-full h-full text-stone-400/30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 0,110 Q 150,80 200,140 T 400,160" stroke="#FFFF00" strokeWidth="2" strokeOpacity="0.4" fill="none" />
                        <path d="M 180,0 Q 200,100 220,240" stroke="#FFFF00" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
                      </svg>
                      
                      {/* Red Pin Anchor */}
                      <div className="absolute top-[140px] left-[200px] -translate-x-1/2 -translate-y-full flex flex-col items-center z-10">
                        {/* Red Pin */}
                        <div className="relative text-center">
                          <MapPin className="w-8 h-8 text-red-500 drop-shadow-lg fill-current" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Map scale watermark */}
                  <div className="absolute bottom-2 left-2 px-1 py-0.5 bg-white/70 backdrop-blur-xs text-[8px] text-gray-500 rounded font-mono">
                    Google Maps Data ©2026
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
