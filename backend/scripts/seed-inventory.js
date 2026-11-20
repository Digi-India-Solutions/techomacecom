import "../config/load-env.js";
import prisma from "../db/db.js";

async function seedInventoryData() {
  console.log("Seeding initial inventory and catalog data...");

  // 1. Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: {
      name: "Main Warehouse (Okhla, Delhi)",
      city: "Okhla, Delhi",
      state: "Delhi",
      is_active: true,
    },
    create: {
      name: "Main Warehouse (Okhla, Delhi)",
      code: "MAIN",
      city: "Okhla, Delhi",
      state: "Delhi",
      is_active: true,
    },
  });
  console.log("✔ Warehouse ready:", warehouse.name, `(ID: ${warehouse.id})`);

  // 2. Brands
  const brandsData = [
    { name: "Yuwell Medical", slug: "yuwell-medical" },
    { name: "Gnatus Dental", slug: "gnatus-dental" },
    { name: "MediCore Diagnostics", slug: "medicore-diagnostics" },
    { name: "Paramount Bed", slug: "paramount-bed" },
    { name: "Karma Healthcare", slug: "karma-healthcare" },
    { name: "AuraMed Sterilization", slug: "auramed-sterilization" },
  ];

  const brandMap = new Map();
  for (const b of brandsData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name },
      create: { name: b.name, slug: b.slug, status: "active" },
    });
    brandMap.set(b.slug, brand.id);
  }
  console.log(`✔ ${brandsData.length} brands ready.`);

  // 3. Categories
  const categoriesData = [
    { name: "Oxygen Concentrators", slug: "oxygen-concentrators" },
    { name: "Dental Chairs", slug: "dental-chairs" },
    { name: "Patient Monitors", slug: "patient-monitors" },
    { name: "ICU Beds", slug: "icu-beds" },
    { name: "Manual Wheelchairs", slug: "manual-wheelchairs" },
    { name: "Dental Autoclaves", slug: "dental-autoclaves" },
  ];

  const categoryMap = new Map();
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug, status: "active", level: 1 },
    });
    categoryMap.set(c.slug, cat.id);
  }
  console.log(`✔ ${categoriesData.length} categories ready.`);

  // 4. Products & Variants & Inventory
  const productsData = [
    {
      name: "MedixPulse 5L Stationary Oxygen Concentrator",
      slug: "medixpulse-5l-stationary-oxygen-concentrator",
      sku: "BDM-OXY-5L-01",
      brandSlug: "yuwell-medical",
      categorySlug: "oxygen-concentrators",
      imageUrl: "/src/assets/images/product_oxygen_concentrator_1794913183075.jpg",
      variants: [
        {
          name: "5L Standard Edition",
          sku: "BDM-OXY-5L-01-STD",
          pricePaise: 4250000n,
          mrpPaise: 5400000n,
          availableStock: 12,
          reservedStock: 3,
          lowStockThreshold: 6,
        },
        {
          name: "5L + Built-in Nebulizer",
          sku: "BDM-OXY-5L-01-NEB",
          pricePaise: 4580000n,
          mrpPaise: 5800000n,
          availableStock: 6,
          reservedStock: 1,
          lowStockThreshold: 6,
        },
      ],
    },
    {
      name: "DentaLux 5000 Electromechanical Dental Chair Unit",
      slug: "dentalux-5000-electromechanical-dental-chair-unit",
      sku: "BDM-DNT-5000",
      brandSlug: "gnatus-dental",
      categorySlug: "dental-chairs",
      imageUrl: "/src/assets/images/product_dental_chair_1794913183436.jpg",
      variants: [
        {
          name: "Navy Upholstery / Top Delivery",
          sku: "BDM-DNT-5000-NVT",
          pricePaise: 18500000n,
          mrpPaise: 22500000n,
          availableStock: 3,
          reservedStock: 1,
          lowStockThreshold: 3,
        },
      ],
    },
    {
      name: "MediCore Med-Vitals 7000 5-Para Patient Monitor",
      slug: "medicore-med-vitals-7000-5-para-patient-monitor",
      sku: "BDM-MON-7000",
      brandSlug: "medicore-diagnostics",
      categorySlug: "patient-monitors",
      imageUrl: "/src/assets/images/product_patient_monitor_1794913183598.jpg",
      variants: [
        {
          name: "5-Para Standard",
          sku: "BDM-MON-7000-5P",
          pricePaise: 3800000n,
          mrpPaise: 4800000n,
          availableStock: 3,
          reservedStock: 2,
          lowStockThreshold: 5,
        },
      ],
    },
    {
      name: "Paramount ProCare 5-Function Electric ICU Hospital Bed",
      slug: "paramount-procare-5-function-electric-icu-hospital-bed",
      sku: "BDM-BED-5F-90",
      brandSlug: "paramount-bed",
      categorySlug: "icu-beds",
      imageUrl: "/src/assets/images/product_hospital_bed_1794913184533.jpg",
      variants: [
        {
          name: "Standard Frame",
          sku: "BDM-BED-5F-90-STD",
          pricePaise: 11500000n,
          mrpPaise: 14200000n,
          availableStock: 5,
          reservedStock: 2,
          lowStockThreshold: 4,
        },
      ],
    },
    {
      name: "Karma ErgoLite Ultra-Light Folding Wheelchair",
      slug: "karma-ergolite-ultra-light-folding-wheelchair",
      sku: "BDM-WCH-EL18",
      brandSlug: "karma-healthcare",
      categorySlug: "manual-wheelchairs",
      imageUrl: "/src/assets/images/product_wheelchair_1794913183842.jpg",
      variants: [
        {
          name: '18" Seat Width',
          sku: "BDM-WCH-EL18",
          pricePaise: 2450000n,
          mrpPaise: 3100000n,
          availableStock: 16,
          reservedStock: 3,
          lowStockThreshold: 8,
        },
      ],
    },
    {
      name: "AuraFlow 18B Class B Vacuum Dental Autoclave",
      slug: "auraflow-18b-class-b-vacuum-dental-autoclave",
      sku: "BDM-STR-18B",
      brandSlug: "auramed-sterilization",
      categorySlug: "dental-autoclaves",
      imageUrl: "/src/assets/images/product_autoclave_1794913184649.jpg",
      variants: [
        {
          name: "18 Liters Chamber",
          sku: "BDM-STR-18B",
          pricePaise: 14800000n,
          mrpPaise: 17500000n,
          availableStock: 0,
          reservedStock: 0,
          lowStockThreshold: 3,
        },
      ],
    },
  ];

  const variantMap = new Map();

  for (const p of productsData) {
    let product = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          brand_id: brandMap.get(p.brandSlug),
          category_id: categoryMap.get(p.categorySlug),
          status: "active",
          images: {
            create: [
              { url: p.imageUrl, type: "main", sort_order: 0 },
            ],
          },
        },
      });
    }

    for (let idx = 0; idx < p.variants.length; idx++) {
      const v = p.variants[idx];
      let variant = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
      if (!variant) {
        variant = await prisma.productVariant.create({
          data: {
            product_id: product.id,
            name: v.name,
            sku: v.sku,
            price_paise: v.pricePaise,
            mrp_paise: v.mrpPaise,
            image_url: p.imageUrl,
            is_default: idx === 0,
            is_active: true,
            sort_order: idx,
          },
        });
      }

      variantMap.set(v.sku, variant);

      // Create / update inventory
      const totalPhysicalQty = v.availableStock + v.reservedStock;
      await prisma.inventory.upsert({
        where: {
          variant_id_warehouse_id: {
            variant_id: variant.id,
            warehouse_id: warehouse.id,
          },
        },
        update: {
          quantity: totalPhysicalQty,
          reserved: v.reservedStock,
          low_stock_threshold: v.lowStockThreshold,
        },
        create: {
          variant_id: variant.id,
          warehouse_id: warehouse.id,
          quantity: totalPhysicalQty,
          reserved: v.reservedStock,
          low_stock_threshold: v.lowStockThreshold,
        },
      });
    }
  }

  console.log(`✔ ${productsData.length} products and their inventory seeded.`);

  // 5. Initial stock movements
  const superAdmin = await prisma.adminUser.findFirst();
  const adminId = superAdmin?.id || null;

  const initialMovements = [
    {
      sku: "BDM-OXY-5L-01-STD",
      change_qty: 10,
      balance_after: 14,
      reason: "purchase",
      note: "PO-2026-1184 inbound shipment from Yuwell India",
    },
    {
      sku: "BDM-OXY-5L-01-STD",
      change_qty: -2,
      balance_after: 12,
      reason: "correction",
      note: "Allocated 2 units to B2B clinic demo kit",
    },
    {
      sku: "BDM-MON-7000-5P",
      change_qty: -1,
      balance_after: 3,
      reason: "damage",
      note: "LCD bezel cracked during transit inspection; moved to RMA",
    },
  ];

  for (const m of initialMovements) {
    const variant = variantMap.get(m.sku);
    if (!variant) continue;

    const existing = await prisma.stockMovement.findFirst({
      where: {
        variant_id: variant.id,
        warehouse_id: warehouse.id,
        note: m.note,
      },
    });

    if (!existing) {
      await prisma.stockMovement.create({
        data: {
          variant_id: variant.id,
          warehouse_id: warehouse.id,
          change_qty: m.change_qty,
          balance_after: m.balance_after,
          reason: m.reason,
          note: m.note,
          admin_user_id: adminId,
        },
      });
    }
  }

  console.log("✔ Initial stock movements seeded.");
  console.log("Done! Inventory database setup complete.");
}

seedInventoryData()
  .catch((err) => {
    console.error("Failed to seed inventory:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

