import { Product, Category, Brand, Coupon, BlogPost, SleepTestPackage, Order, ActiveRental, Rental, Review } from '@/types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-respiratory',
    name: 'Respiratory Care',
    slug: 'respiratory-care',
    icon: 'Wind',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    description: 'Medical-grade oxygen concentrators, CPAP/BiPAP devices, high-efficiency nebulizers, and respiratory consumables.',
    itemCount: 48,
    subCategories: [
      {
        id: 'sub-oxygen',
        name: 'Oxygen Concentrators',
        slug: 'oxygen-concentrators',
        itemCount: 16,
        items: ['5L Stationary Concentrators', '10L Dual Flow Concentrators', 'Portable Travel Concentrators', 'Oxygen Cannulas & Tubing']
      },
      {
        id: 'sub-cpap',
        name: 'CPAP & BiPAP Devices',
        slug: 'cpap-bipap-devices',
        itemCount: 14,
        items: ['Auto CPAP Machines', 'BiPAP ST & AVAPS Units', 'Nasal & Full Face Masks', 'Humidifier Chambers & Filters']
      },
      {
        id: 'sub-nebulizer',
        name: 'Nebulizers & Inhalers',
        slug: 'nebulizers-inhalers',
        itemCount: 10,
        items: ['Compressor Nebulizers', 'Mesh Ultrasonic Nebulizers', 'Pediatric Nebulizers', 'Nebulizer Medication Cups']
      },
      {
        id: 'sub-oximeter',
        name: 'Pulse Oximeters',
        slug: 'pulse-oximeters',
        itemCount: 8,
        items: ['Fingertip Pulse Oximeters', 'Tabletop Oximeters', 'Pediatric Oximeters', 'SpO2 Reusable Probes']
      }
    ]
  },
  {
    id: 'cat-dental-equipment',
    name: 'Dental Operatory & Units',
    slug: 'dental-operatory-units',
    icon: 'Armchair',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
    description: 'Ergonomic dental chair units, silent oil-free compressors, motorized suction systems, and operatory delivery lights.',
    itemCount: 36,
    subCategories: [
      {
        id: 'sub-chairs',
        name: 'Dental Chairs & Units',
        slug: 'dental-chairs',
        itemCount: 12,
        items: ['Electrically Operated Dental Chairs', 'Hydraulic Operatory Units', 'Ambidextrous Chairs', 'Doctor & Assistant Stools']
      },
      {
        id: 'sub-compressors',
        name: 'Oil-Free Air Compressors',
        slug: 'oil-free-air-compressors',
        itemCount: 8,
        items: ['Single Chair 1HP Compressors', 'Multi-Chair 2HP/3HP Units', 'Air Dryers & Moisture Filters']
      },
      {
        id: 'sub-suction',
        name: 'Dental Suction Systems',
        slug: 'dental-suction-systems',
        itemCount: 7,
        items: ['Wet Suction Units', 'Dry Vacuum Motor Pumps', 'Mobile Operatory Suctions', 'Cannula Tips']
      },
      {
        id: 'sub-lights',
        name: 'Operatory Lights & Mounts',
        slug: 'operatory-lights',
        itemCount: 9,
        items: ['LED Sensor Operating Lights', 'Halogen Dental Lamps', 'Ceiling Suspended Lights']
      }
    ]
  },
  {
    id: 'cat-dental-handpieces',
    name: 'Dental Handpieces & Motors',
    slug: 'dental-handpieces-motors',
    icon: 'Activity',
    image: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
    description: 'Precision Japanese and European high-speed turbines, surgical contra-angles, cordless endomotors, and piezo ultrasonic scalers.',
    itemCount: 52,
    subCategories: [
      {
        id: 'sub-airorot',
        name: 'High Speed Airotors',
        slug: 'high-speed-airotors',
        itemCount: 18,
        items: ['LED Push Button Turbines', 'Torque Head Handpieces', 'Miniature Pediatric Heads', '4-Hole & Borden 2-Hole']
      },
      {
        id: 'sub-micromotor',
        name: 'Low Speed Micromotors',
        slug: 'low-speed-micromotors',
        itemCount: 12,
        items: ['Electric Brushless Micromotors', 'Pneumatic Air Motors', '1:1 Direct Drive Contra Angles', '1:5 Increasing Handpieces']
      },
      {
        id: 'sub-endomotor',
        name: 'Endomotors & Apex Locators',
        slug: 'endomotors-apex-locators',
        itemCount: 14,
        items: ['Cordless Endodontic Motors', 'Dual Integrated Apex Locators', 'Reciprocating Rotary Motors']
      },
      {
        id: 'sub-scalers',
        name: 'Piezo Ultrasonic Scalers',
        slug: 'ultrasonic-scalers',
        itemCount: 8,
        items: ['Built-in Scaler Units', 'Detachable LED Handpiece Scalers', 'Subgingival Perio Tips']
      }
    ]
  },
  {
    id: 'cat-dental-materials',
    name: 'Dental Consumables & Materials',
    slug: 'dental-consumables-materials',
    icon: 'Boxes',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    description: 'Universal nano-hybrid composites, self-etch adhesives, rotary NiTi endo files, impression silicones, and luting cements.',
    itemCount: 120,
    subCategories: [
      {
        id: 'sub-composites',
        name: 'Composites & Bonding',
        slug: 'composites-bonding',
        itemCount: 35,
        items: ['Universal Microhybrid Composites', 'Flowable Bulk Fill', 'Universal 7th/8th Gen Adhesives', 'Etching Gel 37%']
      },
      {
        id: 'sub-endo-files',
        name: 'Endodontic Rotary Files',
        slug: 'endodontic-rotary-files',
        itemCount: 28,
        items: ['Heat-Treated Gold Rotary Files', 'Reciprocating Single Files', 'Gutta Percha Points', 'Paper Points']
      },
      {
        id: 'sub-cements',
        name: 'Luting & Cements',
        slug: 'luting-cements',
        itemCount: 25,
        items: ['Resin Modified Glass Ionomer (RMGIC)', 'Resin Cements', 'Zinc Phosphate', 'Zinc Oxide Eugenol']
      },
      {
        id: 'sub-impression',
        name: 'Impression Materials',
        slug: 'impression-materials',
        itemCount: 32,
        items: ['Addition Silicone (PVS) Putty', 'Light Body Cartridges', 'Alginate Fast Set', 'Bite Registration Paste']
      }
    ]
  },
  {
    id: 'cat-autoclaves',
    name: 'Sterilization & Infection Control',
    slug: 'sterilization-infection-control',
    icon: 'ShieldCheck',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    description: 'Class B fractional vacuum autoclaves, ultrasonic instrument cleaners, heat sealers, and medical-grade disinfectants.',
    itemCount: 42,
    subCategories: [
      {
        id: 'sub-autoclaves',
        name: 'Class B & N Autoclaves',
        slug: 'class-b-autoclaves',
        itemCount: 15,
        items: ['18L Class B Vacuum Autoclaves', '23L/24L Dental Sterilizers', 'Semi-Automatic Front Loading']
      },
      {
        id: 'sub-ultrasonic',
        name: 'Ultrasonic Cleaners',
        slug: 'ultrasonic-cleaners',
        itemCount: 8,
        items: ['Digital Timer Ultrasonic Baths', 'Heated Cavitation Cleaners', 'Instrument Baskets']
      },
      {
        id: 'sub-pouches',
        name: 'Pouches & Heat Sealers',
        slug: 'pouches-heat-sealers',
        itemCount: 11,
        items: ['Continuous Rotary Sealers', 'Self-Sealing Sterilization Pouches', 'Chemical Indicator Strips']
      },
      {
        id: 'sub-disinfectants',
        name: 'Surface & Instrument Disinfectants',
        slug: 'disinfectants',
        itemCount: 8,
        items: ['Glutaraldehyde Solutions', 'Surface Spray Wipes', 'Enzymatic Cleaners']
      }
    ]
  },
  {
    id: 'cat-diagnostic',
    name: 'Diagnostic & Monitoring',
    slug: 'diagnostic-monitoring',
    icon: 'Stethoscope',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    description: 'Clinical digital blood pressure monitors, 12-lead ECG machines, acoustic stethoscopes, and glucose monitoring systems.',
    itemCount: 34,
    subCategories: [
      {
        id: 'sub-bp',
        name: 'Blood Pressure Monitors',
        slug: 'blood-pressure-monitors',
        itemCount: 14,
        items: ['Upper Arm Digital BP Monitors', 'Bluetooth Clinical BP Monitors', 'Ambulatory 24h ABPM Systems']
      },
      {
        id: 'sub-ecg',
        name: 'ECG / EKG Machines',
        slug: 'ecg-machines',
        itemCount: 8,
        items: ['3-Channel Portable ECG', '12-Channel Interpretive ECG', 'Thermal Recording Paper Rolls']
      },
      {
        id: 'sub-stethoscopes',
        name: 'Stethoscopes',
        slug: 'stethoscopes',
        itemCount: 6,
        items: ['Cardiology IV Stethoscopes', 'Classic Dual Head Stethoscopes', 'Pediatric Diagnostic Stethoscopes']
      },
      {
        id: 'sub-glucose',
        name: 'Glucose & Vitals',
        slug: 'glucose-vitals',
        itemCount: 6,
        items: ['Digital Glucometers', 'Blood Glucose Test Strips', 'Infrared Forehead Thermometers']
      }
    ]
  },
  {
    id: 'cat-critical-care',
    name: 'Critical Care & ICU Equipment',
    slug: 'critical-care',
    icon: 'HeartPulse',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    description: 'Multi-para bedside patient monitors, precision syringe pumps, volumetric infusion pumps, emergency defibrillators, and ICU ventilation essentials.',
    itemCount: 29,
    subCategories: [
      {
        id: 'sub-patient-monitors',
        name: 'Multi-Para Patient Monitors',
        slug: 'patient-monitors',
        itemCount: 10,
        items: ['12-inch 5-Para Monitors', 'Modular High-Acuity ICU Monitors', 'Transport Patient Monitors', 'Central Monitoring Systems']
      },
      {
        id: 'sub-pumps',
        name: 'Infusion & Syringe Pumps',
        slug: 'infusion-syringe-pumps',
        itemCount: 8,
        items: ['Dual Channel Syringe Pumps', 'Volumetric IV Infusion Pumps', 'Dose Error Reduction Systems', 'Target Controlled Infusion']
      },
      {
        id: 'sub-defib',
        name: 'Defibrillators & AEDs',
        slug: 'defibrillators-aeds',
        itemCount: 6,
        items: ['Biphasic Defibrillator Monitors', 'Public Access AED Units', 'Adult & Pediatric Defib Pads', 'Internal Paddles']
      },
      {
        id: 'sub-icu-suction',
        name: 'Medical Suction Apparatus',
        slug: 'medical-suction-apparatus',
        itemCount: 5,
        items: ['Heavy Duty AC/DC Suction Units', 'Ward Mobile Suction Systems', 'Bacterial Filters & Canisters']
      },
      {
        id: 'sub-icu-ventilators',
        name: 'Transport & ICU Ventilators',
        slug: 'icu-ventilators',
        itemCount: 5,
        items: ['Turbine-Driven Non-Invasive Ventilators', 'Emergency Transport Resuscitators', 'High Flow Oxygen Therapy Units']
      },
      {
        id: 'sub-hospital-furniture',
        name: 'Hospital Furniture & ICU Beds',
        slug: 'hospital-furniture',
        itemCount: 6,
        items: ['5-Function Motorized ICU Beds', 'Emergency Crash Carts with Defib Tray', 'Overbed Tables']
      }
    ]
  },
  {
    id: 'cat-mobility',
    name: 'Mobility & Patient Care',
    slug: 'mobility-patient-care',
    icon: 'HeartHandshake',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80',
    description: 'Reclining and motorized wheelchairs, motorized 3-function hospital beds, alternating pressure air mattresses, and walker aids.',
    itemCount: 31,
    subCategories: [
      {
        id: 'sub-wheelchairs',
        name: 'Wheelchairs',
        slug: 'wheelchairs',
        itemCount: 12,
        items: ['Motorized Power Wheelchairs', 'Reclining High-Back Wheelchairs', 'Lightweight Aluminum Foldable Chairs']
      },
      {
        id: 'sub-beds',
        name: 'Hospital Beds & Furniture',
        slug: 'hospital-beds-furniture',
        itemCount: 8,
        items: ['Motorized 3-Function ICU Beds', 'Semi-Fowler Manual Beds', 'Overbed Dining Tables']
      },
      {
        id: 'sub-mattresses',
        name: 'Anti-Bedsore Air Mattresses',
        slug: 'air-mattresses',
        itemCount: 6,
        items: ['Bubble Pad Air Mattresses with Pump', 'Tubular Cell Alternating Pressure Mattresses']
      },
      {
        id: 'sub-walking-aids',
        name: 'Walking & Transfer Aids',
        slug: 'walking-aids',
        itemCount: 5,
        items: ['Adjustable Reciprocal Walkers', 'Patient Transfer Belts', 'Quad Canes & Crutches']
      }
    ]
  },
  {
    id: 'cat-radiology',
    name: 'Dental Radiology & Imaging',
    slug: 'dental-radiology-imaging',
    icon: 'Scan',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
    description: 'Portable DC high-frequency dental X-ray machines, ultra-HD CMOS RVG sensors, PSP phosphor plate scanners, and radiation lead shielding.',
    itemCount: 22,
    subCategories: [
      {
        id: 'sub-rvg',
        name: 'RVG Digital Sensors',
        slug: 'rvg-digital-sensors',
        itemCount: 8,
        items: ['Size 1 Pediatric CMOS Sensors', 'Size 2 Adult High Resolution RVG', 'Direct USB Sensor Systems']
      },
      {
        id: 'sub-portable-xray',
        name: 'Portable Dental X-Ray',
        slug: 'portable-dental-xray',
        itemCount: 6,
        items: ['Handheld High-Frequency DC X-Ray', 'Wall-Mounted Dental X-Rays', 'Scissor Arm X-Ray Units']
      },
      {
        id: 'sub-psp',
        name: 'Phosphor Plate Scanners',
        slug: 'phosphor-plate-scanners',
        itemCount: 4,
        items: ['Compact Intraoral PSP Scanners', 'Laser Imaging Phosphor Plates']
      },
      {
        id: 'sub-radiation-shielding',
        name: 'Lead Aprons & Thyroid Collars',
        slug: 'radiation-shielding',
        itemCount: 4,
        items: ['0.5mm Pb Panoramic Lead Aprons', 'Thyroid Protection Collars']
      }
    ]
  },
  {
    id: 'cat-surgical-ortho',
    name: 'Surgical Instruments & Extraction',
    slug: 'surgical-instruments-extraction',
    icon: 'Scissors',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=600&q=80',
    description: 'German stainless steel dental extraction forceps, root elevators, implant surgical kits, bone rongeurs, and needle holders.',
    itemCount: 45,
    subCategories: [
      {
        id: 'sub-forceps',
        name: 'Dental Extraction Forceps',
        slug: 'extraction-forceps',
        itemCount: 15,
        items: ['Upper Molar Left & Right Forceps', 'Lower Universal Cowhorn Forceps', 'Pediatric Anatomical Forceps']
      },
      {
        id: 'sub-elevators',
        name: 'Root Elevators & Luxators',
        slug: 'elevators-luxators',
        itemCount: 12,
        items: ['Cryer Root Tip Elevators', 'Coupland Chisel Elevators', 'Micro Luxating Hybrids']
      },
      {
        id: 'sub-implant-tools',
        name: 'Implantology Surgical Kits',
        slug: 'implantology-surgical-kits',
        itemCount: 10,
        items: ['Torque Ratchet Wrench Sets', 'Trephine Drills & Trepans', 'Bone Graft Syringes']
      },
      {
        id: 'sub-sutures',
        name: 'Surgical Sutures & Blades',
        slug: 'sutures-blades',
        itemCount: 8,
        items: ['Braided Silk 3-0 Sutures', 'PGA Fast Absorbable Sutures', 'Carbon Steel #15 Surgical Blades']
      }
    ]
  },
  {
    id: 'cat-sleep-diagnostics',
    name: 'Sleep & Snoring Diagnostics',
    slug: 'sleep-snoring-diagnostics',
    icon: 'Moon',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
    description: 'Level 2/3 Home Sleep Apnea Test (HSAT) kits, overnight pulse oximetry, mandibular advancement devices, and CPAP titrators.',
    itemCount: 18,
    subCategories: [
      {
        id: 'sub-home-sleep-kits',
        name: 'Home Sleep Test Kits',
        slug: 'home-sleep-test-kits',
        itemCount: 6,
        items: ['7-Channel Level 3 Sleep Kits', '16-Channel Comprehensive PSG Kits', 'Disposable Wearable Sleep Rings']
      },
      {
        id: 'sub-cpap-masks',
        name: 'CPAP Masks & Headgear',
        slug: 'cpap-masks-headgear',
        itemCount: 8,
        items: ['Nasal Pillows Masks', 'Full Face Silicone Masks', 'Magnetic Clip Headgear Straps']
      },
      {
        id: 'sub-sleep-accessories',
        name: 'Heated Tubing & Filters',
        slug: 'sleep-accessories',
        itemCount: 4,
        items: ['ClimateLineAir Heated Tubes', 'Ultra-Fine Hypoallergenic Filters']
      }
    ]
  },
  {
    id: 'cat-clinic-setup',
    name: 'Hospital & Clinic Furniture',
    slug: 'clinic-furniture-setup',
    icon: 'Building2',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    description: 'Physician stools with lumbar support, heavy-duty stainless steel instrument trolleys, foldable privacy screens, and mayo stands.',
    itemCount: 26,
    subCategories: [
      {
        id: 'sub-stools',
        name: 'Ergonomic Doctor Stools',
        slug: 'doctor-stools',
        itemCount: 8,
        items: ['Saddle Ergonomic Stools with Tilting Seat', 'Assistant Stools with Torso Support Ring']
      },
      {
        id: 'sub-trolleys',
        name: 'Instrument Trolleys & Stands',
        slug: 'instrument-trolleys',
        itemCount: 10,
        items: ['304 Grade Stainless Steel 2-Tier Trolleys', 'Hydraulic Mayo Operating Stands']
      },
      {
        id: 'sub-screens',
        name: 'Examination Couches & Screens',
        slug: 'examination-couches',
        itemCount: 8,
        items: ['2-Section Medical Examination Tables', '4-Panel Mobile Ward Privacy Partitions']
      }
    ]
  }
];

