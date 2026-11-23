import { Product, Category, Brand, Coupon, BlogPost, SleepTestPackage, Order, ActiveRental, Rental, Review } from '@/types';

export const MOCK_CATEGORIES: Category[] = [];

export const MOCK_BRANDS: Brand[] = [];

export const MOCK_PRODUCTS: Product[] = [];

export const MOCK_COUPONS: Coupon[] = [];

export const MOCK_SLEEP_TEST_PACKAGES: SleepTestPackage[] = [
  {
    id: 'sleep-pkg-level3',
    title: 'Level 3 Sleep Apnea Screening (Standard)',
    subtitle: 'Doorstep 7-channel test recommended for persistent snoring, daytime fatigue, and hypertension.',
    channels: 7,
    price: 3499,
    mrp: 6000,
    duration: '1 Night At-Home Study',
    badge: 'Most Popular',
    features: [
      'Overnight monitoring in your own bed with calibrated equipment',
      'Calculates accurate Apnea-Hypopnea Index (AHI) & Oxygen Desaturation (ODI)',
      'AASM standard clinical analysis validated by Sleep Specialist',
      'Doorstep equipment delivery & pickup by trained technician',
      '15-Minute telephonic doctor consultation included'
    ],
    reportDeliveryHours: 24,
    doctorConsultationIncluded: true
  },
  {
    id: 'sleep-pkg-level2',
    title: 'Level 2 Comprehensive Polysomnography (Advanced)',
    subtitle: 'Full 16-channel sleep test recording brain EEG waves, sleep stages, REM cycles, and limb movement.',
    channels: 16,
    price: 6999,
    mrp: 11000,
    duration: '1 Night Comprehensive Study',
    badge: 'Clinical Grade',
    features: [
      'Complete sleep staging (Deep NREM sleep, REM sleep, Sleep Latency)',
      'Dual EEG, EOG, EMG, ECG, Thoracic & Abdominal belts',
      'Detailed report for complex sleep disorders and insomnia differential diagnosis',
      'Home technician stays or sets up overnight recording',
      'Detailed 30-Minute Video Consultation with Senior Pulmonologist'
    ],
    reportDeliveryHours: 36,
    doctorConsultationIncluded: true
  },
  {
    id: 'sleep-pkg-titration',
    title: 'CPAP / BiPAP Titration Study',
    subtitle: 'Determines the optimal therapeutic pressure for your CPAP machine before purchasing.',
    channels: 8,
    price: 4999,
    mrp: 7500,
    duration: '1 Night Titration Trial',
    features: [
      'Trial of ResMed AutoSet CPAP device at your home',
      'Determines exact 90th percentile therapeutic pressure setting',
      'Mask fitting trial (Nasal Pillows vs Full Face Masks)',
      'Deductible: ₹2,000 credited back if you buy or rent CPAP from Buy Denmed'
    ],
    reportDeliveryHours: 24,
    doctorConsultationIncluded: true
  }
];

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'dental-clinic-setup-checklist-india',
    title: 'Complete 2026 Dental Clinic Setup Checklist: Equipment, Compliance & Budgeting',
    excerpt: 'Step-by-step equipment guide for dentists setting up their first clinic in India: from dental chairs to autoclaves and AERB radiation permissions.',
    content: `Setting up a modern dental operatory requires balancing clinical ergonomics, infection control regulations, and capital expenditure. In this comprehensive guide, we break down essential operatory units, oil-free compressors, Class B vacuum sterilization protocols, and digital radiography considerations.`,
    author: 'Dr. Rohan Verma',
    authorRole: 'MDS Oral & Maxillofacial Surgery, Clinical Advisor',
    publishedAt: '2026-10-18',
    readTime: '6 min read',
    category: 'Dental Clinic Management',
    coverImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    tags: ['Dental Clinic', 'Equipment Setup', 'Autoclave', 'AERB']
  },
  {
    id: 'post-2',
    slug: 'sleep-apnea-cpap-vs-bipap-guide',
    title: 'CPAP vs BiPAP: How Pulmonologists Choose the Right Therapy for Sleep Disordered Breathing',
    excerpt: 'Understand the mechanical and physiological differences between fixed CPAP, Auto-CPAP, and Bi-level VPAP ST for OSA, COPD, and hypoventilation.',
    content: `Positive airway pressure therapy remains the gold standard in managing obstructive sleep apnea. While CPAP delivers a single continuous pressure, BiPAP alternates between higher inspiratory (IPAP) and lower expiratory (EPAP) pressures, making exhalation substantially easier for patients with restrictive pulmonary conditions.`,
    author: 'Dr. Meera Iyer',
    authorRole: 'MD Pulmonary Medicine, Sleep Specialist',
    publishedAt: '2026-10-24',
    readTime: '8 min read',
    category: 'Respiratory Care',
    coverImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    tags: ['Sleep Apnea', 'CPAP', 'BiPAP', 'Pulmonology']
  },
  {
    id: 'post-3',
    slug: 'class-b-autoclave-sterilization-protocols',
    title: 'Why Class B Fractional Vacuum Autoclaves Are Mandatory for Modern Dental Handpieces',
    excerpt: 'Discover why standard Class N pressure cookers fail to sterilize narrow turbine lumens and how fractional vacuum eliminates cross-infection risks.',
    content: `Traditional downward displacement steam sterilizers cannot purge trapped air bubbles from inside narrow dental handpiece bearings and hollow contra-angles. Class B autoclaves utilize triple pre-vacuum pulses to guarantee total steam contact across every internal surface.`,
    author: 'Dr. Amitav Sen',
    authorRole: 'Hospital Sterilization Consultant',
    publishedAt: '2026-11-01',
    readTime: '5 min read',
    category: 'Sterilization & Safety',
    coverImage: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80',
    tags: ['Infection Control', 'Sterilization', 'Autoclave']
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'BDM-2026-89102',
    date: '2026-11-01T10:30:00Z',
    status: 'Dispatched',
    items: [
      {
        productId: 'prod-philips-everflo-5l',
        productName: 'Philips Respironics EverFlo 5 Litre Stationary Oxygen Concentrator',
        brandName: 'Philips Respironics',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        sku: 'PHI-EVF-5L-IN',
        quantity: 1,
        unitPrice: 48999,
        totalPrice: 48999
      },
      {
        productId: 'prod-omron-hem-7156',
        productName: 'Omron HEM-7156 Deluxe Upper Arm Blood Pressure Monitor with 360° Cuff',
        brandName: 'Omron Healthcare',
        image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
        sku: 'OMR-HEM-7156-IN',
        quantity: 2,
        unitPrice: 2499,
        totalPrice: 4998
      }
    ],
    subtotal: 53997,
    discount: 2500,
    shipping: 0,
    gstAmount: 6179,
    totalAmount: 57676,
    paymentMethod: 'Online Razorpay (Cards/UPI/EMI)',
    paymentStatus: 'Paid',
    shippingAddress: {
      id: 'addr-1',
      type: 'Clinic',
      name: 'Dr. Vikram Malhotra',
      clinicHospitalName: 'Malhotra Multi-Speciality Dental & Respiratory Center',
      phone: '+91 98112 34567',
      addressLine1: 'Suite 204, Metro Plaza, Sector 18',
      addressLine2: 'Near Sector 18 Metro Station',
      pincode: '201301',
      city: 'Noida',
      state: 'Uttar Pradesh',
      isDefault: true
    },
    gstDetails: {
      gstin: '09AAACM1234F1Z8',
      legalBusinessName: 'Malhotra Healthcare Pvt Ltd'
    },
    trackingNumber: 'BLUEDART-EXP-99214481',
    courierPartner: 'BlueDart Express Air Cargo',
    estimatedDelivery: '2026-11-04',
    timeline: [
      { status: 'Placed', date: '2026-11-01 10:30 AM', title: 'Order Placed', description: 'Payment of ₹57,676 verified via Razorpay.', completed: true },
      { status: 'Confirmed', date: '2026-11-01 11:45 AM', title: 'Verified by Procurement', description: 'Product serial numbers recorded and batch verified.', completed: true },
      { status: 'Packed', date: '2026-11-01 04:20 PM', title: 'Packed & Palletized', description: 'Shock-proof tamper evident packaging sealed with warranty cards.', completed: true },
      { status: 'Dispatched', date: '2026-11-02 09:15 AM', title: 'Dispatched via BlueDart', description: 'In transit to Noida hub. Tracking # BLUEDART-EXP-99214481.', completed: true },
      { status: 'Delivered', date: 'Expected 2026-11-04', title: 'Out for Delivery', description: 'Scheduled delivery to clinic address.', completed: false }
    ]
  }
];

