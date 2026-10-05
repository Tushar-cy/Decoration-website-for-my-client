/**
 * Decor Joy Gurgaon - Offline / Client Demo Fallback Dataset
 * Used automatically when the backend / MongoDB server is offline,
 * guaranteeing 100% flawless presentation, zero loading errors, and instant delivery to clients.
 */

export const FALLBACK_CATEGORIES = [
  {
    _id: "cat_1",
    name: "Birthdays",
    slug: "birthdays",
    image: "/decor-gallery/decor_002.jpg",
    sortOrder: 1,
    isActive: true,
  },
  {
    _id: "cat_2",
    name: "Anniversaries",
    slug: "anniversaries",
    image: "/decor-gallery/decor_006.jpg",
    sortOrder: 2,
    isActive: true,
  },
  {
    _id: "cat_3",
    name: "Baby Showers",
    slug: "baby-showers",
    image: "/decor-gallery/decor_012.jpg",
    sortOrder: 3,
    isActive: true,
  },
  {
    _id: "cat_4",
    name: "Proposals",
    slug: "proposals",
    image: "/decor-gallery/decor_018.jpg",
    sortOrder: 4,
    isActive: true,
  },
  {
    _id: "cat_5",
    name: "Special Celebrations",
    slug: "special-celebrations",
    image: "/decor-gallery/decor_024.jpg",
    sortOrder: 5,
    isActive: true,
  },
];

