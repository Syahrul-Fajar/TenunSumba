import { createClient } from '@supabase/supabase-js';
import { Product, ContactMessage, Order, Article, OrderItem } from '../types';
import { PRODUCTS } from '../data/products';

const rawSupabaseUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

const supabaseUrl = rawSupabaseUrl.endsWith('/rest/v1/')
  ? rawSupabaseUrl.slice(0, -9)
  : rawSupabaseUrl.endsWith('/rest/v1')
    ? rawSupabaseUrl.slice(0, -8)
    : rawSupabaseUrl;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your_supabase_url_here') &&
  !supabaseAnonKey.includes('your_supabase_anon_key_here')
);

// Create Supabase client conditionally
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper keys for LocalStorage fallbacks
const LOCAL_PRODUCTS_KEY = 'cd_seraphine_products';
const LOCAL_INQUIRIES_KEY = 'cd_seraphine_inquiries';
const LOCAL_ORDERS_KEY = 'cd_seraphine_orders';
const LOCAL_ARTICLES_KEY = 'cd_seraphine_articles';

// Initialize LocalStorage empty tables if not present
if (!localStorage.getItem(LOCAL_PRODUCTS_KEY)) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(LOCAL_INQUIRIES_KEY)) {
  localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(LOCAL_ORDERS_KEY)) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([]));
}
if (!localStorage.getItem(LOCAL_ARTICLES_KEY)) {
  localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify([]));
}

// Low-level pure client fallbacks
const localDb = {
  getProducts: (): Product[] => {
    try {
      const list = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || '[]');
      return list.map((p: any) => ({ ...p, stock: p.stock ?? 5 }));
    } catch {
      return PRODUCTS.map(p => ({ ...p, stock: 5 }));
    }
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  },
  getInquiries: () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_INQUIRIES_KEY) || '[]');
    } catch {
      return [];
    }
  },
  saveInquiries: (inquiries: any[]) => {
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(inquiries));
  },
  getOrders: (): Order[] => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
    } catch {
      return [];
    }
  },
  saveOrders: (orders: Order[]) => {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  },
  getArticles: (): Article[] => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_ARTICLES_KEY) || '[]');
    } catch {
      return [];
    }
  },
  saveArticles: (articles: Article[]) => {
    localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify(articles));
  }
};

