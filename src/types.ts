export interface Product {
  id: string;
  title: string;
  category: string; // 'Kain Tenun' | 'Tas & Aksesori' | 'Selendang' | 'Dekorasi'
  price: number;
  image: string;
  description: string;
  maknaMotif?: string; // Philosophy of Motif
  status?: 'aktif' | 'nonaktif'; // Product status in catalog
  isFeatured: boolean;
  code: string;
  dimensions?: string;
  weaver: string;
  makingTime: string; // e.g., '3 Bulan'
  stock?: number; // Stock management quantity
}

export interface FilterState {
  categories: string[];
  maxPrice: number;
  sortBy: string; // 'popular' | 'price-low' | 'price-high'
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
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'menunggu' | 'dikirim' | 'selesai' | 'batal';
  createdAt: string;
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
