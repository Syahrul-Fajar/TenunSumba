export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  description: string;
  maknaMotif?: string;
  status?: 'aktif' | 'nonaktif';
  isFeatured: boolean;
  code: string;
  weaver: string;
  stock?: number;
  id_kategori?: number | null;
  id_penenun?: number | null;
}

export interface FilterState {
  categories: string[];
  maxPrice: number;
  sortBy: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  product_title?: string;
  product_code?: string;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  productCode: string;
  price: number;
  quantity: number;
  ukuran?: string;
  isCustom?: boolean;
  customPanjang?: number;
  customLebar?: number;
  customCatatan?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'menunggu' | 'dikemas' | 'dikirim' | 'selesai' | 'batal';
  createdAt: string;
  promoKode?: string;
  diskon?: number;
  ongkir?: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  image: string;
  createdAt: string;
}

// ── Admin ────────────────────────────────────────────────────────────────────

export interface Admin {
  id_admin: number;
  username: string;
  password?: string;
  email: string;
  nama_lengkap?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  created_at?: string;
  deleted_at?: string | null;
}

// ── Alamat ───────────────────────────────────────────────────────────────────

export interface Alamat {
  id_alamat: number;
  id_user: number;
  label?: string;
  penerima: string;
  no_hp: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  kode_pos: string;
  alamat_lengkap: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ── Produk Media ─────────────────────────────────────────────────────────────

export interface ProdukMedia {
  id_media: number;
  id_produk: number;
  url: string;
  tipe: 'IMAGE' | 'VIDEO';
  urutan: number;
  created_at?: string;
}

// ── Detail Pesanan ───────────────────────────────────────────────────────────

export interface DetailPesanan {
  id_detail: number;
  id_pesanan: number;
  id_produk: number;
  jumlah: number;
  harga_satuan: number;
  is_custom: boolean;
  produk_snapshot?: any;
  varian?: any;
  // Joined
  nama_produk?: string;
}

// ── Wishlist ─────────────────────────────────────────────────────────────────

export interface Wishlist {
  id_wishlist: number;
  id_user: number;
  id_produk: number;
  created_at?: string;
  // Joined
  nama_produk?: string;
  harga?: number;
  gambar?: string;
}

// ── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id_audit: number;
  id_admin?: number | null;
  id_user?: number | null;
  aksi: string;
  tabel: string;
  id_record: number;
  data_sebelum?: any;
  data_sesudah?: any;
  created_at?: string;
  // Joined
  nama_admin?: string;
}

// ── New Table Types ────────────────────────────────────────────────────────────

export interface Kategori {
  id_kategori: number;
  nama_kategori: string;
  deskripsi?: string;
}

export interface KelompokPenenun {
  id_kelompok: number;
  nama_kelompok: string;
  lokasi_desa?: string;
  deskripsi?: string;
  foto?: string;
  id_admin?: number;
}

export interface Penenun {
  id_penenun: number;
  nama: string;
  foto?: string;
  bio?: string;
  nama_kelompok?: string;
  lokasi_desa?: string;
  deskripsi?: string;
  id_admin?: number;
}

export interface Promo {
  id_promo: number;
  kode_promo: string;
  diskon: number; // percentage e.g. 10 = 10%
  berlaku_hingga?: string;
  keterangan?: string;
  id_admin?: number;
}

export interface Review {
  id_review: number;
  id_produk: number;
  id_user: number;
  id_pesanan?: number;
  rating: number; // 1-5
  komentar?: string;
  created_at: string;
  // Joined data
  nama_user?: string;
}

export interface Pembayaran {
  id_pembayaran: number;
  id_pesanan: number;
  metode?: string;
  status: 'menunggu' | 'berhasil' | 'gagal';
  bukti?: string;
  jumlah?: number;
  tanggal_bayar?: string;
}

export interface Pengiriman {
  id_pengiriman: number;
  id_pesanan: number;
  ekspedisi?: string;
  nomor_resi?: string;
  status_pengiriman: 'menunggu' | 'diproses' | 'dikirim' | 'tiba';
  tanggal_kirim?: string;
  estimasi_tiba?: string;
}

export interface StokLog {
  id_stok: number;
  id_produk: number;
  id_admin?: number;
  jumlah_masuk: number;
  jumlah_keluar: number;
  keterangan?: string;
  tanggal: string;
  // Joined
  nama_produk?: string;
}

// ── User & Auth ───────────────────────────────────────────────────────────────

export interface User {
  id_user: number;
  nama_lengkap: string;
  email: string;
  password?: string; // only used during login, never stored in state
  no_telepon?: string;
  alamat?: string;
  created_at?: string;
}

// ── Keranjang ─────────────────────────────────────────────────────────────────

export interface KeranjangItem {
  id_keranjang?: number;
  id_user: number;
  id_produk: number;
  jumlah: number;
  ukuran?: string;
  // Joined product data (for display)
  nama_produk?: string;
  harga?: number;
  gambar?: string;
}

// ── Notifikasi ────────────────────────────────────────────────────────────────

export interface Notifikasi {
  id_notifikasi: number;
  id_user: number;
  pesan: string;
  is_read: boolean;
  created_at: string;
  tipe?: string; // 'pesanan' | 'promo' | 'info'
}

// ── Custom Size ───────────────────────────────────────────────────────────────

export interface CustomSize {
  id_size: number;
  id_produk: number;
  ukuran: string;       // e.g. 'S', 'M', 'L', 'XL', '200x100cm'
  panjang_cm?: number;
  lebar_cm?: number;
  harga_tambahan?: number; // surcharge for this size
  keterangan?: string;
  // Joined
  nama_produk?: string;
}