// EXPOSED API SERVICES (Both Supabase and Local storage)
export const dbService = {
  // 1. PRODUCTS SERVICES (Katalog & Stok)
  async getAllProducts(): Promise<Product[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('produk')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((item: any) => ({
            id: String(item.id_produk),
            title: item.nama_produk,
            category: 'Kain Tenun',
            price: Number(item.harga),
            image: item.gambar,
            description: item.deskripsi || '',
            maknaMotif: item.makna_motif || '',
            status: item.status || 'aktif',
            isFeatured: false,
            code: 'TIS-' + item.id_produk,
            dimensions: '200 x 100 cm',
            weaver: 'Mama Penenun',
            makingTime: '3 Bulan',
            stock: item.stok !== undefined && item.stok !== null ? Number(item.stok) : 5
          }));
        }
        console.warn('Supabase products fetch failed or table missing, utilizing LocalStorage fallback.', error);
      } catch (err) {
        console.error('Database connection error; using LocalStorage fallback.', err);
      }
    }
    return localDb.getProducts();
  },

  async saveProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    const isNew = !product.id;
    let finalId = product.id || '';

    if (supabase) {
      try {
        const payload: any = {
          nama_produk: product.title,
          harga: product.price,
          gambar: product.image,
          deskripsi: product.description || '',
          makna_motif: product.maknaMotif || '',
          status: product.status || 'aktif',
          stok: product.stock ?? 5
        };

        let result;
        if (isNew) {
          result = await supabase.from('produk').insert([payload]).select();
          if (!result.error && result.data && result.data[0]) {
            finalId = String(result.data[0].id_produk);
          }
        } else {
          const queryId = !isNaN(Number(product.id)) ? Number(product.id) : product.id;
          result = await supabase.from('produk').update(payload).eq('id_produk', queryId);
        }

        if (!result.error) {
          const finalProduct: Product = { ...product, id: finalId } as Product;
          return finalProduct;
        }
        console.error('Supabase save failed, writing locally instead:', result.error);
      } catch (err) {
        console.error('Supabase write crash; saving locally:', err);
      }
    }

    // Save locally
    const finalProduct: Product = { ...product, id: finalId || 'prod_' + Math.random().toString(36).substring(2, 9) } as Product;
    const list = localDb.getProducts();
    if (isNew) {
      list.unshift(finalProduct);
    } else {
      const idx = list.findIndex((p) => p.id === finalProduct.id);
      if (idx !== -1) {
        list[idx] = finalProduct;
      } else {
        list.unshift(finalProduct);
      }
    }
    localDb.saveProducts(list);
    return finalProduct;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const queryId = !isNaN(Number(id)) ? Number(id) : id;
        const { error } = await supabase.from('produk').delete().eq('id_produk', queryId);
        if (!error) return true;
        console.error('Supabase delete product error:', error);
      } catch (err) {
        console.error('Supabase delete exception:', err);
      }
    }

    const list = localDb.getProducts();
    const filtered = list.filter((p) => p.id !== id);
    localDb.saveProducts(filtered);
    return true;
  },

  // 2. INQUIRIES / CONTACT SERVICES (Database Pelanggan - Routed entirely locally)
  async getInquiries(): Promise<any[]> {
    return localDb.getInquiries();
  },

  async sendInquiry(inquiry: Omit<ContactMessage, ''> & { product_title?: string; product_code?: string }): Promise<any> {
    const payload = {
      id: 'inq_' + Math.random().toString(36).substring(2, 9),
      name: inquiry.name,
      email: inquiry.email,
      subject: inquiry.subject,
      message: inquiry.message,
      product_title: inquiry.product_title || null,
      product_code: inquiry.product_code || null,
      status: 'baru',
      created_at: new Date().toISOString()
    };

    const list = localDb.getInquiries();
    list.unshift(payload);
    localDb.saveInquiries(list);
    return payload;
  },

  async updateInquiryStatus(id: string, status: 'baru' | 'dibaca' | 'selesai'): Promise<boolean> {
    const list = localDb.getInquiries();
    const idx = list.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      localDb.saveInquiries(list);
    }
    return true;
  },

  async deleteInquiry(id: string): Promise<boolean> {
    const list = localDb.getInquiries();
    const filtered = list.filter((item: any) => item.id !== id);
    localDb.saveInquiries(filtered);
    return true;
  },

  // 3. ORDERS SERVICES (Manajemen Pesanan)
  async getAllOrders(): Promise<Order[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pesanan')
          .select('*, detail_pesanan(*, produk(*))')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((item: any) => {
            const items: OrderItem[] = (item.detail_pesanan || []).map((det: any) => ({
              productId: String(det.id_produk),
              productTitle: det.produk ? det.produk.nama_produk : 'Kain Tenun Sumba',
              productCode: 'TIS-' + det.id_produk,
              price: Number(det.harga_satuan || 0),
              quantity: Number(det.jumlah || 1)
            }));

            // Fallback for legacy orders
            if (items.length === 0) {
              items.push({
                productId: 'TENUN-SUMBA',
                productTitle: 'Kain Tenun Sumba',
                productCode: 'TENUN-SUMBA',
                price: Number(item.total_harga || 0),
                quantity: 1
              });
            }

            const parts = (item.catatan || '').split(' | ');
            return {
              id: String(item.id_pesanan),
              customerName: parts[0] || 'Pelanggan Seraphine',
              customerEmail: '—',
              customerPhone: parts[1] || '—',
              customerAddress: parts[2] || '—',
              items,
              totalPrice: Number(item.total_harga || 0),
              status: item.status_pesanan || 'menunggu',
              createdAt: item.created_at
            };
          });
        }
        console.warn('Supabase orders fetch failed or table missing, utilizing LocalStorage fallback.', error);
      } catch (err) {
        console.error('Database connection error on orders; using LocalStorage fallback.', err);
      }
    }
    return localDb.getOrders();
  },

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    let finalId = '';
    const createdAt = new Date().toISOString();

    if (supabase) {
      try {
        const payload = {
          total_harga: order.totalPrice,
          status_pesanan: order.status || 'menunggu',
          catatan: `${order.customerName} | ${order.customerPhone} | ${order.customerAddress}`
        };
        const result = await supabase.from('pesanan').insert([payload]).select();
        if (!result.error && result.data && result.data[0]) {
          finalId = String(result.data[0].id_pesanan);
          
          // Insert items into detail_pesanan
          for (const item of order.items) {
            const detailPayload = {
              id_pesanan: Number(finalId),
              id_produk: Number(item.productId),
              jumlah: item.quantity,
              harga_satuan: item.price
            };
            await supabase.from('detail_pesanan').insert([detailPayload]);
            await this.deductProductStock(item.productId, item.quantity);
          }

          const finalOrder: Order = { ...order, id: finalId, createdAt };
          return finalOrder;
        }
        console.error('Supabase create order failed, writing locally instead:', result.error);
      } catch (err) {
        console.error('Supabase order write crash; saving locally:', err);
      }
    }

    // Save locally
    const finalOrder: Order = { ...order, id: finalId || 'ord_' + Math.random().toString(36).substring(2, 9), createdAt };
    const list = localDb.getOrders();
    list.unshift(finalOrder);
    localDb.saveOrders(list);

    // Deduct stock locally
    for (const item of order.items) {
      await this.deductProductStock(item.productId, item.quantity);
    }
    return finalOrder;
  },

  async deductProductStock(productId: string, quantity: number): Promise<void> {
    try {
      const products = await this.getAllProducts();
      const product = products.find(p => p.id === productId);
      if (product) {
        const currentStock = product.stock ?? 5;
        const newStock = Math.max(0, currentStock - quantity);
        await this.saveProduct({ ...product, stock: newStock });
      }
    } catch (err) {
      console.error('Failed to deduct stock:', err);
    }
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<boolean> {
    if (supabase) {
      try {
        const queryId = !isNaN(Number(id)) ? Number(id) : id;
        const { error } = await supabase.from('pesanan').update({ status_pesanan: status }).eq('id_pesanan', queryId);
        if (!error) return true;
        console.error('Supabase update order status error:', error);
      } catch (err) {
        console.error('Supabase update order status exception:', err);
      }
    }

    const list = localDb.getOrders();
    const idx = list.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      localDb.saveOrders(list);
    }
    return true;
  },

  async deleteOrder(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const queryId = !isNaN(Number(id)) ? Number(id) : id;
        const { error } = await supabase.from('pesanan').delete().eq('id_pesanan', queryId);
        if (!error) return true;
        console.error('Supabase delete order error:', error);
      } catch (err) {
        console.error('Supabase delete order exception:', err);
      }
    }

    const list = localDb.getOrders();
    const filtered = list.filter((item: any) => item.id !== id);
    localDb.saveOrders(filtered);
    return true;
  },

  // 4. ARTICLES SERVICES (Manajemen Konten & Edukasi)
  async getAllArticles(): Promise<Article[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('artikel')
          .select('*');
        if (!error && data) {
          return data.map((item: any) => ({
            id: String(item.id_artikel),
            title: item.judul,
            slug: item.judul.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            content: item.konten,
            excerpt: item.konten.substring(0, 100) + '...',
            author: 'Admin',
            image: item.thumbnail || '',
            createdAt: new Date().toISOString()
          }));
        }
        console.warn('Supabase articles fetch failed or table missing, utilizing LocalStorage fallback.', error);
      } catch (err) {
        console.error('Database connection error on articles; using LocalStorage fallback.', err);
      }
    }
    return localDb.getArticles();
  },

  async saveArticle(article: Omit<Article, 'id' | 'createdAt'> & { id?: string }): Promise<Article> {
    const isNew = !article.id;
    let finalId = article.id || '';
    const createdAt = new Date().toISOString();

    if (supabase) {
      try {
        const payload: any = {
          judul: article.title,
          konten: article.content,
          thumbnail: article.image
        };

        let result;
        if (isNew) {
          result = await supabase.from('artikel').insert([payload]).select();
          if (!result.error && result.data && result.data[0]) {
            finalId = String(result.data[0].id_artikel);
          }
        } else {
          const queryId = !isNaN(Number(article.id)) ? Number(article.id) : article.id;
          result = await supabase.from('artikel').update(payload).eq('id_artikel', queryId);
        }

        if (!result.error) {
          const finalArticle: Article = { ...article, id: finalId, createdAt: isNew ? createdAt : (article as any).createdAt || createdAt };
          return finalArticle;
        }
        console.error('Supabase save article failed, writing locally instead:', result.error);
      } catch (err) {
        console.error('Supabase write article crash; saving locally:', err);
      }
    }

    // Save locally
    const finalArticle: Article = { ...article, id: finalId || 'art_' + Math.random().toString(36).substring(2, 9), createdAt: isNew ? createdAt : (article as any).createdAt || createdAt };
    const list = localDb.getArticles();
    if (isNew) {
      list.unshift(finalArticle);
    } else {
      const idx = list.findIndex((a) => a.id === finalArticle.id);
      if (idx !== -1) {
        list[idx] = finalArticle;
      } else {
        list.unshift(finalArticle);
      }
    }
    localDb.saveArticles(list);
    return finalArticle;
  },

  async deleteArticle(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const queryId = !isNaN(Number(id)) ? Number(id) : id;
        const { error } = await supabase.from('artikel').delete().eq('id_artikel', queryId);
        if (!error) return true;
        console.error('Supabase delete article error:', error);
      } catch (err) {
        console.error('Supabase delete article exception:', err);
      }
    }

    const list = localDb.getArticles();
    const filtered = list.filter((a) => a.id !== id);
    localDb.saveArticles(filtered);
    return true;
  }
};

