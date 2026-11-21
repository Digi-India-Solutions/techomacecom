async function verify() {
  const faqRes = await fetch("http://localhost:3000/faq");
  const faqHtml = await faqRes.text();
  console.log("FAQ status:", faqRes.status);
  console.log("FAQ contains 'GST tax invoices':", faqHtml.includes("GST tax invoices"));

  const blogRes = await fetch("http://localhost:3000/blog");
  const blogHtml = await blogRes.text();
  console.log("Blog status:", blogRes.status);
  console.log("Blog contains 'Oxygen Concentrator':", blogHtml.includes("Oxygen Concentrator"));

  const singleBlogRes = await fetch("http://localhost:3000/blog/5l-vs-10l-oxygen-concentrator-home-care-guide");
  const singleBlogHtml = await singleBlogRes.text();
  console.log("Single Blog status:", singleBlogRes.status);
  console.log("Single blog contains '5 LPM':", singleBlogHtml.includes("5 LPM"));
}

verify().catch(console.error);

