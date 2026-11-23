import prisma from "../../../db/db.js";
import { ApiError } from "../../lib/http.js";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatProduct(p) {
  const images = (p.images || []).map((img) => ({
    id: img.id.toString(),
    url: img.url,
    altText: img.alt_text || "",
    type: img.type || "main",
    sortOrder: img.sort_order || 0,
  }));

  const specifications = (p.specs || []).map((s) => ({
    id: s.id.toString(),
    key: s.spec_key,
    value: s.spec_value,
    sortOrder: s.sort_order || 0,
  }));

  const variants = (p.variants || []).map((v) => {
    const inv = v.inventory && v.inventory.length > 0 ? v.inventory[0] : null;
    const availableStock = inv ? Math.max(0, inv.quantity - inv.reserved) : 0;

    return {
      id: v.id.toString(),
      name: v.name,
      sku: v.sku,
      price: Number(v.price_paise) / 100,
      mrp: Number(v.mrp_paise) / 100,
      stock: availableStock,
      optionType: v.option_type || "Model",
      imageUrl: v.image_url || (images[0]?.url || ""),
      isDefault: v.is_default,
      isActive: v.is_active,
      sortOrder: v.sort_order || 0,
    };
  });

  // Calculate product-level aggregate stock
  let totalStock = 0;
  let totalReserved = 0;
  let lowStockThreshold = 5;

  if (variants.length > 0) {
    totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    for (const v of p.variants || []) {
      const inv = v.inventory && v.inventory.length > 0 ? v.inventory[0] : null;
      if (inv) {
        totalReserved += inv.reserved;
        lowStockThreshold = inv.low_stock_threshold;
      }
    }
  }

  // First / default variant price
  const defVar = variants.find((v) => v.isDefault) || variants[0];
  const price = defVar ? defVar.price : 0;
  const mrp = defVar ? defVar.mrp : price;

  // Rental plans
  const rentalPlans = (p.rental_plans || []).map((rp) => ({
    id: rp.id.toString(),
    durationType: rp.period,
    price: Number(rp.price_paise) / 100,
    minDuration: rp.min_periods,
    maxDuration: rp.max_periods,
  }));

  const firstPlan = p.rental_plans && p.rental_plans.length > 0 ? p.rental_plans[0] : null;

  return {
    id: p.id.toString(),
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brandId: p.brand_id ? p.brand_id.toString() : "",
    brandName: p.brand?.name || "Buy Denmed",
    categoryId: p.category_id ? p.category_id.toString() : "",
    categoryPath: p.category?.path || p.category?.name || "General",
    shortDescription: p.short_description || "",
    fullDescription: p.description || "",
    status: p.status,
    price,
    mrp,
    gstPercent: Number(p.gst_rate) || 18,
    hsnCode: p.hsn_code || "",
    stock: totalStock,
    reservedStock: totalReserved,
    lowStockThreshold,
    emiEnabled: Boolean(p.emi_enabled),
    codEnabled: p.cod_enabled !== false,
    featured: Boolean(p.is_featured),
    bestSeller: Boolean(p.is_best_seller),
    dealOfTheDay: false,
    newArrival: Boolean(p.is_new_arrival),
    showAvailableOnRent: Boolean(p.rent_enabled),
    variants,
    images,
    specifications,
    weightKg: p.weight_grams ? p.weight_grams / 1000 : 1,
    lengthCm: Number(p.length_cm) || 0,
    widthCm: Number(p.width_cm) || 0,
    heightCm: Number(p.height_cm) || 0,
    rental: {
      enabled: Boolean(p.rent_enabled),
      plans: rentalPlans,
      securityDeposit: firstPlan ? Number(firstPlan.security_deposit_paise) / 100 : 0,
      deliveryPickupCharge: firstPlan ? Number(firstPlan.delivery_pickup_paise) / 100 : 0,
      prescriptionRequired: firstPlan ? firstPlan.prescription_required : false,
    },
    seoTitle: p.meta_title || "",
    seoDescription: p.meta_description || "",
    createdAt: p.created_at.toISOString(),
    updatedAt: p.updated_at.toISOString(),
  };
}

