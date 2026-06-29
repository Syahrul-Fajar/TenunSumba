import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function testInsertOrder() {
  const payload = {
    total_harga: 1500000,
    status_pesanan: 'menunggu',
    catatan: 'Test Customer | 08123456789 | Alamat Sumba'
  };

  try {
    const { data, error } = await supabase.from('pesanan').insert([payload]).select();
    console.log("Insert order result:", { data, error });
  } catch (e: any) {
    console.log("Exception:", e.message);
  }
}

testInsertOrder();
