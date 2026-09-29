const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const Admin = require("./models/Admin");
const Category = require("./models/Category");
const Product = require("./models/Product");
const AddOn = require("./models/AddOn");
const Settings = require("./models/Settings");
const Gallery = require("./models/Gallery");
const Testimonial = require("./models/Testimonial");
const Coupon = require("./models/Coupon");

const sampleCategories = [
  {
    name: "Birthdays",
    slug: "birthdays",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Anniversaries",
    slug: "anniversaries",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Baby Showers",
    slug: "baby-showers",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Proposals",
    slug: "proposals",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
    sortOrder: 4,
    isActive: true,
  },
  {
    name: "Special Celebrations",
    slug: "special-celebrations",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
    sortOrder: 5,
    isActive: true,
  },
];

const sampleAddOns = [
  {
    name: "Warm White Fairy Light Canopy",
    pricePaise: 49900, // ₹499
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    isActive: true,
  },
  {
    name: "Custom LED Neon Sign ('Happy Birthday' / 'Cheers')",
    pricePaise: 99900, // ₹999
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80",
    isActive: true,
  },
  {
    name: "40 Glass Lantern Pathway with Tea Lights",
    pricePaise: 79900, // ₹799
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80",
    isActive: true,
  },
  {
    name: "Cold Pyro Sparkler Shots (Set of 2)",
    pricePaise: 129900, // ₹1,299
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80",
    isActive: true,
  },
  {
    name: "Helium Heart Balloon Bunch (10 pcs)",
    pricePaise: 89900, // ₹899
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    isActive: true,
  },
];

const sampleGallery = [
  {
    title: "Rose Gold & Blush Balloon Ring Setup",
    category: "Birthday",
    description: "Custom metallic balloon circle with neon happy birthday sign in Golf Course Extension, Gurgaon.",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
    isActive: true,
    sortOrder: 1,
  },
  {
    title: "Candlelight Cabana Terrace Setup",
    category: "Anniversary",
    description: "Intimate white drape canopy with warm fairy lights and rose petals in DLF Phase 5.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
    isActive: true,
    sortOrder: 2,
  },
  {
    title: "Pastel Cloud Baby Shower Decor",
    category: "Baby Shower",
    description: "Soft blue and cream organic balloons with golden metallic pedestals in Sector 57.",
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
    isActive: true,
    sortOrder: 3,
  },
  {
    title: "Rooftop 'Marry Me' Candlelight Glow",
    category: "Proposal",
    description: "Romantic path of glass lanterns and red roses leading to glowing illuminated letters.",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
    isActive: true,
    sortOrder: 4,
  },
  {
    title: "Golden 25th Silver Jubilee Backdrop",
    category: "Anniversary",
    description: "Shimmer sequin wall with chrome gold balloon arches and custom LED signage.",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=80",
    isActive: true,
    sortOrder: 5,
  },
  {
    title: "Floral Bohemian Cabana Setup",
    category: "Other",
    description: "Pampas grass, warm lights and boho rug arrangement for intimate family celebrations.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
    isActive: true,
    sortOrder: 6,
  },
];

