import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const { data, error } = await supabase.from('users').insert([{
    nama_lengkap: 'Tenun',
    email: `tenun_${Date.now()}@test.com`,
    password: 'Tenun123',
    no_telepon: '08123456789'
  }]).select();

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User Tenun created successfully:', data);
    if (data && data[0]) {
      const now = new Date().toISOString();
      const { error: errAlamat } = await supabase.from('alamat').insert([{
        id_user: data[0].id_user,
        label: 'Rumah',
        penerima: 'Tenun',
        no_hp: '08123456789',
        provinsi: 'Nusa Tenggara Timur',
        kota: 'Sumba Barat Daya',
        kecamatan: 'Kota Tambolaka',
        kelurahan: 'Weetebula',
        kode_pos: '87255',
        alamat_lengkap: 'Alamat Testing Sumba',
        is_default: true,
        is_active: true,
        created_at: now,
        updated_at: now
      }]);
      if (errAlamat) console.error('Error creating alamat:', errAlamat);
      else console.log('Alamat Tenun created successfully');
    }
  }
}

createTestUser();
