import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import { dbService } from '../lib/supabase';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [noTelepon, setNoTelepon] = useState('');
  const [alamat, setAlamat] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginView) {
        const user = await dbService.loginUser(email, password);
        onLoginSuccess(user);
        onClose();
      } else {
        const user = await dbService.registerUser({
          nama_lengkap: namaLengkap,
          email,
          password,
          no_telepon: noTelepon,
          alamat
        });
        onLoginSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setEmail('');
    setPassword('');
    setNamaLengkap('');
    setNoTelepon('');
    setAlamat('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-[#F1F5F9] shrink-0">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">
              {isLoginView ? 'Selamat Datang' : 'Buat Akun Baru'}
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              {isLoginView ? 'Masuk untuk mengelola pesanan dan keranjang.' : 'Daftar untuk menikmati pengalaman berbelanja terbaik.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[#64748B] hover:text-[#7B1618] hover:bg-[#F8FAFC] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Nama Lengkap *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors"
                    placeholder="Nama lengkap Anda"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors"
                  placeholder="contoh@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#7B1618]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLoginView && (
              <>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">No Telepon (Opsional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="tel"
                      value={noTelepon}
                      onChange={(e) => setNoTelepon(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors"
                      placeholder="081234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B] mb-1.5">Alamat Lengkap (Opsional)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-[#94A3B8]" />
                    <textarea
                      rows={2}
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#F1F5F9] rounded-xl text-[#1A1A1A] focus:outline-none focus:border-[#7B1618] transition-colors resize-none"
                      placeholder="Alamat pengiriman default..."
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 mt-4 text-xs tracking-wider uppercase font-bold"
            >
              {isLoading ? 'Memproses...' : (isLoginView ? 'Masuk' : 'Daftar')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#64748B]">
              {isLoginView ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button
                type="button"
                onClick={toggleView}
                className="font-bold text-[#7B1618] hover:underline"
              >
                {isLoginView ? 'Daftar sekarang' : 'Masuk di sini'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
