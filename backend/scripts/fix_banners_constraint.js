import prisma from "../db/db.js";

async function main() {
  console.log("Dropping existing banners_placement_chk constraint if exists...");
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "banners" DROP CONSTRAINT IF EXISTS "banners_placement_chk";
  `);

  console.log("Adding updated banners_placement_chk constraint...");
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "banners" ADD CONSTRAINT "banners_placement_chk" CHECK ("placement" IN (
      'hero',
      'category',
      'brand',
      'best_sellers',
      'new_arrivals',
      'offers',
      'hot_selling',
      'deal_of_day',
      'brands_page',
      'rental',
      'sleep_test',
      'promo_banner_1',
      'promo_banner_2',
      'promo_banners',
      'featured_categories',
      'promo_1',
      'promo_2'
    ));
  `);

  console.log("Checking constraint definition...");
  const updated = await prisma.$queryRawUnsafe(`
    SELECT conname::text, pg_get_constraintdef(oid)::text as def
    FROM pg_constraint
    WHERE conrelid = 'banners'::regclass AND conname::text = 'banners_placement_chk';
  `);
  console.log("Updated constraint definition:", updated);
  console.log("banners_placement_chk constraint successfully updated!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
