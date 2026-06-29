import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function testInsert() {
  const payload = {
    nama_produk: "Test Kain Tenun " + Date.now(),
    harga: 1500000,
    gambar: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80",
    deskripsi: "Deskripsi Kain Tenun Test",
    makna_motif: "Makna motif test",
    status: "aktif",
    stok: 5
  };

  try {
    const { data, error } = await supabase.from('produk').insert([payload]).select();
    console.log("Insert result:", { data, error });
  } catch (e: any) {
    console.log("Exception:", e.message);
  }
}

testInsert();