export const MOCK_ACTIVE_RENTALS: ActiveRental[] = [
  {
    id: 'rent-201',
    equipmentName: 'Philips Respironics EverFlo 5 LPM Oxygen Concentrator',
    brand: 'Philips Respironics',
    serialNumber: 'PHI-EVF-2026-88194',
    startDate: '2026-09-15',
    tenureMonths: 6,
    monthlyRent: 4000,
    securityDeposit: 10000,
    nextRenewalDate: '2026-11-15',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'rent-202',
    equipmentName: 'KosmoCare Glide Premium Motorized Electric Wheelchair',
    brand: 'BPL Medical Technologies',
    serialNumber: 'KOS-GLD-993120',
    startDate: '2026-10-01',
    tenureMonths: 3,
    monthlyRent: 5200,
    securityDeposit: 15000,
    nextRenewalDate: '2026-12-01',
    status: 'Active',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80'
  }
];

export const MOCK_RENTALS: Rental[] = [
  {
    id: 'rnt-101',
    bookingNumber: 'BDM-RNT-2026-88194',
    product: MOCK_PRODUCTS.find((p) => p.id === 'prod-philips-everflo-5l') || MOCK_PRODUCTS[0],
    plan: { type: 'monthly', price: 4500, minDuration: 1, maxDuration: 12, freeMaintenance: true },
    duration: 3,
    startDate: '2026-09-15',
    endDate: '2026-12-15',
    deposit: 10000,
    rentAmount: 13500,
    charges: { deliveryPickup: 500, gst: 1620 },
    status: 'active',
    address: {
      id: 'addr-1',
      type: 'Clinic',
      name: 'Dr. Vikram Malhotra',
      clinicHospitalName: 'Malhotra Multi-Speciality Dental & Respiratory Center',
      phone: '+91 98112 34567',
      addressLine1: 'Suite 204, Metro Plaza, Sector 18',
      addressLine2: 'Near Sector 18 Metro Station',
      pincode: '201301',
      city: 'Noida',
      state: 'Uttar Pradesh',
      isDefault: true
    },
    payments: [
      {
        id: 'pay-rnt-01',
        amount: 25620,
        date: '2026-09-15 10:30 AM',
        method: 'Razorpay UPI (Axis Bank)',
        type: 'initial',
        status: 'paid',
        transactionId: 'pay_rzp_9921481'
      }
    ],
    createdAt: '2026-09-15T10:30:00Z'
  },
  {
    id: 'rnt-102',
    bookingNumber: 'BDM-RNT-2026-99312',
    product: MOCK_PRODUCTS.find((p) => p.id === 'prod-kosmocare-power-wheelchair') || MOCK_PRODUCTS[11],
    plan: { type: 'monthly', price: 6000, minDuration: 1, maxDuration: 6, freeMaintenance: true },
    duration: 2,
    startDate: '2026-09-01',
    endDate: '2026-11-01',
    deposit: 15000,
    rentAmount: 12000,
    charges: { deliveryPickup: 800, gst: 1440 },
    status: 'return_scheduled',
    returnPickupDate: '2026-11-05',
    address: {
      id: 'addr-1',
      type: 'Clinic',
      name: 'Dr. Vikram Malhotra',
      clinicHospitalName: 'Malhotra Multi-Speciality Dental & Respiratory Center',
      phone: '+91 98112 34567',
      addressLine1: 'Suite 204, Metro Plaza, Sector 18',
      addressLine2: 'Near Sector 18 Metro Station',
      pincode: '201301',
      city: 'Noida',
      state: 'Uttar Pradesh',
      isDefault: true
    },
    payments: [
      {
        id: 'pay-rnt-02',
        amount: 29240,
        date: '2026-09-01 11:15 AM',
        method: 'HDFC Corporate Credit Card',
        type: 'initial',
        status: 'paid',
        transactionId: 'pay_rzp_8841290'
      }
    ],
    createdAt: '2026-09-01T11:15:00Z'
  },
  {
    id: 'rnt-103',
    bookingNumber: 'BDM-RNT-2026-44210',
    product: MOCK_PRODUCTS.find((p) => p.id === 'prod-resmed-airsense-10') || MOCK_PRODUCTS[1],
    plan: { type: 'weekly', price: 1800, minDuration: 1, maxDuration: 4, freeMaintenance: true },
    duration: 2,
    startDate: '2026-11-01',
    endDate: '2026-11-15',
    deposit: 12000,
    rentAmount: 3600,
    charges: { deliveryPickup: 500, gst: 432 },
    status: 'pending_approval',
    address: {
      id: 'addr-1',
      type: 'Clinic',
      name: 'Dr. Vikram Malhotra',
      clinicHospitalName: 'Malhotra Multi-Speciality Dental & Respiratory Center',
      phone: '+91 98112 34567',
      addressLine1: 'Suite 204, Metro Plaza, Sector 18',
      pincode: '201301',
      city: 'Noida',
      state: 'Uttar Pradesh',
      isDefault: true
    },
    payments: [
      {
        id: 'pay-rnt-03',
        amount: 16532,
        date: '2026-11-01 02:40 PM',
        method: 'Razorpay UPI (NetBanking)',
        type: 'initial',
        status: 'paid',
        transactionId: 'pay_rzp_7739120'
      }
    ],
    createdAt: '2026-11-01T14:40:00Z'
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-philips-everflo',
    name: 'Dr. Anand Joshi',
    authorName: 'Dr. Anand Joshi',
    clinicName: 'Joshi Dental & Implant Clinic',
    city: 'Pune',
    rating: 5,
    title: 'Outstanding build quality and whisper quiet operation',
    comment: 'The Philips EverFlo 5 LPM has been running continuously in our clinic setup. Purity levels tested at 93.8% consistently. Fast pan-India dispatch and genuine serial number verified on Philips portal.',
    date: '2026-10-28',
    createdAt: '2026-10-28T10:00:00Z',
    isVerifiedBuyer: true,
    verifiedBuyer: true,
    status: 'approved',
    helpfulCount: 24,
    images: ['/images/prod_suction_machine_1793803542649.jpg']
  },
  {
    id: 'rev-2',
    productId: 'prod-philips-everflo',
    name: 'Dr. Shweta Kulkarni',
    authorName: 'Dr. Shweta Kulkarni',
    clinicName: 'Chest & Sleep Care Hospital',
    city: 'Bengaluru',
    rating: 5,
    title: 'Reliable life support unit with easy maintenance',
    comment: 'Compact footprint, light wheels for room-to-room transfer, and zero overheating even after 48-hour continuous runtime. Strongly recommend Buy Denmed for clinical procurement.',
    date: '2026-10-22',
    createdAt: '2026-10-22T14:30:00Z',
    isVerifiedBuyer: true,
    verifiedBuyer: true,
    status: 'approved',
    helpfulCount: 19
  },
  {
    id: 'rev-3',
    productId: 'prod-resmed-airsense10',
    name: 'Rajesh Malhotra',
    authorName: 'Rajesh Malhotra',
    city: 'Gurugram',
    rating: 5,
    title: 'Transformative sleep quality, my AHI dropped from 32 to 2.4',
    comment: 'Diagnosed with severe OSA via Buy Denmed home sleep test. Ordered this AutoSet CPAP unit with HumidAir heated humidifier. Whisper quiet, automatic pressure adjustment is seamless, and my daytime fatigue is completely gone.',
    date: '2026-10-18',
    createdAt: '2026-10-18T09:15:00Z',
    isVerifiedBuyer: true,
    verifiedBuyer: true,
    status: 'approved',
    helpfulCount: 38
  },
  {
    id: 'rev-4',
    productId: 'prod-resmed-airsense10',
    name: 'Dr. Vikram Sethi',
    authorName: 'Dr. Vikram Sethi',
    clinicName: 'Metro Sleep Disorders Clinic',
    city: 'Delhi NCR',
    rating: 4,
    title: 'Gold standard auto-titrating CPAP device',
    comment: 'We prescribe ResMed AirSense 10 to over 80% of our sleep apnea patients. Built-in cellular data telemetry makes remote compliance tracking very easy for pulmonologists.',
    date: '2026-10-05',
    createdAt: '2026-10-05T16:00:00Z',
    isVerifiedBuyer: true,
    verifiedBuyer: true,
    status: 'approved',
    helpfulCount: 15
  },
  {
    id: 'rev-5',
    productId: 'prod-nsk-pana-air',
    name: 'Dr. Harish Chawla',
    authorName: 'Dr. Harish Chawla',
    clinicName: 'Chawla Endodontic Specialty',
    city: 'New Delhi',
    rating: 5,
    title: 'Genuine Japanese NSK handpiece with super smooth torque',
    comment: 'Authenticity is always my primary worry with dental handpieces. The Pana Air FX from Buy Denmed came with official NSK warranty card and original serial engraving. Runs smoothly at 400,000 RPM with minimal vibration.',
    date: '2026-10-14',
    createdAt: '2026-10-14T11:20:00Z',
    isVerifiedBuyer: true,
    verifiedBuyer: true,
    status: 'approved',
    helpfulCount: 31,
    images: ['/images/prod_rotary_files_1793803543213.jpg']
  },
  {
    id: 'rev-6',
    productId: 'prod-woodpecker-ai-ray',
    name: 'Dr. Priya Nambiar',
    authorName: 'Dr. Priya Nambiar',
    clinicName: 'Apex Dental Care',
    city: 'Kochi',
    rating: 5,
    title: 'Crisp digital radiographs, ultra lightweight',
    comment: 'The 70kV high-frequency DC generator produces crystal clear images when paired with our Size 1.5 RVG sensor. Battery easily lasts 150+ exposures on a single charge.',
    date: '2026-10-11',
    createdAt: '2026-10-11T12:00:00Z',
    isVerifiedBuyer: true,
    verifiedBuyer: true,
    status: 'approved',
    helpfulCount: 22
  },
  {
    id: 'rev-7',
    productId: 'prod-3m-filtek-z250',
    name: 'Dr. Manasvi Roy',
    authorName: 'Dr. Manasvi Roy',
    city: 'Kolkata',
    rating: 5,
    title: 'Superb polishability and shade match',
    comment: 'Original 3M batch fresh stock with 2.5 years remaining shelf life. Great handling properties, non-sticky consistency, and very low polymerization shrinkage for class II restorations.',
    date: '2026-09-29',
    createdAt: '2026-09-29T15:45:00Z',
    isVerifiedBuyer: true,
    verifiedBuyer: true,
    status: 'approved',
    helpfulCount: 17
  },
  {
    id: 'rev-8',
    productId: 'prod-omron-hem-7120',
    name: 'Sunita Mehra',
    authorName: 'Sunita Mehra',
    city: 'Mumbai',
    rating: 5,
    title: 'Accurate clinical readings and simple one-touch operation',
    comment: 'Bought this for monitoring elderly parents daily blood pressure. The cuff fits securely and hypertension indicator alert is very clear. Delivered in 24 hours in Mumbai.',
    date: '2026-09-18',
    createdAt: '2026-09-18T10:10:00Z',
    isVerifiedBuyer: true,
    verifiedBuyer: true,
    status: 'approved',
    helpfulCount: 12
  }
];
