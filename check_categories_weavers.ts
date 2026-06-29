import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function checkData() {
  try {
    const { data: kategori, error: errKategori } = await supabase.from('kategori').select('*');
    console.log("Kategori:", { data: kategori, error: errKategori });

    const { data: penenun, error: errPenenun } = await supabase.from('penenun').select('*');
    console.log("Penenun:", { data: penenun, error: errPenenun });
  } catch (e: any) {
    console.log("Exception:", e.message);
  }
}

checkData();
