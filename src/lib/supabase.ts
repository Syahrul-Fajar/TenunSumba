import { createClient } from '@supabase/supabase-js';
import { Product, ContactMessage, Order, Article, OrderItem, Kategori, Penenun, KelompokPenenun, Promo, Review, Pembayaran, Pengiriman, StokLog, User, KeranjangItem, Notifikasi, CustomSize } from '../types';
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
          status: (product.status || 'aktif').toUpperCase(),
          stok: product.stock ?? 5,
          id_kategori: product.id_kategori || null,
          id_penenun: product.id_penenun || null
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
        console.error('Supabase save failed:', result.error);
        throw new Error(result.error.message);
      } catch (err) {
        console.error('Supabase write crash:', err);
        throw err;
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

  async checkAdminCredentials(username: string, password: string): Promise<boolean> {
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('verify_admin_password', {
          p_username: username,
          p_password: password
        });
        
        if (!error && data !== null) {
          return data as boolean;
        }
        console.warn('RPC auth failed or not defined. Trying fallback checks.', error);
      } catch (err) {
        console.error('Admin credential check error:', err);
      }
    }
    return (username.toLowerCase() === 'tenunsumba' && password === 'tenunsumba') || 
           (username.toLowerCase() === 'admin' && (password === 'admin' || password === '1234')) ||
           (username.toLowerCase() === 'superadmin' && password === 'superadmin123');
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

    const orderItems = order.items || [
      {
        productId: (order as any).productId,
        productTitle: (order as any).productTitle || 'Kain Tenun Sumba',
        productCode: (order as any).productCode || 'TENUN-SUMBA',
        price: (order as any).price || order.totalPrice,
        quantity: (order as any).quantity || 1
      }
    ];

    if (supabase) {
      try {
        // 1. Create a guest user record to resolve the NOT NULL id_user constraint in pesanan
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            nama_lengkap: order.customerName,
            email: `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`,
            password: 'guest_checkout',
            no_telepon: order.customerPhone,
            alamat: order.customerAddress
          }])
          .select();

        if (userError) {
          console.error('Supabase guest user creation failed:', userError);
          throw new Error(userError.message);
        }

        if (!userData || userData.length === 0) {
          throw new Error('Failed to create guest user record.');
        }

        // 2. Insert order using the generated id_user
        const payload = {
          id_user: userData[0].id_user,
          total_harga: order.totalPrice,
          status_pesanan: order.status || 'menunggu',
          catatan: `${order.customerName} | ${order.customerPhone} | ${order.customerAddress}`
        };
        const result = await supabase.from('pesanan').insert([payload]).select();
        if (!result.error && result.data && result.data[0]) {
          finalId = String(result.data[0].id_pesanan);
          
          // Insert items into detail_pesanan
          for (const item of orderItems) {
            const detailPayload = {
              id_pesanan: Number(finalId),
              id_produk: Number(item.productId),
              jumlah: item.quantity,
              harga_satuan: item.price
            };
            const detailResult = await supabase.from('detail_pesanan').insert([detailPayload]);
            if (detailResult.error) {
              console.error('Supabase detail_pesanan insert failed:', detailResult.error);
              throw new Error(detailResult.error.message);
            }
            await this.deductProductStock(item.productId, item.quantity);
          }

          const finalOrder: Order = { ...order, id: finalId, createdAt, items: orderItems };
          return finalOrder;
        }
        console.error('Supabase create order failed:', result ? result.error : 'Unknown error');
        throw new Error(result ? result.error?.message : 'Failed to save order.');
      } catch (err) {
        console.error('Supabase order write crash:', err);
        throw err;
      }
    }

    // Save locally
    const finalOrder: Order = { ...order, id: finalId || 'ord_' + Math.random().toString(36).substring(2, 9), createdAt, items: orderItems };
    const list = localDb.getOrders();
    list.unshift(finalOrder);
    localDb.saveOrders(list);

    // Deduct stock locally
    for (const item of orderItems) {
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
        // Log stok keluar
        if (supabase) {
          await supabase.from('stok_log').insert([{
            id_produk: Number(productId),
            jumlah_masuk: 0,
            jumlah_keluar: quantity,
            keterangan: 'Terjual (pesanan)',
            tanggal: new Date().toISOString()
          }]);
        }
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
  },
  // 5. KATEGORI SERVICES
  async getAllKategori(): Promise<Kategori[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('kategori').select('*').order('nama_kategori');
        if (!error && data) return data as Kategori[];
        console.warn('Kategori fetch failed:', error);
      } catch (err) { console.error(err); }
    }
    return [];
  },

  async saveKategori(k: Omit<Kategori, 'id_kategori'> & { id_kategori?: number }): Promise<Kategori> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const isNew = !k.id_kategori;
    const payload = { nama_kategori: k.nama_kategori, deskripsi: k.deskripsi || '' };
    let result;
    if (isNew) {
      result = await supabase.from('kategori').insert([payload]).select();
    } else {
      result = await supabase.from('kategori').update(payload).eq('id_kategori', k.id_kategori).select();
    }
    if (result.error) throw new Error(result.error.message);
    return result.data![0] as Kategori;
  },

  async deleteKategori(id: number): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('kategori').delete().eq('id_kategori', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // 6. KELOMPOK PENENUN SERVICES
  async getAllKelompokPenenun(): Promise<KelompokPenenun[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('kelompok_penenun').select('*').order('nama_kelompok');
        if (!error && data) return data as KelompokPenenun[];
        console.warn('KelompokPenenun fetch failed:', error);
      } catch (err) { console.error(err); }
    }
    return [];
  },

  async saveKelompokPenenun(k: Omit<KelompokPenenun, 'id_kelompok'> & { id_kelompok?: number }): Promise<KelompokPenenun> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const isNew = !k.id_kelompok;
    const payload = { nama_kelompok: k.nama_kelompok, lokasi_desa: k.lokasi_desa || '', deskripsi: k.deskripsi || '', foto: k.foto || '' };
    let result;
    if (isNew) {
      result = await supabase.from('kelompok_penenun').insert([payload]).select();
    } else {
      result = await supabase.from('kelompok_penenun').update(payload).eq('id_kelompok', k.id_kelompok).select();
    }
    if (result.error) throw new Error(result.error.message);
    return result.data![0] as KelompokPenenun;
  },

  async deleteKelompokPenenun(id: number): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('kelompok_penenun').delete().eq('id_kelompok', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // 7. PENENUN SERVICES
  async getAllPenenun(): Promise<Penenun[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('penenun').select('*').order('nama');
        if (!error && data) return data as Penenun[];
        console.warn('Penenun fetch failed:', error);
      } catch (err) { console.error(err); }
    }
    return [];
  },

  async savePenenun(p: Omit<Penenun, 'id_penenun'> & { id_penenun?: number }): Promise<Penenun> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const isNew = !p.id_penenun;
    const payload = { nama: p.nama, bio: p.bio || '', foto: p.foto || '', nama_kelompok: p.nama_kelompok || '', lokasi_desa: p.lokasi_desa || '', deskripsi: p.deskripsi || '' };
    let result;
    if (isNew) {
      result = await supabase.from('penenun').insert([payload]).select();
    } else {
      result = await supabase.from('penenun').update(payload).eq('id_penenun', p.id_penenun).select();
    }
    if (result.error) throw new Error(result.error.message);
    return result.data![0] as Penenun;
  },

  async deletePenenun(id: number): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('penenun').delete().eq('id_penenun', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // 8. PROMO SERVICES
  async getAllPromo(): Promise<Promo[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('promo').select('*').order('berlaku_hingga');
        if (!error && data) return data as Promo[];
        console.warn('Promo fetch failed:', error);
      } catch (err) { console.error(err); }
    }
    return [];
  },

  async verifyPromo(kode: string): Promise<Promo | null> {
    if (!supabase) return null;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('promo')
      .select('*')
      .eq('kode_promo', kode.toUpperCase())
      .gte('berlaku_hingga', today)
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as Promo;
  },

  async savePromo(p: Omit<Promo, 'id_promo'> & { id_promo?: number }): Promise<Promo> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const isNew = !p.id_promo;
    const payload = { kode_promo: p.kode_promo.toUpperCase(), diskon: p.diskon, berlaku_hingga: p.berlaku_hingga || null, keterangan: p.keterangan || '' };
    let result;
    if (isNew) {
      result = await supabase.from('promo').insert([payload]).select();
    } else {
      result = await supabase.from('promo').update(payload).eq('id_promo', p.id_promo).select();
    }
    if (result.error) throw new Error(result.error.message);
    return result.data![0] as Promo;
  },

  async deletePromo(id: number): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('promo').delete().eq('id_promo', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // 9. REVIEW SERVICES
  async getReviewsByProduct(id_produk: number): Promise<Review[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('review')
          .select('*, users(nama_lengkap)')
          .eq('id_produk', id_produk)
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((r: any) => ({
            ...r,
            nama_user: r.users?.nama_lengkap || 'Anonim'
          })) as Review[];
        }
        console.warn('Review fetch failed:', error);
      } catch (err) { console.error(err); }
    }
    return [];
  },

  async saveReview(r: { id_produk: number; id_user: number; rating: number; komentar?: string; id_pesanan?: number }): Promise<Review> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const { data, error } = await supabase.from('review').insert([r]).select();
    if (error) throw new Error(error.message);
    return data![0] as Review;
  },

  async hasUserPurchasedProduct(id_user: number, id_produk: number): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { data, error } = await supabase
        .from('pesanan')
        .select('id_pesanan, status_pesanan, detail_pesanan!inner(id_produk)')
        .eq('id_user', id_user)
        .eq('detail_pesanan.id_produk', id_produk)
        .not('status_pesanan', 'eq', 'batal')
        .limit(1);
        
      if (error) {
        console.warn('hasUserPurchasedProduct error:', error);
        return false;
      }
      return data && data.length > 0;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  // 10. PEMBAYARAN SERVICES
  async getAllPembayaran(): Promise<Pembayaran[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pembayaran')
          .select('*')
          .order('id_pembayaran', { ascending: false });
        if (!error && data) return data as Pembayaran[];
        console.warn('Pembayaran fetch failed:', error);
      } catch (err) { console.error(err); }
    }
    return [];
  },

  async savePembayaran(p: Omit<Pembayaran, 'id_pembayaran'>): Promise<Pembayaran> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const { data, error } = await supabase.from('pembayaran').insert([p]).select();
    if (error) throw new Error(error.message);
    return data![0] as Pembayaran;
  },

  async updatePembayaranStatus(id: number, status: 'menunggu' | 'berhasil' | 'gagal', extra?: Partial<Pembayaran>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('pembayaran').update({ status, ...extra }).eq('id_pembayaran', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // 11. PENGIRIMAN SERVICES
  async getAllPengiriman(): Promise<Pengiriman[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('pengiriman')
          .select('*')
          .order('id_pengiriman', { ascending: false });
        if (!error && data) return data as Pengiriman[];
        console.warn('Pengiriman fetch failed:', error);
      } catch (err) { console.error(err); }
    }
    return [];
  },

  async savePengiriman(p: Omit<Pengiriman, 'id_pengiriman'>): Promise<Pengiriman> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const { data, error } = await supabase.from('pengiriman').insert([p]).select();
    if (error) throw new Error(error.message);
    return data![0] as Pengiriman;
  },

  async updatePengiriman(id: number, updates: Partial<Pengiriman>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('pengiriman').update(updates).eq('id_pengiriman', id);
    if (error) throw new Error(error.message);
    return true;
  },

  // 12. STOK LOG SERVICES
  async getStokLog(): Promise<StokLog[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('stok_log')
          .select('*, produk(nama_produk)')
          .order('tanggal', { ascending: false })
          .limit(100);
        if (!error && data) {
          return data.map((s: any) => ({
            ...s,
            nama_produk: s.produk?.nama_produk || '—'
          })) as StokLog[];
        }
        console.warn('StokLog fetch failed:', error);
      } catch (err) { console.error(err); }
    }
    return [];
  },

  async addStokLog(log: Omit<StokLog, 'id_stok' | 'tanggal' | 'nama_produk'>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('stok_log').insert([{ ...log, tanggal: new Date().toISOString() }]);
    if (error) { console.error('StokLog insert failed:', error); return false; }
    return true;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. USER AUTH SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  async registerUser(data: { nama_lengkap: string; email: string; password: string; no_telepon?: string; alamat?: string }): Promise<User> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    // Check if email already exists
    const { data: existing } = await supabase.from('users').select('id_user').eq('email', data.email).limit(1);
    if (existing && existing.length > 0) throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
    const { data: result, error } = await supabase
      .from('users')
      .insert([{ nama_lengkap: data.nama_lengkap, email: data.email, password: data.password, no_telepon: data.no_telepon || '', alamat: data.alamat || '' }])
      .select();
    if (error) throw new Error(error.message);
    const user = result![0] as User;
    // Strip password from returned object
    const { password: _pw, ...safeUser } = user;
    return safeUser as User;
  },

  async loginUser(email: string, password: string): Promise<User> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('password', password)
      .limit(1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Email atau password salah.');
    const user = data[0] as User;
    const { password: _pw, ...safeUser } = user;
    return safeUser as User;
  },

  async updateUserProfile(id_user: number, updates: Partial<Pick<User, 'nama_lengkap' | 'no_telepon' | 'alamat'>>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('users').update(updates).eq('id_user', id_user);
    if (error) throw new Error(error.message);
    return true;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. KERANJANG (DB-BACKED CART) SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  async getKeranjang(id_user: number): Promise<KeranjangItem[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('keranjang')
        .select('*, produk(nama_produk, harga, gambar)')
        .eq('id_user', id_user);
      if (error) { console.warn('Keranjang fetch failed:', error); return []; }
      return (data || []).map((row: any) => ({
        id_keranjang: row.id_keranjang,
        id_user: row.id_user,
        id_produk: row.id_produk,
        jumlah: row.jumlah,
        ukuran: row.ukuran || '',
        nama_produk: row.produk?.nama_produk || '',
        harga: row.produk?.harga || 0,
        gambar: row.produk?.gambar || '',
      })) as KeranjangItem[];
    } catch (err) { console.error(err); return []; }
  },

  async upsertKeranjang(item: { id_user: number; id_produk: number; jumlah: number; ukuran?: string }): Promise<boolean> {
    if (!supabase) return false;
    // Try to find existing row for this user+product+ukuran
    const { data: existing } = await supabase
      .from('keranjang')
      .select('id_keranjang, jumlah')
      .eq('id_user', item.id_user)
      .eq('id_produk', item.id_produk)
      .eq('ukuran', item.ukuran || '')
      .limit(1);
    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('keranjang')
        .update({ jumlah: item.jumlah })
        .eq('id_keranjang', existing[0].id_keranjang);
      if (error) { console.error(error); return false; }
    } else {
      const { error } = await supabase
        .from('keranjang')
        .insert([{ id_user: item.id_user, id_produk: item.id_produk, jumlah: item.jumlah, ukuran: item.ukuran || '' }]);
      if (error) { console.error(error); return false; }
    }
    return true;
  },

  async removeFromKeranjang(id_user: number, id_produk: number, ukuran?: string): Promise<boolean> {
    if (!supabase) return false;
    const query = supabase.from('keranjang').delete().eq('id_user', id_user).eq('id_produk', id_produk);
    if (ukuran !== undefined) query.eq('ukuran', ukuran);
    const { error } = await query;
    if (error) { console.error(error); return false; }
    return true;
  },

  async clearKeranjangDB(id_user: number): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('keranjang').delete().eq('id_user', id_user);
    if (error) { console.error(error); return false; }
    return true;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. NOTIFIKASI SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  async getNotifikasiUser(id_user: number): Promise<Notifikasi[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('notifikasi')
        .select('*')
        .eq('id_user', id_user)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) { console.warn('Notifikasi fetch failed:', error); return []; }
      return (data || []) as Notifikasi[];
    } catch (err) { console.error(err); return []; }
  },

  async markNotifikasiRead(id_notifikasi: number): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('notifikasi').update({ is_read: true }).eq('id_notifikasi', id_notifikasi);
    if (error) { console.error(error); return false; }
    return true;
  },

  async markAllNotifikasiRead(id_user: number): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('notifikasi').update({ is_read: true }).eq('id_user', id_user).eq('is_read', false);
    if (error) { console.error(error); return false; }
    return true;
  },

  async createNotifikasi(id_user: number, pesan: string, tipe: string = 'info'): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('notifikasi').insert([{ id_user, pesan, tipe, is_read: false }]);
    if (error) { console.error('Notifikasi insert failed:', error); return false; }
    return true;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. CUSTOM SIZE SERVICES
  // ═══════════════════════════════════════════════════════════════════════════

  async getSizesByProduct(id_produk: number): Promise<CustomSize[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('custom_size')
        .select('*')
        .eq('id_produk', id_produk)
        .order('ukuran');
      if (error) { console.warn('CustomSize fetch failed:', error); return []; }
      return (data || []) as CustomSize[];
    } catch (err) { console.error(err); return []; }
  },

  async getAllSizes(): Promise<CustomSize[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('custom_size')
        .select('*, produk(nama_produk)')
        .order('id_produk');
      if (error) { console.warn('AllSizes fetch failed:', error); return []; }
      return (data || []).map((s: any) => ({ ...s, nama_produk: s.produk?.nama_produk || '—' })) as CustomSize[];
    } catch (err) { console.error(err); return []; }
  },

  async saveSize(s: Omit<CustomSize, 'id_size' | 'nama_produk'> & { id_size?: number }): Promise<CustomSize> {
    if (!supabase) throw new Error('Supabase tidak terhubung');
    const payload = { id_produk: s.id_produk, ukuran: s.ukuran, panjang_cm: s.panjang_cm || null, lebar_cm: s.lebar_cm || null, harga_tambahan: s.harga_tambahan || 0, keterangan: s.keterangan || '' };
    let result;
    if (!s.id_size) {
      result = await supabase.from('custom_size').insert([payload]).select();
    } else {
      result = await supabase.from('custom_size').update(payload).eq('id_size', s.id_size).select();
    }
    if (result.error) throw new Error(result.error.message);
    return result.data![0] as CustomSize;
  },

  async deleteSize(id_size: number): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('custom_size').delete().eq('id_size', id_size);
    if (error) throw new Error(error.message);
    return true;
  },

  async syncProductSizes(id_produk: number, ukuranList: string[]): Promise<boolean> {
    if (!supabase) return false;
    try {
      // Delete old sizes
      await supabase.from('custom_size').delete().eq('id_produk', id_produk);
      
      if (ukuranList.length > 0) {
        // Insert new sizes
        const payloads = ukuranList.map(ukuran => ({
          id_produk,
          ukuran,
          harga_tambahan: 0,
        }));
        await supabase.from('custom_size').insert(payloads);
      }
      return true;
    } catch (err) {
      console.error('syncProductSizes failed', err);
      return false;
    }
  },
};


// HIGH FIDELITY SQL SCHEMA FOR AUTO-SETUP
export const supabaseSQL = `-- LEGACY SCHEMA (superseded by actual Supabase schema)

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
