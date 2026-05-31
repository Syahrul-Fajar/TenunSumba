import { createClient } from '@supabase/supabase-js';
import { Product, ContactMessage } from '../types';
import { PRODUCTS } from '../data/products';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client conditionally
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to initialize local storage data if not already present
const LOCAL_PRODUCTS_KEY = 'cd_seraphine_products';
const LOCAL_INQUIRIES_KEY = 'cd_seraphine_inquiries';

if (!localStorage.getItem(LOCAL_PRODUCTS_KEY)) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(PRODUCTS));
}

if (!localStorage.getItem(LOCAL_INQUIRIES_KEY)) {
  const initialInquiries = [
    {
      id: 'inq_1',
      name: 'Budi Santoso',
      email: 'budi.santoso@gmail.com',
      subject: 'Tanya Tenun Ikat Sumba Kuda',
      message: 'Halo, saya berencana memesan Kain Tenun Ikat Motif Kuda untuk hiasan ruang tamu. Apakah bisa request ukuran khusus 300 x 120 cm? Berapa lama pengerjaannya?',
      product_title: 'Tenun Ikat Sumba Motif Kuda',
      product_code: 'TIS-KUD0A',
      status: 'baru',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
    },
    {
      id: 'inq_2',
      name: 'Elizabeth Taylor',
      email: 'eliz.taylor@culture.org',
      subject: 'Custom Order Table Runner',
      message: 'Greetings, we are interested in ordering 10 units of the Table Runner for an exhibition in Jakarta. Is there a bulk discount? Please send us a quotation.',
      product_title: 'Taplak Meja Tenun Panjang (Runner)',
      product_code: 'DKR-TBL06',
      status: 'dibaca',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
    }
  ];
  localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(initialInquiries));
}

// Low-level pure client fallbacks
const localDb = {
  getProducts: (): Product[] => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || '[]');
    } catch {
      return PRODUCTS;
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
  }
};

// EXPOSED API SERVICES (Both Supabase and Local storage)
export const dbService = {
  // 1. PRODUCTS SERVICES
  async getAllProducts(): Promise<Product[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          // Normalize names from snake_case to camelCase
          return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            price: Number(item.price),
            image: item.image,
            description: item.description,
            isFeatured: item.is_featured ?? item.isFeatured,
            code: item.code,
            dimensions: item.dimensions,
            weaver: item.weaver,
            makingTime: item.making_time ?? item.makingTime
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
    const finalId = product.id || 'prod_' + Math.random().toString(36).substring(2, 9);
    const finalProduct: Product = { ...product, id: finalId } as Product;

    if (supabase) {
      try {
        const payload = {
          id: finalId,
          title: product.title,
          category: product.category,
          price: product.price,
          image: product.image,
          description: product.description,
          is_featured: product.isFeatured,
          code: product.code,
          dimensions: product.dimensions,
          weaver: product.weaver,
          making_time: product.makingTime
        };

        let result;
        if (isNew) {
          result = await supabase.from('products').insert([payload]);
        } else {
          result = await supabase.from('products').update(payload).eq('id', finalId);
        }

        if (!result.error) {
          return finalProduct;
        }
        console.error('Supabase save failed, writing locally instead:', result.error);
      } catch (err) {
        console.error('Supabase write crash; saving locally:', err);
      }
    }

    // Save locally
    const list = localDb.getProducts();
    if (isNew) {
      list.unshift(finalProduct);
    } else {
      const idx = list.findIndex((p) => p.id === finalId);
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
        const { error } = await supabase.from('products').delete().eq('id', id);
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

  // 2. INQUIRIES / CONTACT SERVICES
  async getInquiries(): Promise<any[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
        console.warn('Supabase inquiries query error, using local storage fallback:', error);
      } catch (err) {
        console.error('Supabase connection error on inquiries, using local:', err);
      }
    }
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

    if (supabase) {
      try {
        const { error } = await supabase.from('inquiries').insert([payload]);
        if (!error) return payload;
        console.error('Supabase insert inquiry error, saving locally:', error);
      } catch (err) {
        console.error('Supabase insert inquiry exception, saving locally:', err);
      }
    }

    const list = localDb.getInquiries();
    list.unshift(payload);
    localDb.saveInquiries(list);
    return payload;
  },

  async updateInquiryStatus(id: string, status: 'baru' | 'dibaca' | 'selesai'): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('inquiries').update({ status }).eq('id', id);
        if (!error) return true;
        console.error('Supabase update status error:', error);
      } catch (err) {
        console.error('Supabase update status exception:', err);
      }
    }

    const list = localDb.getInquiries();
    const idx = list.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      localDb.saveInquiries(list);
    }
    return true;
  },

  async deleteInquiry(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase.from('inquiries').delete().eq('id', id);
        if (!error) return true;
        console.error('Supabase delete inquiry error:', error);
      } catch (err) {
        console.error('Supabase delete inquiry exception:', err);
      }
    }

    const list = localDb.getInquiries();
    const filtered = list.filter((item: any) => item.id !== id);
    localDb.saveInquiries(filtered);
    return true;
  }
};
