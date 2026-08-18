import type { WebsiteContent } from "@/types/database"

// ============================================================
// WEBSITE CONTENT DEFAULTS
// Hardcoded fallback content. If a CMS value exists, it overrides these.
// ============================================================

export const WEBSITE_CONTENT_PAGES = [
  { id: "home", label: "Home" },
  { id: "shop", label: "Shop" },
  { id: "skills-studio", label: "Skills Studio" },
  { id: "about", label: "About Us" },
  { id: "lookbook", label: "Lookbook" },
  { id: "colors", label: "Colors & Paints" },
  { id: "craft-guide", label: "Craft Guide" },
  { id: "custom-orders", label: "Custom Orders" },
  { id: "incubator", label: "Incubator" },
  { id: "footer", label: "Footer" },
] as const

export type WebsiteContentPage = (typeof WEBSITE_CONTENT_PAGES)[number]["id"]

export const defaultWebsiteContent: Record<WebsiteContentPage, Record<string, Record<string, string>>> = {
  home: {
    hero: {
      heading: "From Craft\nto Career",
      subtitle: "Handcrafted Pakistani textiles, artisan led skills training, sustainable livelihoods.",
      cta_primary: "Shop the Collection",
      cta_secondary: "Learn a Craft",
    },
    trust_bar: {
      items: "Handcrafted,Natural Dyes,Skills Training,Sustainable Livelihoods,Ships Nationwide",
    },
    featured_products: {
      heading: "Featured products",
      description: "Handpicked pieces from our studio floor.",
      link_text: "View all products",
    },
    artisans: {
      heading: "The hands behind the craft",
    },
    impact: {
      label: "Our Impact",
      heading: "Empowering cottage artisans since 2018",
    },
    incubator: {
      label: "Incubator",
      heading: "Where craft becomes enterprise",
      description:
        "For artisans, graduates, and designers ready to turn textile skill into a sustainable business. We provide studio access, practical mentoring, and connections to buyers.",
      list_items: "Studio Access,Mentorship & Counselling,Market Linkage",
      cta: "Learn about our incubator ->",
    },
    ugc: {
      heading: "As worn by our customers",
      button_text: "Share your look",
    },
  },
  shop: {
    page_intro: {
      heading: "Shop All",
    },
    rfd_promo: {
      heading: "Ready for Dyeing (RFD) Fabric",
      description:
        "Small-quantity RFD fabric for quality printing, available for students, designers, and entrepreneurs.",
      button_text: "Enquire on WhatsApp",
    },
  },
  "skills-studio": {
    hero: {
      label: "Skills Studio",
      heading: "Learn. Create. Earn.",
      description:
        "Theory and practical workshops on sustainable production, natural dyes, block printing, and value addition — designed for students, small businesses, and textile schools across Pakistan.",
    },
    workspace: {
      label: "Workspace Facility",
      heading: "Learn in a fully equipped space",
      description:
        "Our classroom, lecture space, and working lab give students the resources to experiment with textiles and apply their knowledge to different materials.",
    },
    facility_cards: {
      card_1_title: "Classroom & Lectures",
      card_1_description:
        "A fully equipped classroom for theory sessions, demonstrations, and group learning.",
      card_2_title: "Working Lab",
      card_2_description:
        "Hands-on space to experiment with dyes, prints, fabrics, and finishing techniques.",
      card_3_title: "Collaborative Spaces",
      card_3_description:
        "Partnerships with institutes and producers so designers can access resources beyond our walls.",
    },
    cta: {
      heading: "Ready to start your craft journey?",
      description:
        "Our workshops blend theory with practice so you can build skills that create real opportunities — whether you are a beginner, a student, or a small business looking to add value through sustainability.",
      button_primary: "Ask on WhatsApp",
      button_secondary: "Browse Products",
    },
  },
  about: {
    hero: {
      label: "About Us",
      heading: "Textile Impressions",
      description: "Education, sampling & production for Pakistan’s textile future.",
    },
    who_we_are: {
      label: "Who We Are",
      heading: "A new kind of textile facility",
      paragraph_1:
        "We are a first-of-its-kind facility that continues Pakistan’s strive for social development. By introducing international technology to local businesses, we help makers make socially responsible and cost-effective decisions.",
      paragraph_2:
        "Our work sits at the intersection of craft, education, and enterprise — connecting traditional knowledge with contemporary practice so Pakistan’s textile sector can grow with integrity.",
      image_url: "https://picsum.photos/seed/textile-studio/1200/900",
      image_alt: "Textile Impressions studio workspace",
    },
    vision_mission: {
      vision_label: "Our Vision",
      vision_text: "Textile awareness through education and collaboration.",
      mission_label: "Our Mission",
      mission_text: "Build a community of past and present textile talents to revive the sector in Pakistan.",
    },
    values: {
      label: "Our Values",
      heading: "What guides us",
      value_1_title: "Sustainable Responsibility",
      value_1_description: "We choose materials and methods that respect people and planet.",
      value_2_title: "Self Sufficiency",
      value_2_description: "We build skills so artisans and businesses can stand on their own.",
      value_3_title: "Flexible Entrepreneurship",
      value_3_description: "We adapt, experiment, and turn craft into independent enterprise.",
    },
    founder: {
      label: "Behind the venture",
      heading: "Dr. Sitara Tanveer",
      paragraph_1:
        "Textile Impressions is led by Dr. Sitara Tanveer, a textile professional whose career began in the early 1990s in directorial roles with Pakistani textile giants including Al-Abid and Nakshbandi Industries. Her passion for craft led her to distinguished trainings in Germany and Switzerland, and later to a PhD in Applied Chemistry from the HEJ Institute, University of Karachi, focused on fiber reactive dyes and color fastness on cotton.",
      paragraph_2:
        "She continues to collaborate with leading institutes across Pakistan — including the Textile Institute of Pakistan, SMARTI, NED University, Karachi University, and the Federal Urdu University of Arts, Science and Technology. Her aim is to revive Pakistan’s textile sector by equipping young talent with the skills, sustainability practices, and quality standards needed to compete internationally.",
      image_url: "https://picsum.photos/seed/textile-founder/1000/1250",
      image_alt: "Dr. Sitara Tanveer, founder of Textile Impressions",
    },
    cta: {
      heading: "Be part of the revival",
      description: "Whether you want to learn, create, or grow a textile business, there is a place for you here.",
      button_primary: "Explore Skills Studio",
      button_secondary: "Join the incubator",
    },
  },
  lookbook: {
    page_intro: {
      label: "Lookbook",
      heading: "Editorial collections",
    },
  },
  colors: {
    hero: {
      label: "Sustainable Colors",
      heading: "Colors rooted in nature",
      description:
        "From madder root reds to indigo blues — our palette is crafted by artisans using traditional methods that honor both craft and environment.",
    },
    color_range: {
      heading: "Our Color Range",
      description:
        "Three categories of sustainable textile colors, each designed for different craft applications.",
      category_1_title: "Natural Dyes",
      category_1_description:
        "Plant-based colors derived from madder root, indigo, pomegranate, and turmeric. Each batch carries the subtle variations that make hand-dyed textiles unique.",
      category_2_title: "Block Printing Paints",
      category_2_description:
        "Formulated for traditional hand-carved block printing. Rich pigmentation with smooth transfer on cotton, linen, and silk.",
      category_3_title: "Fabric Paints",
      category_3_description:
        "Versatile fabric paints for freehand painting, stenciling, and mixed media. Wash-resistant and designed for lasting vibrancy.",
    },
    why_colors: {
      heading: "Why Our Colors Matter",
      card_1_title: "Zero Synthetic Chemicals",
      card_1_description:
        "Our natural dye range uses only plant-based colorants. No heavy metals, no azo dyes, no formaldehyde. Safe for artisans and safe for the people who wear the finished textiles.",
      card_2_title: "Water-Based Formulas",
      card_2_description:
        "All our block printing paints and fabric paints use water-based formulations that are easy to clean, low-odor, and gentle on natural fibers like cotton and linen.",
      card_3_title: "Artisan Crafted",
      card_3_description:
        "Each color batch is prepared by hand by our artisan partners. The natural variations you see are not defects — they are proof of human touch in an age of mass production.",
      card_4_title: "Supporting Livelihoods",
      card_4_description:
        "Every purchase of our colors and paints directly supports the artisan families who prepare them. Your creative projects become part of a larger story of sustainable craft livelihoods.",
    },
    shop_colors: {
      heading: "Shop Colors & Paints",
      description: "Browse our full collection of sustainable textile colors.",
      link_text: "View all products",
    },
    cta: {
      heading: "Ready to create something beautiful?",
      description:
        "Whether you are a professional textile artist or just starting out, our sustainable colors are designed for your next project.",
      button_primary: "Shop Colors & Paints",
      button_secondary: "Custom Orders",
    },
  },
  "custom-orders": {
    hero: {
      label: "Custom studio",
      heading: "Commission a bespoke piece",
      description:
        "Share your fabric, fit, color, and deadline preferences. Our studio will review the request and continue the conversation on WhatsApp.",
    },
    form: {
      submit_button: "Send custom order request",
    },
  },
  incubator: {
    hero: {
      label: "Textile Impression Incubator",
      heading: "Pakistan’s first textile cottage industry incubator",
      description:
        "A fashion studio and support system for artisans, home-based makers, and small textile businesses ready to refine their craft and reach stronger markets.",
    },
    services: {
      service_1_title: "Studio Access",
      service_1_description:
        "Shared textile studio space for sampling, finishing, photography, and small batch production.",
      service_2_title: "Mentorship, Training & Counselling",
      service_2_description:
        "Career counselling and practical guidance for graduates and emerging makers: quality control, pricing, merchandising, product development, and starting a small-scale textile business.",
      service_3_title: "Market Linkage",
      service_3_description:
        "Retail pathways through Textile Impressions, digital selling support, and buyer-facing storytelling.",
    },
    how_it_works: {
      heading: "How it works",
      steps: "Apply,Assessment,Onboarding,Grow",
    },
    cohort: {
      heading: "Current cohort",
    },
    form: {
      heading: "Apply for incubation",
      submit_button: "Submit enquiry",
    },
  },
  "craft-guide": {
    page_intro: {
      label: "Craft guide",
      heading: "Pakistani textile traditions, explained",
    },
    article_1: {
      title: "What is block printing?",
      tag: "Block Print",
      body_1:
        "Block printing is one of Pakistan's most recognizable textile crafts: a method of creating repeat patterns by pressing carved wooden blocks onto fabric. Each block carries a portion of the design, so a finished garment may pass through many careful impressions before the pattern feels complete. The beauty of the process is its human rhythm. Small variations in pressure, dye absorption, and alignment give the cloth a character that machine printing rarely keeps.",
      body_2:
        "In Punjab and Sindh, block printing often appears on cottons, lawns, khaddar, dupattas, and home textiles. Artisans may use floral butis, borders, geometric repeats, or regional motifs that have moved through generations of workshops. The process usually begins with fabric preparation, then color mixing, block alignment, printing, drying, washing, and finishing. Natural and pigment dyes both appear in contemporary practice, depending on the studio and intended use.",
      body_3:
        "For customers, block printed pieces offer a way to wear craft without treating it as costume. A printed kurta or dupatta can feel relaxed, modern, and deeply rooted at the same time. Textile Impressions works with makers who understand that balance: the print should honor the hand, but the final garment still needs clean finishing, strong fabric, and everyday ease.",
    },
    article_2: {
      title: "The art of Ajrak",
      tag: "Ajrak",
      body_1:
        "Ajrak is a celebrated textile tradition associated strongly with Sindh, recognized for deep indigo, madder-like reds, black outlines, and intricate geometric symmetry. Traditional Ajrak uses resist printing and repeated dye stages, building pattern and color through patience rather than speed. The cloth carries cultural memory: it is worn as a shawl, gifted with respect, and used as a visual marker of identity across communities.",
      body_2:
        "The craft is technically demanding. A single piece can move through washing, mordanting, resist application, dyeing, sun drying, and repeated printing stages. Even when contemporary studios create Ajrak-inspired garments with lighter processes or modern silhouettes, the best work keeps the discipline of balance: dense pattern, controlled contrast, and a respect for the geometry that makes Ajrak so powerful.",
      body_3:
        "In fashion, Ajrak can be styled beyond the classic shawl. It works beautifully as a statement kurta, a panel on a minimal co-ord, a dupatta over ivory, or a structured accent in menswear-inspired tailoring. The key is restraint. Let the pattern breathe, pair it with quiet fabrics, and allow its indigo depth to lead the look.",
    },
    article_3: {
      title: "Natural vs synthetic dyes",
      tag: "Dyes",
      body_1:
        "Natural dyes come from plant, mineral, or other organic sources, while synthetic dyes are chemically produced for consistency, range, and scale. Neither category is automatically good or bad in every context. Natural dyes can offer remarkable softness, tonal complexity, and a link to older textile practices. Synthetic dyes can provide durability, repeatability, and affordability for larger production runs.",
      body_2:
        "The real question is how responsibly the dye is used. Natural dyeing still requires water, mordants, labor, and technical knowledge. Poor handling can waste resources or create uneven results. Synthetic dyeing can be safe and efficient when managed with proper controls, but it can also become harmful when wastewater and chemicals are mishandled. A thoughtful textile studio considers colorfastness, skin comfort, environmental impact, and the intended life of the garment.",
      body_3:
        "For handcrafted fashion, natural dyes are especially loved for their living quality. Indigo may shift gently with wear, earthy yellows can soften over time, and hand-dyed cloth often carries subtle movement in tone. Customers should expect this character and care for it properly. Wash gently, avoid harsh detergents, dry away from strong sun, and treat color variation as part of the textile's story.",
    },
    article_4: {
      title: "How to care for handcrafted textiles",
      tag: "Care",
      body_1:
        "Handcrafted textiles deserve care that protects the fabric, dye, and handwork. Start by reading the garment label, then choose the gentlest practical method. Many block printed, embroidered, naturally dyed, or delicate cotton pieces last longer when washed separately in cold water with a mild detergent. Avoid bleach, strong stain removers, and long soaking unless a care label specifically allows it.",
      body_2:
        "Drying matters as much as washing. Direct, harsh sunlight can fade dyes and weaken fibers, especially on richly colored or naturally dyed garments. Dry pieces inside out in shade, reshape them while damp, and avoid wringing embroidery or fine trims. If ironing is needed, use low to medium heat from the reverse side. For embellished garments, place a cotton cloth between the iron and the fabric.",
      body_3:
        "Storage is another quiet form of care. Fold heavier embroidered items instead of hanging them for long periods, because weight can pull the garment out of shape. Keep textiles clean and fully dry before storing. Use breathable garment bags for special pieces, and give seasonal clothes a little air from time to time. Good care turns a handcrafted garment into something that can be worn often, repaired if needed, and kept in the wardrobe for years.",
    },
  },
  footer: {
    description: {
      text: "Handcrafted Pakistani fashion, made with love. Premium quality kurtas, dupattas, suits, and accessories.",
    },
    quick_links: {
      heading: "Quick Links",
    },
    payment_methods: {
      heading: "Payment Methods",
    },
    contact: {
      heading: "Contact Us",
    },
    copyright: {
      text: "© {year} Textile Impressions. All rights reserved.",
    },
  },
}

