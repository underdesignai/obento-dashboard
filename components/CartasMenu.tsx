"use client";
import { useState, useEffect } from "react";
import { X, UtensilsCrossed, Waves, Wine } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

/* ─── TIPOS ─── */
type Item = {
  name: string;
  desc?: string;
  descEn?: string;
  price: string;
  allergens?: string;
  badge?: string;
  badgeEn?: string;
  image?: string;
  halal?: boolean;
  activo?: boolean;
};
type Section = {
  title: string;
  titleEn?: string;
  image?: string;
  items: Item[];
};
type Menus = { mexicana: Section[]; sushi: Section[]; bebidas: Section[] };

/* ─── CARTA MEXICANA ─── */
const mexicana: Section[] = [
  {
    title: "Snacks & Entradas",
    titleEn: "Snacks & Starters",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
    items: [
      {
        name: "Guacamole Clásico",
        desc: "Aguacate madurado al momento, lima fresca, ajo y cilantro. Coronado con aceite de oliva y granada. Con tostadas artesanales.",
        descEn: "Freshly made guacamole with lime, garlic and coriander. Topped with olive oil and pomegranate seeds. Served with artisan tostadas.",
        price: "189,-", allergens: "Sl",
        badge: "Vegetariano", badgeEn: "Vegetarian",
        image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&q=80",
      },
      {
        name: "Salsa Tasting",
        desc: "Trío de salsas: tomatillo verde, mango habanero tropical y roja asada. Con tortillachips.",
        descEn: "Trio of salsas: green tomatillo, tropical mango habanero and roasted red. With tortilla chips.",
        price: "159,-", allergens: "Sl",
        badge: "Vegetariano", badgeEn: "Vegetarian",
        image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&q=80",
      },
      {
        name: "Ranchero Bean Dip",
        desc: "Dip cremoso de alubias con cebolla fresca, ajo, cilantro y pimiento rojo. Con tortillachips.",
        descEn: "Creamy bean dip with fresh onion, garlic, coriander and red pepper. With tortilla chips.",
        price: "139,-", allergens: "Sl",
        badge: "Vegetariano", badgeEn: "Vegetarian",
        image: "https://images.unsplash.com/photo-1628294895950-9805252327bc?w=400&q=80",
      },
      {
        name: "Cheddar Nachos",
        desc: "Nachos de maíz artesanales, cheddar fundido, frijoles, guacamole, jalapeños encurtidos y pico de gallo.",
        descEn: "Artisan corn nachos, melted cheddar, refried beans, guacamole, pickled jalapeños and pico de gallo.",
        price: "229,-", allergens: "M, Sl, Su",
        image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&q=80",
      },
      {
        name: "Corn Ribs",
        desc: "Maíz a la brasa con ajo, hierbas y aceite de oliva. Servido con mayonesa chili con carne y lima.",
        descEn: "Grilled corn with garlic, herbs and olive oil. Served with chili con carne mayonnaise and lime.",
        price: "119,-", allergens: "E, Sn",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80",
      },
    ],
  },
  {
    title: "Ceviches",
    titleEn: "Ceviches",
    image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&q=80",
    items: [
      {
        name: "Gambas de Lima",
        desc: "Langostinos argentinos marinados en leche de tigre con jengibre, cítricos y cilantro. Con tomate, aguacate y pepino en tostadas.",
        descEn: "Argentine prawns marinated in tiger's milk with ginger, citrus and coriander. With tomato, avocado and cucumber on tostadas.",
        price: "239,-", allergens: "Sl, Sk",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
      },
      {
        name: "Nikkei Ceviche",
        desc: "Ceviche peruano-japonés con atún, aguacate, daikon, pepino y aderezo de cítricos y soja. Con crujiente de arroz al wasabi.",
        descEn: "Peruvian-Japanese ceviche with tuna, avocado, daikon, cucumber and citrus-soy dressing. With wasabi rice cracker.",
        price: "269,-", allergens: "F, Se, So, Su, Sl",
        badge: "Firma del Chef", badgeEn: "Chef's Signature",
        image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80",
      },
    ],
  },
  {
    title: "Ensaladas",
    titleEn: "Salads",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    items: [
      {
        name: "Mango Jalisco Salad",
        desc: "Ensalada fresca con aliño de mango, mango, maíz, aguacate y tiras de tortilla.",
        descEn: "Fresh salad with mango dressing, mango, corn, avocado and tortilla strips.",
        price: "207,-",
        badge: "Vegetariano", badgeEn: "Vegetarian",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
      },
      {
        name: "Scampi Mango Jalisco Salad",
        desc: "Ensalada jalisco con langostinos a la plancha.",
        descEn: "Jalisco salad with grilled scampi.",
        price: "289,-", allergens: "G, Sk",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
      },
    ],
  },
  {
    title: "Tacos (2 uds.)",
    titleEn: "Tacos (2 pcs.)",
    image: "https://images.unsplash.com/photo-1570461226513-e08b58a52c53?w=800&q=80",
    items: [
      {
        name: "Taco de Pastor",
        desc: "Pollo marinado en guajillo y piña, con cebolla, cilantro, piña fresca y salsa roja.",
        descEn: "Chicken marinated in guajillo and pineapple, with onion, coriander, fresh pineapple and red salsa.",
        price: "199,-", allergens: "Sl, Su", halal: true,
        image: "https://images.unsplash.com/photo-1570461226513-e08b58a52c53?w=400&q=80",
      },
      {
        name: "Taco de Gambas",
        desc: "Scampi Nobashi en tempura con col roja encurtida, huevas de trucha y mayonesa chipotle.",
        descEn: "Nobashi scampi in tempura with pickled red cabbage, trout roe and chipotle mayonnaise.",
        price: "189,-", allergens: "H, F, Sk, Su, E",
        image: "https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=400&q=80",
      },
      {
        name: "Taco de Pescado",
        desc: "Pescado crujiente con coleslaw fresca, huevas de trucha y salsa de cilantro, chili y queso.",
        descEn: "Crispy fish with fresh coleslaw, trout roe and coriander, chili and cheese sauce.",
        price: "189,-", allergens: "H, M, F, E, Sn",
        image: "https://images.unsplash.com/photo-1570461226513-e08b58a52c53?w=400&q=80",
      },
      {
        name: "Tacos de Cerdo",
        desc: "Cerdo deshilachado en chili ahumado y miel, con guacamole y pico de gallo.",
        descEn: "Pulled pork in smoked chili and honey, with guacamole and pico de gallo.",
        price: "199,-", allergens: "So, Su, Sn",
        image: "https://images.unsplash.com/photo-1611250188496-e966043a0629?w=400&q=80",
      },
      {
        name: "Tandoori Chicken Taco",
        desc: "Pollo marinado en tandoori, con verduras frescas y salsa de yogur con menta.",
        descEn: "Tandoori marinated chicken, with fresh vegetables and mint yogurt sauce.",
        price: "209,-", allergens: "Sn, M, H, Su, Sk", halal: true,
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
      },
    ],
  },
  {
    title: "Garnachas — Tacos de queso fundido (2 uds.)",
    titleEn: "Garnachas — Melted Cheese Tacos (2 pcs.)",
    image: "https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800&q=80",
    items: [
      {
        name: "Quesabirrias",
        desc: "Brisket cocido a fuego lento en adobo mexicano, con salsa roja, cebolla, cilantro y consomé para mojar.",
        descEn: "Slow-cooked brisket in Mexican adobo, with red salsa, onion, coriander and consommé for dipping.",
        price: "289,-", allergens: "M, Sl, So", halal: true,
        image: "https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=400&q=80",
      },
      {
        name: "Costra de Pastor",
        desc: "Pollo pastor con cilantro, cebolla, piña fresca y salsa roja. En costra de queso.",
        descEn: "Pastor chicken with coriander, onion, fresh pineapple and red salsa. In a cheese crust.",
        price: "279,-", allergens: "M, Sl, Su", halal: true,
        image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&q=80",
      },
      {
        name: "Costra de Milpa",
        desc: "Champiñones, maíz, cilantro y ajo, toppado con goudaost crujiente.",
        descEn: "Mushrooms, corn, coriander and garlic, topped with crispy gouda.",
        price: "257,-", allergens: "M, Sl",
        badge: "Vegetariano", badgeEn: "Vegetarian",
        image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400&q=80",
      },
    ],
  },
  {
    title: "Flautas — Tacos crujientes (2 uds.)",
    titleEn: "Flautas — Crispy Tacos (2 pcs.)",
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&q=80",
    items: [
      {
        name: "Flautas de Res",
        desc: "Taco crujiente de ternera con salsa roja, crema agria, halloumi y mayonesa de remolacha.",
        descEn: "Crispy beef taco with red salsa, sour cream, halloumi and beetroot mayonnaise.",
        price: "267,-", allergens: "M, E, Sl",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80",
      },
      {
        name: "Flautas de Camote",
        desc: "Boniato crujiente con mango habanero, crema agria, halloumi y chipotle mayo.",
        descEn: "Crispy sweet potato with mango habanero, sour cream, halloumi and chipotle mayo.",
        price: "259,-", allergens: "M, E",
        badge: "Vegetariano", badgeEn: "Vegetarian",
        image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400&q=80",
      },
      {
        name: "Flautas de Pato",
        desc: "Pato deshilachado con mole poblano de chocolate y chili, crema agria y col roja.",
        descEn: "Pulled duck with chocolate and chili mole poblano, sour cream and red cabbage.",
        price: "269,-", allergens: "Se, H, M, E, Sl, So",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80",
      },
    ],
  },
  {
    title: "Burritos",
    titleEn: "Burritos",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
    items: [
      {
        name: "Birria Burrito",
        desc: "Brisket de res cocido lentamente en tortilla de harina con queso fundido, arroz, pico de gallo, lechuga, alubias y maíz.",
        descEn: "Slow-cooked beef brisket in flour tortilla with melted cheese, rice, pico de gallo, lettuce, beans and corn.",
        price: "289,-", allergens: "H, M, Sl", halal: true,
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80",
      },
    ],
  },
  {
    title: "Platos Principales",
    titleEn: "Main Courses",
    image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80",
    items: [
      {
        name: "Brisket Norteño",
        desc: "300g de pecho de buey horneado 15 horas y glaseado con chimichurri. Con coleslaw fresca y tortillas de maíz.",
        descEn: "300g beef brisket slow-roasted for 15 hours and glazed with chimichurri. With fresh coleslaw and corn tortillas.",
        price: "449,-", allergens: "E, Su, Sn", halal: true,
        image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80",
      },
      {
        name: "Uruguayan Entrecôte",
        desc: "250g de entrecot a la parrilla, servido con patatas asadas, pimientos padrón y chimichurri de la casa.",
        descEn: "250g grilled entrecôte, served with roasted potatoes, padrón peppers and house chimichurri.",
        price: "469,-", allergens: "Su, Sn", halal: true,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
      },
      {
        name: "Golden Torsk",
        desc: "Bacalao con salsa de coco y gambas, puré de patata y verduras de temporada. Toppado con cilantro fresco y guindilla.",
        descEn: "Cod with coconut and prawn sauce, mashed potato and seasonal vegetables. Topped with fresh coriander and chili.",
        price: "379,-", allergens: "F, Sk, M",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80",
      },
      {
        name: "Coyo Mejillones",
        desc: "Mejillones al vapor en salsa cremosa de parmesano, vino blanco y aji amarillo. Con patatas fritas.",
        descEn: "Steamed mussels in creamy parmesan, white wine and aji amarillo sauce. With French fries.",
        price: "500gr 349,- · 800gr 469,-", allergens: "M, Su, Bl",
        image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80",
      },
    ],
  },
  {
    title: "Guarniciones & Salsas",
    titleEn: "Sides & Sauces",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
    items: [
      {
        name: "Pommes Frites",
        desc: "Con chipotle mayo.",
        descEn: "With chipotle mayo.",
        price: "89,-", allergens: "E, Sn",
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
      },
      {
        name: "Poblano Rice",
        desc: "Arroz verde con cilantro, cebolla, ajo y jalapeños. Con maíz, guisantes y zanahoria.",
        descEn: "Green rice with coriander, onion, garlic and jalapeños. With corn, peas and carrots.",
        price: "99,-", allergens: "Sl",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80",
      },
      {
        name: "Coleslaw",
        desc: "Col roja y zanahoria en aliño de mayonesa especiada.",
        descEn: "Red cabbage and carrot in spiced mayonnaise dressing.",
        price: "45,-", allergens: "E, Su, Sn",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80",
      },
      {
        name: "Tortillas",
        desc: "Tortillas de maíz artesanales.",
        descEn: "Artisan corn tortillas.",
        price: "59,-",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
      },
      { name: "Chimichurri", price: "49,-", allergens: "Su", image: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400&q=80" },
      { name: "Salsa Roja", price: "45,-", allergens: "Sl", image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&q=80" },
      { name: "Salsa Tomatillo", price: "45,-", allergens: "Sl", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80" },
      { name: "Mango Habanero", price: "45,-", image: "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&q=80" },
      { name: "Chipotle Mayo", price: "45,-", allergens: "E, Sn, Su", image: "https://images.unsplash.com/photo-1628294895950-9805252327bc?w=400&q=80" },
      {
        name: "Diablo Salsa",
        desc: "Extra picante.",
        descEn: "Extra hot.",
        price: "45,-", allergens: "Sl",
        image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
      },
      { name: "Crema Agria", price: "49,-", allergens: "M", image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80" },
    ],
  },
  {
    title: "Postres",
    titleEn: "Desserts",
    image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80",
    items: [
      {
        name: "Churros",
        desc: "Churros dorados con salsa de chocolate negro, crumble de vainilla crujiente y helado artesanal de lucuma.",
        descEn: "Golden churros with dark chocolate sauce, crispy vanilla crumble and artisan lucuma ice cream.",
        price: "189,-", allergens: "H, M",
        image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&q=80",
      },
      {
        name: "Avocado Brownie",
        desc: "Brownie de chocolate negro con aguacate y nueces, helado de pistacho y caramelo salado.",
        descEn: "Dark chocolate and avocado brownie with walnuts, pistachio ice cream and salted caramel.",
        price: "189,-", allergens: "E, M, H, Va, Pi",
        image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80",
      },
      {
        name: "Tres Leches",
        desc: "Bizcocho empapado en tres leches, coronado con nata montada y cacao.",
        descEn: "Sponge cake soaked in three milks, topped with whipped cream and cocoa.",
        price: "185,-", allergens: "M, H, E",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
      },
    ],
  },
];

/* ─── CARTA SUSHI ─── */
const sushi: Section[] = [
  {
    title: "Tartar",
    titleEn: "Tartar",
    image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80",
    items: [
      {
        name: "Laksetartar",
        desc: "Salmón con aguacate, chutney de mango, crema de aguacate, huevas de salmón, salsa de maracuyá y crujiente de arroz.",
        descEn: "Salmon with avocado, mango chutney, avocado cream, salmon roe, passion fruit sauce and rice cracker.",
        price: "269,-", allergens: "G, F, So, Se",
        badge: "Best Seller", badgeEn: "Best Seller",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80",
      },
    ],
  },
  {
    title: "Nigiri Clásico (4 uds.)",
    titleEn: "Classic Nigiri (4 pcs.)",
    image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80",
    items: [
      { name: "Laks",          desc: "Salmón",    descEn: "Salmon",     price: "159,-", allergens: "F", image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80" },
      { name: "Tunfisk Akami", desc: "Atún akami",descEn: "Akami tuna", price: "189,-", allergens: "F", image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80" },
      { name: "Bonito",        desc: "Bonito",    descEn: "Bonito",     price: "169,-", allergens: "F", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80" },
      { name: "Kveite",        desc: "Halibut",   descEn: "Halibut",    price: "169,-", allergens: "F", image: "https://images.unsplash.com/photo-1676037150408-4b59a542fa7c?w=400&q=80" },
      { name: "Hamachi",       desc: "Pez limón", descEn: "Yellowtail", price: "189,-", allergens: "F", image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80" },
      { name: "Kamskjell",     desc: "Vieira",    descEn: "Scallop",    price: "139,-", allergens: "Bl", image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80" },
    ],
  },
  {
    title: "Nigiri Especial (4 uds.)",
    titleEn: "Special Nigiri (4 pcs.)",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80",
    items: [
      {
        name: "Aburi Sake",
        desc: "Nigiri de salmón flameado con mayonesa de la casa y cebollino.",
        descEn: "Flame-seared salmon nigiri with house mayonnaise and chives.",
        price: "179,-", allergens: "F, E, So",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80",
      },
      {
        name: "Truffel Toro",
        desc: "Nigiri de toro flameado con mayonesa de trufa.",
        descEn: "Flame-seared toro nigiri with truffle mayonnaise.",
        price: "199,-", allergens: "F, E, So",
        badge: "Premium", badgeEn: "Premium",
        image: "https://images.unsplash.com/photo-1676037150408-4b59a542fa7c?w=400&q=80",
      },
      {
        name: "Hirame",
        desc: "Nigiri de halibut flameado con salsa de tamarindo y wasabi.",
        descEn: "Flame-seared halibut nigiri with tamarind sauce and wasabi.",
        price: "189,-", allergens: "F, So, Se",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80",
      },
    ],
  },
  {
    title: "Sashimi Clásico (4 uds.)",
    titleEn: "Classic Sashimi (4 pcs.)",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80",
    items: [
      { name: "Laks",          desc: "Salmón",    descEn: "Salmon",     price: "139,-", allergens: "F", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80" },
      { name: "Tunfisk Akami", desc: "Atún akami",descEn: "Akami tuna", price: "179,-", allergens: "F", image: "https://images.unsplash.com/photo-1676037150408-4b59a542fa7c?w=400&q=80" },
      { name: "Bonito",                                                   price: "159,-", allergens: "F", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80" },
      { name: "Kveite",        desc: "Halibut",   descEn: "Halibut",    price: "159,-", allergens: "F", image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80" },
      { name: "Hamachi",       desc: "Pez limón", descEn: "Yellowtail", price: "179,-", allergens: "F", image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80" },
      { name: "Kamskjell",     desc: "Vieira",    descEn: "Scallop",    price: "159,-", allergens: "Bl", image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80" },
    ],
  },
  {
    title: "Sashimi Especial (4 uds.)",
    titleEn: "Special Sashimi (4 pcs.)",
    image: "https://images.unsplash.com/photo-1676037150408-4b59a542fa7c?w=800&q=80",
    items: [
      {
        name: "Umai Sashimi",
        desc: "Sashimi de salmón toppado con mantequilla de mango, ponzu, jalapeño y huevas.",
        descEn: "Salmon sashimi topped with mango butter, ponzu, jalapeño and roe.",
        price: "239,-", allergens: "F, So, M, Se, Sn",
        image: "https://images.unsplash.com/photo-1676037150408-4b59a542fa7c?w=400&q=80",
      },
      {
        name: "Truffle Akami",
        desc: "Sashimi de atún akami toppado con miel de trufa negra y crujiente de arroz.",
        descEn: "Akami tuna sashimi topped with black truffle honey and rice cracker.",
        price: "269,-", allergens: "G, F",
        badge: "Exclusivo", badgeEn: "Exclusive",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
      },
      {
        name: "Coyo Sashimi",
        desc: "Sashimi de halibut con vinagreta de wasabi, crema de jalapeño, semillas de granada y tiras de boniato crujiente.",
        descEn: "Halibut sashimi with wasabi vinaigrette, jalapeño cream, pomegranate seeds and crispy sweet potato strips.",
        price: "269,-", allergens: "G, F, So, Se, Sn",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80",
      },
    ],
  },
  {
    title: "Moriawase — Sashimi variado sobre hielo",
    titleEn: "Moriawase — Assorted Sashimi on Ice",
    image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80",
    items: [
      {
        name: "Moriawase 16 piezas",
        desc: "4 tipos de pescado de temporada.",
        descEn: "4 types of seasonal fish.",
        price: "799,-",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80",
      },
      {
        name: "Moriawase 32 piezas",
        desc: "4 tipos de pescado de temporada.",
        descEn: "4 types of seasonal fish.",
        price: "1.499,-",
        image: "https://images.unsplash.com/photo-1676037150408-4b59a542fa7c?w=400&q=80",
      },
    ],
  },
  {
    title: "Maki Clásico (8 uds.)",
    titleEn: "Classic Maki (8 pcs.)",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80",
    items: [
      {
        name: "Laks Maki",
        desc: "Maki de salmón y cebollino.",
        descEn: "Salmon and chive maki.",
        price: "199,-", allergens: "F",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&q=80",
      },
      {
        name: "Coyo Tempura Maki",
        desc: "Maki de tempura de scampi y aguacate, toppado con crema de aguacate.",
        descEn: "Tempura scampi and avocado maki, topped with avocado cream.",
        price: "199,-", allergens: "G, F, So, Se",
        image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&q=80",
      },
      {
        name: "Kamskjell Maki",
        desc: "Maki de pepino y vieira con vinagreta de wasabi, toppado con ikura.",
        descEn: "Cucumber and scallop maki with wasabi vinaigrette, topped with ikura.",
        price: "209,-", allergens: "So, Se, Bl",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
      },
      {
        name: "California Maki",
        desc: "Maki de cangrejo, aguacate y queso crema.",
        descEn: "Crab, avocado and cream cheese maki.",
        price: "209,-", allergens: "G, Sk, F",
        image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80",
      },
      {
        name: "Tunfisk Maki",
        desc: "Maki de atún y aguacate.",
        descEn: "Tuna and avocado maki.",
        price: "209,-", allergens: "F",
        image: "https://images.unsplash.com/photo-1676037150408-4b59a542fa7c?w=400&q=80",
      },
    ],
  },
  {
    title: "Maki Especial (8 uds.)",
    titleEn: "Special Maki (8 pcs.)",
    image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800&q=80",
    items: [
      {
        name: "PX Maki",
        desc: "Tempura de scampi, tartar de salmón picante y salsa PX. Toppado con mantequilla de mango y huevas.",
        descEn: "Tempura scampi, spicy salmon tartar and PX sauce. Topped with mango butter and roe.",
        price: "225,-", allergens: "G, Sk, F, So, M, Se, Sn, Su",
        badge: "Firma", badgeEn: "Signature",
        image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&q=80",
      },
      {
        name: "Kiwami",
        desc: "Maki de cebollino y pescado blanco de temporada, toppado con atún y salsa de trufa.",
        descEn: "Chive and seasonal white fish maki, topped with tuna and truffle sauce.",
        price: "239,-", allergens: "F, So",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
      },
      {
        name: "Spicy Maguro",
        desc: "Maki de pepino y aguacate, toppado con tartar de atún picante y tiras de boniato.",
        descEn: "Cucumber and avocado maki, topped with spicy tuna tartar and sweet potato strips.",
        price: "229,-", allergens: "G, F, So, Se, Su",
        image: "https://images.unsplash.com/photo-1676037150408-4b59a542fa7c?w=400&q=80",
      },
      {
        name: "Hotate Maki",
        desc: "Maki de pepino y aguacate, toppado con vieira flameada y crema de jalapeño.",
        descEn: "Cucumber and avocado maki, topped with flame-seared scallop and jalapeño cream.",
        price: "229,-", allergens: "So, Se, Bl",
        image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&q=80",
      },
    ],
  },
  {
    title: "Futo Maki (6 uds.)",
    titleEn: "Futo Maki (6 pcs.)",
    image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800&q=80",
    items: [
      {
        name: "Yuzu Tempura Scampi",
        desc: "Futo maki de cebollino, aguacate, doble tempura de scampi, mayonesa de yuzu y shichimi togarashi.",
        descEn: "Futo maki with chive, avocado, double tempura scampi, yuzu mayonnaise and shichimi togarashi.",
        price: "239,-", allergens: "G, Sk, E, F, So, M, Se, Sn",
        image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&q=80",
      },
    ],
  },
  {
    title: "Chef's Mix — Combos variados",
    titleEn: "Chef's Mix — Assorted Combinations",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80",
    items: [
      {
        name: "Chef's Mix 16 piezas",
        desc: "Selección del chef de 16 piezas de sushi variado.",
        descEn: "Chef's selection of 16 assorted sushi pieces.",
        price: "465,-",
        image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80",
      },
      {
        name: "Chef's Mix 32 piezas",
        desc: "Selección del chef de 32 piezas. Para celebrar en grande.",
        descEn: "Chef's selection of 32 pieces. Perfect for a celebration.",
        price: "890,-",
        image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&q=80",
      },
    ],
  },
];

/* ─── BEBIDAS ─── */
const bebidas: Section[] = [
  {
    title: "Cócteles Signature",
    titleEn: "Signature Cocktails",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
    items: [
      { name: "Pretty Coyo",      desc: "Gin, Limoncello, Frambuesa, Clara de huevo, Lima.",  descEn: "Gin, Limoncello, Raspberry, Egg white, Lime.",    price: "199,-", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
      { name: "Tokyo Negroni",    desc: "Gin, Campari, Umeshu.",                               descEn: "Gin, Campari, Umeshu.",                            price: "199,-", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
      { name: "Oahu Blue",        desc: "Ron de coco, Blue Curaçao.",                          descEn: "Coconut rum, Blue Curaçao.",                       price: "199,-", image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80" },
      { name: "East of Collins",  desc: "Gin, Yuzu, Licor de Pandan.",                         descEn: "Gin, Yuzu, Pandan Liqueur.",                       price: "199,-", image: "https://images.unsplash.com/photo-1471933810861-0682bd892489?w=400&q=80" },
      { name: "Espresso Martini", desc: "Giffard Coffee, Espresso, Smirnoff Vodka.",           descEn: "Giffard Coffee, Espresso, Smirnoff Vodka.",        price: "199,-", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
    ],
  },
  {
    title: "Frozen Cocktails",
    titleEn: "Frozen Cocktails",
    image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80",
    items: [
      { name: "Frozen Mango Chili Margarita", desc: "Tequila Patrón, Cointreau, puré de mango, zumo de lima, chili.",        descEn: "Tequila Patrón, Cointreau, mango purée, lime juice, chili.",              price: "199,-", image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80" },
      { name: "Piña Colada",                  desc: "Ron de coco, puré de piña, puré de coco, zumo de piña y lima.",          descEn: "Coconut rum, pineapple purée, coconut purée, pineapple and lime juice.",   price: "199,-", image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80" },
      { name: "Frozen Strawberry Daiquiri",   desc: "Ron Bacardi, puré de fresa, zumo de lima.",                              descEn: "Bacardi rum, strawberry purée, lime juice.",                              price: "199,-", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" },
      { name: "Mexican Pornstar",             desc: "Licor de maracuyá, vodka de vainilla, zumo de lima y maracuyá.",         descEn: "Passion fruit liqueur, vanilla vodka, lime and passion fruit juice.",      price: "199,-", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
    ],
  },
  {
    title: "Margaritas",
    titleEn: "Margaritas",
    image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=800&q=80",
    items: [
      { name: "Classic Margarita",      desc: "Tequila Patrón, Cointreau, zumo de lima, sal.",                    descEn: "Tequila Patrón, Cointreau, lime juice, salt.",                          price: "199,-", image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80" },
      { name: "Passionfruit Margarita", desc: "Tequila Patrón, Cointreau, puré de maracuyá, lima, tajin.",        descEn: "Tequila Patrón, Cointreau, passion fruit purée, lime, tajin.",          price: "199,-", image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80" },
      { name: "Mezcal Margarita",       desc: "Mezcal 400 Conejos, Cointreau, pepino, lima, tajin.",              descEn: "Mezcal 400 Conejos, Cointreau, cucumber, lime, tajin.",                 price: "199,-", image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80" },
    ],
  },
  {
    title: "Mojitos",
    titleEn: "Mojitos",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
    items: [
      { name: "Classic Mojito",      desc: "Ron Bacardi, lima, menta y soda.",    descEn: "Bacardi rum, lime, mint and soda.",          price: "199,-", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80" },
      { name: "Lychee Mojito",       desc: "Ron Bacardi, lima, menta, lichi.",    descEn: "Bacardi rum, lime, mint, lychee.",           price: "199,-", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80" },
      { name: "Passionfruit Mojito", desc: "Ron Bacardi, lima, menta, maracuyá.", descEn: "Bacardi rum, lime, mint, passion fruit.",    price: "199,-", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80" },
    ],
  },
  {
    title: "Spritzers",
    titleEn: "Spritzers",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80",
    items: [
      { name: "Aperol Spritz",    desc: "Aperol, Prosecco.",                     descEn: "Aperol, Prosecco.",                          price: "189,-", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" },
      { name: "Limoncello Spritz",desc: "Limoncello, Prosecco.",                 descEn: "Limoncello, Prosecco.",                      price: "189,-", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" },
      { name: "Hugo Spritz",      desc: "Licor de flor de saúco, Prosecco.",     descEn: "Elderflower liqueur, Prosecco.",             price: "189,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
    ],
  },
  {
    title: "Gin & Tonics",
    titleEn: "Gin & Tonics",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80",
    items: [
      { name: "Classic GT", desc: "Gordons, limón, bayas de enebro, Fever Tree Tonic.",                     descEn: "Gordons, lemon, juniper berries, Fever Tree Tonic.",                   price: "165,-", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80" },
      { name: "Roku GT",    desc: "Roku Gin, jengibre, Fever Tree Tonic.",                                  descEn: "Roku Gin, ginger, Fever Tree Tonic.",                                  price: "189,-", image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80" },
      { name: "Pink GT",    desc: "Gordons Pink, naranja, arándanos, Fever Tree Raspberry & Rhubarb.",      descEn: "Gordons Pink, orange, blueberries, Fever Tree Raspberry & Rhubarb.",   price: "179,-", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" },
    ],
  },
  {
    title: "Cócteles Clásicos",
    titleEn: "Classic Cocktails",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
    items: [
      { name: "Paloma",          desc: "Tequila, soda de pomelo y lima.",                                          descEn: "Tequila, grapefruit soda and lime.",                                      price: "199,-", image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80" },
      { name: "Pornstar Martini",desc: "Vodka de vainilla, Passoa, puré de maracuyá, lima, Prosecco.",             descEn: "Vanilla vodka, Passoa, passion fruit purée, lime, Prosecco.",              price: "199,-", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80" },
      { name: "Irish Coffee",    desc: "Tullamore, café, azúcar, nata.",                                           descEn: "Tullamore, coffee, sugar, cream.",                                        price: "189,-", allergens: "M", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
      { name: "Baileys Coffee",  desc: "Baileys, café.",                                                           descEn: "Baileys, coffee.",                                                       price: "119,-", allergens: "M", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
    ],
  },
  {
    title: "Micheladas & Sangría",
    titleEn: "Micheladas & Sangria",
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80",
    items: [
      { name: "Chelada",           desc: "Cerveza, lima, sal. Elige tu cerveza.",                 descEn: "Beer, lime, salt. Choose your beer.",                     price: "39,- + cerveza",  image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
      { name: "Michelada",         desc: "Cerveza, zumo de tomate, lima, chili y sal.",            descEn: "Beer, tomato juice, lime, chili and salt.",               price: "43,- + cerveza",  allergens: "Cel, SF", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
      { name: "Asian Yuzu Chelada",desc: "Cerveza, Yuzu Sake, lima, sal.",                         descEn: "Beer, Yuzu Sake, lime, salt.",                            price: "85,- + cerveza",  image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "Sangría (jarra)",   desc: "Blanca, roja o rosada.",                                 descEn: "White, red or rosé.",                                    price: "750,-",           image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "Sangría (copa)",                                                                                                                                       price: "169,-",           image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
    ],
  },
  {
    title: "Cervezas",
    titleEn: "Beers",
    image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80",
    items: [
      { name: "Heineken",                    desc: "Países Bajos · 4.7% · 0.4L",    descEn: "Netherlands · 4.7% · 0.4L",    price: "129,-", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "Kirin",                       desc: "Japón · 5.0% · 0.4L",           descEn: "Japan · 5.0% · 0.4L",          price: "139,-", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "Nøgne Ø Blanc",              desc: "Noruega · 5.5% · 0.4L",          descEn: "Norway · 5.5% · 0.4L",         price: "139,-", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "Sol",                         desc: "México · 4.2% · 0.33L",          descEn: "Mexico · 4.2% · 0.33L",        price: "120,-", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
      { name: "Charro",                      desc: "México · 4.5% · 0.35L",          descEn: "Mexico · 4.5% · 0.35L",        price: "149,-", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
      { name: "Modelo Negra",               desc: "México · 5.4% · 0.35L",           descEn: "Mexico · 5.4% · 0.35L",        price: "170,-", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "Nøgne India Pale Ale",       desc: "Noruega · 7.5% · 0.33L",          descEn: "Norway · 7.5% · 0.33L",        price: "159,-", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "Nøgne Asian Pale Ale",       desc: "Noruega · 4.5% · 0.33L",          descEn: "Norway · 4.5% · 0.33L",        price: "129,-", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "San Miguel Gluten Free",      desc: "Italia · 5.4% · 0.33L",           descEn: "Italy · 5.4% · 0.33L",         price: "154,-", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "Bulmers Original (Cider)",    desc: "Irlanda · 4.5% · 0.5L",           descEn: "Ireland · 4.5% · 0.5L",        price: "189,-", allergens: "Su", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
      { name: "Bulmers Red Berries (Cider)", desc: "Irlanda · 4.5% · 0.5L",           descEn: "Ireland · 4.5% · 0.5L",        price: "199,-", allergens: "Su", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&q=80" },
      { name: "Kirin Free (Sin alcohol)",    desc: "Japón · 0.0% · 0.33L",            descEn: "Japan · 0.0% · 0.33L",         price: "99,-",  image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
      { name: "Weihenstephaner Sin alcohol", desc: "Alemania · 0.0% · 0.5L",           descEn: "Germany · 0.0% · 0.5L",        price: "115,-", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80" },
    ],
  },
  {
    title: "Sake",
    titleEn: "Sake",
    image: "https://images.unsplash.com/photo-1564463836146-4e30522c2984?w=800&q=80",
    items: [
      { name: "ILE Four Yuzu Citrus",          desc: "Japón · 10.5% · copa/botella 0.5L",   descEn: "Japan · 10.5% · glass/bottle 0.5L",  price: "155,- / 730,-",   image: "https://images.unsplash.com/photo-1564463836146-4e30522c2984?w=400&q=80" },
      { name: "ILE Four Junmai Daiginjo",      desc: "Japón · 16% · copa/botella 0.72L",    descEn: "Japan · 16% · glass/bottle 0.72L",   price: "170,- / 1.140,-", image: "https://images.unsplash.com/photo-1564463836146-4e30522c2984?w=400&q=80" },
      { name: "Sho Chiku Bai Premium Junmai",  desc: "Japón · 15% · copa/botella 0.72L",    descEn: "Japan · 15% · glass/bottle 0.72L",   price: "122,- / 890,-",   image: "https://images.unsplash.com/photo-1564463836146-4e30522c2984?w=400&q=80" },
    ],
  },
  {
    title: "Sin Alcohol",
    titleEn: "Non-Alcoholic",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
    items: [
      { name: "Forrest Berry Lemonade",           desc: "Frambuesa, fresa, grosella negra, lima con agua con gas.",    descEn: "Raspberry, strawberry, blackcurrant, lime with sparkling water.", price: "119,-", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
      { name: "Tropical Lemonade",                desc: "Maracuyá, mango, lima con agua con gas.",                     descEn: "Passion fruit, mango, lime with sparkling water.",                price: "119,-", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
      { name: "Asian Lemonade",                   desc: "Lichi, lima, matcha con agua con gas.",                       descEn: "Lychee, lime, matcha with sparkling water.",                      price: "119,-", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
      { name: "Jarritos",                         desc: "Refresco mexicano: mango, fresa, guayaba o piña · 0.33L",    descEn: "Mexican soda: mango, strawberry, guava or pineapple · 0.33L",   price: "95,-",  image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
      { name: "Coca-Cola / Zero / Fanta / Sprite",desc: "0.4L vaso / 0.33L botella",                                   descEn: "0.4L glass / 0.33L bottle",                                      price: "75,-",  image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
      { name: "Red Bull",                         desc: "Regular o Sin azúcar · 0.2L",                                 descEn: "Regular or Sugar-free · 0.2L",                                   price: "80,-",  image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
      { name: "San Pellegrino",                   desc: "0.75L",                                                        descEn: "0.75L",                                                          price: "140,-", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
      { name: "Ringi Gravenstein",                desc: "0.25L / 0.75L",                                               descEn: "0.25L / 0.75L",                                                  price: "120,- / 240,-", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
    ],
  },
  {
    title: "Café & Té",
    titleEn: "Coffee & Tea",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    items: [
      { name: "Café",        price: "45,-",         image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
      { name: "Espresso",    price: "43,- / 45,-",  image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
      { name: "Americano",   price: "43,- / 45,-",  image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
      { name: "Cappuccino",  price: "50,- / 55,-",  image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
      { name: "Caffè Latte", price: "55,- / 60,-",  image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
      { name: "Iced Latte",  price: "55,- / 60,-",  image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
      { name: "Té",          price: "45,-",         image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
    ],
  },
  {
    title: "Vinos por Copa",
    titleEn: "Wines by the Glass",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
    items: [
      { name: "Prosecco Treviso Brut",    desc: "Tenuta La Maredana · Véneto, Italia",                  descEn: "Tenuta La Maredana · Veneto, Italy",                 price: "155,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "Crémant de Limoux",        desc: "J. Laurens · Languedoc, Francia",                      descEn: "J. Laurens · Languedoc, France",                     price: "169,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "AIX Rosé",                 desc: "Maison Saint Aix · Provence, Francia",                 descEn: "Maison Saint Aix · Provence, France",                price: "195,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "Chablis",                  desc: "Gérard Tremblay · Chablis, Francia",                   descEn: "Gérard Tremblay · Chablis, France",                  price: "195,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "Hochheim Riesling Classic",desc: "Domdechant Werner · Rheingau, Alemania",               descEn: "Domdechant Werner · Rheingau, Germany",              price: "175,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "Pouilly-Fumé",             desc: "Jean Pabiot · Loire, Francia",                         descEn: "Jean Pabiot · Loire, France",                        price: "190,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "Bourgogne Pinot Noir",     desc: "Michel Juillot · Bourgogne, Francia",                  descEn: "Michel Juillot · Bourgogne, France",                 price: "195,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "Le Versant Merlot",        desc: "Les Vignobles Foncalieu · Pays d'Oc, Francia",        descEn: "Les Vignobles Foncalieu · Pays d'Oc, France",        price: "179,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
      { name: "Valpolicella Superiore",   desc: "La Casa di Roberta · Véneto, Italia",                  descEn: "La Casa di Roberta · Veneto, Italy",                 price: "175,-", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
    ],
  },
];

/* ─── COMPONENTE MODAL ─── */
function Modal({
  title, sections, color, onClose, allergens, halalLabel, footerNote, lang,
}: {
  title: string;
  sections: Section[];
  color: string;
  onClose: () => void;
  allergens: string;
  halalLabel: string;
  footerNote: string;
  lang: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="relative w-full md:max-w-3xl max-h-[95vh] md:max-h-[88vh] flex flex-col overflow-hidden"
        style={{ background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "2px" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="shrink-0" style={{ background: "linear-gradient(135deg, #1a1608 0%, #0e0d0b 100%)", borderBottom: "1px solid rgba(201,168,76,0.18)" }}>
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
          <div className="flex items-center justify-between" style={{ padding: "1.5rem 1.75rem 1.25rem" }}>
            <div>
              <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.4rem" }}>
                Coyo Restaurant · Oslo
              </p>
              <h2 className="font-serif text-white" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 700, letterSpacing: "-0.01em" }}>
                {title}
              </h2>
            </div>
            <button onClick={onClose}
              className="flex items-center justify-center cursor-pointer"
              style={{ width: 36, height: 36, color: "rgba(255,255,255,0.35)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "2px", background: "rgba(201,168,76,0.04)", flexShrink: 0, transition: "all 200ms" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)"; e.currentTarget.style.background = "rgba(201,168,76,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.background = "rgba(201,168,76,0.04)"; }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {sections.map((sec, si) => {
            const secTitle = lang === "en" && sec.titleEn ? sec.titleEn : sec.title;
            return (
              <div key={si} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Título de sección */}
                <div style={{ padding: "2rem 2rem 1rem" }}>
                  <span className="text-[11px] uppercase tracking-[0.25em] font-sans font-semibold" style={{ color }}>
                    {secTitle}
                  </span>
                </div>

                {/* Hero image */}
                {sec.image && (
                  <div style={{ position: "relative", width: "100%", height: 160, margin: "0 0 0.5rem", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sec.image} alt={secTitle} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, #0e0d0b)" }} />
                  </div>
                )}

                {/* Items */}
                <div style={{ padding: "0.5rem 2rem 2rem" }}>
                  {sec.items.map((item, ii) => {
                    const itemDesc  = lang === "en" && item.descEn  ? item.descEn  : item.desc;
                    const itemBadge = lang === "en" && item.badgeEn ? item.badgeEn : item.badge;
                    return (
                      <div key={ii} className="flex gap-5"
                        style={{
                          padding: "1.25rem 0",
                          borderBottom: ii < sec.items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        }}>
                        {item.image && (
                          <div style={{ width: 64, height: 64, flexShrink: 0, overflow: "hidden", borderRadius: "2px" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-sans text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>{item.name}</span>
                              {itemBadge && (
                                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-sans"
                                  style={{ color, border: `1px solid ${color}40`, background: `${color}12`, borderRadius: "2px" }}>
                                  {itemBadge}
                                </span>
                              )}
                              {item.halal && (
                                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-sans"
                                  style={{ color: "rgb(134,239,172)", border: "1px solid rgba(52,211,153,0.25)", background: "rgba(20,83,45,0.5)", borderRadius: "2px" }}>
                                  {halalLabel}
                                </span>
                              )}
                            </div>
                            <span className="font-sans text-[14px] font-semibold shrink-0" style={{ color }}>{item.price}</span>
                          </div>
                          {itemDesc && <p className="font-sans text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.38)", marginTop: "0.4rem" }}>{itemDesc}</p>}
                          {item.allergens && <p className="font-sans text-[11px] italic" style={{ color: "rgba(255,255,255,0.2)", marginTop: "0.4rem" }}>{allergens}: {item.allergens}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <p className="text-center text-[10px] font-sans py-6" style={{ color: "rgba(255,255,255,0.15)" }}>
            {footerNote}
          </p>
        </div>
      </div>
    </div>
  );
}

function filterSections(sections: Section[]): Section[] {
  return sections.map(s => ({ ...s, items: s.items.filter(it => it.activo !== false) }));
}

/* ─── EXPORT PRINCIPAL ─── */
export default function CartasMenu() {
  const [open, setOpen] = useState<"mexicana" | "sushi" | "bebidas" | null>(null);
  const [apiMenus, setApiMenus] = useState<Menus | null>(null);
  const { tr, lang } = useLanguage();
  const cm = tr.cartasMenu;

  useEffect(() => {
    fetch("/api/admin/menus")
      .then(r => r.ok ? r.json() : null)
      .then((data: Menus | null) => { if (data) setApiMenus(data); })
      .catch(() => {});
  }, []);

  const m = apiMenus ?? { mexicana, sushi, bebidas };

  return (
    <>
      <div className="flex flex-col md:flex-row items-stretch justify-center" style={{ gap: 24 }}>
        <button onClick={() => setOpen("mexicana")} className="btn-primary w-full md:w-[200px]" style={{ minHeight: 110, justifyContent: "center", flexDirection: "column", gap: 10, paddingTop: 18, paddingBottom: 18 }}>
          <UtensilsCrossed size={18} style={{ position: "relative", zIndex: 1 }} />
          <span>{cm.mexicanMenu}</span>
        </button>
        <button onClick={() => setOpen("sushi")} className="btn-primary w-full md:w-[200px]" style={{ minHeight: 110, justifyContent: "center", flexDirection: "column", gap: 10, paddingTop: 18, paddingBottom: 18 }}>
          <Waves size={18} style={{ position: "relative", zIndex: 1 }} />
          <span>{cm.sushiMenu}</span>
        </button>
        <button onClick={() => setOpen("bebidas")} className="btn-primary w-full md:w-[200px]" style={{ minHeight: 110, justifyContent: "center", flexDirection: "column", gap: 10, paddingTop: 18, paddingBottom: 18 }}>
          <Wine size={18} style={{ position: "relative", zIndex: 1 }} />
          <span>{cm.drinks}</span>
        </button>
      </div>

      {open === "mexicana" && <Modal title={cm.mexicanMenu} sections={filterSections(m.mexicana)} color="#c9a84c" onClose={() => setOpen(null)} allergens={cm.allergens} halalLabel={tr.productCard.halal} footerNote={cm.halalNote} lang={lang} />}
      {open === "sushi"    && <Modal title={cm.sushiMenu}   sections={filterSections(m.sushi)}    color="#c9a84c" onClose={() => setOpen(null)} allergens={cm.allergens} halalLabel={tr.productCard.halal} footerNote={cm.halalNote} lang={lang} />}
      {open === "bebidas"  && <Modal title={cm.drinks}      sections={filterSections(m.bebidas)}  color="#c9a84c" onClose={() => setOpen(null)} allergens={cm.allergens} halalLabel={tr.productCard.halal} footerNote={cm.halalNote} lang={lang} />}
    </>
  );
}