export const MOCK_BRANDS: Brand[] = [
  {
    id: 'brand-philips',
    name: 'Philips Respironics',
    slug: 'philips-respironics',
    logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    originCountry: 'Netherlands / USA',
    description: 'Global pioneer in respiratory therapy, medical ventilation, and sleep apnea treatment trusted by leading hospitals worldwide.',
    authorizedDistributor: true,
    productCount: 18,
    featuredCategories: ['Respiratory Care', 'Sleep & Snoring Diagnostics']
  },
  {
    id: 'brand-resmed',
    name: 'ResMed',
    slug: 'resmed',
    logo: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    originCountry: 'Australia / USA',
    description: 'World-leading connected medical solutions for sleep disordered breathing, chronic obstructive pulmonary disease (COPD), and ventilation.',
    authorizedDistributor: true,
    productCount: 14,
    featuredCategories: ['Respiratory Care', 'Sleep & Snoring Diagnostics']
  },
  {
    id: 'brand-3m',
    name: '3M ESPE',
    slug: '3m-espe',
    logo: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
    originCountry: 'United States',
    description: 'Gold-standard dental restorative materials, Filtek universal composites, Scotchbond adhesives, and Impregum polyether impressions.',
    authorizedDistributor: true,
    productCount: 32,
    featuredCategories: ['Dental Consumables & Materials']
  },
  {
    id: 'brand-dentsply',
    name: 'Dentsply Sirona',
    slug: 'dentsply-sirona',
    logo: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    originCountry: 'United States / Germany',
    description: 'The world’s largest manufacturer of professional dental equipment, ProTaper rotary files, and dental operatory technologies.',
    authorizedDistributor: true,
    productCount: 26,
    featuredCategories: ['Dental Consumables & Materials', 'Dental Handpieces & Motors']
  },
  {
    id: 'brand-omron',
    name: 'Omron Healthcare',
    slug: 'omron-healthcare',
    logo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    originCountry: 'Japan',
    description: '#1 recommended blood pressure monitor and respiratory nebulizer brand by cardiologists and pulmonologists in India.',
    authorizedDistributor: true,
    productCount: 20,
    featuredCategories: ['Diagnostic & Monitoring', 'Respiratory Care']
  },
  {
    id: 'brand-bpl',
    name: 'BPL Medical Technologies',
    slug: 'bpl-medical-technologies',
    logo: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    originCountry: 'India',
    description: 'Premier Indian medical electronics manufacturer offering patient monitors, ECG machines, oxygen concentrators, and defibrillators.',
    authorizedDistributor: true,
    productCount: 22,
    featuredCategories: ['Critical Care & ICU', 'Diagnostic & Monitoring', 'Respiratory Care']
  },
  {
    id: 'brand-wh',
    name: 'W&H Dentalwerk',
    slug: 'wh-dentalwerk',
    logo: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80',
    originCountry: 'Austria',
    description: 'Austrian precision engineering for dental surgical units, implant motors, high-speed LED turbines, and sterilization systems.',
    authorizedDistributor: true,
    productCount: 16,
    featuredCategories: ['Dental Handpieces & Motors', 'Sterilization & Infection Control']
  },
  {
    id: 'brand-woodpecker',
    name: 'Woodpecker Guilin',
    slug: 'woodpecker-guilin',
    logo: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=240&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80',
    originCountry: 'Global / Guilin',
    description: 'Industry-standard ultrasonic piezo scalers, cordless endomotors, portable dental X-rays, and intraoral RVG sensors.',
    authorizedDistributor: true,
    productCount: 29,
    featuredCategories: ['Dental Handpieces & Motors', 'Dental Radiology & Imaging']
  }
];

