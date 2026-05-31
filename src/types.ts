export interface Product {
  id: string;
  title: string;
  category: string; // 'Kain Tenun' | 'Tas & Aksesori' | 'Selendang' | 'Dekorasi'
  price: number;
  image: string;
  description: string;
  isFeatured: boolean;
  code: string;
  dimensions?: string;
  weaver: string;
  makingTime: string; // e.g., '3 Bulan'
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
}