export async function resolveBrand(brandIdOrName) {
  if (!brandIdOrName) {
    const existing = await prisma.brand.findFirst();
    if (existing) return existing;
    return await prisma.brand.create({
      data: { name: "Buy Denmed", slug: "buy-denmed", status: "active" },
    });
  }

  // 1. Try BigInt ID
  try {
    const bId = BigInt(brandIdOrName);
    const byId = await prisma.brand.findUnique({ where: { id: bId } });
    if (byId) return byId;
  } catch {}

  // 2. Try Slug or Name
  const cleanSlug = slugify(String(brandIdOrName).replace(/^brand-/, ""));
  const bySlug = await prisma.brand.findUnique({ where: { slug: cleanSlug } });
  if (bySlug) return bySlug;

  const byName = await prisma.brand.findFirst({
    where: {
      OR: [
        { name: { equals: String(brandIdOrName), mode: "insensitive" } },
        { slug: { equals: cleanSlug, mode: "insensitive" } },
      ],
    },
  });
  if (byName) return byName;

  // 3. Create brand if not found
  const name = String(brandIdOrName).replace(/^brand-/, "").replace(/[-_]+/g, " ");
  const capitalized = name.replace(/\b\w/g, (c) => c.toUpperCase());
  return await prisma.brand.create({
    data: {
      name: capitalized || "Buy Denmed",
      slug: cleanSlug || `brand-${Date.now()}`,
      status: "active",
    },
  });
}

export async function resolveCategory(categoryIdOrName) {
  if (!categoryIdOrName) {
    const existing = await prisma.category.findFirst();
    if (existing) return existing;
    return await prisma.category.create({
      data: {
        name: "General Equipment",
        slug: "general-equipment",
        path: "General Equipment",
        status: "active",
        level: 1,
      },
    });
  }

  // 1. Try BigInt ID
  try {
    const cId = BigInt(categoryIdOrName);
    const byId = await prisma.category.findUnique({ where: { id: cId } });
    if (byId) return byId;
  } catch {}

  // 2. Try Slug or Name
  const cleanSlug = slugify(String(categoryIdOrName).replace(/^cat-/, ""));
  const bySlug = await prisma.category.findUnique({ where: { slug: cleanSlug } });
  if (bySlug) return bySlug;

  const byName = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: String(categoryIdOrName), mode: "insensitive" } },
        { slug: { equals: cleanSlug, mode: "insensitive" } },
      ],
    },
  });
  if (byName) return byName;

  // 3. Create category if not found
  const name = String(categoryIdOrName).replace(/^cat-/, "").replace(/[-_]+/g, " ");
  const capitalized = name.replace(/\b\w/g, (c) => c.toUpperCase());
  return await prisma.category.create({
    data: {
      name: capitalized || "General Equipment",
      slug: cleanSlug || `cat-${Date.now()}`,
      path: capitalized || "General Equipment",
      status: "active",
      level: 1,
    },
  });
}

export async function resolveWarehouse() {
  let warehouse = await prisma.warehouse.findUnique({ where: { code: "MAIN" } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.findFirst({ where: { is_active: true } });
  }
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: "Main Warehouse (Okhla, Delhi)",
        code: "MAIN",
        city: "Okhla, Delhi",
        state: "Delhi",
        is_active: true,
      },
    });
  }
  return warehouse;
}

