const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const Admin = require("./models/Admin");
const Service = require("./models/Service");
const Gallery = require("./models/Gallery");
const Testimonial = require("./models/Testimonial");

const sampleServices = [
  {
    title: "Enchanted Birthday Celebration",
    description:
      "Transform your birthday into a magical wonderland with pastel organic balloon arches, marquee number lights, personalized cake tables, and custom photo backdrops.",
    category: "Birthdays",
    startingPrice: 3499,
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Romantic Anniversary Surprise",
    description:
      "Celebrate your love story with luxury rose petal pathways, candlelit ambiance, fairy light canopies, helium heart balloons, and personalized anniversary frame setups.",
    category: "Anniversaries",
    startingPrice: 4999,
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Dreamy Baby Shower & Welcome Baby",
    description:
      "Sweet pastel balloons, cloud motifs, teddy bear installations, customized mom-to-be seating, and elegant floral accents designed for the newest arrival.",
    category: "Baby Showers",
    startingPrice: 4499,
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Magical Marry Me Proposal",
    description:
      "An unforgettable proposal setting with glowing 'MARRY ME' neon letters, heart shaped floral arch, pathway candles, sparklers, and chilled celebratory vibes.",
    category: "Proposals",
    startingPrice: 7999,
    image:
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Grand Ring Ceremony & Haldi Decor",
    description:
      "Traditional marigold cascades paired with contemporary golden brass elements, cabana seating, and festive photography backdrops for pre-wedding celebrations.",
    category: "Special Celebrations",
    startingPrice: 8999,
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Kids Theme Extravaganza",
    description:
      "Jungle safari, princess castle, superhero or underwater themed setups with custom cutouts, balloon pillars, and interactive backdrop photobooths.",
    category: "Birthdays",
    startingPrice: 4999,
    image:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1000&q=80",
  },
];

const sampleGallery = [
  {
    title: "Rose Gold & Blush Balloon Ring Setup",
    category: "Birthday",
    description: "Custom metallic balloon circle with neon happy birthday sign in Golf Course Extension, Gurgaon.",
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Candlelight Cabana Terrace Setup",
    category: "Anniversary",
    description: "Intimate white drape canopy with warm fairy lights and rose petals in DLF Phase 5.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Pastel Cloud Baby Shower Decor",
    category: "Baby Shower",
    description: "Soft blue and cream organic balloons with golden metallic pedestals in Sector 57.",
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Rooftop 'Marry Me' Candlelight Glow",
    category: "Proposal",
    description: "Romantic path of glass lanterns and red roses leading to glowing illuminated letters.",
    image:
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Golden 25th Silver Jubilee Backdrop",
    category: "Anniversary",
    description: "Shimmer sequin wall with chrome gold balloon arches and custom LED signage.",
    image:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Floral Bohemian Cabana Setup",
    category: "Other",
    description: "Pampas grass, warm lights and boho rug arrangement for intimate family celebrations.",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=80",
  },
];

const sampleTestimonials = [
  {
    name: "Priyanka Sharma",
    location: "DLF Phase 4, Gurgaon",
    eventType: "1st Birthday Party",
    review:
      "Decor Joy Gurgaon made our daughter's first birthday absolutely unforgettable! The pastel balloon arch was breathtaking and the setup was completed right on schedule. Highly recommended!",
    rating: 5,
  },
  {
    name: "Rohan & Aditi Verma",
    location: "Sector 57, Gurugram",
    eventType: "Anniversary Surprise",
    review:
      "The romantic canopy decor was straight out of a fairy tale. Attention to detail was remarkable and the pricing was very fair compared to other event planners in Gurgaon.",
    rating: 5,
  },
  {
    name: "Neha Mathur",
    location: "Sohna Road, Gurgaon",
    eventType: "Baby Shower",
    review:
      "From consultation to final execution, the team was polite, creative and so accommodating. Everyone kept asking who did the decor!",
    rating: 5,
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/decorjoy";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Seed Admin Account from environment variables
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

    // Seed Services if empty
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      await Service.insertMany(sampleServices);
      console.log(`Seeded ${sampleServices.length} decoration services.`);
    } else {
      console.log(`Services already exist (${serviceCount} items).`);
    }

    // Seed Gallery if empty
    const galleryCount = await Gallery.countDocuments();
    if (galleryCount === 0) {
      await Gallery.insertMany(sampleGallery);
      console.log(`Seeded ${sampleGallery.length} gallery items.`);
    } else {
      console.log(`Gallery items already exist (${galleryCount} items).`);
    }

    // Seed Testimonials if empty
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
