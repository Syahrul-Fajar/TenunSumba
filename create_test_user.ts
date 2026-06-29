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
    email: 'tenun@test.com',
    password: 'Tenun123',
    no_telepon: '08123456789',
    alamat: 'Alamat Testing Sumba'
  }]);

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User Tenun created successfully');
  }
}

createTestUser();