export async function listProducts(filters = {}) {
  const where = { deleted_at: null };

  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
      { variants: { some: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  const list = await prisma.product.findMany({
    where,
    include: {
      brand: true,
      category: true,
      variants: {
        orderBy: { sort_order: "asc" },
        include: {
          inventory: {
            take: 1,
          },
        },
      },
      images: {
        orderBy: { sort_order: "asc" },
      },
      specs: {
        orderBy: { sort_order: "asc" },
      },
      rental_plans: true,
    },
    orderBy: { created_at: "desc" },
  });

  return list.map(formatProduct);
}

export async function getProductById(idOrSlug) {
  let where;
  try {
    const pId = BigInt(idOrSlug);
    where = { id: pId };
  } catch {
    where = { slug: idOrSlug };
  }

  const p = await prisma.product.findFirst({
    where,
    include: {
      brand: true,
      category: true,
      variants: {
        orderBy: { sort_order: "asc" },
        include: {
          inventory: {
            take: 1,
          },
        },
      },
      images: {
        orderBy: { sort_order: "asc" },
      },
      specs: {
        orderBy: { sort_order: "asc" },
      },
      rental_plans: true,
    },
  });

  if (!p) return null;
  return formatProduct(p);
}

export async function createProduct(payload, adminUser) {
  const brand = await resolveBrand(payload.brandId);
  const category = await resolveCategory(payload.categoryId);
  const warehouse = await resolveWarehouse();

  // Ensure unique slug
  let baseSlug = payload.slug || slugify(payload.name);
  if (!baseSlug) baseSlug = `product-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  // Ensure unique SKU
  let primarySku = (payload.sku || `BDM-${Date.now()}`).trim().toUpperCase();
  let skuCounter = 1;
  while (await prisma.product.findUnique({ where: { sku: primarySku } })) {
    primarySku = `${payload.sku.trim().toUpperCase()}-${skuCounter++}`;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create main Product
    const createdProduct = await tx.product.create({
      data: {
        name: payload.name.trim(),
        slug,
        sku: primarySku,
        brand_id: brand.id,
        category_id: category.id,
        short_description: payload.shortDescription || null,
        description: payload.fullDescription || null,
        hsn_code: payload.hsnCode || null,
        gst_rate: payload.gstPercent ?? 18,
        weight_grams: payload.weightKg ? Math.round(payload.weightKg * 1000) : null,
        length_cm: payload.lengthCm ?? null,
        width_cm: payload.widthCm ?? null,
        height_cm: payload.heightCm ?? null,
        emi_enabled: Boolean(payload.emiEnabled),
        cod_enabled: payload.codEnabled !== false,
        rent_enabled: Boolean(payload.showAvailableOnRent || payload.rental?.enabled),
        sale_enabled: true,
        is_featured: Boolean(payload.featured),
        is_best_seller: Boolean(payload.bestSeller),
        is_new_arrival: Boolean(payload.newArrival),
        meta_title: payload.seoTitle || null,
        meta_description: payload.seoDescription || null,
        status: payload.status || "draft",
      },
    });

    // 2. Create Variants & Inventory
    const variantsToCreate =
      payload.variants && payload.variants.length > 0
        ? payload.variants
        : [
            {
              name: payload.name.trim(),
              sku: primarySku,
              price: payload.price || 0,
              mrp: payload.mrp || payload.price || 0,
              stock: payload.stock || 0,
              optionType: "default",
              isDefault: true,
              isActive: true,
              imageUrl: payload.images?.[0]?.url || "",
              sortOrder: 0,
            },
          ];

    for (const v of variantsToCreate) {
      let varSku = (v.sku || `${primarySku}-VAR`).trim().toUpperCase();
      const existingVar = await tx.productVariant.findUnique({ where: { sku: varSku } });
      if (existingVar) {
        varSku = `${varSku}-${Date.now().toString().slice(-4)}`;
      }

      const variant = await tx.productVariant.create({
        data: {
          product_id: createdProduct.id,
          name: v.name.trim(),
          sku: varSku,
          option_type: v.optionType || "model",
          price_paise: BigInt(Math.round((v.price || 0) * 100)),
          mrp_paise: BigInt(Math.round((v.mrp || v.price || 0) * 100)),
          image_url: v.imageUrl || payload.images?.[0]?.url || null,
          is_default: Boolean(v.isDefault),
          is_active: v.isActive !== false,
          sort_order: v.sortOrder || 0,
        },
      });

      // Create Inventory in Warehouse
      const initialStock = Math.max(0, v.stock || 0);
      const lowThreshold = payload.lowStockThreshold || 5;

      const inv = await tx.inventory.create({
        data: {
          variant_id: variant.id,
          warehouse_id: warehouse.id,
          quantity: initialStock,
          reserved: 0,
          low_stock_threshold: lowThreshold,
        },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            variant_id: variant.id,
            warehouse_id: warehouse.id,
            change_qty: initialStock,
            reason: "purchase",
            balance_after: initialStock,
            admin_user_id: adminUser?.id ? BigInt(adminUser.id) : null,
            note: `Initial inventory creation for variant ${variant.sku}`,
          },
        });
      }
    }

    // 3. Create Images
    if (payload.images && payload.images.length > 0) {
      for (let idx = 0; idx < payload.images.length; idx++) {
        const img = payload.images[idx];
        if (!img.url) continue;
        await tx.productImage.create({
          data: {
            product_id: createdProduct.id,
            url: img.url,
            alt_text: img.altText || payload.name,
            type: img.type || (idx === 0 ? "main" : "angle"),
            sort_order: img.sortOrder ?? idx,
          },
        });
      }
    }

    // 4. Create Specifications
    if (payload.specifications && payload.specifications.length > 0) {
      for (let idx = 0; idx < payload.specifications.length; idx++) {
        const s = payload.specifications[idx];
        if (!s.key || !s.value) continue;
        await tx.productSpec.create({
          data: {
            product_id: createdProduct.id,
            spec_key: s.key.trim(),
            spec_value: s.value.trim(),
            sort_order: s.sortOrder ?? idx,
          },
        });
      }
    }

    // 5. Create Rental Plans (if applicable)
    if (payload.rental?.enabled && payload.rental.plans?.length > 0) {
      for (const plan of payload.rental.plans) {
        await tx.rentalPlan.create({
          data: {
            product_id: createdProduct.id,
            period: plan.durationType,
            price_paise: BigInt(Math.round(plan.price * 100)),
            min_periods: plan.minDuration || 1,
            max_periods: plan.maxDuration || 12,
            security_deposit_paise: BigInt(Math.round((payload.rental.securityDeposit || 0) * 100)),
            delivery_pickup_paise: BigInt(Math.round((payload.rental.deliveryPickupCharge || 0) * 100)),
            prescription_required: payload.rental.prescriptionRequired ?? false,
          },
        });
      }
    }

    // 6. Return loaded product
    const full = await tx.product.findUnique({
      where: { id: createdProduct.id },
      include: {
        brand: true,
        category: true,
        variants: {
          orderBy: { sort_order: "asc" },
          include: {
            inventory: {
              take: 1,
            },
          },
        },
        images: {
          orderBy: { sort_order: "asc" },
        },
        specs: {
          orderBy: { sort_order: "asc" },
        },
        rental_plans: true,
      },
    });

    return formatProduct(full);
  });
}

export async function updateProduct(idOrSlug, payload, adminUser) {
  let pId;
  try {
    pId = BigInt(idOrSlug);
  } catch {
    const existing = await prisma.product.findUnique({ where: { slug: idOrSlug } });
    if (!existing) throw ApiError.notFound("Product not found");
    pId = existing.id;
  }

  const existing = await prisma.product.findUnique({
    where: { id: pId },
    include: { variants: true },
  });
  if (!existing) throw ApiError.notFound("Product not found");

  const brand = payload.brandId ? await resolveBrand(payload.brandId) : null;
  const category = payload.categoryId ? await resolveCategory(payload.categoryId) : null;
  const warehouse = await resolveWarehouse();

  return await prisma.$transaction(async (tx) => {
    const updateData = {};
    if (payload.name) updateData.name = payload.name.trim();
    if (payload.slug) updateData.slug = slugify(payload.slug);
    if (payload.sku) updateData.sku = payload.sku.trim().toUpperCase();
    if (brand) updateData.brand_id = brand.id;
    if (category) updateData.category_id = category.id;
    if (payload.shortDescription !== undefined) updateData.short_description = payload.shortDescription;
    if (payload.fullDescription !== undefined) updateData.description = payload.fullDescription;
    if (payload.hsnCode !== undefined) updateData.hsn_code = payload.hsnCode;
    if (payload.gstPercent !== undefined) updateData.gst_rate = payload.gstPercent;
    if (payload.weightKg !== undefined) updateData.weight_grams = Math.round(payload.weightKg * 1000);
    if (payload.lengthCm !== undefined) updateData.length_cm = payload.lengthCm;
    if (payload.widthCm !== undefined) updateData.width_cm = payload.widthCm;
    if (payload.heightCm !== undefined) updateData.height_cm = payload.heightCm;
    if (payload.emiEnabled !== undefined) updateData.emi_enabled = payload.emiEnabled;
    if (payload.codEnabled !== undefined) updateData.cod_enabled = payload.codEnabled;
    if (payload.showAvailableOnRent !== undefined) updateData.rent_enabled = payload.showAvailableOnRent;
    if (payload.featured !== undefined) updateData.is_featured = payload.featured;
    if (payload.bestSeller !== undefined) updateData.is_best_seller = payload.bestSeller;
    if (payload.newArrival !== undefined) updateData.is_new_arrival = payload.newArrival;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.seoTitle !== undefined) updateData.meta_title = payload.seoTitle;
    if (payload.seoDescription !== undefined) updateData.meta_description = payload.seoDescription;

    await tx.product.update({
      where: { id: pId },
      data: updateData,
    });

    // Update variants if provided
    if (payload.variants && payload.variants.length > 0) {
      for (const v of payload.variants) {
        const varSku = v.sku.trim().toUpperCase();
        let variant = await tx.productVariant.findUnique({ where: { sku: varSku } });

        if (variant) {
          variant = await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              name: v.name.trim(),
              price_paise: BigInt(Math.round((v.price || 0) * 100)),
              mrp_paise: BigInt(Math.round((v.mrp || v.price || 0) * 100)),
              is_default: Boolean(v.isDefault),
              is_active: v.isActive !== false,
              image_url: v.imageUrl || null,
            },
          });
        } else {
          variant = await tx.productVariant.create({
            data: {
              product_id: pId,
              name: v.name.trim(),
              sku: varSku,
              option_type: v.optionType || "model",
              price_paise: BigInt(Math.round((v.price || 0) * 100)),
              mrp_paise: BigInt(Math.round((v.mrp || v.price || 0) * 100)),
              image_url: v.imageUrl || null,
              is_default: Boolean(v.isDefault),
              is_active: v.isActive !== false,
            },
          });
        }

        // Upsert inventory
        const desiredStock = Math.max(0, v.stock || 0);
        const lowThreshold = payload.lowStockThreshold || 5;

        await tx.inventory.upsert({
          where: {
            variant_id_warehouse_id: {
              variant_id: variant.id,
              warehouse_id: warehouse.id,
            },
          },
          update: {
            quantity: desiredStock,
            low_stock_threshold: lowThreshold,
          },
          create: {
            variant_id: variant.id,
            warehouse_id: warehouse.id,
            quantity: desiredStock,
            reserved: 0,
            low_stock_threshold: lowThreshold,
          },
        });
      }
    }

    // Update images if provided
    if (payload.images !== undefined && Array.isArray(payload.images)) {
      await tx.productImage.deleteMany({
        where: { product_id: pId },
      });
      for (let idx = 0; idx < payload.images.length; idx++) {
        const img = payload.images[idx];
        if (!img.url) continue;
        await tx.productImage.create({
          data: {
            product_id: pId,
            url: img.url,
            alt_text: img.altText || payload.name || existing.name,
            type: img.type || (idx === 0 ? "main" : "angle"),
            sort_order: img.sortOrder ?? idx,
          },
        });
      }
    }

    // Update specifications if provided
    if (payload.specifications !== undefined && Array.isArray(payload.specifications)) {
      await tx.productSpec.deleteMany({
        where: { product_id: pId },
      });
      for (let idx = 0; idx < payload.specifications.length; idx++) {
        const s = payload.specifications[idx];
        if (!s.key || !s.value) continue;
        await tx.productSpec.create({
          data: {
            product_id: pId,
            spec_key: s.key.trim(),
            spec_value: s.value.trim(),
            sort_order: s.sortOrder ?? idx,
          },
        });
      }
    }

    // Update rental plans if provided
    if (payload.rental?.plans !== undefined && Array.isArray(payload.rental.plans)) {
      await tx.rentalPlan.deleteMany({
        where: { product_id: pId },
      });
      if (payload.rental.enabled && payload.rental.plans.length > 0) {
        for (const plan of payload.rental.plans) {
          await tx.rentalPlan.create({
            data: {
              product_id: pId,
              plan_type: plan.type || "monthly",
              price_per_month_paise: BigInt(Math.round((plan.price || 0) * 100)),
              min_duration_months: plan.minDuration || 1,
              max_duration_months: plan.maxDuration || 12,
              security_deposit_paise: BigInt(Math.round((plan.securityDeposit || 0) * 100)),
              delivery_pickup_charge_paise: BigInt(Math.round((plan.installationFee || 0) * 100)),
            },
          });
        }
      }
    }

    // Refresh and return
    const full = await tx.product.findUnique({
      where: { id: pId },
      include: {
        brand: true,
        category: true,
        variants: {
          orderBy: { sort_order: "asc" },
          include: {
            inventory: {
              take: 1,
            },
          },
        },
        images: {
          orderBy: { sort_order: "asc" },
        },
        specs: {
          orderBy: { sort_order: "asc" },
        },
        rental_plans: true,
      },
    });

    return formatProduct(full);
  });
}

export async function deleteProduct(idOrSlug, adminUser) {
  let pId;
  try {
    pId = BigInt(idOrSlug);
  } catch {
    const existing = await prisma.product.findUnique({ where: { slug: idOrSlug } });
    if (!existing) throw ApiError.notFound("Product not found");
    pId = existing.id;
  }

  // Soft delete product
  await prisma.product.update({
    where: { id: pId },
    data: {
      deleted_at: new Date(),
      status: "inactive",
    },
  });

  return { success: true };
}