// Flatten defaults to match DB shape for easy comparison / seeding.
export function flattenDefaults(): Omit<WebsiteContent, "id" | "updated_at">[] {
  const rows: Omit<WebsiteContent, "id" | "updated_at">[] = []
  for (const [page, sections] of Object.entries(defaultWebsiteContent)) {
    for (const [section, fields] of Object.entries(sections)) {
      for (const [field, value] of Object.entries(fields)) {
        rows.push({ page, section, field, value })
      }
    }
  }
  return rows
}

// ============================================================
// ADMIN HELPERS
// ============================================================

export function getDefaultValue(page: string, section: string, field: string): string | undefined {
  return (defaultWebsiteContent as Record<string, Record<string, Record<string, string>>>)[page]?.[section]?.[field]
}

export function isValidContentKey(page: string, section: string, field: string): boolean {
  return getDefaultValue(page, section, field) !== undefined
}

export function mergeContent(rows: WebsiteContent[] | null): typeof defaultWebsiteContent {
  const merged = JSON.parse(JSON.stringify(defaultWebsiteContent)) as typeof defaultWebsiteContent
  if (!rows) return merged
  for (const row of rows) {
    const page = row.page as WebsiteContentPage
    if (!merged[page]) continue
    if (!merged[page][row.section]) continue
    merged[page][row.section][row.field] = row.value
  }
  return merged
}