// HIGH FIDELITY SQL SCHEMA FOR AUTO-SETUP
export const supabaseSQL = `-- 1. BUAT TABLE PRODUCTS SECARA OTOMATIS
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    is_featured BOOLEAN DEFAULT false,
    code TEXT UNIQUE NOT NULL,
    dimensions TEXT,
    weaver TEXT,
    making_time TEXT,
    stock INT DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REFILL DATA PERTAMA KALI UNTUK PRODUCTS
INSERT INTO public.products (id, title, category, price, image, description, is_featured, code, dimensions, weaver, making_time, stock) 
VALUES 
('1', 'Tenun Ikat Sumba Motif Kuda', 'Kain Tenun', 2500000, 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80', 'Kain Tenun Ikat Sumba asli dengan motif Kuda Sumba melambangkan keanggunan dan status sosial.', true, 'TIS-KUD0A', '240 x 110 cm', 'Mama Seraphine Weetebula', '6 Bulan', 8),
('2', 'Tas Selempang Tenun Sumba', 'Tas & Aksesori', 850000, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', 'Tas selempang serbaguna yang menggabungkan potongan kain tenun ikat berkualitas tinggi dengan aksen kulit sapi asli.', true, 'TAS-SLP01', '25 x 20 x 8 cm', 'Kelompok Perempuan Wanno', '2 Minggu', 12),
('3', 'Selendang Sumba Warna Alam', 'Selendang', 1200000, 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80', 'Selendang tenun halus dikerjakan menggunakan katun pintal tangan.', true, 'SLD-ALM02', '180 x 45 cm', 'Mama Yuliana', '1.5 Bulan', 5)
ON CONFLICT (id) DO NOTHING;

-- 2. BUAT TABLE INQUIRIES (DATABASE PELANGGAN)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    product_title TEXT,
    product_code TEXT,
    status TEXT DEFAULT 'baru', -- 'baru' | 'dibaca' | 'selesai'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BUAT TABLE ORDERS (MANAJEMEN PESANAN)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_code TEXT NOT NULL,
    price NUMERIC NOT NULL,
    quantity INT DEFAULT 1,
    total_price NUMERIC NOT NULL,
    status TEXT DEFAULT 'baru', -- 'baru' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BUAT TABLE ARTICLES (MANAJEMEN KONTEN & EDUKASI)
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    image TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS) AGAR AMAN
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- BUAT POLICY SUPAYA SEMUA ORANG BISA VIEW & INSERT
CREATE POLICY "Public Read Access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.inquiries FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Access" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Full Admin Access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Admin Access" ON public.inquiries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Admin Access" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Admin Access" ON public.articles FOR ALL USING (true) WITH CHECK (true);
`;
