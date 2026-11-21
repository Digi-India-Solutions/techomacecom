import { getBlogPostBySlug } from "./lib/api/index.js";

async function main() {
  const post = await getBlogPostBySlug("5l-vs-10l-oxygen-concentrator-home-care-guide");
  console.log("Post found:", Boolean(post));
  if (post) {
    console.log("Title:", post.title);
    console.log("Content preview:", post.content ? post.content.slice(0, 100) : "NO CONTENT");
  }
}

main().catch(console.error);