export const FALLBACK_PRODUCTS = [
  {
    _id: "prod_1",
    title: "Enchanted Ring Arch & Custom Neon",
    slug: "enchanted-ring-arch-custom-neon",
    categoryId: "cat_1",
    shortDescription: "6ft circular backdrop layered with 250+ organic chrome balloons, bespoke neon signage, and cake table styling.",
    description: "Transform your birthday into a magical wonderland with pastel organic balloon arches, marquee number lights, personalized cake tables, and custom photo backdrops in Gurgaon.",
    basePricePaise: 449900, // ₹4,499
    compareAtPricePaise: 549900,
    images: [
      {
        url: "/decor-gallery/decor_001.jpg",
        alt: "Enchanted Ring Arch Birthday with Pastel Chrome Balloons",
      },
      {
        url: "/decor-gallery/decor_002.jpg",
        alt: "Celebration Party Setup with Happy Birthday LED Sign",
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
    ],
    includedItems: [
      "250+ Premium metallic and pastel balloons",
      "6ft Golden circular backdrop frame",
      "Warm white LED neon sign ('Happy Birthday')",
      "Free on-time setup & takedown in Gurgaon",
    ],
    setupMinutes: 90,
    minLeadHours: 24,
    badge: "Bestseller",
    isFeatured: true,
    isActive: true,
    sortOrder: 1,
    tags: ["birthdays", "ring-arch", "neon", "balloons", "gurgaon"],
  },
  {
    _id: "prod_2",
    title: "Romantic Candlelight & Cabana Surprise",
    slug: "romantic-candlelight-cabana-surprise",
    categoryId: "cat_2",
    shortDescription: "Luxury sheer white fabric cabana structure with 20 warm candle lanterns, rose petal aisle, and heart helium balloons.",
    description: "Celebrate your love story with luxury rose petal pathways, candlelit ambiance, fairy light canopies, helium heart balloons, and personalized anniversary setups across Gurgaon condos.",
    basePricePaise: 549900, // ₹5,499
    compareAtPricePaise: 699900,
    images: [
      {
        url: "/decor-gallery/decor_006.jpg",
        alt: "Romantic White Cabana with Fairy Lights Canopy",
      },
      {
        url: "/decor-gallery/decor_008.jpg",
        alt: "Rose Petal Runway with Warm Candlelight Lanterns",
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
    setupMinutes: 120,
    minLeadHours: 24,
    badge: "Romantic Choice",
    isFeatured: true,
    isActive: true,
    sortOrder: 2,
    tags: ["anniversaries", "cabana", "candlelight", "romantic", "gurgaon"],
  },
  {
    _id: "prod_3",
    title: "Dreamy Clouds & Teddy Bear Baby Shower",
    slug: "dreamy-clouds-teddy-bear-baby-shower",
    categoryId: "cat_3",
    shortDescription: "Whimsical pastel blue and cream balloon clouds with plush teddy props, baby block boxes, and warm 'Oh Baby' neon sign.",
    description: "Celebrate the arrival of your little angel with tender pastel tones, illuminated letter boxes, plush bears, and sweet organic archways.",
    basePricePaise: 489900, // ₹4,899
    compareAtPricePaise: 599900,
    images: [
      {
        url: "/decor-gallery/decor_012.jpg",
        alt: "Pastel Cloud Baby Shower Decor in Gurgaon",
      },
      {
        url: "/decor-gallery/decor_014.jpg",
        alt: "Teddy Bear Props and Baby Letter Boxes",
      },
    ],
    variants: [],
    includedItems: [
      "200+ Pastel & eucalyptus organic balloons",
      "Large plush teddy bear photo props",
      "4 Illuminated 'BABY' letter blocks",
      "'Oh Baby' warm neon signage",
    ],
    setupMinutes: 90,
    minLeadHours: 24,
    badge: "Trending",
    isFeatured: true,
    isActive: true,
    sortOrder: 3,
    tags: ["baby-showers", "teddy-bear", "pastel", "neon", "gurgaon"],
  },
  {
    _id: "prod_4",
    title: "Sunset Terrace 'Marry Me' Pathway",
    slug: "sunset-terrace-marry-me-pathway",
    categoryId: "cat_4",
    shortDescription: "Giant illuminated MARRY ME marquee letters with 40 glass candle lanterns, rose petal carpet, and heart arch.",
    description: "Create an unforgettable proposal experience with sweeping candlelit walkways, radiant marquee lettering, and romantic balloon arches.",
    basePricePaise: 799900, // ₹7,999
    compareAtPricePaise: 999900,
    images: [
      {
        url: "/decor-gallery/decor_018.jpg",
        alt: "Marry Me Proposal Pathway Setup",
      },
      {
        url: "/decor-gallery/decor_020.jpg",
        alt: "Illuminated Marquee Letters and Candles",
      },
    ],
    variants: [],
    includedItems: [
      "3ft High illuminated 'MARRY ME' marquee letters",
      "Red carpet runner + fresh red rose petals",
      "40 Safe LED glass lanterns and tea lights",
      "Heart-shaped organic balloon arch",
    ],
    setupMinutes: 120,
    minLeadHours: 48,
    badge: "Premium Experience",
    isFeatured: true,
    isActive: true,
    sortOrder: 4,
    tags: ["proposals", "marry-me", "marquee", "terrace", "gurgaon"],
  },
  {
    _id: "prod_5",
    title: "Luxury Shimmer Sequin Wall & Chrome Garlands",
    slug: "luxury-shimmer-sequin-wall-chrome-garlands",
    categoryId: "cat_5",
    shortDescription: "Dynamic metallic gold shimmer backdrop framed with chrome organic balloon garland, spotlighting, and neon sign.",
    description: "The ultimate Instagram-worthy setup for milestone birthdays, corporate milestones, and lavish family celebrations.",
    basePricePaise: 649900, // ₹6,499
    compareAtPricePaise: 799900,
    images: [
      {
        url: "/decor-gallery/decor_024.jpg",
        alt: "Luxury Shimmer Wall with Chrome Balloons",
      },
    ],
    variants: [],
    includedItems: [
      "8ft x 8ft Reflective gold shimmer sequin wall",
      "Multi-layered metallic balloon garland",
      "Dual ambient stage spotlighting",
      "Custom acrylic or neon greeting sign",
    ],
    setupMinutes: 100,
    minLeadHours: 24,
    badge: "Luxury Choice",
    isFeatured: true,
    isActive: true,
    sortOrder: 5,
    tags: ["special-celebrations", "shimmer-wall", "chrome", "luxury"],
  },
  {
    _id: "prod_6",
    title: "Jungle Safari Kingdom 1st Birthday",
    slug: "jungle-safari-kingdom-1st-birthday",
    categoryId: "cat_1",
    shortDescription: "Earthy green and metallic gold balloon arch with life-size animal cutouts, number 1 marquee, and artificial palms.",
    description: "Bring the wild to life for your little explorer's first birthday with lifelike safari animals, palm leaves, and vibrant balloon waterfalls.",
    basePricePaise: 529900, // ₹5,299
    compareAtPricePaise: 649900,
    images: [
      {
        url: "/decor-gallery/decor_030.jpg",
        alt: "Jungle Safari Birthday Setup in Gurgaon",
      },
    ],
    variants: [],
    includedItems: [
      "Safari themed organic balloon waterfall",
      "4 Custom character animal cutouts (Giraffe, Lion, Zebra)",
      "Giant 3ft '1' illuminated marquee number",
      "Grass carpet & cake table styling",
    ],
    setupMinutes: 100,
    minLeadHours: 24,
    badge: "Kids Favorite",
    isFeatured: true,
    isActive: true,
    sortOrder: 6,
    tags: ["birthdays", "safari", "1st-birthday", "kids"],
  },
];

export const FALLBACK_TESTIMONIALS = [
  {
    _id: "test_1",
    name: "Priyanka Sharma",
    location: "DLF Phase 4, Gurgaon",
    eventType: "1st Birthday Party",
    review: "Decor Joy Gurgaon made our daughter's first birthday absolutely unforgettable! The pastel balloon arch was breathtaking and completed 30 minutes before guests arrived.",
    rating: 5,
    isActive: true,
  },
  {
    _id: "test_2",
    name: "Rohan & Aditi Verma",
    location: "Sector 57, Gurugram",
    eventType: "Anniversary Surprise",
    review: "The romantic cabana decor in our living room was straight out of a fairy tale. Attention to detail was remarkable and our anniversary photos came out stunning.",
    rating: 5,
    isActive: true,
  },
  {
    _id: "test_3",
    name: "Neha Mathur",
    location: "Sohna Road, Gurgaon",
    eventType: "Baby Shower",
    review: "From the WhatsApp consultation to final execution, the team was polite, creative and so accommodating. Everyone kept asking who did the decoration!",
    rating: 5,
    isActive: true,
  },
  {
    _id: "test_4",
    name: "Vikram Malhotra",
    location: "Golf Course Road, Gurgaon",
    eventType: "Milestone 30th Birthday",
    review: "Flawless execution! The golden shimmer wall and neon sign looked so luxurious. Professional decorators who cleaned up everything afterwards.",
    rating: 5,
    isActive: true,
  },
];
