import prisma from "./db/db.js";

async function main() {
  const faqs = await prisma.faq.findMany();
  const blogs = await prisma.blogPost.findMany();
  console.log("Faqs count in DB:", faqs.length);
  console.log("BlogPosts count in DB:", blogs.length);
}

main().catch(console.error).finally(() => process.exit(0));

