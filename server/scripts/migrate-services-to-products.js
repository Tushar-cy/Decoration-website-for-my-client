const mongoose = require("mongoose");
const { connectDB, closeDB } = require("../config/db");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Settings = require("../models/Settings");
const Service = require("../models/Service");

const isDryRun = process.argv.includes("--dry-run");

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const DEFAULT_CATEGORIES = [
  { name: "Birthdays", slug: "birthdays", sortOrder: 1 },
  { name: "Anniversaries", slug: "anniversaries", sortOrder: 2 },
  { name: "Baby Showers", slug: "baby-showers", sortOrder: 3 },
  { name: "Proposals", slug: "proposals", sortOrder: 4 },
  { name: "Special Celebrations", slug: "special-celebrations", sortOrder: 5 },
];

const runMigration = async () => {
  try {
    console.log("=== Decor Joy Data Migration: Services -> Products ===");
    if (isDryRun) {
      console.log("🔍 MODE: DRY-RUN (Simulating changes, no database writes)\n");
    } else {
      console.log("🚀 MODE: LIVE EXECUTION (Writing changes to database)\n");
    }

    let dbConnected = false;
    try {
      await connectDB(1, 500);
      dbConnected = true;
    } catch (connErr) {
      if (isDryRun) {
        console.log("ℹ️  Live MongoDB offline; demonstrating dry-run diff against sample data fixtures.\n");
      } else {
        throw connErr;
      }
    }

    const diff = {
      categoriesCreated: [],
      categoriesExisting: [],
      settingsCreated: false,
      productsCreated: [],
      productsSkipped: [],
      inquiriesConverted: [],
      inquiriesAlreadyDate: 0,
    };

    // 1. Ensure Default Categories
    console.log("--- Step 1: Default Categories ---");
    const categoryMap = {};

    for (const cat of DEFAULT_CATEGORIES) {
      const existing = dbConnected ? await Category.findOne({ slug: cat.slug }) : null;
      if (!existing) {
        diff.categoriesCreated.push(cat);
        console.log(`[+] Category to create: "${cat.name}" (slug: ${cat.slug})`);
        if (!isDryRun && dbConnected) {
          const created = await Category.create(cat);
          categoryMap[cat.name] = created._id;
        }
      } else {
        diff.categoriesExisting.push(cat.name);
        categoryMap[cat.name] = existing._id;
      }
    }

    // 2. Ensure Singleton Settings
    console.log("\n--- Step 2: Singleton Settings ---");
    const existingSettings = dbConnected ? await Settings.findOne() : null;
    if (!existingSettings) {
      diff.settingsCreated = true;
      console.log("[+] Settings: Singleton default business settings to create");
      if (!isDryRun && dbConnected) {
        await Settings.create({});
      }
    } else {
      console.log("[=] Settings: Singleton already exists");
    }

    // 3. Migrate Services to Products
    console.log("\n--- Step 3: Services -> Products ---");
    const sampleLegacyServices = [
      {
        title: "Enchanted Birthday Celebration",
        category: "Birthdays",
        startingPrice: 3499,
        description: "Transform your birthday into a magical wonderland with pastel organic balloon arches.",
        image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Romantic Anniversary Surprise",
        category: "Anniversaries",
        startingPrice: 4999,
        description: "Celebrate your love story with luxury rose petal pathways and candlelit ambiance.",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Dreamy Baby Shower & Welcome Baby",
        category: "Baby Showers",
        startingPrice: 4499,
        description: "Sweet pastel balloons, cloud motifs, and teddy bear installations.",
        image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Magical Marry Me Proposal",
        category: "Proposals",
        startingPrice: 7999,
        description: "An unforgettable proposal setting with glowing MARRY ME neon letters.",
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Grand Ring Ceremony & Haldi Decor",
        category: "Special Celebrations",
        startingPrice: 8999,
        description: "Traditional marigold cascades paired with golden brass elements.",
        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
      },
      {
        title: "Kids Theme Extravaganza",
        category: "Birthdays",
        startingPrice: 4999,
        description: "Jungle safari, balloon pillars, and interactive backdrop photobooths.",
        image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1000&q=80",
      },
    ];

    const services = dbConnected ? await Service.find({}) : sampleLegacyServices;
    console.log(`Found ${services.length} existing service records.`);

    for (const service of services) {
      const slug = slugify(service.title);
      const existingProduct = dbConnected ? await Product.findOne({ slug }) : null;

      if (existingProduct) {
        diff.productsSkipped.push(service.title);
        continue;
      }

      // Convert rupees to paise (e.g. ₹3,499 -> 349900 paise)
      const basePricePaise = Math.round(Number(service.startingPrice) * 100);
      const categoryId =
        categoryMap[service.category] || categoryMap["Birthdays"];

      const productPayload = {
        title: service.title,
        slug,
        categoryId,
        shortDescription: service.description.slice(0, 160),
        description: service.description,
        basePricePaise,
        compareAtPricePaise: Math.round(basePricePaise * 1.2), // 20% anchor compare price
        images: [
          {
            url: service.image,
            alt: service.title,
            publicId: "",
          },
        ],
        variants: [
          {
            name: "Theme Color",
            options: [
              {
                label: "Signature Gold & Rose",
                priceDeltaPaise: 0,
                colorCode: "#b88932",
              },
              {
                label: "Pastel Multitone",
                priceDeltaPaise: 0,
                colorCode: "#d48b8b",
              },
              {
                label: "Midnight Royal Blue",
                priceDeltaPaise: 40000,
                colorCode: "#1e3a8a",
              },
            ],
          },
          {
            name: "Setup Size",
            options: [
              { label: "Standard Setup (6ft Arch)", priceDeltaPaise: 0 },
              { label: "Grand Setup (8ft Arch + Neon)", priceDeltaPaise: 150000 },
            ],
          },
        ],
        includedItems: [
          "200+ Premium organic metallic & pastel balloons",
          "Damage-free removable wall and backdrop mounts",
          "Dedicated Gurugram styling technician on site",
        ],
        setupMinutes: 90,
        minLeadHours: 24,
        badge: "Popular",
        isFeatured: true,
        isActive: true,
        tags: [service.category.toLowerCase(), "balloons", "gurgaon", "decor"],
        seo: {
          title: `${service.title} | Decor Joy Gurgaon`,
          description: service.description.slice(0, 160),
        },
      };

      diff.productsCreated.push({
        title: service.title,
        slug,
        basePricePaise,
        category: service.category,
      });

      console.log(
        `[+] Product to migrate: "${service.title}" -> slug: ${slug}, basePrice: ₹${service.startingPrice} (${basePricePaise} paise)`
      );

      if (!isDryRun) {
        await Product.create(productPayload);
      }
    }

    // 4. Migrate Inquiry.eventDate: string -> Date
    console.log("\n--- Step 4: Inquiry.eventDate (string -> Date) ---");
    const sampleLegacyInquiries = [
      { _id: "legacy_inquiry_001", eventDate: "2026-10-15" },
      { _id: "legacy_inquiry_002", eventDate: "2026-11-20" },
    ];

    const rawInquiries = dbConnected
      ? await mongoose.connection.collection("inquiries").find({}).toArray()
      : sampleLegacyInquiries;

    for (const inq of rawInquiries) {
      if (typeof inq.eventDate === "string") {
        const parsedDate = new Date(inq.eventDate);
        if (!isNaN(parsedDate.getTime())) {
          diff.inquiriesConverted.push({
            id: inq._id.toString(),
            from: inq.eventDate,
            to: parsedDate.toISOString(),
          });
          console.log(
            `[~] Inquiry ${inq._id}: eventDate string "${inq.eventDate}" -> Date ${parsedDate.toISOString()}`
          );

          if (!isDryRun && dbConnected) {
            await mongoose.connection
              .collection("inquiries")
              .updateOne(
                { _id: inq._id },
                { $set: { eventDate: parsedDate } }
              );
          }
        }
      } else {
        diff.inquiriesAlreadyDate++;
      }
    }

    // Migration Summary Diff Report
    console.log("\n================ MIGRATION DIFF SUMMARY ================");
    console.log(`Categories to create : ${diff.categoriesCreated.length}`);
    console.log(`Categories unchanged : ${diff.categoriesExisting.length}`);
    console.log(`Settings to create   : ${diff.settingsCreated ? "1" : "0"}`);
    console.log(`Products to create   : ${diff.productsCreated.length}`);
    console.log(`Products unchanged   : ${diff.productsSkipped.length}`);
    console.log(`Inquiries to convert : ${diff.inquiriesConverted.length}`);
    console.log(`Inquiries unchanged : ${diff.inquiriesAlreadyDate}`);

    const totalChanges =
      diff.categoriesCreated.length +
      (diff.settingsCreated ? 1 : 0) +
      diff.productsCreated.length +
      diff.inquiriesConverted.length;

    if (totalChanges === 0) {
      console.log("\n✨ Result: 0 changes pending. Database is already fully synchronized and idempotent.");
    } else if (isDryRun) {
      console.log(`\n🔍 Dry-run complete. ${totalChanges} planned changes detected above.`);
    } else {
      console.log(`\n✅ Migration successfully applied ${totalChanges} changes to the database.`);
    }
    console.log("========================================================\n");

    if (dbConnected) {
      await closeDB();
    }
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    await closeDB();
    process.exit(1);
  }
};

if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  slugify,
  DEFAULT_CATEGORIES,
};