const sampleTestimonials = [
  {
    name: "Priyanka Sharma",
    location: "DLF Phase 4, Gurgaon",
    eventType: "1st Birthday Party",
    review: "Decor Joy Gurgaon made our daughter's first birthday absolutely unforgettable! The pastel balloon arch was breathtaking and completed on schedule.",
    rating: 5,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Rohan & Aditi Verma",
    location: "Sector 57, Gurugram",
    eventType: "Anniversary Surprise",
    review: "The romantic canopy decor was straight out of a fairy tale. Attention to detail was remarkable and pricing was very fair.",
    rating: 5,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Neha Mathur",
    location: "Sohna Road, Gurgaon",
    eventType: "Baby Shower",
    review: "From consultation to final execution, the team was polite, creative and accommodating. Everyone kept asking who did the decor!",
    rating: 5,
    isActive: true,
    sortOrder: 3,
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/decorjoy";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // 1. Seed Admin Account
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("❌ Refusing to seed: ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables.");
      process.exit(1);
    }

    if (adminPassword.toLowerCase() === "admin123") {
      console.error("❌ Refusing to seed: Insecure default password 'admin123' is forbidden. Set a secure password.");
      process.exit(1);
    }

    if (adminPassword.length < 12) {
      console.error("❌ Refusing to seed: ADMIN_PASSWORD must be at least 12 characters long.");
      process.exit(1);
    }

    const existingAdmin = await Admin.findOne({ email: adminEmail.toLowerCase().trim() });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      await Admin.create({
        name: "Decor Joy Admin",
        email: adminEmail.toLowerCase().trim(),
        password: hashedPassword,
        role: "owner",
        isActive: true,
        failedLogins: 0,
        lockedUntil: null,
      });
      console.log(`Created admin account: ${adminEmail}`);
    } else {
      console.log(`Admin account already exists: ${adminEmail}`);
    }

    // 2. Seed Default Settings
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({});
      console.log("Created singleton default Settings.");
    } else {
      console.log("Settings already exist.");
    }

    // 3. Seed Categories
    const categoryMap = {};
    for (const cat of sampleCategories) {
      let doc = await Category.findOne({ slug: cat.slug });
      if (!doc) {
        doc = await Category.create(cat);
        console.log(`Seeded category: ${cat.name}`);
      }
      categoryMap[cat.name] = doc._id;
    }

    // 4. Seed AddOns
    const addOnIds = [];
    for (const addon of sampleAddOns) {
      let doc = await AddOn.findOne({ name: addon.name });
      if (!doc) {
        doc = await AddOn.create(addon);
        console.log(`Seeded add-on: ${addon.name}`);
      }
      addOnIds.push(doc._id);
    }

    // 5. Seed Products with Variants and Add-ons
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const sampleProducts = [
        {
          title: "Enchanted Ring Arch & Custom Neon",
          slug: "enchanted-ring-arch-custom-neon",
          categoryId: categoryMap["Birthdays"],
          shortDescription: "6ft circular backdrop layered with 250+ organic chrome balloons, bespoke neon signage, and cake table styling.",
          description: "Transform your birthday into a magical wonderland with pastel organic balloon arches, marquee number lights, personalized cake tables, and custom photo backdrops in Gurgaon.",
          basePricePaise: 449900, // ₹4,499
          compareAtPricePaise: 549900,
          images: [
            {
              url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
              alt: "Enchanted Ring Arch Birthday",
              publicId: "",
            },
          ],
          variants: [
            {
              name: "Color Palette",
              options: [
                { label: "Rose Gold & Blush", priceDeltaPaise: 0, colorCode: "#d48b8b" },
                { label: "Champagne Gold & White", priceDeltaPaise: 0, colorCode: "#b88932" },
                { label: "Chrome Blue & Silver", priceDeltaPaise: 50000, colorCode: "#1e3a8a" },
              ],
            },
            {
              name: "Backdrop Scale",
              options: [
                { label: "Standard 6ft Ring Arch", priceDeltaPaise: 0 },
                { label: "Grand 8ft Layered Ring + Neon", priceDeltaPaise: 150000 },
              ],
            },
          ],
          includedItems: [
            "250+ Premium metallic and pastel balloons",
            "6ft Golden circular backdrop frame",
            "Warm white LED neon sign ('Happy Birthday')",
            "Free on-time setup & takedown in Gurgaon",
          ],
          addOnIds: addOnIds.slice(0, 3),
          setupMinutes: 90,
          minLeadHours: 24,
          badge: "Bestseller",
          isFeatured: true,
          isActive: true,
          sortOrder: 1,
          tags: ["birthdays", "ring-arch", "neon", "balloons", "gurgaon"],
          seo: {
            title: "Enchanted Ring Arch & Custom Neon | Decor Joy Gurgaon",
            description: "Gurgaon's favorite birthday ring arch with premium balloons and custom neon signage.",
          },
        },
        {
          title: "Romantic Candlelight & Cabana Surprise",
          slug: "romantic-candlelight-cabana-surprise",
          categoryId: categoryMap["Anniversaries"],
          shortDescription: "Luxury sheer white fabric cabana structure with 20 warm candle lanterns, rose petal aisle, and heart helium balloons.",
          description: "Celebrate your love story with luxury rose petal pathways, candlelit ambiance, fairy light canopies, helium heart balloons, and personalized anniversary setups across Gurgaon condos.",
          basePricePaise: 549900, // ₹5,499
          compareAtPricePaise: 699900,
          images: [
            {
              url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
              alt: "Romantic Candlelight Cabana",
              publicId: "",
            },
          ],
          variants: [
            {
              name: "Canopy Styling",
              options: [
                { label: "Classic Warm White Sheer", priceDeltaPaise: 0, colorCode: "#faf8f5" },
                { label: "Blush Pink & Fairy Glow", priceDeltaPaise: 40000, colorCode: "#fbcfe8" },
              ],
            },
          ],
          includedItems: [
            "Luxury white sheer fabric cabana structure",
            "Rose petal aisle + 20 glass candle votives",
            "Warm curtain fairy lights canopy",
            "Personalized anniversary message card",
          ],
          addOnIds: addOnIds.slice(1, 4),
          setupMinutes: 120,
          minLeadHours: 24,
          badge: "Romantic Choice",
          isFeatured: true,
          isActive: true,
          sortOrder: 2,
          tags: ["anniversaries", "cabana", "candlelight", "romantic", "gurgaon"],
          seo: {
            title: "Romantic Candlelight & Cabana Surprise | Decor Joy Gurgaon",
            description: "Luxury anniversary cabana and candlelight decoration in Gurugram.",
          },
        },
        {
          title: "Dreamy Cloud Baby Shower & Teddy Installation",
          slug: "dreamy-cloud-baby-shower-teddy",
          categoryId: categoryMap["Baby Showers"],
          shortDescription: "Soft pastel organic balloon clouds with golden pedestals, plush teddy bear installations, and 'Oh Baby' neon sign.",
          description: "Sweet pastel balloons, cloud motifs, teddy bear installations, customized mom-to-be seating, and elegant floral accents designed for the newest arrival in Gurugram.",
          basePricePaise: 499900, // ₹4,999
          compareAtPricePaise: 599900,
          images: [
            {
              url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
              alt: "Pastel Cloud Baby Shower",
              publicId: "",
            },
          ],
          variants: [
            {
              name: "Theme Color",
              options: [
                { label: "Pastel Blue & Cloud White", priceDeltaPaise: 0, colorCode: "#93c5fd" },
                { label: "Blush Peach & Cream", priceDeltaPaise: 0, colorCode: "#fed7aa" },
                { label: "Gender-Neutral Sage & Ivory", priceDeltaPaise: 0, colorCode: "#84a98c" },
              ],
            },
          ],
          includedItems: [
            "300+ Pastel cloud organic balloon garland",
            "Golden metallic display pedestals",
            "Glow LED 'Oh Baby' neon sign",
            "Large plush teddy bear & cloud props",
          ],
          addOnIds: [addOnIds[0], addOnIds[4]],
          setupMinutes: 90,
          minLeadHours: 24,
          badge: "Newborn Special",
          isFeatured: true,
          isActive: true,
          sortOrder: 3,
          tags: ["baby-showers", "cloud", "teddy", "balloons", "gurgaon"],
          seo: {
            title: "Dreamy Cloud Baby Shower Setup | Decor Joy Gurgaon",
            description: "Gurgaon's top rated baby shower and welcome baby decoration service.",
          },
        },
        {
          title: "Grand 'Marry Me' Rooftop Proposal",
          slug: "grand-marry-me-rooftop-proposal",
          categoryId: categoryMap["Proposals"],
          shortDescription: "4ft illuminated marquee 'MARRY ME' letters, floral heart arch, glass candle walkway, and cold pyro sparklers.",
          description: "The definitive Gurgaon proposal experience. Unforgettable proposal setting with glowing marquee letters, pathway candles, sparklers, and dedicated coordinator.",
          basePricePaise: 849900, // ₹8,499
          compareAtPricePaise: 999900,
          images: [
            {
              url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
              alt: "Grand Marry Me Proposal",
              publicId: "",
            },
          ],
          variants: [
            {
              name: "Marquee Sign",
              options: [
                { label: "4ft 'MARRY ME' Illuminated Letters", priceDeltaPaise: 0 },
                { label: "Floral Heart Arch + Marquee Letters", priceDeltaPaise: 150000 },
              ],
            },
          ],
          includedItems: [
            "4ft Illuminated marquee 'MARRY ME' letters",
            "Grand floral heart arch with fairy lights",
            "Red rose petal runway with 40 glass lanterns",
            "2 Cold pyro sparkler machines for the moment",
          ],
          addOnIds: addOnIds.slice(2, 5),
          setupMinutes: 150,
          minLeadHours: 48,
          badge: "Luxury Pick",
          isFeatured: true,
          isActive: true,
          sortOrder: 4,
          tags: ["proposals", "marry-me", "rooftop", "sparklers", "gurgaon"],
          seo: {
            title: "Grand 'Marry Me' Rooftop Proposal | Decor Joy Gurgaon",
            description: "Luxury proposal decoration with glowing marquee letters and rose petal runway.",
          },
        },
        {
          title: "Festive Marigold & Brass Urli Haldi Backdrop",
          slug: "festive-marigold-brass-urli-haldi",
          categoryId: categoryMap["Special Celebrations"],
          shortDescription: "Bright yellow & orange marigold cascades paired with brass urli bowls, festive drapes, and royal photography backdrop.",
          description: "Traditional marigold cascades paired with contemporary golden brass elements, cabana seating, and festive photography backdrops for pre-wedding celebrations in Gurgaon.",
          basePricePaise: 799900, // ₹7,999
          compareAtPricePaise: 899900,
          images: [
            {
              url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
              alt: "Traditional Haldi Decor",
              publicId: "",
            },
          ],
          variants: [
            {
              name: "Floral Theme",
              options: [
                { label: "Genda Phool Golden Yellow", priceDeltaPaise: 0, colorCode: "#eab308" },
                { label: "Rani Pink & Marigold Fusion", priceDeltaPaise: 50000, colorCode: "#db2777" },
              ],
            },
          ],
          includedItems: [
            "Fresh & artificial marigold flower cascades",
            "Golden brass urlis with floating candles",
            "Festive yellow & rani pink silk drapery",
            "Floor diwan mattress & bolster covers",
          ],
          addOnIds: [addOnIds[0], addOnIds[2]],
          setupMinutes: 120,
          minLeadHours: 24,
          badge: "Festive Special",
          isFeatured: true,
          isActive: true,
          sortOrder: 5,
          tags: ["special-celebrations", "haldi", "mehndi", "traditional", "gurgaon"],
          seo: {
            title: "Festive Haldi & Mehndi Decor | Decor Joy Gurgaon",
            description: "Traditional and elegant Haldi and Mehndi decoration service in Gurugram.",
          },
        },
        {
          title: "Cozy Living Room Damage-Free Surprise",
          slug: "cozy-living-room-damage-free-surprise",
          categoryId: categoryMap["Birthdays"],
          shortDescription: "100 high-grade latex balloons, ceiling canopy, golden banner, and fairy lights with zero wall damage adhesives.",
          description: "Transform any Gurgaon apartment bedroom or living room into a celebration wonderland with zero mess or wall damage.",
          basePricePaise: 249900, // ₹2,499
          compareAtPricePaise: 299900,
          images: [
            {
              url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
              alt: "Cozy Living Room Birthday",
              publicId: "",
            },
          ],
          variants: [
            {
              name: "Balloon Tone",
              options: [
                { label: "Pastel Multitone", priceDeltaPaise: 0, colorCode: "#f3c68f" },
                { label: "Metallic Rose Gold & Black", priceDeltaPaise: 30000, colorCode: "#d48b8b" },
              ],
            },
          ],
          includedItems: [
            "100 High-grade latex & metallic balloons",
            "Ceiling balloon canopy with curling ribbons",
            "Golden foil 'Happy Birthday' banner",
            "2 Fairy light strings (warm glow)",
            "Damage-free removable wall adhesives",
          ],
          addOnIds: [addOnIds[0], addOnIds[1]],
          setupMinutes: 45,
          minLeadHours: 12,
          badge: "Best Value",
          isFeatured: true,
          isActive: true,
          sortOrder: 6,
          tags: ["birthdays", "room-decor", "budget", "balloons", "gurgaon"],
          seo: {
            title: "Cozy Living Room Birthday Decor | Decor Joy Gurgaon",
            description: "Quick and damage-free room balloon surprise in Gurgaon.",
          },
        },
      ];

      await Product.insertMany(sampleProducts);
      console.log(`Seeded ${sampleProducts.length} rich Product documents with variants and add-ons.`);
    } else {
      console.log(`Products already exist (${productCount} items).`);
    }

    // 6. Seed Coupons
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      await Coupon.create([
        {
          code: "JOY10",
          type: "percent",
          value: 10,
          minOrderPaise: 300000, // ₹3,000
          maxDiscountPaise: 100000, // ₹1,000
          validTo: nextYear,
          isActive: true,
        },
        {
          code: "WELCOME500",
          type: "flat",
          value: 50000, // ₹500
          minOrderPaise: 250000, // ₹2,500
          validTo: nextYear,
          isActive: true,
        },
      ]);
      console.log("Seeded sample Coupons: JOY10 and WELCOME500.");
    }

    // 7. Seed Gallery if empty
    const galleryCount = await Gallery.countDocuments();
    if (galleryCount === 0) {
      await Gallery.insertMany(sampleGallery);
      console.log(`Seeded ${sampleGallery.length} gallery items.`);
    } else {
      console.log(`Gallery items already exist (${galleryCount} items).`);
    }

    // 8. Seed Testimonials if empty
    const testimonialCount = await Testimonial.countDocuments();
    if (testimonialCount === 0) {
      await Testimonial.insertMany(sampleTestimonials);
      console.log(`Seeded ${sampleTestimonials.length} testimonials.`);
    } else {
      console.log(`Testimonials already exist (${testimonialCount} items).`);
    }

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();
