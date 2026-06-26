import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Tenun Ikat Sumba Motif Kuda',
    category: 'Kain Tenun',
    price: 2500000,
    image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=600&q=80',
    description: 'Kain Tenun Ikat Sumba asli dengan motif Kuda Sumba (Sandalwood pony) yang melambangkan keanggunan, keberanian, dan status sosial tinggi. Diwarnai secara eksklusif menggunakan pewarna alam lokal seperti akar pohon mengkudu untuk warna merah marun dan daun tarum untuk warna biru tua.',
    isFeatured: true,
    code: 'TIS-KUD0A',
    dimensions: '240 x 110 cm',
    weaver: 'Mama Seraphine Weetebula',
    makingTime: '6 Bulan'
  },
  {
    id: '2',
    title: 'Tas Selempang Tenun Sumba',
    category: 'Tas & Aksesori',
    price: 850000,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    description: 'Tas selempang serbaguna yang menggabungkan potongan kain tenun ikat berkualitas tinggi dengan aksen kulit sapi asli. Ringkas, elegan, dan dilengkapi furing tebal serta ritsleting logam premium di bagian dalam.',
    isFeatured: true,
    code: 'TAS-SLP01',
    dimensions: '25 x 20 x 8 cm',
    weaver: 'Kelompok Perempuan Wanno',
    makingTime: '2 Minggu'
  },
  {
    id: '3',
    title: 'Selendang Sumba Warna Alam',
    category: 'Selendang',
    price: 1200000,
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80',
    description: 'Selendang tenun halus dikerjakan menggunakan katun pintal tangan (handspun cotton). Menampilkan garis-garis geometris khas pesisir Sumba Barat dengan rumbai ikatan khas buatan tangan perajin.',
    isFeatured: true,
    code: 'SLD-ALM02',
    dimensions: '180 x 45 cm',
    weaver: 'Mama Yuliana',
    makingTime: '1.5 Bulan'
  },
  {
    id: '4',
    title: 'Sarung Sumba Pahikung',
    category: 'Kain Tenun',
    price: 3200000,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80',
    description: 'Sarung tenun Pahikung (Lau Pahudu) yang dibuat melalui proses pakan tambahan yang sangat rumit. Menghasilkan pola visual timbul bernuansa megah yang menceritakan mitologi kuno Marapu Sumba.',
    isFeatured: true,
    code: 'SRG-PAH04',
    dimensions: '160 x 120 cm',
    weaver: 'Mama Maria Weetebula',
    makingTime: '8 Bulan'
  },
  {
    id: '5',
    title: 'Aksesori Tenun (Dompet & Pouch Set)',
    category: 'Tas & Aksesori',
    price: 450000,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
    description: 'Set dompet clutch dan saku kosmetik terbuat dari upcycling kain tenun tradisional yang dipreservasi. Penuh warna, ramah lingkungan, sekaligus mendukung penuh ekonomi sirkular perempuan penenun.',
    isFeatured: false,
    code: 'AKS-DMP05',
    dimensions: '20 x 12 cm',
    weaver: 'Penenun Muda Seraphine',
    makingTime: '1 Minggu'
  },
  {
    id: '6',
    title: 'Taplak Meja Tenun Panjang (Runner)',
    category: 'Dekorasi',
    price: 1500000,
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80',
    description: 'Table runner tenun tebal dengan motif etnik simetris rona bumi untuk memperindah meja kayu. Melindungi permukaan meja sekaligus memperkuat aksen Nusantara di ruangan Anda.',
    isFeatured: false,
    code: 'DKR-TBL06',
    dimensions: '200 x 35 cm',
    weaver: 'Mama Paulina',
    makingTime: '2 Bulan'
  },
  {
    id: '7',
    title: 'Tenun Ikat Kambera Jingga',
    category: 'Kain Tenun',
    price: 2800000,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    description: 'Mahakarya kain ikat dari daerah Kambera dengan warna jingga kecokelatan legendaris dari kayu kombu. Menampilkan ilustrasi Andung (Pohon Tengkorak) ikonik warisan mitologi Sumba kuno.',
    isFeatured: false,
    code: 'TIS-KAM07',
    dimensions: '220 x 105 cm',
    weaver: 'Mama Seraphine Weetebula',
    makingTime: '5 Bulan'
  },
  {
    id: '8',
    title: 'Sarung Bantal Kursi Tenun',
    category: 'Dekorasi',
    price: 600000,
    image: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=600&q=80',
    description: 'Sepasang sarung bantal kursi dengan panel depan tenun ikat motif Burung Kaka (Kakatua) yang melambangkan musyawarah desa, keramahan, serta kesetiaan.',
    isFeatured: false,
    code: 'DKR-BTL08',
    dimensions: '45 x 45 cm (2 pcs)',
    weaver: 'Koperasi Perempuan Weetebula',
    makingTime: '10 Hari'
  }
];
