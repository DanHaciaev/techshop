import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

// Mirrors src/lib/prisma.ts's own path handling: a relative "file:" URL is
// resolved relative to this file's own directory (prisma/), matching how
// Prisma's classic engine has always resolved DATABASE_URL for this schema
// — @libsql/client otherwise resolves it relative to the process cwd
// instead, which would seed a different, empty db file when run via `npm
// run db:seed` from the project root. A remote "libsql://..." URL (Turso)
// passes through untouched.
function resolveDatabaseUrl(raw: string): string {
  if (!raw.startsWith("file:")) return raw;
  const relative = raw.slice("file:".length);
  if (path.isAbsolute(relative)) return raw;
  return `file:${path.join(__dirname, relative)}`;
}

const adapter = new PrismaLibSql({
  url: resolveDatabaseUrl(process.env.DATABASE_URL!),
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

function productImage(title: string, category: string, seed: number) {
  const params = new URLSearchParams({ title, category, seed: String(seed) });
  return `/api/og/product?${params.toString()}`;
}

function promoImage(title: string, subtitle: string, badge: string, seed: number) {
  const params = new URLSearchParams({ title, subtitle, badge, seed: String(seed) });
  return `/api/og/promo?${params.toString()}`;
}

async function main() {
  // --- Admin user ---------------------------------------------------------
  const passwordHash = await bcrypt.hash("admin", 10);
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: passwordHash },
  });

  // --- Settings ------------------------------------------------------------
  await prisma.settings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      shopName: "TechShop",
      phone: "+373 22 000 000",
      email: "info@techshop.md",
      address: "Кишинёв, ул. Штефан чел Маре, 1",
      addressRo: "Chișinău, str. Ștefan cel Mare, 1",
      accentColor: "#2563eb",
    },
  });

  // --- Categories ------------------------------------------------------------
  const categoriesData = [
    { name: "Смартфоны", nameRo: "Smartphone-uri", slug: "smartphones", order: 1 },
    { name: "Ноутбуки", nameRo: "Laptopuri", slug: "laptops", order: 2 },
    { name: "Телевизоры", nameRo: "Televizoare", slug: "tv", order: 3 },
    { name: "Наушники и аудио", nameRo: "Căști și audio", slug: "audio", order: 4 },
    { name: "Бытовая техника", nameRo: "Electrocasnice", slug: "appliances", order: 5 },
    { name: "Гейминг", nameRo: "Gaming", slug: "gaming", order: 6 },
    { name: "Аксессуары", nameRo: "Accesorii", slug: "accessories", order: 7 },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameRo: c.nameRo, order: c.order },
      create: c,
    });
    categories[c.slug] = cat.id;
  }

  // --- Subcategories (demonstrate the category → subcategory hierarchy) -----
  const subcategoriesData = [
    { name: "Apple", nameRo: "Apple", slug: "smartphones-apple", parent: "smartphones", order: 1 },
    { name: "Android", nameRo: "Android", slug: "smartphones-android", parent: "smartphones", order: 2 },
    { name: "Игровые ноутбуки", nameRo: "Laptopuri gaming", slug: "laptops-gaming", parent: "laptops", order: 1 },
    { name: "Ультрабуки", nameRo: "Ultrabookuri", slug: "laptops-ultrabook", parent: "laptops", order: 2 },
  ];
  for (const c of subcategoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameRo: c.nameRo, order: c.order, parentId: categories[c.parent] },
      create: { name: c.name, nameRo: c.nameRo, slug: c.slug, order: c.order, parentId: categories[c.parent] },
    });
    categories[c.slug] = cat.id;
  }

  // --- Products ------------------------------------------------------------
  type ProductSeed = {
    name: string;
    nameRo?: string;
    slug: string;
    category: string;
    price: number;
    oldPrice?: number;
    stock: number;
    featured?: boolean;
    description: string;
    descriptionRo: string;
    attributes?: { name: string; nameRo: string; value: string; valueRo: string }[];
  };

  const productsData: ProductSeed[] = [
    { name: "iPhone 15 Pro 128GB", slug: "iphone-15-pro-128", category: "smartphones-apple", price: 18999, oldPrice: 20999, stock: 12, featured: true, description: "Флагманский смартфон Apple с чипом A17 Pro, титановым корпусом и камерой 48 Мп.", descriptionRo: "Smartphone-ul de vârf de la Apple cu cip A17 Pro, corp din titan și cameră de 48 MP.",
      attributes: [
        { name: "Экран", nameRo: "Ecran", value: "6.1\" OLED, 120 Гц", valueRo: "6.1\" OLED, 120 Hz" },
        { name: "Процессор", nameRo: "Procesor", value: "Apple A17 Pro", valueRo: "Apple A17 Pro" },
        { name: "Память", nameRo: "Memorie", value: "128 ГБ", valueRo: "128 GB" },
        { name: "Камера", nameRo: "Cameră", value: "48 Мп + 12 Мп + 12 Мп", valueRo: "48 MP + 12 MP + 12 MP" },
        { name: "Батарея", nameRo: "Baterie", value: "3274 мАч", valueRo: "3274 mAh" },
      ] },
    { name: "Samsung Galaxy S24", slug: "samsung-galaxy-s24", category: "smartphones-android", price: 14999, stock: 20, featured: true, description: "Смартфон Samsung Galaxy S24 с AMOLED экраном 6.2\" и встроенным ИИ.", descriptionRo: "Smartphone Samsung Galaxy S24 cu ecran AMOLED de 6.2\" și inteligență artificială integrată." },
    { name: "Xiaomi Redmi Note 13", slug: "xiaomi-redmi-note-13", category: "smartphones-android", price: 4499, stock: 35, description: "Доступный смартфон с батареей 5000 мАч и быстрой зарядкой 33 Вт.", descriptionRo: "Smartphone accesibil cu baterie de 5000 mAh și încărcare rapidă de 33 W." },
    { name: "Google Pixel 8", slug: "google-pixel-8", category: "smartphones-android", price: 12999, stock: 8, description: "Чистый Android, лучшая камера в классе и 7 лет обновлений.", descriptionRo: "Android pur, cea mai bună cameră din clasă și 7 ani de actualizări." },

    { name: "MacBook Air M3 13\"", slug: "macbook-air-m3-13", category: "laptops-ultrabook", price: 24999, oldPrice: 26999, stock: 7, featured: true, description: "Ультрабук Apple на чипе M3, до 18 часов автономной работы.", descriptionRo: "Ultrabook Apple cu cip M3, până la 18 ore de autonomie.",
      attributes: [
        { name: "Экран", nameRo: "Ecran", value: "13.6\" Liquid Retina", valueRo: "13.6\" Liquid Retina" },
        { name: "Процессор", nameRo: "Procesor", value: "Apple M3", valueRo: "Apple M3" },
        { name: "Память", nameRo: "Memorie", value: "8 ГБ / 256 ГБ SSD", valueRo: "8 GB / 256 GB SSD" },
        { name: "Автономность", nameRo: "Autonomie", value: "до 18 часов", valueRo: "până la 18 ore" },
      ] },
    { name: "ASUS ROG Strix G16", slug: "asus-rog-strix-g16", category: "laptops-gaming", price: 27999, stock: 5, featured: true, description: "Игровой ноутбук с RTX 4060 и экраном 165 Гц.", descriptionRo: "Laptop de gaming cu RTX 4060 și ecran de 165 Hz." },
    { name: "Lenovo ThinkPad E14", slug: "lenovo-thinkpad-e14", category: "laptops", price: 13999, stock: 15, description: "Надёжный бизнес-ноутбук с корпусом из магниевого сплава.", descriptionRo: "Laptop de business fiabil, cu carcasă din aliaj de magneziu." },
    { name: "Dell XPS 13", slug: "dell-xps-13", category: "laptops-ultrabook", price: 21999, stock: 6, description: "Компактный ультрабук с почти безрамочным дисплеем InfinityEdge.", descriptionRo: "Ultrabook compact cu ecran aproape fără margini InfinityEdge." },

    { name: "Samsung QLED 55\" QN90", slug: "samsung-qled-55-qn90", category: "tv", price: 16999, oldPrice: 19999, stock: 9, featured: true, description: "4K QLED телевизор с частотой 120 Гц и Neo Quantum процессором.", descriptionRo: "Televizor QLED 4K cu frecvență de 120 Hz și procesor Neo Quantum." },
    { name: "LG OLED 65\" C4", slug: "lg-oled-65-c4", category: "tv", price: 28999, stock: 4, description: "OLED телевизор с идеальным чёрным цветом и поддержкой Dolby Vision.", descriptionRo: "Televizor OLED cu negru perfect și suport Dolby Vision." },
    { name: "Xiaomi TV A 43\"", slug: "xiaomi-tv-a-43", category: "tv", price: 4999, stock: 22, description: "Компактный Smart TV на Android TV с HDR10.", descriptionRo: "Smart TV compact pe Android TV cu HDR10." },

    { name: "Sony WH-1000XM5", slug: "sony-wh-1000xm5", category: "audio", price: 6499, oldPrice: 7499, stock: 18, featured: true, description: "Беспроводные наушники с лучшим в классе шумоподавлением.", descriptionRo: "Căști wireless cu cea mai bună anulare a zgomotului din clasă." },
    { name: "Apple AirPods Pro 2", slug: "apple-airpods-pro-2", category: "audio", price: 4299, stock: 25, description: "Наушники с активным шумоподавлением и адаптивным звуком.", descriptionRo: "Căști cu anulare activă a zgomotului și sunet adaptiv." },
    { name: "JBL Flip 6", slug: "jbl-flip-6", category: "audio", price: 1899, stock: 30, description: "Портативная колонка с защитой IP67 и мощным звуком.", descriptionRo: "Boxă portabilă cu protecție IP67 și sunet puternic." },
    { name: "Marshall Emberton II", slug: "marshall-emberton-ii", category: "audio", price: 2699, stock: 14, description: "Стильная колонка в фирменном ретро-дизайне Marshall.", descriptionRo: "Boxă elegantă în designul retro caracteristic Marshall." },

    { name: "Робот-пылесос Xiaomi S10+", nameRo: "Robot aspirator Xiaomi S10+", slug: "xiaomi-robot-vacuum-s10", category: "appliances", price: 8999, oldPrice: 10499, stock: 10, featured: true, description: "Робот-пылесос с влажной уборкой и станцией самоочистки.", descriptionRo: "Robot aspirator cu spălare umedă și stație de auto-curățare." },
    { name: "Холодильник Bosch Serie 4", nameRo: "Frigider Bosch Serie 4", slug: "bosch-serie-4-fridge", category: "appliances", price: 15999, stock: 6, description: "Двухкамерный холодильник с технологией NoFrost.", descriptionRo: "Frigider cu două compartimente și tehnologie NoFrost." },
    { name: "Кофемашина De'Longhi Magnifica", nameRo: "Espressor De'Longhi Magnifica", slug: "delonghi-magnifica", category: "appliances", price: 9999, stock: 9, description: "Автоматическая кофемашина для эспрессо и капучино.", descriptionRo: "Espressor automat pentru espresso și cappuccino." },
    { name: "Стиральная машина LG F4", nameRo: "Mașină de spălat LG F4", slug: "lg-f4-washer", category: "appliances", price: 11999, stock: 7, description: "Стиральная машина с прямым приводом и паровой обработкой.", descriptionRo: "Mașină de spălat cu transmisie directă și tratament cu abur." },

    { name: "PlayStation 5 Slim", slug: "playstation-5-slim", category: "gaming", price: 12999, stock: 11, featured: true, description: "Игровая консоль нового поколения с поддержкой 4K и SSD.", descriptionRo: "Consolă de generație nouă cu suport 4K și SSD." },
    { name: "Xbox Series X", slug: "xbox-series-x", category: "gaming", price: 12499, stock: 8, description: "Самая мощная консоль Xbox с играми в 4K на 60-120 fps.", descriptionRo: "Cea mai puternică consolă Xbox, jocuri în 4K la 60-120 fps." },
    { name: "Nintendo Switch OLED", slug: "nintendo-switch-oled", category: "gaming", price: 8499, stock: 13, description: "Гибридная консоль с ярким OLED экраном 7 дюймов.", descriptionRo: "Consolă hibridă cu ecran OLED luminos de 7 inch." },
    { name: "Руль Logitech G29", nameRo: "Volan Logitech G29", slug: "logitech-g29", category: "gaming", price: 6999, stock: 5, description: "Игровой руль с force feedback для гоночных симуляторов.", descriptionRo: "Volan de gaming cu force feedback pentru simulatoare de curse." },

    { name: "Powerbank Anker 20000mAh", nameRo: "Baterie externă Anker 20000mAh", slug: "anker-powerbank-20000", category: "accessories", price: 999, stock: 40, description: "Внешний аккумулятор с быстрой зарядкой PD 20W.", descriptionRo: "Baterie externă cu încărcare rapidă PD 20W." },
    { name: "Чехол MagSafe для iPhone 15", nameRo: "Husă MagSafe pentru iPhone 15", slug: "magsafe-case-iphone-15", category: "accessories", price: 499, stock: 60, description: "Силиконовый чехол с поддержкой магнитной зарядки MagSafe.", descriptionRo: "Husă din silicon cu suport pentru încărcare magnetică MagSafe." },
    { name: "USB-C кабель Baseus 100W", nameRo: "Cablu USB-C Baseus 100W", slug: "baseus-usb-c-100w", category: "accessories", price: 299, stock: 80, description: "Прочный кабель для быстрой зарядки ноутбуков и телефонов.", descriptionRo: "Cablu rezistent pentru încărcarea rapidă a laptopurilor și telefoanelor." },
  ];

  const allCategoryLabels = [...categoriesData, ...subcategoriesData];
  const productIds: Record<string, string> = {};
  let seedIndex = 0;
  for (const p of productsData) {
    seedIndex += 1;
    const categoryName = allCategoryLabels.find((c) => c.slug === p.category)?.name ?? "";
    const attributesJson = JSON.stringify(p.attributes ?? []);
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        stock: p.stock,
        featured: !!p.featured,
        description: p.description,
        descriptionRo: p.descriptionRo,
        nameRo: p.nameRo ?? "",
        categoryId: categories[p.category],
        attributes: attributesJson,
      },
      create: {
        name: p.name,
        nameRo: p.nameRo ?? "",
        slug: p.slug,
        description: p.description,
        descriptionRo: p.descriptionRo,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        stock: p.stock,
        featured: !!p.featured,
        categoryId: categories[p.category],
        image: productImage(p.name, categoryName, seedIndex),
        sku: `SKU-${1000 + seedIndex}`,
        attributes: attributesJson,
      },
    });
    productIds[p.slug] = product.id;
  }

  // --- Promotions ------------------------------------------------------------
  const promotionsData = [
    {
      title: "Скидки на смартфоны Apple и Samsung",
      titleRo: "Reduceri la smartphone-uri Apple și Samsung",
      slug: "flagmany-so-skidkoy",
      subtitle: "До -15% на флагманы этого сезона",
      subtitleRo: "Până la -15% la modelele flagship ale sezonului",
      badge: "-15%",
      badgeRo: "-15%",
      description:
        "Специальное предложение на самые популярные флагманские смартфоны. Успейте купить по выгодной цене — количество товара ограничено.",
      descriptionRo:
        "Ofertă specială pentru cele mai populare smartphone-uri flagship. Grăbiți-vă să cumpărați la preț avantajos — stoc limitat.",
      products: ["iphone-15-pro-128", "samsung-galaxy-s24"],
    },
    {
      title: "Ноутбуки для работы и игр",
      titleRo: "Laptopuri pentru muncă și jocuri",
      slug: "noutbuki-nedeli",
      subtitle: "Выгода до 2000 lei при покупке до конца месяца",
      subtitleRo: "Economisiți până la 2000 lei la cumpărare până la finalul lunii",
      badge: "Хит продаж",
      badgeRo: "Cel mai vândut",
      description:
        "Подборка лучших ноутбуков для учёбы, работы и игр — от компактных ультрабуков до мощных игровых станций.",
      descriptionRo:
        "O selecție a celor mai bune laptopuri pentru studiu, muncă și jocuri — de la ultrabookuri compacte la stații de gaming puternice.",
      products: ["macbook-air-m3-13", "asus-rog-strix-g16"],
    },
    {
      title: "Умный дом со скидкой",
      titleRo: "Casă inteligentă la reducere",
      slug: "umnaya-tehnika-dlya-doma",
      subtitle: "Робот-пылесос и техника для дома по акции",
      subtitleRo: "Robot aspirator și electrocasnice la promoție",
      badge: "-14%",
      badgeRo: "-14%",
      description:
        "Сделайте домашние дела проще — роботы-пылесосы, кофемашины и другая техника для дома со скидками.",
      descriptionRo:
        "Simplificați treburile casnice — roboți aspiratori, espressoare și alte electrocasnice cu reduceri.",
      products: ["xiaomi-robot-vacuum-s10", "delonghi-magnifica"],
    },
    {
      title: "Игровая консоль в подарок аксессуар",
      titleRo: "Consolă de gaming cu accesoriu cadou",
      slug: "igrovye-konsoli",
      subtitle: "PlayStation 5 и Xbox Series X в наличии",
      subtitleRo: "PlayStation 5 și Xbox Series X în stoc",
      badge: "Новинка",
      badgeRo: "Noutate",
      description:
        "Игровые консоли нового поколения уже в магазине. При покупке — дополнительный джойстик со скидкой 30%.",
      descriptionRo:
        "Consolele de generație nouă sunt deja în magazin. La cumpărare — un joystick suplimentar cu reducere de 30%.",
      products: ["playstation-5-slim", "xbox-series-x"],
    },
  ];

  let promoSeed = 0;
  for (const promo of promotionsData) {
    promoSeed += 1;
    const created = await prisma.promotion.upsert({
      where: { slug: promo.slug },
      update: {
        title: promo.title,
        titleRo: promo.titleRo,
        subtitle: promo.subtitle,
        subtitleRo: promo.subtitleRo,
        description: promo.description,
        descriptionRo: promo.descriptionRo,
        badge: promo.badge,
        badgeRo: promo.badgeRo,
      },
      create: {
        title: promo.title,
        titleRo: promo.titleRo,
        slug: promo.slug,
        subtitle: promo.subtitle,
        subtitleRo: promo.subtitleRo,
        description: promo.description,
        descriptionRo: promo.descriptionRo,
        badge: promo.badge,
        badgeRo: promo.badgeRo,
        image: promoImage(promo.title, promo.subtitle, promo.badge, promoSeed),
        order: promoSeed,
      },
    });

    for (const productSlug of promo.products) {
      const productId = productIds[productSlug];
      if (!productId) continue;
      await prisma.promotionProduct.upsert({
        where: { promotionId_productId: { promotionId: created.id, productId } },
        update: {},
        create: { promotionId: created.id, productId },
      });
    }
  }

  // --- Stores ------------------------------------------------------------
  const storesData = [
    { name: "TechShop Centru", address: "ул. Штефан чел Маре, 1", addressRo: "str. Ștefan cel Mare, 1", city: "Кишинёв", cityRo: "Chișinău", phone: "+373 22 000 001", hours: "09:00–20:00", hoursRo: "09:00–20:00", order: 1 },
    { name: "TechShop Botanica", address: "ул. Independenței, 24", addressRo: "str. Independenței, 24", city: "Кишинёв", cityRo: "Chișinău", phone: "+373 22 000 002", hours: "09:00–20:00", hoursRo: "09:00–20:00", order: 2 },
    { name: "TechShop Bălți", address: "ул. Independenței, 10", addressRo: "str. Independenței, 10", city: "Бельцы", cityRo: "Bălți", phone: "+373 23 000 003", hours: "10:00–19:00", hoursRo: "10:00–19:00", order: 3 },
  ];

  const storeIds: Record<string, string> = {};
  for (const s of storesData) {
    const existing = await prisma.store.findFirst({ where: { name: s.name } });
    const store = existing
      ? await prisma.store.update({ where: { id: existing.id }, data: s })
      : await prisma.store.create({ data: s });
    storeIds[s.name] = store.id;
  }

  // --- Per-store stock (demonstrates pickup-availability checking) ----------
  const storeStockData: { product: string; stocks: Record<string, number> }[] = [
    { product: "iphone-15-pro-128", stocks: { "TechShop Centru": 4, "TechShop Botanica": 2, "TechShop Bălți": 0 } },
    { product: "samsung-galaxy-s24", stocks: { "TechShop Centru": 6, "TechShop Botanica": 0, "TechShop Bălți": 3 } },
    { product: "macbook-air-m3-13", stocks: { "TechShop Centru": 2, "TechShop Botanica": 1, "TechShop Bălți": 0 } },
    { product: "playstation-5-slim", stocks: { "TechShop Centru": 5, "TechShop Botanica": 3, "TechShop Bălți": 2 } },
  ];
  for (const row of storeStockData) {
    const productId = productIds[row.product];
    if (!productId) continue;
    for (const [storeName, quantity] of Object.entries(row.stocks)) {
      const storeId = storeIds[storeName];
      if (!storeId) continue;
      await prisma.storeStock.upsert({
        where: { productId_storeId: { productId, storeId } },
        update: { quantity },
        create: { productId, storeId, quantity },
      });
    }
  }

  // --- Demo seller (POS/till login, scoped to one store) -------------------
  const sellerPasswordHash = await bcrypt.hash("seller", 10);
  await prisma.adminUser.upsert({
    where: { username: "seller" },
    update: { storeId: storeIds["TechShop Centru"] },
    create: {
      username: "seller",
      password: sellerPasswordHash,
      role: "SELLER",
      storeId: storeIds["TechShop Centru"],
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