export const MOCK_PRODUCTS: Product[] = [
  // 1. Philips EverFlo 5L
  {
    id: 'prod-philips-everflo-5l',
    slug: 'philips-respironics-everflo-5l-oxygen-concentrator',
    name: 'Philips Respironics EverFlo 5 Litre Stationary Oxygen Concentrator',
    brandId: 'brand-philips',
    brandName: 'Philips Respironics',
    categoryId: 'cat-respiratory',
    categoryName: 'Respiratory Care',
    subCategory: 'Oxygen Concentrators',
    subCategorySlug: 'oxygen-concentrators',
    sku: 'PHI-EVF-5L-IN',
    price: 48999,
    mrp: 68000,
    discountPercentage: 28,
    rating: 4.8,
    reviewsCount: 142,
    inStock: true,
    stockCount: 18,
    isDealOfDay: true,
    dealExpiresAt: '2026-11-04T23:59:59Z',
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 2299,
    rentEnabled: true,
    rentPricePerMonth: 4500,
    securityDeposit: 10000,
    deliveryPickupCharge: 500,
    images: [
      { url: '/images/prod_oxygen_main.jpg', alt: 'Front view with digital flow display', type: 'main' },
      { url: '/images/prod_oxygen_angle.jpg', alt: '45 degree side angle profile', type: 'angle' },
      { url: '/images/prod_oxygen_detail.jpg', alt: 'Close-up of flow control valve and purity sensor', type: 'detail' },
      { url: '/images/prod_oxygen_inuse.jpg', alt: 'In-use oxygen therapy with nasal cannula', type: 'in-use' },
      { url: '/images/prod_oxygen_box.jpg', alt: 'Standard kit with humidifier bottle and cannulas', type: 'box-contents' },
      { url: '/images/prod_oxygen_infographic.jpg', alt: 'Dimensions, 93% purity and decibel rating infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_oxygen_main.jpg',
    image: '/images/prod_oxygen_main.jpg',
    shortDescription: 'Quiet, lightweight 5 LPM oxygen concentrator engineered for continuous 24/7 medical therapy with low power consumption.',
    description: 'The Philips Respironics EverFlo stationary oxygen concentrator produces continuous medical-grade oxygen at 93% ± 3% purity. Weighing only 14 kg with smooth caster wheels, it is remarkably compact, quiet (<45 dBA), and delivers up to 5 Litres Per Minute. Equipped with an integrated OPI (Oxygen Percentage Indicator) ultrasound sensor that verifies oxygen purity and safety in real-time.',
    specifications: {
      'Flow Rate': '0.5 to 5.0 Litres/min',
      'Oxygen Purity': '93% ± 3% at all flow rates',
      'Sound Level': 'Less than 45 dBA',
      'Power Consumption': 'Approx. 350 Watts',
      'Dimensions': '58.4 cm H x 38.1 cm W x 24.1 cm D',
      'Weight': '14.1 kg',
      'Alarm System': 'Low Oxygen (<82%), Low Flow, Power Outage',
      'Country of Origin': 'USA / Netherlands'
    },
    features: [
      'Ultra-compact design fits smoothly into clinic or home bedrooms',
      'Metal cannula connection for extended durability and leak-prevention',
      'Integrated recessed flowmeter prevents accidental knob bumps',
      'Low power consumption minimizes clinic electricity bills',
      'Continuous 24-hour operation rating with 3-year factory warranty'
    ],
    warranty: '3 Years Comprehensive Manufacturer Warranty with on-site service support across Tier 1 & Tier 2 Indian cities.',
    variants: [
      { id: 'v-standard', name: 'Standard Unit with OPI', sku: 'PHI-EVF-5L-OPI', price: 48999, mrp: 68000, inStock: true, stockCount: 18 },
      { id: 'v-with-pulse', name: 'Combo: Unit + Fingertip Oximeter + 5 Cannulas', sku: 'PHI-EVF-COMBO', price: 50499, mrp: 71500, inStock: true, stockCount: 9 }
    ],
    emiPlans: [
      { tenureMonths: 3, monthlyAmount: 16333, bankName: 'HDFC / ICICI / SBI', interestRate: 0, isNoCost: true },
      { tenureMonths: 6, monthlyAmount: 8450, bankName: 'Bajaj Finserv / Axis', interestRate: 12 },
      { tenureMonths: 9, monthlyAmount: 5820, bankName: 'Kotak / Standard Chartered', interestRate: 13 },
      { tenureMonths: 12, monthlyAmount: 4510, bankName: 'All Major Bank Cards', interestRate: 14 }
    ],
    rentalPlans: [
      { type: 'daily', price: 350, minDuration: 3, maxDuration: 14, freeMaintenance: true },
      { type: 'weekly', price: 1600, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 4500, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['US FDA Cleared', 'CE 0123 Certified', 'ISO 13485'],
    gstRate: 12
  },

  // 2. ResMed AirSense 10 AutoSet
  {
    id: 'prod-resmed-airsense-10',
    slug: 'resmed-airsense-10-autoset-cpap-machine',
    name: 'ResMed AirSense 10 AutoSet Tri-Pack CPAP with HumidAir & Mask',
    brandId: 'brand-resmed',
    brandName: 'ResMed',
    categoryId: 'cat-respiratory',
    categoryName: 'Respiratory Care',
    subCategory: 'CPAP & BiPAP Devices',
    subCategorySlug: 'cpap-bipap-devices',
    sku: 'RES-AS10-AUTOPK',
    price: 54990,
    mrp: 75000,
    discountPercentage: 27,
    rating: 4.9,
    reviewsCount: 98,
    inStock: true,
    stockCount: 14,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 2599,
    rentEnabled: true,
    rentPricePerMonth: 5000,
    securityDeposit: 12000,
    deliveryPickupCharge: 500,
    images: [
      { url: '/images/prod_cpap_main.jpg', alt: 'Front view with color display and integrated humidifier', type: 'main' },
      { url: '/images/prod_cpap_angle.jpg', alt: '45 degree angled side perspective', type: 'angle' },
      { url: '/images/prod_cpap_detail.jpg', alt: 'Close-up of push dial navigation and tube connector', type: 'detail' },
      { url: '/images/prod_cpap_inuse.jpg', alt: 'Peaceful night sleep therapy with mask in-use', type: 'in-use' },
      { url: '/images/prod_cpap_box.jpg', alt: 'Complete pack with humidifier chamber, heated tubing and bag', type: 'box-contents' },
      { url: '/images/prod_cpap_infographic.jpg', alt: 'Whisper-quiet 26dBA, AutoRamp pressure and cellular sync', type: 'infographic' },
    ],
    thumbnail: '/images/prod_cpap_main.jpg',
    image: '/images/prod_cpap_main.jpg',
    shortDescription: 'Auto-titrating CPAP device with built-in HumidAir heated humidifier and wireless sleep therapy tracking.',
    description: 'The ResMed AirSense 10 AutoSet is the premium auto-adjusting positive airway pressure machine for obstructive sleep apnea. Featuring AutoRamp with sleep onset detection, Climate Control technology, and built-in cellular connectivity that uploads sleep data directly to your sleep physician or the myAir app.',
    specifications: {
      'Operating Pressure Range': '4 to 20 cm H2O',
      'Sound Level': '26.6 dBA (whisper quiet)',
      'Dimensions': '11.6 cm x 25.5 cm x 15.0 cm',
      'Humidifier': 'Built-in HumidAir with ClimateLineAir option',
      'Weight': '1.24 kg',
      'Modes': 'AutoSet, CPAP',
      'Country of Origin': 'Australia'
    },
    features: [
      'AutoRamp begins with gentle pressure to help patients fall asleep easily',
      'Intelligent SmartStart detects inhalation and begins therapy automatically',
      'Ambient light sensor dims screen brightness automatically in the dark',
      'Includes premium AirFit N20 or F20 mask choice with package'
    ],
    warranty: '2 Years Manufacturer Warranty + 1 Year Extended Denmed Care Plan',
    variants: [
      { id: 'v-nasal', name: 'With AirFit N20 Nasal Mask', sku: 'RES-AS10-N20', price: 54990, mrp: 75000, inStock: true, stockCount: 10 },
      { id: 'v-fullface', name: 'With AirFit F20 Full Face Mask', sku: 'RES-AS10-F20', price: 57490, mrp: 79000, inStock: true, stockCount: 4 }
    ],
    emiPlans: [
      { tenureMonths: 3, monthlyAmount: 18330, bankName: 'All Major Banks', interestRate: 0, isNoCost: true },
      { tenureMonths: 6, monthlyAmount: 9480, bankName: 'HDFC / ICICI', interestRate: 12 },
      { tenureMonths: 12, monthlyAmount: 5060, bankName: 'Bajaj / Axis', interestRate: 14 }
    ],
    rentalPlans: [
      { type: 'daily', price: 400, minDuration: 3, maxDuration: 14, freeMaintenance: true },
      { type: 'weekly', price: 1800, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 5000, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['US FDA 510(k)', 'CE Marked', 'ISO 13485'],
    gstRate: 12
  },

  // 3. Omron HEM-7156
  {
    id: 'prod-omron-hem-7156',
    slug: 'omron-hem-7156-digital-blood-pressure-monitor',
    name: 'Omron HEM-7156 Deluxe Upper Arm Blood Pressure Monitor with 360° Accuracy Cuff',
    brandId: 'brand-omron',
    brandName: 'Omron Healthcare',
    categoryId: 'cat-diagnostic',
    categoryName: 'Diagnostic & Monitoring',
    subCategory: 'Blood Pressure Monitors',
    subCategorySlug: 'blood-pressure-monitors',
    sku: 'OMR-HEM-7156-IN',
    price: 2499,
    mrp: 3560,
    discountPercentage: 30,
    rating: 4.7,
    reviewsCount: 312,
    inStock: true,
    stockCount: 65,
    isDealOfDay: true,
    dealExpiresAt: '2026-11-04T23:59:59Z',
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_bp_main.jpg', alt: 'Front view with large LCD digital readout', type: 'main' },
      { url: '/images/prod_bp_angle.jpg', alt: '45 degree angle showing angled ergonomic display', type: 'angle' },
      { url: '/images/prod_bp_detail.jpg', alt: 'Close-up of reading display and 360 accuracy icon', type: 'detail' },
      { url: '/images/prod_bp_inuse.jpg', alt: 'Upper arm cuff application and measurement in-use', type: 'in-use' },
      { url: '/images/prod_bp_box.jpg', alt: 'Box contents with cuff, batteries and carry case', type: 'box-contents' },
      { url: '/images/prod_bp_infographic.jpg', alt: 'Clinical accuracy, memory capacity and dimensions infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_bp_main.jpg',
    image: '/images/prod_bp_main.jpg',
    shortDescription: 'Clinically validated digital BP monitor equipped with 360° IntelliWrap pre-formed arm cuff for foolproof accuracy.',
    description: 'The Omron HEM-7156 utilizes Omron’s patented IntelliSense technology and an IntelliWrap cuff (22-42 cm) that guarantees precise readings from any angle around your arm. Detects irregular heartbeats, body movement, and hypertension indicator icons.',
    specifications: {
      'Measurement Method': 'Oscillometric',
      'Blood Pressure Range': '0 to 299 mmHg (Accuracy ±3 mmHg)',
      'Pulse Range': '40 to 180 beats/min (Accuracy ±5%)',
      'Cuff Size': '22 - 42 cm (Fits normal & large arms)',
      'Memory': '60 Measurements with date & timestamp',
      'Power Source': '4 AA Batteries or Optional AC Adapter'
    },
    features: [
      '360° IntelliWrap Cuff snaps easily and fits without pinching',
      'Cuff Wrapping Guide indicator ensures optimal tightness',
      'Irregular Heartbeat detection alerts you of potential arrhythmia',
      'Averaging function calculates mean of last 3 readings taken in 10 mins'
    ],
    warranty: '3 Years Standard + 2 Years Extended Warranty on registering online.',
    certifications: ['AAMI / ESH Clinically Validated', 'CE', 'ISO 9001'],
    gstRate: 12
  },

  // 4. Woodpecker Endo Smart Plus
  {
    id: 'prod-woodpecker-endo-smart-plus',
    slug: 'woodpecker-endo-smart-plus-cordless-endomotor',
    name: 'Woodpecker Endo Smart Plus Cordless Endomotor with Built-in Apex Locator Link',
    brandId: 'brand-woodpecker',
    brandName: 'Woodpecker Guilin',
    categoryId: 'cat-dental-handpieces',
    categoryName: 'Dental Handpieces & Motors',
    subCategory: 'Endomotors & Apex Locators',
    subCategorySlug: 'endomotors-apex-locators',
    sku: 'WDK-ESP-END-01',
    price: 18500,
    mrp: 26000,
    discountPercentage: 29,
    rating: 4.8,
    reviewsCount: 84,
    inStock: true,
    stockCount: 22,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 1650,
    rentEnabled: false,
    images: [
      { url: '/images/prod_handpiece_main.jpg', alt: 'High-precision dental handpiece on white background', type: 'main' },
      { url: '/images/prod_handpiece_angle.jpg', alt: '45 degree profile view of ergonomic body and head', type: 'angle' },
      { url: '/images/prod_handpiece_detail.jpg', alt: 'Close-up of push-button chuck and optic LED spray nozzles', type: 'detail' },
      { url: '/images/prod_handpiece_inuse.jpg', alt: 'Clinical operatory restoration procedure in-use', type: 'in-use' },
      { url: '/images/prod_handpiece_box.jpg', alt: 'Autoclavable case with maintenance nozzles and tool', type: 'box-contents' },
      { url: '/images/prod_handpiece_infographic.jpg', alt: '400,000 RPM, torque power and anti-retraction head infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_handpiece_main.jpg',
    image: '/images/prod_handpiece_main.jpg',
    shortDescription: 'Brushless micro-motor with 360° rotatable miniature contra-angle head and reciprocal root canal filing modes.',
    description: 'The Woodpecker Endo Smart Plus is a state-of-the-art cordless endodontic handpiece. It can be paired wirelessly with Woodpecker apex locators (Ai-Pex) for real-time apical positioning. Delivers stable torque between 0.4Ncm - 5.0Ncm and speed from 100rpm - 1200rpm with 9 pre-programmed rotary file modes.',
    specifications: {
      'Speed Range': '100 rpm - 1,200 rpm',
      'Torque Range': '0.4 N.cm - 5.0 N.cm',
      'Contra-Angle Head': '6:1 Super Mini Head with 360° rotation',
      'Battery Capacity': '2000mAh Lithium Rechargeable',
      'Modes': 'Continuous Rotation, Reciprocation, Auto-Reverse'
    },
    features: [
      'German precision brushless motor with negligible vibration',
      'Miniature contra-angle head provides unrestricted view of molars',
      'Wireless charging dock with LED illuminated display',
      'Pre-calibrated profiles for Protaper, WaveOne, Hero, and custom files'
    ],
    warranty: '1 Year Comprehensive Warranty on Handpiece & Motor.',
    certifications: ['CE 0197', 'ISO 13485'],
    gstRate: 12
  },

  // 5. 3M Filtek Z250 Universal Composite
  {
    id: 'prod-3m-filtek-z250',
    slug: '3m-filtek-z250-universal-restorative-composite',
    name: '3M ESPE Filtek Z250 Universal Microhybrid Restorative Composite Syringe (4g)',
    brandId: 'brand-3m',
    brandName: '3M ESPE',
    categoryId: 'cat-dental-materials',
    categoryName: 'Dental Consumables & Materials',
    subCategory: 'Composites & Bonding',
    subCategorySlug: 'composites-bonding',
    sku: '3M-FLK-Z250-4G',
    price: 1199,
    mrp: 1750,
    discountPercentage: 31,
    rating: 4.9,
    reviewsCount: 220,
    inStock: true,
    stockCount: 140,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_composite_main.jpg', alt: 'Universal composite syringe on clean white background', type: 'main' },
      { url: '/images/prod_composite_angle.jpg', alt: '45 degree angle showing screw plunger and shade indicator', type: 'angle' },
      { url: '/images/prod_composite_detail.jpg', alt: 'Close-up of dispensing tip and shade label', type: 'detail' },
      { url: '/images/bento_dental_equip_1793803387280.jpg', alt: 'Clinical tray restorative preparation', type: 'in-use' },
      { url: '/images/prod_composite_syringe_1793803614187.jpg', alt: 'Multi-shade syringe package and dispenser accessories', type: 'box-contents' },
      { url: '/images/hero_dental_setup_1793803412433.jpg', alt: 'Nanohybrid polish retention and physical properties infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_composite_main.jpg',
    image: '/images/prod_composite_main.jpg',
    shortDescription: 'Esthetic universal composite suitable for both anterior and posterior restorations with fast 20-second light cure.',
    description: '3M Filtek Z250 is an esthetic microhybrid composite tested with over 15 years of clinical success. It offers low polymerization shrinkage, non-sticky handling, excellent fracture toughness, and long-term polish retention for high-stress posterior restorations.',
    specifications: {
      'Weight': '4 grams per syringe',
      'Filler Loading': '82% by weight (60% by volume)',
      'Curing Time': '20 seconds for standard shades',
      'Shelf Life': '3 Years from manufacturing date'
    },
    features: [
      'Excellent handling with zero stickiness to hand instruments',
      'Superior fracture toughness and abrasion resistance',
      'Radiopaque for clear post-op X-ray verification',
      'Available across popular Vita classical shades: A1, A2, A3, A3.5, B2'
    ],
    warranty: '100% Genuine 3M Product Guarantee with batch authentication code.',
    variants: [
      { id: 'v-a1', name: 'Shade A1', sku: '3M-Z250-A1', price: 1199, mrp: 1750, inStock: true, stockCount: 40 },
      { id: 'v-a2', name: 'Shade A2 (Most Popular)', sku: '3M-Z250-A2', price: 1199, mrp: 1750, inStock: true, stockCount: 65 },
      { id: 'v-a3', name: 'Shade A3', sku: '3M-Z250-A3', price: 1199, mrp: 1750, inStock: true, stockCount: 35 }
    ],
    certifications: ['US FDA Approved', 'CE 0086'],
    gstRate: 18
  },

  // 6. Euronda E8 Class B Autoclave 24L
  {
    id: 'prod-euronda-e8-autoclave',
    slug: 'euronda-e8-class-b-vacuum-autoclave-24l',
    name: 'Euronda E8 Italian Class B Pre & Post Vacuum Dental Autoclave (24 Litres)',
    brandId: 'brand-wh',
    brandName: 'W&H Dentalwerk',
    categoryId: 'cat-autoclaves',
    categoryName: 'Sterilization & Infection Control',
    subCategory: 'Class B & N Autoclaves',
    subCategorySlug: 'class-b-autoclaves',
    sku: 'EUR-E8-24L-IT',
    price: 189000,
    mrp: 235000,
    discountPercentage: 20,
    rating: 4.9,
    reviewsCount: 38,
    inStock: true,
    stockCount: 5,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 8900,
    rentEnabled: true,
    rentPricePerMonth: 12500,
    securityDeposit: 30000,
    deliveryPickupCharge: 1500,
    images: [
      { url: '/images/prod_autoclave_main.jpg', alt: 'Front view with stainless steel chamber door', type: 'main' },
      { url: '/images/prod_autoclave_angle.jpg', alt: '45 degree angled perspective on white background', type: 'angle' },
      { url: '/images/prod_autoclave_detail.jpg', alt: 'Close-up of touchscreen cycle parameters and USB logger', type: 'detail' },
      { url: '/images/prod_autoclave_inuse.jpg', alt: 'Dental assistant loading sterile instrument cassette', type: 'in-use' },
      { url: '/images/prod_autoclave_box.jpg', alt: 'Standard package with 4 stainless trays and drainage hose', type: 'box-contents' },
      { url: '/images/prod_autoclave_infographic.jpg', alt: 'Class B pre-vacuum sterilization specs and chamber capacity', type: 'infographic' },
    ],
    thumbnail: '/images/prod_autoclave_main.jpg',
    image: '/images/prod_autoclave_main.jpg',
    shortDescription: '100% Made in Italy EN 13060 compliant Class B fractional vacuum sterilizer with SD card data logging.',
    description: 'The Euronda E8 combines Italian design excellence with strict European medical sterilization standards (EN 13060). Features a fractional vacuum pump that removes 99.9% of air from porous and hollow handpiece channels prior to steam injection, guaranteeing absolute sterility.',
    specifications: {
      'Chamber Capacity': '24 Litres Stainless Steel AISI 304',
      'Chamber Dimensions': '250 mm dia x 440 mm depth',
      'Sterilization Cycles': '121°C & 134°C B-Cycles, Prion, Bowie & Dick Test',
      'Water Tank': 'Dual Clean & Waste Water Tanks with Conductivity Sensor',
      'Weight': '48 kg'
    },
    features: [
      'Complete Class B sterilization cycles for hollow body handpieces',
      'Integrated SD card automatically logs every sterilization cycle for legal audit compliance',
      'Conductivity sensor stops cycle if water quality is inadequate, protecting instruments',
      'Ultra-efficient thermodynamic drying leaves pouches bone dry'
    ],
    warranty: '2 Years Comprehensive Warranty + 10 Years Chamber Warranty',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 33400, bankName: 'HDFC / Axis Business Loan', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 17400, bankName: 'Bajaj Medical Equipment Finance', interestRate: 12 },
      { tenureMonths: 24, monthlyAmount: 9400, bankName: 'Doctor Loan Schemes', interestRate: 13 }
    ],
    rentalPlans: [
      { type: 'monthly', price: 12500, minDuration: 3, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['EN 13060 Class B', 'CE 0051', 'ISO 13485'],
    gstRate: 12
  },

  // 7. BPL Oxy 5 Neo
  {
    id: 'prod-bpl-oxy-5-neo',
    slug: 'bpl-oxy-5-neo-dual-flow-oxygen-concentrator',
    name: 'BPL Oxy 5 Neo Dual-Flow 5 LPM Medical Oxygen Concentrator',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-respiratory',
    categoryName: 'Respiratory Care',
    subCategory: 'Oxygen Concentrators',
    subCategorySlug: 'oxygen-concentrators',
    sku: 'BPL-OXY-5N-IN',
    price: 38500,
    mrp: 52000,
    discountPercentage: 26,
    rating: 4.6,
    reviewsCount: 76,
    inStock: true,
    stockCount: 20,
    isDealOfDay: true,
    dealExpiresAt: '2026-11-04T23:59:59Z',
    isBestSeller: false,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 1850,
    rentEnabled: true,
    rentPricePerMonth: 3800,
    images: [
      { url: '/images/prod_oxygen_main.jpg', alt: 'Front view with digital flow display', type: 'main' },
      { url: '/images/prod_oxygen_angle.jpg', alt: '45 degree side angle profile', type: 'angle' },
      { url: '/images/prod_oxygen_detail.jpg', alt: 'Close-up of flow control valve and purity sensor', type: 'detail' },
      { url: '/images/prod_oxygen_inuse.jpg', alt: 'In-use oxygen therapy with nasal cannula', type: 'in-use' },
      { url: '/images/prod_oxygen_box.jpg', alt: 'Standard kit with humidifier bottle and cannulas', type: 'box-contents' },
      { url: '/images/prod_oxygen_infographic.jpg', alt: 'Dimensions, 93% purity and decibel rating infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_oxygen_main.jpg',
    image: '/images/prod_oxygen_main.jpg',
    shortDescription: 'Reliable 5 LPM oxygen generator with dual flow outputs, nebulizer outlet, and high-temperature shutoff.',
    description: 'BPL Oxy 5 Neo provides continuous therapeutic oxygen at up to 93% ± 3% concentration. Built for Indian environmental conditions with voltage fluctuation tolerance and a dedicated auxiliary port for direct medication nebulization.',
    specifications: {
      'Flow Rate': '0.5 to 5 LPM',
      'Purity': '93% ± 3%',
      'Nebulizer Function': 'Integrated auxiliary port (≥0.15 mL/min)',
      'Weight': '15.5 kg',
      'Noise': '<46 dBA'
    },
    features: [
      'Dual flowmeters allow oxygen therapy for two patients simultaneously',
      'Built-in nebulization function eliminates need for separate machine',
      'Audio-visual alarms for power loss, low concentration, and overheating'
    ],
    warranty: '2 Years Manufacturer On-Site Service Warranty across 300+ Indian service centers.',
    emiPlans: [
      { tenureMonths: 3, monthlyAmount: 12833, bankName: 'Major Credit Cards', interestRate: 0, isNoCost: true },
      { tenureMonths: 6, monthlyAmount: 6650, bankName: 'HDFC / ICICI', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'monthly', price: 3800, minDuration: 1, maxDuration: 6, tenureMonths: 1, pricePerMonth: 3800, securityDeposit: 8000, installationFee: 500, freeMaintenance: true },
      { type: 'monthly', price: 3400, minDuration: 3, maxDuration: 12, tenureMonths: 3, pricePerMonth: 3400, securityDeposit: 8000, installationFee: 0, freeMaintenance: true }
    ],
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },

  // 8. Dentsply ProTaper Gold Rotary Files
  {
    id: 'prod-dentsply-protaper-gold',
    slug: 'dentsply-protaper-gold-rotary-niti-files-6-pack',
    name: 'Dentsply Sirona ProTaper Gold Assorted Rotary NiTi Files (Pack of 6, 25mm)',
    brandId: 'brand-dentsply',
    brandName: 'Dentsply Sirona',
    categoryId: 'cat-dental-materials',
    categoryName: 'Dental Consumables & Materials',
    subCategory: 'Endodontic Rotary Files',
    subCategorySlug: 'endodontic-rotary-files',
    sku: 'DEN-PTG-AST-25',
    price: 2650,
    mrp: 3400,
    discountPercentage: 22,
    rating: 4.9,
    reviewsCount: 189,
    inStock: true,
    stockCount: 85,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_rotary_files_1793803543213.jpg', alt: 'Endodontic rotary file pack on white background', type: 'main' },
      { url: '/images/prod_handpiece_angle.jpg', alt: '45 degree angle view attached to endomotor', type: 'angle' },
      { url: '/images/prod_handpiece_detail.jpg', alt: 'Close-up of gold heat-treated variable taper flutes', type: 'detail' },
      { url: '/images/hero_dental_setup_1793803412433.jpg', alt: 'Clinical endodontic shaping procedure in-use', type: 'in-use' },
      { url: '/images/prod_handpiece_box.jpg', alt: 'Blister pack with 6 assorted rotary file lengths', type: 'box-contents' },
      { url: '/images/prod_handpiece_infographic.jpg', alt: 'Cyclic fatigue resistance and taper geometry infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_rotary_files_1793803543213.jpg',
    image: '/images/prod_rotary_files_1793803543213.jpg',
    shortDescription: 'Patented gold thermal metallurgy delivers 2.4x greater cyclical fatigue resistance and smooth anatomical navigation.',
    description: 'ProTaper Gold files feature the same exact geometries as ProTaper Universal, but are fortified by advanced metallurgy. The gold heat-treatment provides increased flexibility, allowing the files to smoothly follow curved root canals without canal transportation or ledge formation.',
    specifications: {
      'Pack Size': '6 Files (SX, S1, S2, F1, F2, F3)',
      'Length': '25 mm (Also available in 21mm & 31mm)',
      'Cross Section': 'Convex Triangular',
      'Recommended Speed': '250 - 300 rpm',
      'Recommended Torque': '1.5 - 3.0 N.cm'
    },
    features: [
      '2.4 times greater resistance to cyclic fatigue than traditional nickel-titanium',
      'Retains curvature without bouncing back, preventing ledging',
      'Convex triangular cross section maintains optimal cutting efficiency',
      'Color-coded handles for quick clinical sequence identification'
    ],
    warranty: '100% Genuine Dentsply Sirona holographic seal guarantee.',
    variants: [
      { id: 'v-21mm', name: '21mm Assorted Pack', sku: 'DEN-PTG-AST-21', price: 2650, mrp: 3400, inStock: true, stockCount: 30 },
      { id: 'v-25mm', name: '25mm Assorted Pack (Standard)', sku: 'DEN-PTG-AST-25', price: 2650, mrp: 3400, inStock: true, stockCount: 85 },
      { id: 'v-31mm', name: '31mm Assorted Pack (Long)', sku: 'DEN-PTG-AST-31', price: 2750, mrp: 3550, inStock: true, stockCount: 20 }
    ],
    certifications: ['CE', 'ISO 13485'],
    gstRate: 18
  },

  // 9. Woodpecker i-Sensor H2 HD RVG
  {
    id: 'prod-woodpecker-i-sensor-h2',
    slug: 'woodpecker-i-sensor-h2-hd-digital-rvg-sensor',
    name: 'Woodpecker i-Sensor H2 Ultra-HD CMOS Intraoral Digital RVG Sensor (Size 2)',
    brandId: 'brand-woodpecker',
    brandName: 'Woodpecker Guilin',
    categoryId: 'cat-radiology',
    categoryName: 'Dental Radiology & Imaging',
    subCategory: 'RVG Digital Sensors',
    subCategorySlug: 'rvg-digital-sensors',
    sku: 'WDK-ISEN-H2-SZ2',
    price: 92000,
    mrp: 125000,
    discountPercentage: 26,
    rating: 4.8,
    reviewsCount: 52,
    inStock: true,
    stockCount: 11,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 4350,
    rentEnabled: false,
    images: [
      { url: '/images/prod_handpiece_main.jpg', alt: 'High-precision dental handpiece on white background', type: 'main' },
      { url: '/images/prod_handpiece_angle.jpg', alt: '45 degree profile view of ergonomic body and head', type: 'angle' },
      { url: '/images/prod_handpiece_detail.jpg', alt: 'Close-up of push-button chuck and optic LED spray nozzles', type: 'detail' },
      { url: '/images/prod_handpiece_inuse.jpg', alt: 'Clinical operatory restoration procedure in-use', type: 'in-use' },
      { url: '/images/prod_handpiece_box.jpg', alt: 'Autoclavable case with maintenance nozzles and tool', type: 'box-contents' },
      { url: '/images/prod_handpiece_infographic.jpg', alt: '400,000 RPM, torque power and anti-retraction head infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_handpiece_main.jpg',
    image: '/images/prod_handpiece_main.jpg',
    shortDescription: 'High-contrast 25 lp/mm resolution CMOS sensor with 4.4mm ultra-slim profile and curved rounded edges.',
    description: 'The Woodpecker i-Sensor H2 sets a new benchmark in intraoral radiography with 25 line pairs/mm resolution. Featuring direct USB 2.0/3.0 connection without clumsy junction boxes, an IP68 waterproof rating for cold-liquid disinfection, and robust reinforced cable built to withstand over 70,000 bending cycles.',
    specifications: {
      'Sensor Technology': 'Advanced APS CMOS with Scintillator',
      'Theoretical Resolution': '25 lp/mm (True optical clarity)',
      'Dimensions': '30.4 x 41.9 x 4.4 mm (Active area 26 x 36 mm)',
      'Waterproof Rating': 'IP68 (Can be fully submerged in disinfectant)',
      'Cable Length': '3.0 Meters Direct USB',
      'Compatibility': 'Windows 7, 10, 11 (Supports TWAIN / DICOM)'
    },
    features: [
      'Ultra-thin 4.4mm profile provides patient comfort and reduces gag reflex',
      'Zero interface box: sensor connects directly to clinic PC USB port',
      'Free lifetime imaging software with root canal measurement and bone density tools',
      'Tested for up to 70,000 bends on the cable junction'
    ],
    warranty: '5 Years Manufacturer Replacement Warranty on Sensor Chip.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 16100, bankName: 'Major Credit Cards', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 8400, bankName: 'Doctor Equipment Finance', interestRate: 12 }
    ],
    certifications: ['US FDA 510(k)', 'CE 0197', 'AERB Compliant in India'],
    gstRate: 12
  },

  // 10. Omron NE-C28P Compressor Nebulizer
  {
    id: 'prod-omron-ne-c28p',
    slug: 'omron-ne-c28p-heavy-duty-compressor-nebulizer',
    name: 'Omron NE-C28P Heavy Duty Compressor Nebulizer with Virtual Valve Technology',
    brandId: 'brand-omron',
    brandName: 'Omron Healthcare',
    categoryId: 'cat-respiratory',
    categoryName: 'Respiratory Care',
    subCategory: 'Nebulizers & Inhalers',
    subCategorySlug: 'nebulizers-inhalers',
    sku: 'OMR-NEB-C28P',
    price: 2899,
    mrp: 3990,
    discountPercentage: 27,
    rating: 4.8,
    reviewsCount: 164,
    inStock: true,
    stockCount: 42,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_nebulizer_main.jpg', alt: 'Main front view on white background', type: 'main' },
      { url: '/images/prod_nebulizer_angle.jpg', alt: '45 degree side perspective view', type: 'angle' },
      { url: '/images/prod_nebulizer_detail.jpg', alt: 'Close-up of medication chamber and venturi valve', type: 'detail' },
      { url: '/images/prod_nebulizer_inuse.jpg', alt: 'In-use clinical therapy with patient mask', type: 'in-use' },
      { url: '/images/prod_nebulizer_box.jpg', alt: 'Package contents with masks, tubing and filters', type: 'box-contents' },
      { url: '/images/prod_nebulizer_infographic.jpg', alt: 'Technical specifications and dimensions infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_nebulizer_main.jpg',
    image: '/images/prod_nebulizer_main.jpg',
    shortDescription: 'Robust clinical-grade compressor nebulizer designed for frequent clinic treatments and pediatric asthma care.',
    description: 'Omron NE-C28P is engineered for intensive clinical or home respiratory care. Employs Omron’s Virtual Valve Technology (V.V.T.) that adapts to the patient’s breathing pattern, dramatically reducing medication wastage while delivering optimal 3 µm MMAD particle size straight into the lower bronchioles.',
    specifications: {
      'Particle Size (MMAD)': 'Approx. 3.0 µm',
      'Nebulization Rate': 'High 0.5 mL/min (Short treatment time)',
      'Medication Cup Capacity': '7 mL maximum',
      'Operating Mode': 'Continuous duty compressor'
    },
    features: [
      'High-efficiency nebulization cuts inhalation duration by 40%',
      'Waterproof switch and robust heavy-duty casing',
      'Includes adult mask, child mask, mouthpiece, nosepiece, and 5 air filters'
    ],
    warranty: '3 Years Comprehensive Warranty from Omron Healthcare India.',
    certifications: ['CE', 'ISO 9001'],
    gstRate: 12
  },

  // 11. BPL Magna Patient Monitor (Multi-Para)
  {
    id: 'prod-bpl-magna-monitor',
    slug: 'bpl-magna-multi-para-patient-monitor',
    name: 'BPL Magna 10.4-inch Multi-Parameter Bedside Patient Monitor with ECG, SpO2 & NIBP',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Multi-Para Patient Monitors',
    subCategorySlug: 'patient-monitors',
    sku: 'BPL-MON-MAG-10',
    price: 49500,
    mrp: 66000,
    discountPercentage: 25,
    rating: 4.7,
    reviewsCount: 31,
    inStock: true,
    stockCount: 8,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 2350,
    rentEnabled: true,
    rentPricePerMonth: 5500,
    securityDeposit: 12000,
    deliveryPickupCharge: 600,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'Multi-parameter patient monitor front view on white background', type: 'main' },
      { url: '/images/prod_bp_angle.jpg', alt: '45 degree side view of display screen', type: 'angle' },
      { url: '/images/prod_bp_detail.jpg', alt: 'Close-up of ECG waveforms and numeric vitals display', type: 'detail' },
      { url: '/images/technician_setup_home_1793803357959.jpg', alt: 'Hospital bedside diagnostic monitoring in-use', type: 'in-use' },
      { url: '/images/prod_bp_box.jpg', alt: 'Standard monitor unit, SpO2 sensor, ECG cable and NIBP cuff', type: 'box-contents' },
      { url: '/images/prod_bp_infographic.jpg', alt: 'Waveform channels, battery backup and alarm system infographic', type: 'infographic' },
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: '10.4" TFT color display monitor with 5 standard vital parameters, arrhythmia analysis, and pacemaker detection.',
    description: 'BPL Magna provides precision vital-signs monitoring for operating theaters, ICUs, and post-op recovery. Tracks 3/5 lead ECG, digital SpO2 with perfusion index, oscillometric NIBP, Dual Temperature, and Respiration with audio-visual high/low alarms.',
    specifications: {
      'Display': '10.4 inch High Resolution TFT Color LCD',
      'Parameters': 'ECG, SpO2, NIBP, Respiration, Dual Temperature',
      'Battery Backup': 'Up to 3 hours continuous monitoring',
      'Data Storage': '168 hours graphic and tabular trends'
    },
    features: [
      'Anti-high-frequency electrotome and defibrillation synchronization',
      'Drug dose calculation and titration table built-in',
      'Direct thermal recorder ready (optional upgrade)'
    ],
    warranty: '2 Years Manufacturer Warranty + 2 Free Preventive Calibration Visits.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 8650, bankName: 'Major Credit Cards', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 4550, bankName: 'Doctor Equipment Loan', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'daily', price: 450, minDuration: 3, maxDuration: 14, freeMaintenance: true },
      { type: 'weekly', price: 2000, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 5500, minDuration: 1, maxDuration: 6, freeMaintenance: true }
    ],
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },

  // 12. KosmoCare Motorized Electric Wheelchair
  {
    id: 'prod-kosmocare-power-wheelchair',
    slug: 'kosmocare-glide-motorized-electric-wheelchair',
    name: 'KosmoCare Glide Premium Motorized Electric Foldable Wheelchair with Joystick Control',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-mobility',
    categoryName: 'Mobility & Patient Care',
    subCategory: 'Wheelchairs',
    subCategorySlug: 'wheelchairs',
    sku: 'KOS-GLD-PWR-01',
    price: 49999,
    mrp: 69900,
    discountPercentage: 28,
    rating: 4.8,
    reviewsCount: 44,
    inStock: true,
    stockCount: 12,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 2400,
    rentEnabled: true,
    rentPricePerMonth: 6000,
    securityDeposit: 15000,
    deliveryPickupCharge: 800,
    images: [
      { url: '/images/prod_wheelchair_main.jpg', alt: 'Front centered view on white background', type: 'main' },
      { url: '/images/prod_wheelchair_angle.jpg', alt: '45 degree side view of frame and wheels', type: 'angle' },
      { url: '/images/prod_wheelchair_detail.jpg', alt: 'Close-up of joystick controller and armrest', type: 'detail' },
      { url: '/images/prod_wheelchair_inuse.jpg', alt: 'In-use outdoor mobility assistance', type: 'in-use' },
      { url: '/images/prod_wheelchair_box.jpg', alt: 'Folded unit, battery pack and intelligent charger', type: 'box-contents' },
      { url: '/images/prod_wheelchair_infographic.jpg', alt: 'Fold dimensions, weight capacity and range infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_wheelchair_main.jpg',
    image: '/images/prod_wheelchair_main.jpg',
    shortDescription: 'Heavy-duty foldable electric wheelchair with 360° sensitive joystick, electromagnetic brakes, and 20 km travel range.',
    description: 'Designed for effortless indoor and outdoor navigation. Features dual 250W silent brushless motors, high-grade anti-tip rear wheels, puncture-proof PU tires, and quick-fold mechanism that fits smoothly into standard car boots.',
    specifications: {
      'Motor Power': 'Dual 250W Heavy Duty Motors',
      'Battery': '24V 12Ah Lead Acid / Lithium option',
      'Speed': '1 to 6 km/h (5 Adjustable Speed Settings)',
      'Range': 'Up to 20 km on full charge',
      'Weight Capacity': 'Supports up to 120 kg patient weight',
      'Brake': 'Intelligent electromagnetic auto-stop'
    },
    features: [
      'Electromagnetic brakes halt automatically when releasing the joystick on slopes',
      'Removable breathable anti-microbial seat cushion',
      'Flip-up armrests allow convenient sliding onto hospital beds'
    ],
    warranty: '1 Year Warranty on Motor, Controller, and Battery.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 8750, bankName: 'Credit Cards & Bajaj EMI', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 4600, bankName: 'All Major Cards', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'weekly', price: 2200, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 6000, minDuration: 1, maxDuration: 6, freeMaintenance: true }
    ],
    certifications: ['CE', 'ISO 7176'],
    gstRate: 5
  },

  // 13. W&H Synea Fusion LED High Speed Turbine
  {
    id: 'prod-wh-synea-fusion-led',
    slug: 'wh-synea-fusion-led-dental-high-speed-handpiece',
    name: 'W&H Synea Fusion TG-98L LED Optical High-Speed Dental Turbine (Quattro Spray)',
    brandId: 'brand-wh',
    brandName: 'W&H Dentalwerk',
    categoryId: 'cat-dental-handpieces',
    categoryName: 'Dental Handpieces & Motors',
    subCategory: 'High Speed Airotors',
    subCategorySlug: 'high-speed-airotors',
    sku: 'WH-SYN-TG98L',
    price: 24500,
    mrp: 32000,
    discountPercentage: 23,
    rating: 4.9,
    reviewsCount: 67,
    inStock: true,
    stockCount: 15,
    isDealOfDay: true,
    dealExpiresAt: '2026-11-04T23:59:59Z',
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 2199,
    rentEnabled: false,
    images: [
      { url: '/images/prod_handpiece_main.jpg', alt: 'High-precision dental handpiece on white background', type: 'main' },
      { url: '/images/prod_handpiece_angle.jpg', alt: '45 degree profile view of ergonomic body and head', type: 'angle' },
      { url: '/images/prod_handpiece_detail.jpg', alt: 'Close-up of push-button chuck and optic LED spray nozzles', type: 'detail' },
      { url: '/images/prod_handpiece_inuse.jpg', alt: 'Clinical operatory restoration procedure in-use', type: 'in-use' },
      { url: '/images/prod_handpiece_box.jpg', alt: 'Autoclavable case with maintenance nozzles and tool', type: 'box-contents' },
      { url: '/images/prod_handpiece_infographic.jpg', alt: '400,000 RPM, torque power and anti-retraction head infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_handpiece_main.jpg',
    image: '/images/prod_handpiece_main.jpg',
    shortDescription: 'Austrian precision LED optical turbine featuring 4-hole Quattro spray and ceramic ball bearings for whisper quiet 390,000 RPM.',
    description: 'W&H Synea Fusion TG-98L delivers uncompromised Austrian reliability. The 4-port multi-spray provides 360° mist cooling over the entire preparation site, while the integrated LED+ light produces glare-free daylight-quality illumination with a high color rendering index (CRI >90).',
    specifications: {
      'Head Size': 'Standard Head (Ø 11.5 mm)',
      'Power': '21 Watts of robust cutting torque',
      'Operating Speed': '390,000 rpm',
      'Cooling Spray': 'Quattro Spray (4 Ports)',
      'Connection': 'Roto Quick Coupler / 4-Hole Midwest',
      'Bearing Type': 'Original Austrian Ceramic Ball Bearings'
    },
    features: [
      'Mono LED+ illuminates the preparation site with natural daylight tint',
      'Patented hygienic head system prevents aerosol suck-back into the turbine',
      'Push button chuck system with retention force over 30 Newtons',
      'Fully thermo-washer disinfectable and autoclavable up to 135°C'
    ],
    warranty: '1 Year Full Austrian Factory Warranty on Cartridge & Chuck.',
    certifications: ['CE 0051', 'EN ISO 14457', 'ISO 9001'],
    gstRate: 12
  },

  // 14. Confident Alwayz Dental Chair Unit
  {
    id: 'prod-confident-alwayz-chair',
    slug: 'confident-dental-alwayz-advanced-dental-chair-unit',
    name: 'Confident Dental Alwayz Advanced Microprocessor Operatory Dental Chair Unit',
    brandId: 'brand-dentsply',
    brandName: 'Dentsply Sirona',
    categoryId: 'cat-dental-equipment',
    categoryName: 'Dental Operatory & Units',
    subCategory: 'Dental Chairs & Units',
    subCategorySlug: 'dental-chairs',
    sku: 'CON-ALW-ADV-01',
    price: 165000,
    mrp: 215000,
    discountPercentage: 23,
    rating: 4.8,
    reviewsCount: 29,
    inStock: true,
    stockCount: 4,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 7900,
    rentEnabled: true,
    rentPricePerMonth: 11000,
    images: [
      { url: '/images/prod_chair_main.jpg', alt: 'Complete dental operatory chair unit with delivery unit', type: 'main' },
      { url: '/images/prod_chair_angle.jpg', alt: '45 degree side profile showing multi-articulating headrest', type: 'angle' },
      { url: '/images/prod_chair_detail.jpg', alt: 'Close-up of assistant capacitive touch console and sensor LED', type: 'detail' },
      { url: '/images/prod_chair_inuse.jpg', alt: 'Doctor and assistant treating patient in clinical operatory', type: 'in-use' },
      { url: '/images/prod_chair_box.jpg', alt: 'Operatory components, doctor stool and foot pedal control', type: 'box-contents' },
      { url: '/images/prod_chair_infographic.jpg', alt: 'Motorized movement programs, lux rating and plumbing specs', type: 'infographic' },
    ],
    thumbnail: '/images/prod_chair_main.jpg',
    image: '/images/prod_chair_main.jpg',
    shortDescription: 'Full microprocessor controlled dental chair with 2 preset programs, sensor LED light, and seamless upholstery.',
    description: 'The Confident Alwayz Operatory Chair features silent 24V DC Taiwanese actuators, a wide anatomical backrest, seamless anti-fungal upholstery, hanging type delivery unit with pneumatic locking arm, integrated ceramic spittoon with automatic tumbler filler, and multi-functional foot switch.',
    specifications: {
      'Movement': 'Microprocessor controlled electric motorized actuators',
      'Preset Positions': '2 programmable positions + Zero & Gargle position',
      'Delivery System': 'Over-the-patient continental/hanging delivery with 3 tubing slots',
      'Spittoon': 'Movable toughened ceramic bowl with timed rinse',
      'Operating Light': 'Sensor controlled Dual Intensity Cool LED Light'
    },
    features: [
      'Heavy cast-iron base ensures zero vibration during delicate surgical procedures',
      'Emergency safety stop mechanism triggers if obstruction is detected under chair',
      'Includes ergonomic operator stool with gas-spring height adjustment'
    ],
    warranty: '2 Years Comprehensive Warranty with free pan-India installation by certified technicians.',
    emiPlans: [
      { tenureMonths: 12, monthlyAmount: 15200, bankName: 'Doctor Equipment Finance Schemes', interestRate: 11 },
      { tenureMonths: 24, monthlyAmount: 8200, bankName: 'HDFC / ICICI Business', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'monthly', price: 11000, minDuration: 6, maxDuration: 24, tenureMonths: 12, pricePerMonth: 11000, securityDeposit: 35000, installationFee: 3000, freeMaintenance: true }
    ],
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },

  // 15. Level 3 Home Sleep Test Kit
  {
    id: 'prod-level-3-home-sleep-test-kit',
    slug: 'level-3-home-sleep-apnea-test-diagnostic-kit',
    name: 'Buy Denmed Level 3 Home Sleep Apnea Diagnostic Kit with Board Certified Doctor Report',
    brandId: 'brand-resmed',
    brandName: 'ResMed',
    categoryId: 'cat-sleep-diagnostics',
    categoryName: 'Sleep & Snoring Diagnostics',
    subCategory: 'Home Sleep Test Kits',
    subCategorySlug: 'home-sleep-test-kits',
    sku: 'BDM-HSAT-L3',
    price: 3499,
    mrp: 6000,
    discountPercentage: 42,
    rating: 4.9,
    reviewsCount: 204,
    inStock: true,
    stockCount: 50,
    isDealOfDay: true,
    dealExpiresAt: '2026-11-04T23:59:59Z',
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_cpap_main.jpg', alt: 'Front view with color display and integrated humidifier', type: 'main' },
      { url: '/images/prod_cpap_angle.jpg', alt: '45 degree angled side perspective', type: 'angle' },
      { url: '/images/prod_cpap_detail.jpg', alt: 'Close-up of push dial navigation and tube connector', type: 'detail' },
      { url: '/images/prod_cpap_inuse.jpg', alt: 'Peaceful night sleep therapy with mask in-use', type: 'in-use' },
      { url: '/images/prod_cpap_box.jpg', alt: 'Complete pack with humidifier chamber, heated tubing and bag', type: 'box-contents' },
      { url: '/images/prod_cpap_infographic.jpg', alt: 'Whisper-quiet 26dBA, AutoRamp pressure and cellular sync', type: 'infographic' },
    ],
    thumbnail: '/images/prod_cpap_main.jpg',
    image: '/images/prod_cpap_main.jpg',
    shortDescription: 'Convenient at-home overnight sleep test measuring AHI, SpO2, chest effort, and snoring with specialist consultation.',
    description: 'Diagnose Obstructive Sleep Apnea (OSA) in the comfort of your own bed without an expensive overnight hospital stay. Our technician delivers and sanitizes the calibrated 7-channel diagnostic device at your home in the evening, picks it up the following morning, and delivers a comprehensive AASM-compliant sleep diagnostic report validated by a certified Pulmonologist / Sleep Specialist within 24 hours.',
    specifications: {
      'Test Channels': '7 Channels (Airflow, Snoring, Thoracic Effort, SpO2, Pulse Rate, Body Position, Activity)',
      'Reporting Standard': 'AASM (American Academy of Sleep Medicine) Guidelines',
      'Doctor Consultation': 'Included (15-min tele-consultation with Sleep Specialist)',
      'Delivery & Pickup': 'Included at doorstep across 40+ major Indian cities'
    },
    features: [
      'Zero hospital stay hassle: test completed in your natural home sleep environment',
      'Calculates accurate Apnea-Hypopnea Index (AHI) and Oxygen Desaturation Index (ODI)',
      'Guidance on CPAP titration and personalized treatment roadmap'
    ],
    warranty: 'Guaranteed 24-hour report turnaround or 100% refund.',
    certifications: ['AASM Guidelines Compliant', 'CE Medical Device'],
    gstRate: 0 // Healthcare diagnostics exemption
  },

  // 16. 3M Single Bond Universal Adhesive
  {
    id: 'prod-3m-single-bond-universal',
    slug: '3m-single-bond-universal-adhesive-5ml',
    name: '3M ESPE Single Bond Universal Adhesive Bottle (5ml)',
    brandId: 'brand-3m',
    brandName: '3M ESPE',
    categoryId: 'cat-dental-materials',
    categoryName: 'Dental Consumables & Materials',
    subCategory: 'Composites & Bonding',
    subCategorySlug: 'composites-bonding',
    sku: '3M-SBU-5ML-IN',
    price: 2450,
    mrp: 3200,
    discountPercentage: 23,
    rating: 4.9,
    reviewsCount: 178,
    inStock: true,
    stockCount: 90,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_composite_main.jpg', alt: 'Universal composite syringe on clean white background', type: 'main' },
      { url: '/images/prod_composite_angle.jpg', alt: '45 degree angle showing screw plunger and shade indicator', type: 'angle' },
      { url: '/images/prod_composite_detail.jpg', alt: 'Close-up of dispensing tip and shade label', type: 'detail' },
      { url: '/images/bento_dental_equip_1793803387280.jpg', alt: 'Clinical tray restorative preparation', type: 'in-use' },
      { url: '/images/prod_composite_syringe_1793803614187.jpg', alt: 'Multi-shade syringe package and dispenser accessories', type: 'box-contents' },
      { url: '/images/hero_dental_setup_1793803412433.jpg', alt: 'Nanohybrid polish retention and physical properties infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_composite_main.jpg',
    image: '/images/prod_composite_main.jpg',
    shortDescription: 'One-bottle adhesive solution for total-etch, self-etch, and selective-etch with virtually zero post-op sensitivity.',
    description: '3M Single Bond Universal offers high bond strength to all surfaces (enamel, dentin, zirconia, precious metals, composites) without an extra primer. Features 3M’s unique silane-containing chemistry.',
    specifications: {
      'Volume': '5 ml bottle (Approx. 160 drops)',
      'Etching Techniques': 'Total-Etch, Self-Etch, Selective-Enamel-Etch',
      'Storage': 'Room temperature (no refrigeration required)'
    },
    features: [
      'Virtually zero post-operative sensitivity reported in clinical trials',
      'Bonds directly to zirconia, composite, and metal crowns without separate primer',
      'Flip-top cap allows one-handed dispensing with zero waste'
    ],
    warranty: '100% Original 3M Authentication guarantee.',
    certifications: ['US FDA Cleared', 'CE Marked'],
    gstRate: 18
  },

  // 17. Woodpecker Ai Ray Portable Dental X-Ray
  {
    id: 'prod-woodpecker-ai-ray-portable-xray',
    slug: 'woodpecker-ai-ray-handheld-dental-xray',
    name: 'Woodpecker Ai Ray Portable Handheld High-Frequency Dental X-Ray Machine',
    brandId: 'brand-woodpecker',
    brandName: 'Woodpecker Guilin',
    categoryId: 'cat-radiology',
    categoryName: 'Dental Radiology & Imaging',
    subCategory: 'Portable Dental X-Ray',
    subCategorySlug: 'portable-dental-xray',
    sku: 'WDK-AIRAY-XRAY-01',
    price: 88000,
    mrp: 115000,
    discountPercentage: 23,
    rating: 4.8,
    reviewsCount: 39,
    inStock: true,
    stockCount: 7,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 4100,
    rentEnabled: false,
    images: [
      { url: '/images/prod_handpiece_main.jpg', alt: 'High-precision dental handpiece on white background', type: 'main' },
      { url: '/images/prod_handpiece_angle.jpg', alt: '45 degree profile view of ergonomic body and head', type: 'angle' },
      { url: '/images/prod_handpiece_detail.jpg', alt: 'Close-up of push-button chuck and optic LED spray nozzles', type: 'detail' },
      { url: '/images/prod_handpiece_inuse.jpg', alt: 'Clinical operatory restoration procedure in-use', type: 'in-use' },
      { url: '/images/prod_handpiece_box.jpg', alt: 'Autoclavable case with maintenance nozzles and tool', type: 'box-contents' },
      { url: '/images/prod_handpiece_infographic.jpg', alt: '400,000 RPM, torque power and anti-retraction head infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_handpiece_main.jpg',
    image: '/images/prod_handpiece_main.jpg',
    shortDescription: 'Canon Japanese tube with 0.4mm focal spot for ultra-sharp diagnostic clarity and double lead radiation protection.',
    description: 'The Woodpecker Ai Ray handheld X-ray unit is powered by a high-frequency 70kV inverter and an authentic Canon tube. Features a 0.4mm focal spot that delivers crisp radiographic details, light 2.4 kg weight, 15000mAh Tesla-grade battery (over 1,500 exposures on a single charge), and 2.8" color touch screen.',
    specifications: {
      'Tube Voltage': '70 kV Constant Potential',
      'Tube Current': '2 mA',
      'Focal Spot': '0.4 mm (Canon D-043SB Tube)',
      'Exposure Time': '0.02 to 2.0 seconds',
      'Battery': '15000 mAh High Capacity Lithium',
      'Weight': '2.4 kg'
    },
    features: [
      'Internal double lead shielding guarantees minimal scatter radiation to operator',
      'High-capacity battery enables 1,500 shots per single USB-C fast charge',
      'Preset tooth selection modes for adult molars, incisors, and pediatric settings'
    ],
    warranty: '2 Years Warranty on Machine & Canon Tube.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 15400, bankName: 'All Credit Cards', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 8100, bankName: 'Doctor Equipment Finance', interestRate: 12 }
    ],
    certifications: ['AERB Certified (India)', 'CE', 'ISO 13485'],
    gstRate: 12
  },

  // 18. ResMed Lumis 150 VPAP ST BiPAP
  {
    id: 'prod-resmed-lumis-150-vpap',
    slug: 'resmed-lumis-150-vpap-st-bipap-device',
    name: 'ResMed Lumis 150 VPAP ST Non-Invasive BiPAP Ventilator with iVAPS',
    brandId: 'brand-resmed',
    brandName: 'ResMed',
    categoryId: 'cat-respiratory',
    categoryName: 'Respiratory Care',
    subCategory: 'CPAP & BiPAP Devices',
    subCategorySlug: 'cpap-bipap-devices',
    sku: 'RES-LUM-150-ST',
    price: 115000,
    mrp: 148000,
    discountPercentage: 22,
    rating: 4.9,
    reviewsCount: 47,
    inStock: true,
    stockCount: 6,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 5400,
    rentEnabled: true,
    rentPricePerMonth: 8500,
    images: [
      { url: '/images/prod_cpap_main.jpg', alt: 'Front view with color display and integrated humidifier', type: 'main' },
      { url: '/images/prod_cpap_angle.jpg', alt: '45 degree angled side perspective', type: 'angle' },
      { url: '/images/prod_cpap_detail.jpg', alt: 'Close-up of push dial navigation and tube connector', type: 'detail' },
      { url: '/images/prod_cpap_inuse.jpg', alt: 'Peaceful night sleep therapy with mask in-use', type: 'in-use' },
      { url: '/images/prod_cpap_box.jpg', alt: 'Complete pack with humidifier chamber, heated tubing and bag', type: 'box-contents' },
      { url: '/images/prod_cpap_infographic.jpg', alt: 'Whisper-quiet 26dBA, AutoRamp pressure and cellular sync', type: 'infographic' },
    ],
    thumbnail: '/images/prod_cpap_main.jpg',
    image: '/images/prod_cpap_main.jpg',
    shortDescription: 'Advanced non-invasive bi-level ventilator with intelligent Volume-Assured Pressure Support (iVAPS) for COPD patients.',
    description: 'ResMed Lumis 150 VPAP ST is tailored for non-dependent respiratory patients with respiratory insufficiency or obstructive sleep apnea. Features iVAPS mode that targets alveolar ventilation, intelligent Backup Rate (iBR), and AutoEPAP for upper airway patency.',
    specifications: {
      'IPAP Range': '4 to 25 cm H2O (Up to 30 cm H2O optional)',
      'EPAP Range': '2 to 25 cm H2O',
      'Modes': 'CPAP, S, T, ST, PAC, iVAPS',
      'Humidification': 'Integrated HumidAir Heated Tubing compatible',
      'Country of Origin': 'Australia'
    },
    features: [
      'iVAPS learns each patient’s unique respiratory rate and maintains alveolar targets',
      'QuickNav interface allows rapid switching between therapy profiles',
      'Built-in wireless reporting sends daily usage summaries to your clinician'
    ],
    warranty: '2 Years Manufacturer Warranty + 1 Year Complimentary AMC.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 20100, bankName: 'Major Banks', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 10550, bankName: 'Bajaj / Axis', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'monthly', price: 8500, minDuration: 1, maxDuration: 6, tenureMonths: 1, pricePerMonth: 8500, securityDeposit: 20000, installationFee: 1000, freeMaintenance: true },
      { type: 'monthly', price: 7500, minDuration: 3, maxDuration: 12, tenureMonths: 3, pricePerMonth: 7500, securityDeposit: 20000, installationFee: 0, freeMaintenance: true }
    ],
    certifications: ['US FDA Approved', 'CE 0123'],
    gstRate: 12
  },

  // 19. Woodpecker UDS-J Ultrasonic Scaler
  {
    id: 'prod-woodpecker-uds-j',
    slug: 'woodpecker-uds-j-piezoelectric-ultrasonic-scaler',
    name: 'Woodpecker UDS-J Compact Piezoelectric Dental Ultrasonic Scaler Unit',
    brandId: 'brand-woodpecker',
    brandName: 'Woodpecker Guilin',
    categoryId: 'cat-dental-handpieces',
    categoryName: 'Dental Handpieces & Motors',
    subCategory: 'Piezo Ultrasonic Scalers',
    subCategorySlug: 'ultrasonic-scalers',
    sku: 'WDK-UDSJ-SCL-01',
    price: 6800,
    mrp: 9500,
    discountPercentage: 28,
    rating: 4.7,
    reviewsCount: 115,
    inStock: true,
    stockCount: 35,
    isDealOfDay: true,
    dealExpiresAt: '2026-11-04T23:59:59Z',
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_handpiece_main.jpg', alt: 'High-precision dental handpiece on white background', type: 'main' },
      { url: '/images/prod_handpiece_angle.jpg', alt: '45 degree profile view of ergonomic body and head', type: 'angle' },
      { url: '/images/prod_handpiece_detail.jpg', alt: 'Close-up of push-button chuck and optic LED spray nozzles', type: 'detail' },
      { url: '/images/prod_handpiece_inuse.jpg', alt: 'Clinical operatory restoration procedure in-use', type: 'in-use' },
      { url: '/images/prod_handpiece_box.jpg', alt: 'Autoclavable case with maintenance nozzles and tool', type: 'box-contents' },
      { url: '/images/prod_handpiece_infographic.jpg', alt: '400,000 RPM, torque power and anti-retraction head infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_handpiece_main.jpg',
    image: '/images/prod_handpiece_main.jpg',
    shortDescription: 'Workhorse ultrasonic piezo scaler with automatic frequency tracking and 5 included scaler tips (G1, G2, P1).',
    description: 'The Woodpecker UDS-J is India’s most installed tabletop piezoelectric scaler. Digitally controlled, automatic frequency tracking ensures the machine works on the best frequency and steadily without paining sensitive tooth structures.',
    specifications: {
      'Frequency': '28kHz ± 3kHz',
      'Water Pressure': '0.01MPa - 0.5MPa',
      'Weight': '1.7 kg',
      'Package Includes': 'Scaler unit, Sealed Handpiece, Foot switch, 5 Tips, Torque Wrench'
    },
    features: [
      'Piezo-ceramic oscillation delivers gentle linear vibration without chipping enamel',
      'Automatic frequency tracking eliminates power fluctuation',
      'Small footprint occupies minimal space on clinic operatory trolleys'
    ],
    warranty: '1 Year Warranty on Main Unit.',
    certifications: ['CE 0197', 'ISO 9001'],
    gstRate: 12
  },

  // 20. Philips Respironics DreamWear Nasal Mask
  {
    id: 'prod-philips-dreamwear-mask',
    slug: 'philips-respironics-dreamwear-under-the-nose-nasal-mask',
    name: 'Philips Respironics DreamWear Under-the-Nose Nasal CPAP Mask with Headgear',
    brandId: 'brand-philips',
    brandName: 'Philips Respironics',
    categoryId: 'cat-sleep-diagnostics',
    categoryName: 'Sleep & Snoring Diagnostics',
    subCategory: 'CPAP Masks & Headgear',
    subCategorySlug: 'cpap-masks-headgear',
    sku: 'PHI-DWM-NAS-FIT',
    price: 4950,
    mrp: 6800,
    discountPercentage: 27,
    rating: 4.8,
    reviewsCount: 88,
    inStock: true,
    stockCount: 40,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_cpap_main.jpg', alt: 'Front view with color display and integrated humidifier', type: 'main' },
      { url: '/images/prod_cpap_angle.jpg', alt: '45 degree angled side perspective', type: 'angle' },
      { url: '/images/prod_cpap_detail.jpg', alt: 'Close-up of push dial navigation and tube connector', type: 'detail' },
      { url: '/images/prod_cpap_inuse.jpg', alt: 'Peaceful night sleep therapy with mask in-use', type: 'in-use' },
      { url: '/images/prod_cpap_box.jpg', alt: 'Complete pack with humidifier chamber, heated tubing and bag', type: 'box-contents' },
      { url: '/images/prod_cpap_infographic.jpg', alt: 'Whisper-quiet 26dBA, AutoRamp pressure and cellular sync', type: 'infographic' },
    ],
    thumbnail: '/images/prod_cpap_main.jpg',
    image: '/images/prod_cpap_main.jpg',
    shortDescription: 'Innovative top-of-head hose connection allows freedom to sleep in any position without red nasal bridge marks.',
    description: 'DreamWear’s top-of-head tubing connection allows CPAP users to sleep on their stomach, side, or back freely. Soft silicone airflow frame routes air gently through the frame, resting softly under the nose rather than pressing over the nasal bridge.',
    specifications: {
      'Sizes Included': 'FitPack includes 4 cushion sizes (Small, Medium, Medium-Wide, Large)',
      'Hose Connection': '360-degree top-swivel elbow',
      'Material': 'Medical-grade hypoallergenic silicone and fabric headgear'
    },
    features: [
      'Under-the-nose cushion prevents irritating red marks on nasal bridge',
      'Top-of-the-head hose swivel prevents bed partner disturbance and hose tangling',
      'Open line of sight enables wearing glasses or reading before sleep'
    ],
    warranty: '90 Days Manufacturer Warranty against manufacturing defects.',
    certifications: ['US FDA Cleared', 'CE'],
    gstRate: 12
  },

  // 21. BPL Cardiart 6108T ECG Machine
  {
    id: 'prod-bpl-cardiart-6108t',
    slug: 'bpl-cardiart-6108t-single-channel-ecg-machine',
    name: 'BPL Cardiart 6108T Single-Channel Portable Thermal ECG Machine',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-diagnostic',
    categoryName: 'Diagnostic & Monitoring',
    subCategory: 'ECG / EKG Machines',
    subCategorySlug: 'ecg-machines',
    sku: 'BPL-ECG-6108T',
    price: 24500,
    mrp: 31000,
    discountPercentage: 21,
    rating: 4.7,
    reviewsCount: 56,
    inStock: true,
    stockCount: 15,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 2200,
    rentEnabled: false,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'Multi-parameter patient monitor front view on white background', type: 'main' },
      { url: '/images/prod_bp_angle.jpg', alt: '45 degree side view of display screen', type: 'angle' },
      { url: '/images/prod_bp_detail.jpg', alt: 'Close-up of ECG waveforms and numeric vitals display', type: 'detail' },
      { url: '/images/technician_setup_home_1793803357959.jpg', alt: 'Hospital bedside diagnostic monitoring in-use', type: 'in-use' },
      { url: '/images/prod_bp_box.jpg', alt: 'Standard monitor unit, SpO2 sensor, ECG cable and NIBP cuff', type: 'box-contents' },
      { url: '/images/prod_bp_infographic.jpg', alt: 'Waveform channels, battery backup and alarm system infographic', type: 'infographic' },
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: 'Compact digital ECG recorder with high-resolution thermal printing, rechargeable battery, and auto baseline stabilizer.',
    description: 'BPL Cardiart 6108T is the quintessential clinic ECG machine for general practitioners, clinics, and mobile nursing homes. Features automatic and manual recording modes, high-contrast thermal array printer, digital filtering for muscle tremors and AC interference, and long-life rechargeable battery.',
    specifications: {
      'Leads': 'Standard 12 Leads',
      'Recording Modes': 'Manual & Auto Modes',
      'Printer': 'High Resolution Thermal Array (50mm paper)',
      'Battery': 'Rechargeable NiMH battery (Over 100 ECG recordings per charge)',
      'Weight': 'Lightweight 1.2 kg'
    },
    features: [
      'Automatic baseline stabilizer ensures noise-free trace reproduction',
      'Paper out audio-visual alert indicator',
      'Compact and portable with built-in sturdy carrying handle'
    ],
    warranty: '2 Years Manufacturer On-Site Service Warranty.',
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },

  // 22. Dentsply AH Plus Jet Root Canal Sealer
  {
    id: 'prod-dentsply-ah-plus-jet',
    slug: 'dentsply-ah-plus-jet-root-canal-sealer-automix',
    name: 'Dentsply Sirona AH Plus Jet Automix Root Canal Sealer (15g Syringe)',
    brandId: 'brand-dentsply',
    brandName: 'Dentsply Sirona',
    categoryId: 'cat-dental-materials',
    categoryName: 'Dental Consumables & Materials',
    subCategory: 'Luting & Cements',
    subCategorySlug: 'luting-cements',
    sku: 'DEN-AHP-JET-15',
    price: 4350,
    mrp: 5400,
    discountPercentage: 19,
    rating: 4.9,
    reviewsCount: 130,
    inStock: true,
    stockCount: 45,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_composite_main.jpg', alt: 'Universal composite syringe on clean white background', type: 'main' },
      { url: '/images/prod_composite_angle.jpg', alt: '45 degree angle showing screw plunger and shade indicator', type: 'angle' },
      { url: '/images/prod_composite_detail.jpg', alt: 'Close-up of dispensing tip and shade label', type: 'detail' },
      { url: '/images/bento_dental_equip_1793803387280.jpg', alt: 'Clinical tray restorative preparation', type: 'in-use' },
      { url: '/images/prod_composite_syringe_1793803614187.jpg', alt: 'Multi-shade syringe package and dispenser accessories', type: 'box-contents' },
      { url: '/images/hero_dental_setup_1793803412433.jpg', alt: 'Nanohybrid polish retention and physical properties infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_composite_main.jpg',
    image: '/images/prod_composite_main.jpg',
    shortDescription: 'Gold-standard epoxy resin root canal sealer in an automix syringe for bubble-free direct root canal delivery.',
    description: 'AH Plus is celebrated worldwide for its outstanding dimensional stability, exceptional radiopacity, and biocompatibility. The AH Plus Jet automix syringe eliminates hand mixing, preventing air bubble incorporation and delivering direct, hygienic placement into root canals.',
    specifications: {
      'Type': 'Epoxy amine resin base and catalyst',
      'Working Time': '4 Hours at room temperature',
      'Setting Time': '8 Hours at 37°C body temperature',
      'Radiopacity': 'Extremely high (13.6 mm/mm Al)'
    },
    features: [
      'Automix syringe ensures precise 1:1 catalyst-base mixing every time',
      'Extremely low solubility prevents apical leakage over decades',
      'Includes intraoral delivery tips with adjustable angulation'
    ],
    warranty: '100% Genuine Sealed Dentsply Stock.',
    certifications: ['ISO 6876', 'CE 0086'],
    gstRate: 18
  },

  // 23. Runyes Clean 23L Class B Autoclave
  {
    id: 'prod-runyes-clean-23l-autoclave',
    slug: 'runyes-clean-23l-class-b-vacuum-autoclave',
    name: 'Runyes Clean 23 Litre Class B Triple Fractionated Vacuum Dental Autoclave',
    brandId: 'brand-wh',
    brandName: 'W&H Dentalwerk',
    categoryId: 'cat-autoclaves',
    categoryName: 'Sterilization & Infection Control',
    subCategory: 'Class B & N Autoclaves',
    subCategorySlug: 'class-b-autoclaves',
    sku: 'RUN-CLN-23L-B',
    price: 135000,
    mrp: 175000,
    discountPercentage: 23,
    rating: 4.8,
    reviewsCount: 41,
    inStock: true,
    stockCount: 6,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 6500,
    rentEnabled: true,
    rentPricePerMonth: 9500,
    securityDeposit: 25000,
    deliveryPickupCharge: 1200,
    images: [
      { url: '/images/prod_autoclave_main.jpg', alt: 'Front view with stainless steel chamber door', type: 'main' },
      { url: '/images/prod_autoclave_angle.jpg', alt: '45 degree angled perspective on white background', type: 'angle' },
      { url: '/images/prod_autoclave_detail.jpg', alt: 'Close-up of touchscreen cycle parameters and USB logger', type: 'detail' },
      { url: '/images/prod_autoclave_inuse.jpg', alt: 'Dental assistant loading sterile instrument cassette', type: 'in-use' },
      { url: '/images/prod_autoclave_box.jpg', alt: 'Standard package with 4 stainless trays and drainage hose', type: 'box-contents' },
      { url: '/images/prod_autoclave_infographic.jpg', alt: 'Class B pre-vacuum sterilization specs and chamber capacity', type: 'infographic' },
    ],
    thumbnail: '/images/prod_autoclave_main.jpg',
    image: '/images/prod_autoclave_main.jpg',
    shortDescription: 'European standard triple fractionated vacuum sterilizer with Italian vacuum pump, USB logging, and internal mini-printer.',
    description: 'Runyes Clean 23L delivers rapid, verified sterilization for solid, porous, and hollow dental instruments. Powered by an authentic Italian ULKA vacuum pump, smart steam generator, and integrated USB port that records date, temperature, pressure, and operator logs automatically.',
    specifications: {
      'Chamber Volume': '23 Litres (Food Grade 304 Stainless Steel)',
      'Vacuum Cycles': 'Triple Pulsed Vacuum (up to -0.85 bar)',
      'Water Reservoir': 'Top-opening dual distilled water and waste water tanks',
      'Printer': 'Built-in thermal receipt printer + USB flash drive logging'
    },
    features: [
      'Triple vacuum pulsation penetrates complex turbine handpiece interior lumens',
      'Dual safety door lock prevents accidental opening while under pressure',
      'Built-in thermal receipt printer prints physical cycle tickets for patient records'
    ],
    warranty: '2 Years Manufacturer Warranty + 5 Years Chamber Guarantee.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 23800, bankName: 'Credit Cards', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 12400, bankName: 'Doctor Equipment Loan', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'monthly', price: 9500, minDuration: 3, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['EN 13060 Class B', 'CE 0197', 'ISO 13485'],
    gstRate: 12
  },

  // 24. 3M ESPE RelyX U200 Self-Adhesive Resin Cement
  {
    id: 'prod-3m-relyx-u200',
    slug: '3m-relyx-u200-self-adhesive-resin-cement-clicker',
    name: '3M ESPE RelyX U200 Self-Adhesive Universal Resin Cement Clicker Dispenser (11g)',
    brandId: 'brand-3m',
    brandName: '3M ESPE',
    categoryId: 'cat-dental-materials',
    categoryName: 'Dental Consumables & Materials',
    subCategory: 'Luting & Cements',
    subCategorySlug: 'luting-cements',
    sku: '3M-RLX-U200-CLK',
    price: 4999,
    mrp: 6500,
    discountPercentage: 23,
    rating: 4.9,
    reviewsCount: 94,
    inStock: true,
    stockCount: 38,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_composite_main.jpg', alt: 'Universal composite syringe on clean white background', type: 'main' },
      { url: '/images/prod_composite_angle.jpg', alt: '45 degree angle showing screw plunger and shade indicator', type: 'angle' },
      { url: '/images/prod_composite_detail.jpg', alt: 'Close-up of dispensing tip and shade label', type: 'detail' },
      { url: '/images/bento_dental_equip_1793803387280.jpg', alt: 'Clinical tray restorative preparation', type: 'in-use' },
      { url: '/images/prod_composite_syringe_1793803614187.jpg', alt: 'Multi-shade syringe package and dispenser accessories', type: 'box-contents' },
      { url: '/images/hero_dental_setup_1793803412433.jpg', alt: 'Nanohybrid polish retention and physical properties infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_composite_main.jpg',
    image: '/images/prod_composite_main.jpg',
    shortDescription: 'Dual-cure self-adhesive resin cement for zirconia crowns, PFM, inlays, onlays, and fiber posts with zero etching needed.',
    description: 'RelyX U200 simplifies clinical cementation procedures by eliminating etching, priming, and bonding steps. Delivers bond strength to zirconia, alumina, metal, and porcelain, alongside moisture tolerance and long-term color stability.',
    specifications: {
      'Format': '11g Clicker Dispenser (Approx. 80 clicks)',
      'Cure Type': 'Dual-Cure (Light & Self-Cure)',
      'Available Shades': 'A2 Universal, Translucent'
    },
    features: [
      'Zero etching or priming required: apply directly into crown and seat',
      'Dual cure mechanism ensures complete cure even under opaque zirconia crowns',
      'Clicker dispenser measures accurate dosage with zero paste waste'
    ],
    warranty: '100% Genuine 3M ESPE stock guarantee.',
    certifications: ['US FDA', 'CE 0086'],
    gstRate: 18
  },

  // 25. BPL Altrax Syringe Infusion Pump
  {
    id: 'prod-bpl-altrax-syringe-pump',
    slug: 'bpl-altrax-micro-syringe-infusion-pump',
    name: 'BPL Altrax Smart Microprocessor Precision Syringe Infusion Pump',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Infusion & Syringe Pumps',
    subCategorySlug: 'infusion-syringe-pumps',
    sku: 'BPL-ALX-SYR-01',
    price: 26500,
    mrp: 34000,
    discountPercentage: 22,
    rating: 4.8,
    reviewsCount: 28,
    inStock: true,
    stockCount: 16,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 2400,
    rentEnabled: true,
    rentPricePerMonth: 3200,
    securityDeposit: 8000,
    deliveryPickupCharge: 500,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'Multi-parameter patient monitor front view on white background', type: 'main' },
      { url: '/images/prod_bp_angle.jpg', alt: '45 degree side view of display screen', type: 'angle' },
      { url: '/images/prod_bp_detail.jpg', alt: 'Close-up of ECG waveforms and numeric vitals display', type: 'detail' },
      { url: '/images/technician_setup_home_1793803357959.jpg', alt: 'Hospital bedside diagnostic monitoring in-use', type: 'in-use' },
      { url: '/images/prod_bp_box.jpg', alt: 'Standard monitor unit, SpO2 sensor, ECG cable and NIBP cuff', type: 'box-contents' },
      { url: '/images/prod_bp_infographic.jpg', alt: 'Waveform channels, battery backup and alarm system infographic', type: 'infographic' },
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: 'High-precision syringe pump supporting 5ml to 60ml syringes with anti-bolus system and drug library.',
    description: 'Engineered for critical medication delivery in neonatal, pediatric, and adult ICUs. Automatically identifies syringe brands, calculates flow rates from 0.1 mL/h to 1500 mL/h, and includes an intelligent occlusion detection sensor with anti-bolus protection.',
    specifications: {
      'Syringe Sizes': '5 ml, 10 ml, 20 ml, 30 ml, 50/60 ml (Auto-calibration)',
      'Flow Rate Range': '0.1 to 1500.0 mL/h (0.1 mL/h increments)',
      'Accuracy': '±2% Mechanical Accuracy',
      'Battery Backup': 'Lithium-ion battery providing over 6 hours at 5 mL/h'
    },
    features: [
      'Anti-bolus system reduces unwanted bolus volume following occlusion release',
      'Comprehensive drug name library built into firmware',
      'Dual CPU microprocessor guarantees patient safety'
    ],
    warranty: '2 Years Manufacturer Warranty.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 4650, bankName: 'Credit Cards', interestRate: 11 }
    ],
    rentalPlans: [
      { type: 'daily', price: 250, minDuration: 3, maxDuration: 14, freeMaintenance: true },
      { type: 'weekly', price: 1100, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 3200, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },

  // 26. Philips Innospire Elegance Nebulizer
  {
    id: 'prod-philips-innospire-elegance',
    slug: 'philips-respironics-innospire-elegance-compressor-nebulizer',
    name: 'Philips Respironics InnoSpire Elegance Heavy-Duty Compressor Nebulizer with SideStream',
    brandId: 'brand-philips',
    brandName: 'Philips Respironics',
    categoryId: 'cat-respiratory',
    categoryName: 'Respiratory Care',
    subCategory: 'Nebulizers & Inhalers',
    subCategorySlug: 'nebulizers-inhalers',
    sku: 'PHI-INN-ELG-01',
    price: 3199,
    mrp: 4499,
    discountPercentage: 29,
    rating: 4.8,
    reviewsCount: 124,
    inStock: true,
    stockCount: 30,
    isDealOfDay: true,
    dealExpiresAt: '2026-11-04T23:59:59Z',
    isBestSeller: false,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_nebulizer_main.jpg', alt: 'Main front view on white background', type: 'main' },
      { url: '/images/prod_nebulizer_angle.jpg', alt: '45 degree side perspective view', type: 'angle' },
      { url: '/images/prod_nebulizer_detail.jpg', alt: 'Close-up of medication chamber and venturi valve', type: 'detail' },
      { url: '/images/prod_nebulizer_inuse.jpg', alt: 'In-use clinical therapy with patient mask', type: 'in-use' },
      { url: '/images/prod_nebulizer_box.jpg', alt: 'Package contents with masks, tubing and filters', type: 'box-contents' },
      { url: '/images/prod_nebulizer_infographic.jpg', alt: 'Technical specifications and dimensions infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_nebulizer_main.jpg',
    image: '/images/prod_nebulizer_main.jpg',
    shortDescription: 'Equipped with patented SideStream venturi technology that delivers consistent aerosol drug medication in under 5 minutes.',
    description: 'The InnoSpire Elegance compressor nebulizer by Philips Respironics utilizes active venturi technology to draw extra air from the room, boosting medication delivery speed. Designed for continuous clinical duty and high daily patient volumes.',
    specifications: {
      'Treatment Time': '2.5 ml in approx. 4.8 minutes',
      'MMAD (Aerosol Size)': '2.9 µm',
      'Maximum Pressure': '44 psi',
      'Weight': '1.5 kg'
    },
    features: [
      'SideStream reusable handset lasts up to 12 months with frequent boiling/disinfection',
      'Continuous duty compressor built for clinic and home usage',
      'Integrated docking station holds nebulizer cup between breathing sessions'
    ],
    warranty: '3 Years Comprehensive Philips India Warranty.',
    certifications: ['US FDA', 'CE Marked'],
    gstRate: 12
  },

  // 27. Karma Ryder 2 Reclining Wheelchair
  {
    id: 'prod-karma-ryder-2-wheelchair',
    slug: 'karma-ryder-2-deluxe-reclining-high-back-wheelchair',
    name: 'Karma Ryder 2 Deluxe Multi-Position Reclining High-Back Wheelchair with Commode & Headrest',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-mobility',
    categoryName: 'Mobility & Patient Care',
    subCategory: 'Wheelchairs',
    subCategorySlug: 'wheelchairs',
    sku: 'KAR-RYD-2-REC',
    price: 15800,
    mrp: 21500,
    discountPercentage: 27,
    rating: 4.7,
    reviewsCount: 65,
    inStock: true,
    stockCount: 18,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 1450,
    rentEnabled: true,
    rentPricePerMonth: 2500,
    securityDeposit: 5000,
    deliveryPickupCharge: 400,
    images: [
      { url: '/images/prod_wheelchair_main.jpg', alt: 'Front centered view on white background', type: 'main' },
      { url: '/images/prod_wheelchair_angle.jpg', alt: '45 degree side view of frame and wheels', type: 'angle' },
      { url: '/images/prod_wheelchair_detail.jpg', alt: 'Close-up of joystick controller and armrest', type: 'detail' },
      { url: '/images/prod_wheelchair_inuse.jpg', alt: 'In-use outdoor mobility assistance', type: 'in-use' },
      { url: '/images/prod_wheelchair_box.jpg', alt: 'Folded unit, battery pack and intelligent charger', type: 'box-contents' },
      { url: '/images/prod_wheelchair_infographic.jpg', alt: 'Fold dimensions, weight capacity and range infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_wheelchair_main.jpg',
    image: '/images/prod_wheelchair_main.jpg',
    shortDescription: 'Smooth 90° to 180° backrest reclining wheelchair with detachable headrest, elevating legrests, and U-cut commode seat.',
    description: 'The Karma Ryder 2 provides total patient comfort for post-stroke recovery, spine injuries, and elderly mobility. Its hydraulic reclining backrest allows flat bed-level resting, while elevating footrests prevent leg edema. Built with chrome-plated steel frame and solid puncture-resistant mag wheels.',
    specifications: {
      'Recline Angle': '90° to 180° continuous recline',
      'Frame Material': 'Heavy-duty steel with anti-rust chrome plating',
      'Weight Capacity': '110 kg',
      'Seat Width': '46 cm (18 inches standard adult)'
    },
    features: [
      'Removable U-cut commode seat with pull-out bedpan bucket',
      'Detachable padded neck pillow and headrest extension',
      'Elevating legrests with adjustable calf pads to reduce pressure ulcers'
    ],
    warranty: '1 Year Frame Warranty.',
    emiPlans: [
      { tenureMonths: 3, monthlyAmount: 5266, bankName: 'Credit Cards', interestRate: 0, isNoCost: true },
      { tenureMonths: 6, monthlyAmount: 2750, bankName: 'Major Banks', interestRate: 11 }
    ],
    rentalPlans: [
      { type: 'daily', price: 200, minDuration: 3, maxDuration: 14, freeMaintenance: true },
      { type: 'weekly', price: 900, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 2500, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['CE', 'ISO 9001'],
    gstRate: 5
  },

  // 28. Woodpecker LED.B Cordless Curing Light
  {
    id: 'prod-woodpecker-led-b',
    slug: 'woodpecker-led-b-cordless-dental-curing-light',
    name: 'Woodpecker LED.B Cordless 1000mW Dental Light Cure Unit with Optical Fiber Rod',
    brandId: 'brand-woodpecker',
    brandName: 'Woodpecker Guilin',
    categoryId: 'cat-dental-equipment',
    categoryName: 'Dental Operatory & Units',
    subCategory: 'Dental Handpieces & Motors',
    subCategorySlug: 'dental-handpieces',
    sku: 'WDK-LEDB-CUR-01',
    price: 3600,
    mrp: 5200,
    discountPercentage: 31,
    rating: 4.8,
    reviewsCount: 155,
    inStock: true,
    stockCount: 40,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_handpiece_main.jpg', alt: 'High-precision dental handpiece on white background', type: 'main' },
      { url: '/images/prod_handpiece_angle.jpg', alt: '45 degree profile view of ergonomic body and head', type: 'angle' },
      { url: '/images/prod_handpiece_detail.jpg', alt: 'Close-up of push-button chuck and optic LED spray nozzles', type: 'detail' },
      { url: '/images/prod_handpiece_inuse.jpg', alt: 'Clinical operatory restoration procedure in-use', type: 'in-use' },
      { url: '/images/prod_handpiece_box.jpg', alt: 'Autoclavable case with maintenance nozzles and tool', type: 'box-contents' },
      { url: '/images/prod_handpiece_infographic.jpg', alt: '400,000 RPM, torque power and anti-retraction head infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_handpiece_main.jpg',
    image: '/images/prod_handpiece_main.jpg',
    shortDescription: '1000 mW/cm² broad-spectrum blue LED curing unit with 4 time modes (5s, 10s, 15s, 20s) and long-life rechargeable battery.',
    description: 'India’s most trusted dental composite curing unit. The Woodpecker LED.B provides constant light intensity output that does not drop even when the battery is low. Autoclavable optical fiber guide light ensures full polymerisation depth in anterior and posterior cavities.',
    specifications: {
      'Light Output': '1000 mW/cm² - 1200 mW/cm²',
      'Wavelength': '420nm - 480nm',
      'Battery Capacity': 'Over 400 cures of 10s on full charge',
      'Weight': '145 grams ergonomic handpiece'
    },
    features: [
      'Constant light power technology ensures uniform curing depth across every tooth',
      'Optical fiber rod can be autoclaved under 135°C steam pressure',
      'Auto-sleep and auto-shutdown timer preserve battery life'
    ],
    warranty: '1 Year Warranty on Main Unit & Charging Dock.',
    certifications: ['CE 0197', 'ISO 9001'],
    gstRate: 12
  },

  // 29. 3M ESPE Impregum Soft Polyether Impression
  {
    id: 'prod-3m-impregum-soft',
    slug: '3m-impregum-soft-polyether-impression-material-intro-kit',
    name: '3M ESPE Impregum Soft Polyether Precision Impression Material Handmix Kit',
    brandId: 'brand-3m',
    brandName: '3M ESPE',
    categoryId: 'cat-dental-materials',
    categoryName: 'Dental Consumables & Materials',
    subCategory: 'Impression Materials',
    subCategorySlug: 'impression-materials',
    sku: '3M-IMP-SFT-KIT',
    price: 6850,
    mrp: 8600,
    discountPercentage: 20,
    rating: 4.9,
    reviewsCount: 72,
    inStock: true,
    stockCount: 24,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_composite_main.jpg', alt: 'Universal composite syringe on clean white background', type: 'main' },
      { url: '/images/prod_composite_angle.jpg', alt: '45 degree angle showing screw plunger and shade indicator', type: 'angle' },
      { url: '/images/prod_composite_detail.jpg', alt: 'Close-up of dispensing tip and shade label', type: 'detail' },
      { url: '/images/bento_dental_equip_1793803387280.jpg', alt: 'Clinical tray restorative preparation', type: 'in-use' },
      { url: '/images/prod_composite_syringe_1793803614187.jpg', alt: 'Multi-shade syringe package and dispenser accessories', type: 'box-contents' },
      { url: '/images/hero_dental_setup_1793803412433.jpg', alt: 'Nanohybrid polish retention and physical properties infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_composite_main.jpg',
    image: '/images/prod_composite_main.jpg',
    shortDescription: 'Legendary polyether precision impression material for implantology, long-span bridges, and subgingival margins.',
    description: 'Impregum Soft features inherent initial hydrophilicity that displaces blood and saliva upon first contact, capturing subgingival margin details that vinyl polysiloxanes miss. Excellent flow behavior under pressure with snap-set characteristics.',
    specifications: {
      'Kit Contents': '1 Base Paste (120ml), 1 Catalyst (15ml), 1 Mixing Pad, 1 Tube Key',
      'Working Time': '2 minutes 45 seconds',
      'Intraoral Setting Time': '3 minutes 15 seconds'
    },
    features: [
      'Inherent hydrophilicity records void-free impressions in moist oral cavities',
      'Snap-set property transitions rapidly from workable to firm, reducing distortion',
      'Ideal for multi-unit implant transfers and full-mouth rehabilitations'
    ],
    warranty: '100% Guaranteed Genuine 3M Product.',
    certifications: ['CE', 'ISO 4823'],
    gstRate: 18
  },

  // 30. W&H Implantmed SI-1023 Surgical Motor
  {
    id: 'prod-wh-implantmed-si1023',
    slug: 'wh-implantmed-si-1023-dental-implantology-surgical-motor',
    name: 'W&H Implantmed Classic SI-1023 Dental Surgical & Implantology Motor Unit',
    brandId: 'brand-wh',
    brandName: 'W&H Dentalwerk',
    categoryId: 'cat-dental-handpieces',
    categoryName: 'Dental Handpieces & Motors',
    subCategory: 'Low Speed Micromotors',
    subCategorySlug: 'low-speed-micromotors',
    sku: 'WH-IMP-SI1023-AT',
    price: 215000,
    mrp: 275000,
    discountPercentage: 22,
    rating: 5.0,
    reviewsCount: 33,
    inStock: true,
    stockCount: 3,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 9900,
    rentEnabled: true,
    rentPricePerMonth: 15000,
    images: [
      { url: '/images/prod_handpiece_main.jpg', alt: 'High-precision dental handpiece on white background', type: 'main' },
      { url: '/images/prod_handpiece_angle.jpg', alt: '45 degree profile view of ergonomic body and head', type: 'angle' },
      { url: '/images/prod_handpiece_detail.jpg', alt: 'Close-up of push-button chuck and optic LED spray nozzles', type: 'detail' },
      { url: '/images/prod_handpiece_inuse.jpg', alt: 'Clinical operatory restoration procedure in-use', type: 'in-use' },
      { url: '/images/prod_handpiece_box.jpg', alt: 'Autoclavable case with maintenance nozzles and tool', type: 'box-contents' },
      { url: '/images/prod_handpiece_infographic.jpg', alt: '400,000 RPM, torque power and anti-retraction head infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_handpiece_main.jpg',
    image: '/images/prod_handpiece_main.jpg',
    shortDescription: 'World-renowned Austrian surgical motor delivering up to 80 Ncm torque with thread cutting and ISQ implant stability measurement.',
    description: 'W&H Implantmed is the gold standard drive unit for implantology and oral maxillofacial surgery. Provides precision torque limits between 5.5 and 80 Ncm, powerful short motor (EM-19), smooth touch glass display, and optional W&H Osstell ISQ module for measuring osseointegration before loading.',
    specifications: {
      'Maximum Torque': '80 Ncm at rotary instrument',
      'Motor Speed': '200 to 40,000 rpm',
      'Coolant Flow Rate': 'Min. 90 mL/min at 100%',
      'Weight': '3.5 kg Console'
    },
    features: [
      'Thread cutting function taps into hard cortical bone smoothly with zero heat',
      'Automatic torque control guarantees precise implant placement without bone stripping',
      'Ultra-short brushless motor is completely thermo-washer disinfectable and autoclavable'
    ],
    warranty: '2 Years Factory Warranty from W&H Austria.',
    emiPlans: [
      { tenureMonths: 12, monthlyAmount: 19800, bankName: 'Doctor Equipment Finance', interestRate: 11 },
      { tenureMonths: 24, monthlyAmount: 10700, bankName: 'HDFC / ICICI Business', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'monthly', price: 15000, minDuration: 3, maxDuration: 12, tenureMonths: 3, pricePerMonth: 15000, securityDeposit: 40000, installationFee: 2000, freeMaintenance: true }
    ],
    certifications: ['CE 0051', 'EN ISO 13485', 'MDD 93/42/EEC'],
    gstRate: 12
  },

  // 31. BPL Cardiart GenX3 3-Channel ECG
  {
    id: 'prod-bpl-cardiart-genx3',
    slug: 'bpl-cardiart-genx3-3-channel-interpretive-ecg-machine',
    name: 'BPL Cardiart GenX3 3-Channel Interpretive Digital ECG Machine with Color Display',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-diagnostic',
    categoryName: 'Diagnostic & Monitoring',
    subCategory: 'ECG / EKG Machines',
    subCategorySlug: 'ecg-machines',
    sku: 'BPL-ECG-GNX3-IN',
    price: 36500,
    mrp: 47000,
    discountPercentage: 22,
    rating: 4.8,
    reviewsCount: 42,
    inStock: true,
    stockCount: 10,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 1999,
    rentEnabled: false,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'Multi-parameter patient monitor front view on white background', type: 'main' },
      { url: '/images/prod_bp_angle.jpg', alt: '45 degree side view of display screen', type: 'angle' },
      { url: '/images/prod_bp_detail.jpg', alt: 'Close-up of ECG waveforms and numeric vitals display', type: 'detail' },
      { url: '/images/technician_setup_home_1793803357959.jpg', alt: 'Hospital bedside diagnostic monitoring in-use', type: 'in-use' },
      { url: '/images/prod_bp_box.jpg', alt: 'Standard monitor unit, SpO2 sensor, ECG cable and NIBP cuff', type: 'box-contents' },
      { url: '/images/prod_bp_infographic.jpg', alt: 'Waveform channels, battery backup and alarm system infographic', type: 'infographic' },
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: 'Simultaneous 12-lead acquisition with built-in Glasgow ECG interpretation algorithm and 4.3" color LCD.',
    description: 'Equipped with the globally validated University of Glasgow interpretation algorithm. Features real-time 12-lead preview, 80mm roll printer, internal memory storing over 500 records, and USB export to PDF for instant doctor WhatsApp / email sharing.',
    specifications: {
      'Recording Channels': '3 Channels simultaneous',
      'Interpretation': 'Glasgow ECG Interpretation Algorithm',
      'Display': '4.3 inch Color TFT Screen',
      'Printer': '80 mm Thermal Roll Printer'
    },
    features: [
      'Glasgow algorithm accounts for age, gender, and clinical history for precise rhythm interpretation',
      'Direct PDF report export to USB thumb drive',
      'Rechargeable Lithium-ion battery delivers up to 250 test prints'
    ],
    warranty: '2 Years Manufacturer Warranty.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 6350, bankName: 'Credit Cards', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 3350, bankName: 'All Major Bank Cards', interestRate: 12 }
    ],
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },

  // 32. 3M Clinpro Tooth Creme
  {
    id: 'prod-3m-clinpro-tooth-creme',
    slug: '3m-clinpro-tooth-creme-with-tcp-vanilla-mint',
    name: '3M ESPE Clinpro Tooth Creme with Functionalized Tri-Calcium Phosphate (113g)',
    brandId: 'brand-3m',
    brandName: '3M ESPE',
    categoryId: 'cat-dental-materials',
    categoryName: 'Dental Consumables & Materials',
    subCategory: 'Composites & Bonding',
    subCategorySlug: 'composites-bonding',
    sku: '3M-CLN-TCP-113G',
    price: 680,
    mrp: 950,
    discountPercentage: 28,
    rating: 4.9,
    reviewsCount: 165,
    inStock: true,
    stockCount: 120,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: false,
    images: [
      { url: '/images/prod_composite_main.jpg', alt: 'Universal composite syringe on clean white background', type: 'main' },
      { url: '/images/prod_composite_angle.jpg', alt: '45 degree angle showing screw plunger and shade indicator', type: 'angle' },
      { url: '/images/prod_composite_detail.jpg', alt: 'Close-up of dispensing tip and shade label', type: 'detail' },
      { url: '/images/bento_dental_equip_1793803387280.jpg', alt: 'Clinical tray restorative preparation', type: 'in-use' },
      { url: '/images/prod_composite_syringe_1793803614187.jpg', alt: 'Multi-shade syringe package and dispenser accessories', type: 'box-contents' },
      { url: '/images/hero_dental_setup_1793803412433.jpg', alt: 'Nanohybrid polish retention and physical properties infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_composite_main.jpg',
    image: '/images/prod_composite_main.jpg',
    shortDescription: 'Advanced remineralizing anti-cavity dentifrice delivering bio-available fluoride, calcium, and phosphate deep into enamel.',
    description: '3M Clinpro Tooth Creme features functionalized tri-calcium phosphate (fTCP) which prevents premature calcium-fluoride bonding in the tube, releasing bioavailable ions only on contact with saliva to remineralize subsurface white spot lesions.',
    specifications: {
      'Weight': '113 grams Tube',
      'Fluoride Content': '0.21% w/w Sodium Fluoride (950 ppm F-)',
      'Flavor': 'Vanilla Mint'
    },
    features: [
      'Reverses early enamel demineralization after orthodontic bracket debonding',
      'Relieves cervical tooth sensitivity and dentin hypersensitivity',
      'Gentle low-abrasion formula cleans safely without abrading exposed root dentin'
    ],
    warranty: '100% Genuine 3M Product Guarantee.',
    certifications: ['ADA Accepted', 'US FDA'],
  },

  // 33. Inogen One G5 Portable Oxygen Concentrator (POC)
  {
    id: 'prod-inogen-one-g5',
    slug: 'inogen-one-g5-portable-oxygen-concentrator',
    name: 'Inogen One G5 FAA-Approved Lightweight Portable Oxygen Concentrator (6 Flow Settings)',
    brandId: 'brand-philips',
    brandName: 'Philips Respironics',
    categoryId: 'cat-respiratory',
    categoryName: 'Respiratory Care',
    subCategory: 'Oxygen Concentrators',
    subCategorySlug: 'oxygen-concentrators',
    sku: 'INO-ONE-G5-6F',
    price: 198000,
    mrp: 245000,
    discountPercentage: 19,
    rating: 4.9,
    reviewsCount: 36,
    inStock: true,
    stockCount: 6,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 9200,
    rentEnabled: true,
    rentPricePerMonth: 8500,
    securityDeposit: 20000,
    deliveryPickupCharge: 500,
    images: [
      { url: '/images/prod_oxygen_main.jpg', alt: 'Front view with digital flow display', type: 'main' },
      { url: '/images/prod_oxygen_angle.jpg', alt: '45 degree side angle profile', type: 'angle' },
      { url: '/images/prod_oxygen_detail.jpg', alt: 'Close-up of flow control valve and purity sensor', type: 'detail' },
      { url: '/images/prod_oxygen_inuse.jpg', alt: 'In-use oxygen therapy with nasal cannula', type: 'in-use' },
      { url: '/images/prod_oxygen_box.jpg', alt: 'Standard kit with humidifier bottle and cannulas', type: 'box-contents' },
      { url: '/images/prod_oxygen_infographic.jpg', alt: 'Dimensions, 93% purity and decibel rating infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_oxygen_main.jpg',
    image: '/images/prod_oxygen_main.jpg',
    shortDescription: 'FAA-cleared portable oxygen concentrator weighing only 2.1 kg with 6 pulse flow settings and up to 13 hours dual battery.',
    description: 'The Inogen One G5 provides patients with active mobile independence. Delivers pulse-dose medical oxygen up to setting 6 with intelligent breath detection. Approved for commercial flight travel by the FAA and DGCA, featuring an intuitive LCD display and Bluetooth connectivity.',
    specifications: {
      'Flow Settings': 'Pulse Dose 1 to 6',
      'Weight': '2.15 kg (4.7 lbs with single battery)',
      'Battery Life': 'Up to 6.5 hours (Single) / 13 hours (Double)',
      'Noise Level': '38 dBA at setting 2',
      'Aviation Compliance': 'FAA and DGCA Commercial In-Flight Cleared'
    },
    features: [
      'Weighs only 2.1 kg, easily carried with shoulder satchel or backpack',
      'Intelligent breath detection triggers rapid bolus at the exact start of inhalation',
      'Bluetooth enabled with Inogen Connect mobile diagnostic app'
    ],
    warranty: '3 Years Warranty on System + 1 Year on Sieve Beds & Batteries.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 34800, bankName: 'Major Credit Cards', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 18200, bankName: 'Medical Equipment Loan', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'daily', price: 600, minDuration: 3, maxDuration: 14, freeMaintenance: true },
      { type: 'weekly', price: 2800, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 8500, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['US FDA Approved', 'FAA Cleared', 'CE 0123'],
    gstRate: 12
  },

  // 34. ResMed AirCurve 10 VAuto BiPAP
  {
    id: 'prod-resmed-aircurve-10-vauto',
    slug: 'resmed-aircurve-10-vauto-bipap-machine',
    name: 'ResMed AirCurve 10 VAuto Auto-Bilevel BiPAP Device with HumidAir & ClimateLineAir',
    brandId: 'brand-resmed',
    brandName: 'ResMed',
    categoryId: 'cat-respiratory',
    categoryName: 'Respiratory Care',
    subCategory: 'CPAP & BiPAP Devices',
    subCategorySlug: 'cpap-bipap-devices',
    sku: 'RES-AC10-VAUTO',
    price: 89000,
    mrp: 120000,
    discountPercentage: 26,
    rating: 4.9,
    reviewsCount: 52,
    inStock: true,
    stockCount: 10,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 4100,
    rentEnabled: true,
    rentPricePerMonth: 6500,
    securityDeposit: 15000,
    deliveryPickupCharge: 500,
    images: [
      { url: '/images/prod_cpap_main.jpg', alt: 'Front view with color display and integrated humidifier', type: 'main' },
      { url: '/images/prod_cpap_angle.jpg', alt: '45 degree angled side perspective', type: 'angle' },
      { url: '/images/prod_cpap_detail.jpg', alt: 'Close-up of push dial navigation and tube connector', type: 'detail' },
      { url: '/images/prod_cpap_inuse.jpg', alt: 'Peaceful night sleep therapy with mask in-use', type: 'in-use' },
      { url: '/images/prod_cpap_box.jpg', alt: 'Complete pack with humidifier chamber, heated tubing and bag', type: 'box-contents' },
      { url: '/images/prod_cpap_infographic.jpg', alt: 'Whisper-quiet 26dBA, AutoRamp pressure and cellular sync', type: 'infographic' },
    ],
    thumbnail: '/images/prod_cpap_main.jpg',
    image: '/images/prod_cpap_main.jpg',
    shortDescription: 'Auto-adjusting bilevel BiPAP machine designed for patients requiring pressure support for OSA, COPD, and hypoventilation.',
    description: 'ResMed AirCurve 10 VAuto uses the proven AutoSet algorithm to continuously adjust inhalation (IPAP) and exhalation (EPAP) pressures while maintaining a fixed pressure support. Built with Easy-Breathe motor, HumidAir heated humidifier, and TiControl breath synchrony for neuromuscular comfort.',
    specifications: {
      'Pressure Range': 'IPAP: 4-25 cm H2O, EPAP: 4-25 cm H2O',
      'Sound Level': '26.6 dBA',
      'Operating Modes': 'VAuto, S, CPAP',
      'Humidification': 'Integrated HumidAir Heated Humidifier',
      'Weight': '1.24 kg'
    },
    features: [
      'TiControl sets minimum and maximum time limits for spontaneous inhalation',
      'VAuto algorithm automatically adjusts baseline pressure while keeping pressure support steady',
      'Includes ClimateLineAir heated tubing preventing rainout condensation'
    ],
    warranty: '2 Years Manufacturer Warranty with free biomedical sanitization.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 15600, bankName: 'All Major Banks', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 8200, bankName: 'Credit Cards', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'daily', price: 500, minDuration: 3, maxDuration: 14, freeMaintenance: true },
      { type: 'weekly', price: 2300, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 6500, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['US FDA 510(k)', 'CE Marked', 'ISO 13485'],
    gstRate: 12
  },

  // 35. Paramount A6 5-Function Electric ICU Hospital Bed
  {
    id: 'prod-paramount-icu-bed-5fn',
    slug: 'paramount-a6-5-function-electric-icu-hospital-bed',
    name: 'Paramount Bed A6 Series 5-Function Fully Motorized Electric ICU Hospital Bed with CPR Release',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Hospital Furniture',
    subCategorySlug: 'hospital-furniture',
    sku: 'PAR-A6-ICU-5FN',
    price: 145000,
    mrp: 195000,
    discountPercentage: 26,
    rating: 4.9,
    reviewsCount: 29,
    inStock: true,
    stockCount: 7,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 6800,
    rentEnabled: true,
    rentPricePerMonth: 7500,
    securityDeposit: 15000,
    deliveryPickupCharge: 1000,
    images: [
      { url: '/images/bento_homecare_mobility_1793803387668.jpg', alt: '5-Function motorized ICU hospital bed on white background', type: 'main' },
      { url: '/images/prod_wheelchair_angle.jpg', alt: '45 degree angle showing split foldaway side rails', type: 'angle' },
      { url: '/images/prod_wheelchair_detail.jpg', alt: 'Close-up of attendant hand pendant controller and CPR release', type: 'detail' },
      { url: '/images/technician_setup_home_1793803357959.jpg', alt: 'Patient recovery room positioning in-use', type: 'in-use' },
      { url: '/images/prod_wheelchair_box.jpg', alt: 'Bed platform, high-density anti-bedsore mattress and IV pole', type: 'box-contents' },
      { url: '/images/prod_wheelchair_infographic.jpg', alt: 'Trendelenburg tilt angles, weight rating and dimensions infographic', type: 'infographic' },
    ],
    thumbnail: '/images/bento_homecare_mobility_1793803387668.jpg',
    image: '/images/bento_homecare_mobility_1793803387668.jpg',
    shortDescription: 'Motorized 5-function ICU bed with backrest, knee-break, height elevation, Trendelenburg & Reverse Trendelenburg, and nurse attendant control.',
    description: 'Designed for ICU wards and home critical care nursing. Powered by ultra-quiet Linak medical linear actuators with emergency manual CPR quick release, tuck-away split safety siderails, battery backup, and high-density 4-section anti-decubitus mattress.',
    specifications: {
      'Functions': 'Backrest 0-75°, Knee-rest 0-45°, Height 450-750mm, Trendelenburg ±12°',
      'Safe Working Load': '250 kg (Supports bariatric patients)',
      'Actuator Motors': 'Linak Denmark CE Medical Approved Actuators',
      'Castors': '125mm Central Locking Castors',
      'Mattress': '4-inch Anti-Bedsore Mediflex Medical Foam Mattress'
    },
    features: [
      'One-touch Cardiac Chair and Trendelenburg shock recovery positions',
      'Bilateral manual CPR release levers for rapid chest compression initiation',
      'Underbed night-light and handheld remote with lockout for patient safety'
    ],
    warranty: '2 Years Comprehensive Warranty on Actuators and Remote.',
    emiPlans: [
      { tenureMonths: 6, monthlyAmount: 25400, bankName: 'Doctor Loans', interestRate: 11 },
      { tenureMonths: 12, monthlyAmount: 13300, bankName: 'Credit Cards', interestRate: 12 }
    ],
    rentalPlans: [
      { type: 'monthly', price: 7500, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['IEC 60601-2-52', 'CE', 'ISO 13485'],
    gstRate: 12
  },

  // 36. Yuwell 7E-A Portable Suction Machine
  {
    id: 'prod-yuwell-7e-a-suction',
    slug: 'yuwell-7e-a-portable-high-vacuum-phlegm-suction-machine',
    name: 'Yuwell 7E-A Medical Grade High-Vacuum Electric Portable Phlegm Suction Machine (1000ml)',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Suction Machines',
    subCategorySlug: 'suction-machines',
    sku: 'YUW-7EA-SUCT-01',
    price: 6800,
    mrp: 9500,
    discountPercentage: 28,
    rating: 4.8,
    reviewsCount: 78,
    inStock: true,
    stockCount: 25,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: false,
    rentEnabled: true,
    rentPricePerMonth: 1800,
    securityDeposit: 3500,
    deliveryPickupCharge: 350,
    images: [
      { url: '/images/prod_suction_machine_1793803542649.jpg', alt: 'Heavy-duty phlegm suction machine on white background', type: 'main' },
      { url: '/images/prod_oxygen_angle.jpg', alt: '45 degree side profile showing collection canister', type: 'angle' },
      { url: '/images/prod_oxygen_detail.jpg', alt: 'Close-up of vacuum regulator valve and negative pressure gauge', type: 'detail' },
      { url: '/images/technician_setup_home_1793803357959.jpg', alt: 'Clinical bedside suction clearance in-use', type: 'in-use' },
      { url: '/images/prod_oxygen_box.jpg', alt: 'Unit with 1000ml jar, bacterial filter and silicone suction tubes', type: 'box-contents' },
      { url: '/images/prod_oxygen_infographic.jpg', alt: 'Pumping capacity, vacuum limits and dimensions infographic', type: 'infographic' },
    ],
    thumbnail: '/images/prod_suction_machine_1793803542649.jpg',
    image: '/images/prod_suction_machine_1793803542649.jpg',
    shortDescription: 'Oil-free lubrication piston pump delivering rapid negative pressure up to 0.075 MPa with overflow protection valve.',
    description: 'Yuwell 7E-A is the standard clinical suction unit for tracheostomy care, sputum aspiration, and emergency airway clearance. Features a stepless negative pressure regulator, autoclavable 1000 mL polycarbonate collection jar, and anti-overflow float valve.',
    specifications: {
      'Max Vacuum': '≥ 0.075 MPa',
      'Pumping Flow Rate': '≥ 15 Litres / min',
      'Jar Capacity': '1000 mL Autoclavable Polycarbonate Jar',
      'Noise Level': '≤ 65 dBA',
      'Weight': '4.4 kg Portable with Top Handle'
    },
    features: [
      'Completely oil-free piston pump produces zero oil mist pollution',
      'Stepless circular pressure regulation gauge from 0.02 to 0.075 MPa',
      'Overflow protection valve stops fluid entry into pump chamber'
    ],
    warranty: '2 Years Manufacturer Replacement Guarantee.',
    rentalPlans: [
      { type: 'daily', price: 150, minDuration: 3, maxDuration: 14, freeMaintenance: true },
      { type: 'weekly', price: 650, minDuration: 1, maxDuration: 4, freeMaintenance: true },
      { type: 'monthly', price: 1800, minDuration: 1, maxDuration: 12, freeMaintenance: true }
    ],
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },
  // 21. BPL Relife 700 Biphasic Defibrillator Monitor
  {
    id: 'prod-bpl-relife-700-defib',
    slug: 'bpl-relife-700-biphasic-defibrillator-monitor',
    name: 'BPL Relife 700 Biphasic Defibrillator Monitor with 7-inch Color Display & AED Mode',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Defibrillators & AEDs',
    subCategorySlug: 'defibrillators-aeds',
    sku: 'BPL-DEF-RL700',
    price: 138000,
    mrp: 175000,
    discountPercentage: 21,
    rating: 4.9,
    reviewsCount: 19,
    inStock: true,
    stockCount: 6,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 6499,
    rentEnabled: true,
    rentPricePerMonth: 12000,
    securityDeposit: 25000,
    deliveryPickupCharge: 1200,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'BPL Relife 700 Defibrillator with adult and pediatric paddles', type: 'main' },
      { url: '/images/prod_bp_angle.jpg', alt: 'Screen view with high resolution energy charge readout', type: 'angle' },
      { url: '/images/technician_setup_home_1793803357959.jpg', alt: 'Defibrillator mounted on hospital emergency crash cart', type: 'in-use' }
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: 'Current controlled biphasic defibrillator with 7-inch TFT color screen, synchronized cardioversion, 360 Joule manual mode, and internal/external paddles.',
    description: 'BPL Relife 700 is an advanced emergency resuscitation biphasic defibrillator monitor designed for cardiac ICUs, emergency departments, and ambulances. Offers manual defibrillation up to 360J, automated AED protocol with voice guidance, synchronized cardioversion, non-invasive transcutaneous pacing, and 3-lead ECG monitoring with thermal print recorder.',
    specifications: {
      'Waveform': 'Biphasic Truncated Exponential (BTE)',
      'Energy Range': '2 to 360 Joules in 15 selectable steps',
      'Display': '7-inch High Contrast TFT Color Screen',
      'Charge Time': 'Less than 5 seconds to 200J on battery',
      'ECG Leads': '3-Lead / 5-Lead patient cable included',
      'Printer': 'High resolution 50mm thermal array recorder'
    },
    features: [
      'Biphasic current controlled impedance compensating waveform',
      'Manual defibrillation, automated AED mode & synchronized cardioversion',
      'Integrated non-invasive transcutaneous external cardiac pacer',
      'Rechargeable Li-Ion battery providing up to 100 shocks at 360 Joules'
    ],
    warranty: '2 Years Comprehensive Manufacturer Warranty.',
    certifications: ['CE', 'ISO 13485', 'AERB Compliant'],
    gstRate: 12
  },
  // 22. Philips HeartStart FRx AED
  {
    id: 'prod-philips-heartstart-frx',
    slug: 'philips-heartstart-frx-automated-external-defibrillator',
    name: 'Philips HeartStart FRx Rugged Automated External Defibrillator (AED) for Emergency Resuscitation',
    brandId: 'brand-philips',
    brandName: 'Philips Respironics',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Defibrillators & AEDs',
    subCategorySlug: 'defibrillators-aeds',
    sku: 'PHI-AED-FRX-01',
    price: 115000,
    mrp: 145000,
    discountPercentage: 20,
    rating: 4.8,
    reviewsCount: 24,
    inStock: true,
    stockCount: 10,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 5499,
    rentEnabled: false,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'Philips HeartStart FRx rugged defibrillator unit', type: 'main' },
      { url: '/images/prod_bp_box.jpg', alt: 'Carry case, SMART Pads II and long-life battery', type: 'box-contents' }
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: 'Rugged IP55 water/dust resistant public and hospital AED with real-time CPR voice coaching and pediatric infant key support.',
    description: 'The Philips HeartStart FRx is engineered for treated environments from sports complexes and clinics to cardiac intensive care wards. Features SMART Biphasic therapy, daily automatic self-testing, and Life Guidance voice prompts to guide first-responders step-by-step through defibrillation and CPR compression metronome pacing.',
    specifications: {
      'Ingress Protection': 'IP55 Jet Water & Dust Resistance',
      'Defibrillation Therapy': 'SMART Biphasic truncated exponential',
      'Battery Longevity': '4-Year standby life (Lithium Manganese Dioxide)',
      'Pediatric Key': 'Converts adult pads to child dose without swapping pads',
      'Weight': '1.5 kg Ultra-Lightweight Rugged Enclosure'
    },
    features: [
      'Pre-connected SMART Pads II usable for both adult and pediatric patients',
      'Real-time CPR coaching with audible metronome and voice cues',
      'Ruggedized enclosure withstands 1-meter drops onto concrete'
    ],
    warranty: '8 Years Worldwide Philips Warranty.',
    certifications: ['US FDA Cleared', 'CE 0123'],
    gstRate: 12
  },
  // 23. BPL Acura V Volumetric Infusion Pump
  {
    id: 'prod-bpl-acura-v-infusion',
    slug: 'bpl-acura-v-volumetric-iv-infusion-pump',
    name: 'BPL Acura V Smart Volumetric IV Infusion Pump with Ultrasonic Bubble Detector',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Infusion & Syringe Pumps',
    subCategorySlug: 'infusion-syringe-pumps',
    sku: 'BPL-INF-ACV-02',
    price: 31500,
    mrp: 42000,
    discountPercentage: 25,
    rating: 4.7,
    reviewsCount: 28,
    inStock: true,
    stockCount: 14,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 1499,
    rentEnabled: true,
    rentPricePerMonth: 3500,
    securityDeposit: 8000,
    deliveryPickupCharge: 500,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'BPL Acura V Volumetric IV Infusion Pump front view', type: 'main' },
      { url: '/images/prod_bp_detail.jpg', alt: 'Digital keypad with infusion rate display', type: 'detail' }
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: 'Precision volumetric IV drip pump with dual pressure sensors, anti-free-flow protection, and dose error reduction library.',
    description: 'BPL Acura V provides safe, continuous intravenous medication and fluid delivery in pediatric and adult ICUs. Features dual microprocessor monitoring, broad flow rate from 0.1 to 1200 ml/h, ultrasonic air bubble detection, and KVO automatic keep-vein-open safety triggers.',
    specifications: {
      'Flow Rate Range': '0.1 to 1200.0 ml/h in 0.1 ml/h increments',
      'Infusion Accuracy': '± 5% with calibrated IV sets',
      'Air Bubble Detection': 'Ultrasonic sensor detects single bubbles down to 50uL',
      'Battery Life': 'Up to 5 hours at 25 ml/h continuous operation',
      'KVO Rate': 'Adjustable 1.0 to 5.0 ml/h'
    },
    features: [
      'Dual pressure occlusion sensors with 10-level threshold adjustments',
      'Anti-bolus system releases pressure upon occlusion clearing',
      'Universal compatibility with standard disposable IV infusion sets'
    ],
    warranty: '2 Years Manufacturer Replacement Guarantee.',
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },
  // 24. ResMed Astral 150 Portable ICU Ventilator
  {
    id: 'prod-resmed-astral-150',
    slug: 'resmed-astral-150-life-support-transport-icu-ventilator',
    name: 'ResMed Astral 150 Life Support Portable ICU & Transport Ventilator with Internal Battery',
    brandId: 'brand-resmed',
    brandName: 'ResMed',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Transport & ICU Ventilators',
    subCategorySlug: 'icu-ventilators',
    sku: 'RES-AST-150-IN',
    price: 410000,
    mrp: 520000,
    discountPercentage: 21,
    rating: 4.9,
    reviewsCount: 16,
    inStock: true,
    stockCount: 4,
    isDealOfDay: true,
    dealExpiresAt: '2026-11-20T23:59:59Z',
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 18999,
    rentEnabled: true,
    rentPricePerMonth: 24000,
    securityDeposit: 50000,
    deliveryPickupCharge: 1500,
    images: [
      { url: '/images/bento_cpap_bipap_1793803386703.jpg', alt: 'ResMed Astral 150 ventilator display unit', type: 'main' },
      { url: '/images/prod_cpap_angle.jpg', alt: 'Profile showing valve circuitry and dual battery bays', type: 'angle' },
      { url: '/images/prod_cpap_detail.jpg', alt: 'Full touchscreen clinical waveform monitor', type: 'detail' }
    ],
    thumbnail: '/images/bento_cpap_bipap_1793803386703.jpg',
    image: '/images/bento_cpap_bipap_1793803386703.jpg',
    shortDescription: 'Lightweight 3.2kg hospital and home life support mechanical ventilator for pediatric to adult patients with 24h battery setup.',
    description: 'ResMed Astral 150 provides mechanical life-support ventilation across invasive (tracheostomy) and non-invasive interfaces. Offers volume and pressure modes (CPAP, S, ST, T, PAC, iVAPS, Volume-Assured), dual limb valve compatibility, integrated FiO2 monitoring, and up to 24 hours of operation with auxiliary external power.',
    specifications: {
      'Ventilation Modes': 'CPAP, Pressure Support, Pressure Control, Volume Control, iVAPS',
      'Patient Range': 'Pediatric (≥ 5kg) to Adult',
      'Weight': '3.2 kg Ultra-Portable',
      'Internal Battery': '8 Hours internal + expandable up to 24 hours',
      'FiO2 Capability': 'Integrated FiO2 sensor from low flow up to 100%'
    },
    features: [
      'Intuitive touchscreen display with real-time pressure & flow graphs',
      'Dual limb circuit capability with precise exhalation valve feedback',
      'iVAPS auto-titrates alveolar ventilation based on patient breathing changes'
    ],
    warranty: '3 Years ResMed Authorized Clinical Warranty.',
    certifications: ['US FDA Cleared', 'CE Mark'],
    gstRate: 12
  },
  // 25. BPL MediVac Heavy-Duty 2x2.5L Hospital Suction Apparatus
  {
    id: 'prod-bpl-medivac-suction',
    slug: 'bpl-medivac-heavy-duty-hospital-theater-suction-unit',
    name: 'BPL MediVac Heavy-Duty 2x2.5L Autoclavable Dual-Jar Hospital Theater Suction Unit',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Medical Suction Apparatus',
    subCategorySlug: 'medical-suction-apparatus',
    sku: 'BPL-SUC-MDV-02',
    price: 24800,
    mrp: 33000,
    discountPercentage: 24,
    rating: 4.6,
    reviewsCount: 38,
    inStock: true,
    stockCount: 12,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 1199,
    rentEnabled: true,
    rentPricePerMonth: 2800,
    securityDeposit: 6000,
    deliveryPickupCharge: 500,
    images: [
      { url: '/images/prod_suction_machine_1793803542649.jpg', alt: 'BPL MediVac Dual Jar Theater Suction Machine on mobile castors', type: 'main' },
      { url: '/images/prod_autoclave_detail.jpg', alt: 'Vacuum gauge and foot switch pedal', type: 'detail' }
    ],
    thumbnail: '/images/prod_suction_machine_1793803542649.jpg',
    image: '/images/prod_suction_machine_1793803542649.jpg',
    shortDescription: 'High vacuum, high flow 60 L/min oil-free piston pump suction unit with dual 2500ml polycarbonate jars and overflow protection.',
    description: 'BPL MediVac is an industrial-duty clinical surgical suction unit engineered for operating rooms, emergency bays, and trauma centers. The dual 2.5L shatterproof polycarbonate jars are fully autoclavable, supported by a heavy-duty pedal foot switch, bacterial exhaust filters, and silent castor wheels.',
    specifications: {
      'Flow Rate': '≥ 60 Litres per minute High Flow',
      'Max Vacuum': '≥ 0.09 MPa (680 mmHg)',
      'Jars': '2 x 2500 mL Shatterproof Polycarbonate',
      'Motor': 'Maintenance-free oil-less piston cylinder',
      'Noise': '≤ 55 dBA Low Whisper Quiet Operating Room Standard'
    },
    features: [
      'Dual autoclavable collection jars with mechanical overflow shut-off',
      'Heavy-duty castors with step-lock foot brakes',
      'Hands-free foot pedal switch included in standard pack'
    ],
    warranty: '2 Years Comprehensive Warranty.',
    certifications: ['CE', 'ISO 9001', 'ISO 13485'],
    gstRate: 12
  },
  // 26. Contec CMS8000 12.1-inch Multi-Parameter ICU Patient Monitor
  {
    id: 'prod-contec-cms8000-monitor',
    slug: 'contec-cms8000-12-inch-multi-parameter-icu-patient-monitor',
    name: 'Contec CMS8000 12.1-inch Color Multi-Parameter ICU Patient Monitor with Arrhythmia Analysis',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Multi-Para Patient Monitors',
    subCategorySlug: 'patient-monitors',
    sku: 'CTC-MON-8000-12',
    price: 36500,
    mrp: 49000,
    discountPercentage: 25,
    rating: 4.6,
    reviewsCount: 42,
    inStock: true,
    stockCount: 15,
    isDealOfDay: false,
    isBestSeller: true,
    isNewArrival: false,
    emiEnabled: true,
    emiStartingFrom: 1750,
    rentEnabled: true,
    rentPricePerMonth: 4500,
    securityDeposit: 10000,
    deliveryPickupCharge: 600,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'Contec 12.1-inch color monitor displaying real-time ECG and vitals', type: 'main' },
      { url: '/images/prod_bp_angle.jpg', alt: 'Side profile showing patient connector interfaces', type: 'angle' },
      { url: '/images/prod_bp_box.jpg', alt: 'Standard package with accessories and cuffs', type: 'box-contents' }
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: '12.1" full-color display with 8 waveforms, ST segment calculation, drug dose titration calculator, and oxyCRG view.',
    description: 'Contec CMS8000 offers comprehensive bedside clinical surveillance for adult, pediatric, and neonatal critical care patients. Standard configurations include 5-Lead ECG, NIBP, SpO2, PR, Dual Temperature, and Respiration, with upgradeable slots for EtCO2 and Invasive Blood Pressure (IBP).',
    specifications: {
      'Display': '12.1-inch High-Brightness Color TFT LCD (800x600)',
      'Waveforms': 'Up to 8 simultaneous waveform channels',
      'Trend Storage': '720-hour graphic & tabular trends memory',
      'Battery': 'Rechargeable internal Lithium battery (3.5h backup)',
      'Alarm': '3-level customizable auditory & visual alerts'
    },
    features: [
      'Built-in drug dose concentration titration table calculator',
      'Anti-high-frequency electrosurgical unit interference protection',
      'Arrhythmia classification and S-T segment detection'
    ],
    warranty: '2 Years Manufacturer Replacement Guarantee.',
    certifications: ['CE', 'ISO 13485'],
    gstRate: 12
  },
  // 27. Paramount Deluxe Emergency Resuscitation Crash Cart
  {
    id: 'prod-paramount-emergency-crash-cart',
    slug: 'paramount-deluxe-hospital-emergency-resuscitation-crash-cart',
    name: 'Paramount Deluxe Emergency Resuscitation Crash Cart with Defibrillator Shelf & CPR Backboard',
    brandId: 'brand-bpl',
    brandName: 'BPL Medical Technologies',
    categoryId: 'cat-critical-care',
    categoryName: 'Critical Care & ICU Equipment',
    subCategory: 'Hospital Furniture & ICU Beds',
    subCategorySlug: 'hospital-furniture',
    sku: 'PAR-CRT-EMG-01',
    price: 39500,
    mrp: 52000,
    discountPercentage: 24,
    rating: 4.8,
    reviewsCount: 15,
    inStock: true,
    stockCount: 7,
    isDealOfDay: false,
    isBestSeller: false,
    isNewArrival: true,
    emiEnabled: true,
    emiStartingFrom: 1899,
    rentEnabled: false,
    images: [
      { url: '/images/bento_monitoring_vitals_1793803410618.jpg', alt: 'Paramount Emergency Crash Cart trolley in red clinical finish', type: 'main' },
      { url: '/images/prod_chair_angle.jpg', alt: 'Side view with oxygen tank cage and IV pole', type: 'angle' }
    ],
    thumbnail: '/images/bento_monitoring_vitals_1793803410618.jpg',
    image: '/images/bento_monitoring_vitals_1793803410618.jpg',
    shortDescription: 'Central locking ABS emergency trolley with 5 sealed modular drawers, 360-degree swivel defib shelf, oxygen cylinder cage, and IV pole.',
    description: 'Essential emergency resuscitation trolley for rapid crash response across hospitals and nursing homes. Built from durable aluminum alloy columns and high-impact ABS injection-molded modular panels. Features 5 color-coded drawers with internal medication divider bins, breakaway disposable seal lock, CPR cardiac backboard, and telescopic stainless IV pole.',
    specifications: {
      'Dimensions': '750 x 480 x 980 mm (L x W x H)',
      'Drawers': '2 Small, 2 Medium, 1 Large Deep Modular Drawer',
      'Defibrillator Shelf': '360° Rotatable with safety security strap',
      'Castors': '125mm Silent medical-grade swivel wheels with 2 diagonal brakes',
      'Accessories Included': 'CPR Board, Oxygen Cylinder Holder, Power Extension, Sharps Bin'
    },
    features: [
      'One-touch centralized disposable breakaway key locking system',
      'Integrated sliding writing auxiliary work tray',
      'Seamless smooth molded top with raised edge spill guard'
    ],
    warranty: '3 Years Mechanical Durability Warranty.',
    certifications: ['ISO 9001', 'ISO 13485'],
    gstRate: 18
  }
];

export const MOCK_COUPONS: Coupon[] = [
  {
    code: 'DENMED10',
    description: '10% instant discount on orders above ₹10,000 (Max discount ₹2,500)',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 10000,
    maxDiscount: 2500,
    expiresAt: '2026-12-31'
  },
  {
    code: 'CLINIC500',
    description: 'Flat ₹500 discount on your first clinical supply order above ₹3,000',
    discountType: 'fixed',
    discountValue: 500,
    minOrderValue: 3000,
    expiresAt: '2026-12-31'
  },
  {
    code: 'RENTFREE',
    description: 'Zero installation charges + ₹1,000 off on 3+ month equipment rental',
    discountType: 'fixed',
    discountValue: 1000,
    minOrderValue: 8000,
    expiresAt: '2026-12-31'
  },
  {
    code: 'GSTBONUS',
    description: 'Extra 5% discount for verified GST registered medical clinics (Orders over ₹25,000)',
    discountType: 'percentage',
    discountValue: 5,
    minOrderValue: 25000,
    maxDiscount: 4000,
    expiresAt: '2026-12-31'
  }
];

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
