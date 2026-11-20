/**
 * Seed script — run with: bun prisma/seed.ts
 * Creates admin + demo users, categories, real products (with live image URLs),
 * banners, coupons, reviews, and site settings.
 * Note: no demo orders/payments are seeded — the admin panel starts clean.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "../src/lib/env"; // load .env with override (stale shell DATABASE_URL must not win)

const db = new PrismaClient();

const IMG = (name: string) => `https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/${name}`;

async function main() {
  const existing = await db.product.count();
  if (existing > 0 && !process.env.FORCE) {
    console.log("Database already seeded. Set FORCE=1 to reseed. Skipping.");
    return;
  }

  if (process.env.FORCE) {
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.review.deleteMany();
    await db.cartItem.deleteMany();
    await db.wishlistItem.deleteMany();
    await db.product.deleteMany();
    await db.category.deleteMany();
    await db.coupon.deleteMany();
    await db.banner.deleteMany();
    await db.address.deleteMany();
    await db.user.deleteMany();
    await db.siteSetting.deleteMany();
  }

  // ---------- Users ----------
  const pass = (p: string) => bcrypt.hashSync(p, 10);
  const admin = await db.user.create({
    data: {
      name: "Store Admin",
      email: "admin@shoperic.com",
      password: pass("Admin@123"),
      role: "ADMIN",
      phone: "+91 98765 43210",
    },
  });
  const priya = await db.user.create({
    data: { name: "Priya Sharma", email: "priya@example.com", password: pass("User@123"), phone: "+91 90000 11111" },
  });
  // Demo customer accounts (used for sample product reviews below; found by email)
  await db.user.create({ data: { name: "Rahul Verma", email: "rahul@example.com", password: pass("User@123"), phone: "+91 90000 22222" } });
  await db.user.create({ data: { name: "Sneha Patel", email: "sneha@example.com", password: pass("User@123"), phone: "+91 90000 33333" } });

  // ---------- Settings ----------
  await db.siteSetting.create({
    data: {
      id: "singleton",
      siteName: "Shoperic",
      tagline: "Everything you love, delivered.",
      announcement: "Free shipping on orders above ₹999 · Extra 10% off with code WELCOME10",
      logoUrl: "/brand/logo.png",
      faviconUrl: "/brand/favicon.svg",
      primaryColor: "#ea580c",
      supportEmail: "support@shoperic.com",
      supportPhone: "+91 90000 00000",
      seoTitle: "Shoperic — Online Shopping for Electronics, Fashion, Home & More",
      seoDescription:
        "Shop electronics, fashion, home essentials, fitness gear and beauty products at the best prices. Fast delivery, secure payments, easy returns.",
      seoKeywords: "online shopping, ecommerce, electronics, fashion, home decor, fitness, beauty, India",
      socialJson: JSON.stringify({
        instagram: "https://instagram.com/shoperic",
        twitter: "https://x.com/shoperic",
        facebook: "https://facebook.com/shoperic",
        youtube: "https://youtube.com/@shoperic",
      }),
      // Cross-portal links: update these to your deployed URLs after going live
      adminUrl: "/admin", // e.g. https://admin.yourstore.com
      storeUrl: "/", // e.g. https://www.yourstore.com
    },
  });

  // ---------- Categories ----------
  const catDefs = [
    { name: "Electronics", slug: "electronics", description: "Audio, wearables & smart gadgets", image: IMG("c54c62e85e42.jpg") },
    { name: "Fashion", slug: "fashion", description: "Apparel, footwear & bags", image: IMG("26ebe10c5480.jpg") },
    { name: "Home & Living", slug: "home-living", description: "Make every corner beautiful", image: IMG("cc234ebafd4b.jpg") },
    { name: "Fitness", slug: "fitness", description: "Gear for your active life", image: IMG("ea019d144980.jpg") },
    { name: "Beauty", slug: "beauty", description: "Skincare & self-care rituals", image: IMG("fb72860f5a8d.png") },
    { name: "Accessories", slug: "accessories", description: "Finish every look", image: IMG("5007e178f92f.jpg") },
  ];
  const cats: Record<string, string> = {};
  for (let i = 0; i < catDefs.length; i++) {
    const c = await db.category.create({ data: { ...catDefs[i], sortOrder: i } });
    cats[c.slug] = c.id;
  }

  // ---------- Products ----------
  type P = {
    name: string; cat: string; price: number; mrp: number; stock: number;
    images: string[]; featured?: boolean; desc: string; tags: string[]; sold: number;
  };
  const products: P[] = [
    {
      name: "SonicWave Pro Wireless Headphones", cat: "electronics", price: 299900, mrp: 499900, stock: 45, featured: true, sold: 132,
      images: [IMG("eeb6fc03e8c8.jpg"), IMG("e84fba27b7a5.jpg")],
      tags: ["audio", "wireless", "bestseller"],
      desc: "Immersive 40mm drivers, hybrid active noise cancellation and 45-hour battery life. Bluetooth 5.3 with dual-device pairing, memory-foam ear cushions and a built-in mic for crystal-clear calls. Includes carry case and USB-C fast charging.",
    },
    {
      name: "PulseFit Smart Watch", cat: "electronics", price: 179900, mrp: 349900, stock: 60, featured: true, sold: 214,
      images: [IMG("c54c62e85e42.jpg"), IMG("4868c90997bd.jpeg")],
      tags: ["wearable", "fitness", "bestseller"],
      desc: "1.85\" AMOLED always-on display with 120+ sports modes, SpO2 and 24x7 heart-rate tracking, sleep score and 10-day battery. IP68 water resistant with smart notifications and AI health insights.",
    },
    {
      name: "BoomBox Mini Bluetooth Speaker", cat: "electronics", price: 99900, mrp: 199900, stock: 80, sold: 96,
      images: [IMG("610fe6615c5e.jpg"), IMG("88e73f2ee130.jpg")],
      tags: ["audio", "portable"],
      desc: "Pocket-sized 10W speaker with punchy bass, TWS pairing and 12-hour playtime. IPX7 splash-proof body, passive bass radiator and built-in mic for handsfree calls.",
    },
    {
      name: "CloudStep Running Sneakers", cat: "fashion", price: 149900, mrp: 249900, stock: 35, featured: true, sold: 178,
      images: [IMG("2acd4e2b6cee.jpg"), IMG("26ebe10c5480.jpg")],
      tags: ["footwear", "unisex", "bestseller"],
      desc: "Breathable knit upper with responsive EVA midsole and anti-skid rubber outsole. Weighs just 240g — built for daily runs, gym sessions and all-day comfort. Unisex sizes UK 6-11.",
    },
    {
      name: "Everyday Organic Cotton Tee", cat: "fashion", price: 49900, mrp: 89900, stock: 120, sold: 341,
      images: [IMG("160629239ff2.png"), IMG("5a828e75afcf.jpg")],
      tags: ["apparel", "cotton"],
      desc: "Made from 100% GOTS-certified organic combed cotton, 180 GSM. Pre-shrunk, bio-washed and tailored for a regular fit that holds its shape wash after wash. Available in 8 shades, sizes XS-XXL.",
    },
    {
      name: "Milano Leather Handbag", cat: "fashion", price: 249900, mrp: 499900, stock: 25, featured: true, sold: 67,
      images: [IMG("d8ea01568a99.jpg"), IMG("48a805b71dce.jpg")],
      tags: ["bag", "leather", "premium"],
      desc: "Handcrafted full-grain leather handbag with gold-tone hardware, suede-lined interior and a detachable sling strap. Fits a 13\" laptop, with zip and slip pockets to keep essentials organised.",
    },
    {
      name: "Terra Ceramic Coffee Mug", cat: "home-living", price: 34900, mrp: 59900, stock: 90, sold: 156,
      images: [IMG("de67f0afc4d8.jpg"), IMG("0aa767af3d18.jpg")],
      tags: ["kitchen", "ceramic"],
      desc: "350ml stoneware mug with a matte reactive glaze — no two pieces are alike. Microwave and dishwasher safe, chip-resistant rim, and a comfortable wide-grip handle. Set of 2 available.",
    },
    {
      name: "Lumen Arc Desk Lamp", cat: "home-living", price: 129900, mrp: 219900, stock: 40, sold: 88,
      images: [IMG("cc234ebafd4b.jpg"), IMG("577d576b8eb2.jpeg")],
      tags: ["lighting", "office"],
      desc: "Minimalist metal-arc lamp with stepless dimming and 3 colour temperatures (2700K-6000K). Flicker-free eye-care LED, 60x swivel head and weighted base. Perfect for desks and bedside tables.",
    },
    {
      name: "Amber Glow Scented Candle", cat: "home-living", price: 44900, mrp: 79900, stock: 70, sold: 203,
      images: [IMG("ecf7ff35305e.webp"), IMG("77425ed60042.jpg")],
      tags: ["decor", "gifting"],
      desc: "Hand-poured 100% soy wax with a cotton wick and warm amber-vanilla fragrance. 45-hour clean burn in a reusable amber glass jar. Comes gift-boxed — a housewarming favourite.",
    },
    {
      name: "ZenFlex Yoga Mat", cat: "fitness", price: 89900, mrp: 149900, stock: 55, featured: true, sold: 119,
      images: [IMG("25074d8d079c.jpg"), IMG("ea019d144980.jpg")],
      tags: ["yoga", "eco"],
      desc: "6mm high-density TPE mat with dual-texture non-slip grip and alignment lines. Latex-free, odourless and 100% recyclable. Comes with a carry strap. 183 x 61cm.",
    },
    {
      name: "IronCore Adjustable Dumbbells", cat: "fitness", price: 349900, mrp: 599900, stock: 20, sold: 45,
      images: [IMG("970d32c7fbf6.png"), IMG("01e6811c91a0.jpg")],
      tags: ["gym", "strength"],
      desc: "Pair of 10kg adjustable dumbbells with quick-lock collars — switch weights in seconds from 2kg to 10kg per dumbbell. Anti-roll hex plates with a knurled steel handle. Storage tray included.",
    },
    {
      name: "Glow Ritual Vitamin C Serum", cat: "beauty", price: 64900, mrp: 119900, stock: 85, featured: true, sold: 287,
      images: [IMG("fb72860f5a8d.png"), IMG("049654206131.jpg")],
      tags: ["skincare", "bestseller"],
      desc: "15% stabilised Vitamin C with hyaluronic acid and Vitamin E. Brightens dull skin, fades dark spots and boosts collagen in 4 weeks. Fragrance-free, dermatologist tested, suitable for all skin types. 30ml.",
    },
    {
      name: "HydraVeil Daily Moisturizer", cat: "beauty", price: 54900, mrp: 99900, stock: 75, sold: 164,
      images: [IMG("dfeb23235544.jpg"), IMG("455b88cd8b6d.jpg")],
      tags: ["skincare", "hydration"],
      desc: "Lightweight gel-cream with ceramides, niacinamide and squalane for 72-hour hydration. Non-comedogenic, absorbs in seconds and layers well under makeup. 50g.",
    },
    {
      name: "Aviator Classic Sunglasses", cat: "accessories", price: 119900, mrp: 249900, stock: 50, sold: 74,
      images: [IMG("5007e178f92f.jpg"), IMG("6e04d46db918.jpg")],
      tags: ["eyewear", "unisex"],
      desc: "Timeless aviator silhouette with polarised UV400 lenses and a lightweight metal frame. Includes a hard case, microfiber pouch and 1-year warranty. Unisex.",
    },
    {
      name: "Heritage Leather Wallet", cat: "accessories", price: 89900, mrp: 179900, stock: 65, sold: 142,
      images: [IMG("3b1484a8c8cc.jpg"), IMG("a69a7c447c99.jpg")],
      tags: ["wallet", "leather", "gifting"],
      desc: "Slim bi-fold crafted from vegetable-tanned buffalo leather with RFID-blocking lining. 8 card slots, 2 note compartments and a hidden pocket. Develops a rich patina over time.",
    },
    {
      name: "VoyagePro Laptop Backpack", cat: "accessories", price: 159900, mrp: 299900, stock: 45, featured: true, sold: 128,
      images: [IMG("fb88fcc1b690.jpg"), IMG("77cd742196af.jpg")],
      tags: ["bag", "travel", "bestseller"],
      desc: "Water-resistant 30L backpack with a padded 15.6\" laptop sleeve, USB charging port, theft-proof back pocket and breathable mesh straps. Trolley strap for travel days.",
    },
  ];

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 70);

  const productMap: Record<string, { id: string; price: number; image: string; name: string }> = {};
  let skuIdx = 1;
  for (const p of products) {
    const created = await db.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        description: p.desc,
        price: p.price,
        mrp: p.mrp,
        sku: `SP-${p.cat.slice(0, 4).toUpperCase()}-${String(skuIdx++).padStart(3, "0")}`,
        stock: p.stock,
        categoryId: cats[p.cat],
        images: JSON.stringify(p.images),
        tags: JSON.stringify(p.tags),
        featured: p.featured ?? false,
        soldCount: p.sold,
        status: "ACTIVE",
      },
    });
    productMap[p.name] = { id: created.id, price: p.price, image: p.images[0], name: p.name };
  }

  // ---------- Banners ----------
  await db.banner.createMany({
    data: [
      {
        title: "Mega Season Sale",
        subtitle: "Up to 60% off across electronics, fashion & more",
        image: IMG("b671f60289bb.jpg"),
        link: "/shop?sort=discount",
        ctaText: "Shop the Sale",
        position: "HERO",
        sortOrder: 0,
      },
      {
        title: "New in Tech",
        subtitle: "Headphones, smartwatches & speakers starting ₹999",
        image: IMG("5dcac8a95de0.jpg"),
        link: "/shop?category=electronics",
        ctaText: "Explore Electronics",
        position: "HERO",
        sortOrder: 1,
      },
      {
        title: "Free Shipping on Orders Above ₹999",
        subtitle: "Fast delivery to 19,000+ pin codes across India",
        image: IMG("f8bb55f917e0.jpg"),
        link: "/shop",
        ctaText: "Start Shopping",
        position: "HERO",
        sortOrder: 2,
      },
    ],
  });

  // ---------- Coupons ----------
  await db.coupon.createMany({
    data: [
      { code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 49900, maxDiscount: 50000, usageLimit: 1000 },
      { code: "FLAT100", type: "FLAT", value: 10000, minOrder: 99900, usageLimit: 500 },
      { code: "MEGA20", type: "PERCENT", value: 20, minOrder: 299900, maxDiscount: 100000, usageLimit: 200 },
    ],
  });

  // ---------- Reviews ----------
  const reviewDefs: { email: string; product: string; rating: number; title: string; comment: string }[] = [
    { email: "priya@example.com", product: "SonicWave Pro Wireless Headphones", rating: 5, title: "Outstanding sound quality", comment: "The ANC is brilliant for my daily metro commute. Battery easily lasts me a week of calls and music." },
    { email: "rahul@example.com", product: "SonicWave Pro Wireless Headphones", rating: 4, title: "Great value", comment: "Sound is punchy and pairing is instant. Slightly tight fit on day one but loosened up nicely." },
    { email: "sneha@example.com", product: "PulseFit Smart Watch", rating: 5, title: "Battery champ", comment: "10 days of battery is real! The AMOLED display looks premium and sleep tracking is surprisingly accurate." },
    { email: "priya@example.com", product: "Glow Ritual Vitamin C Serum", rating: 5, title: "Visible glow in 3 weeks", comment: "Dark spots from acne have faded noticeably. No stickiness at all, and it layers well under sunscreen." },
    { email: "rahul@example.com", product: "CloudStep Running Sneakers", rating: 4, title: "Light and breathable", comment: "Perfect for my 5k runs. Great grip even on wet roads. Order half a size up if you have wide feet." },
    { email: "sneha@example.com", product: "Milano Leather Handbag", rating: 5, title: "Gorgeous leather", comment: "The finish and hardware feel far above the price. Fits my laptop and gym gear without looking bulky." },
    { email: "priya@example.com", product: "Amber Glow Scented Candle", rating: 5, title: "Warm and cosy", comment: "The amber-vanilla scent fills my living room beautifully. Second one I've ordered — great gifting box too." },
    { email: "rahul@example.com", product: "VoyagePro Laptop Backpack", rating: 4, title: "Solid everyday bag", comment: "The laptop sleeve is well padded and the USB port is handy. Zips feel durable after 2 months of daily use." },
    { email: "sneha@example.com", product: "Everyday Organic Cotton Tee", rating: 5, title: "Softest tee I own", comment: "The cotton is thick and soft — nothing like the flimsy fast-fashion ones. Held its shape after 10 washes." },
    { email: "rahul@example.com", product: "ZenFlex Yoga Mat", rating: 5, title: "No slipping at all", comment: "Grip is excellent even in hot yoga. The alignment lines actually help my form. Strap quality is good too." },
  ];

  for (const r of reviewDefs) {
    const user = await db.user.findUnique({ where: { email: r.email } });
    const prod = productMap[r.product];
    if (!user || !prod) continue;
    await db.review.upsert({
      where: { userId_productId: { userId: user.id, productId: prod.id } },
      update: {},
      create: { userId: user.id, productId: prod.id, rating: r.rating, title: r.title, comment: r.comment },
    });
  }

  // Recompute product ratings
  const allReviews = await db.review.groupBy({
    by: ["productId"],
    _avg: { rating: true },
    _count: { rating: true },
  });
  for (const agg of allReviews) {
    await db.product.update({
      where: { id: agg.productId },
      data: { rating: Math.round((agg._avg.rating ?? 0) * 10) / 10, reviewCount: agg._count.rating },
    });
  }

  // NOTE: No demo orders / payments are seeded — the admin dashboard and orders
  // list start clean. Revenue and order stats will only reflect real activity.

  // ---------- Sample address for the demo customer ----------
  await db.address.create({
    data: {
      userId: priya.id, fullName: "Priya Sharma", phone: "+91 90000 11111",
      line1: "12, Lake View Apartments", line2: "Powai", city: "Mumbai",
      state: "Maharashtra", pincode: "400076", isDefault: true,
    },
  });

  console.log("Seed complete! Set admin credentials via your production admin flow.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
