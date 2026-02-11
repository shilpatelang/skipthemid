import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Dish seed data ──────────────────────────────────────────────────────

const DISHES = [
  {
    name: "Jackfruit & Banana Blossom Skewers",
    description:
      "A beloved Kerala street food where young jackfruit and banana blossoms are marinated in a fiery blend of Kashmiri chili, turmeric, and coconut oil, then grilled over charcoal until smoky and caramelized. The jackfruit's meaty texture absorbs the spices beautifully, while the banana blossom adds a delicate, slightly bitter contrast. Vendors in Kochi's Fort area serve these with a tangy tamarind-date chutney.",
    recipe:
      "Slice young jackfruit and banana blossoms into chunks. Marinate in a paste of Kashmiri chili powder, turmeric, coriander, grated coconut, and coconut oil for 2 hours. Thread onto bamboo skewers alternating jackfruit and blossom. Grill over medium-high charcoal heat for 8-10 minutes, turning frequently. Serve with tamarind-date chutney.",
    origin: "Kerala, India",
    cuisine: "South Indian",
    category: "Street Food",
    latitude: 9.9312,
    longitude: 76.2673,
  },
  {
    name: "Ceviche de Conchas Negras",
    description:
      "A prized delicacy from Peru's northern coast, this ceviche features black clams (conchas negras) harvested from the mangrove swamps of Tumbes. The clams are cured in lime juice with sliced red onions, ají limo peppers, and cilantro. Unlike regular ceviche, the conchas negras have a rich, briny intensity that pairs perfectly with the sharp citrus. Traditionally served in the shell with cancha (toasted corn).",
    recipe:
      "Shuck 2 dozen black clams, reserving shells and liquid. Combine clam meat with juice of 8 limes, thinly sliced red onion, minced ají limo pepper, chopped cilantro, and a pinch of salt. Let cure for 5 minutes (no longer—overcooking toughens them). Serve in the shells, spooning the tiger's milk (leche de tigre) over each. Accompany with cancha and sweet potato slices.",
    origin: "Tumbes, Peru",
    cuisine: "Peruvian",
    category: "Seafood",
    latitude: -3.5669,
    longitude: -80.4515,
  },
  {
    name: "Adjarian Khachapuri",
    description:
      "Georgia's most dramatic cheese bread — a boat-shaped dough cradling molten sulguni and imeruli cheeses, topped with a raw egg and a pat of butter just before serving. The diner tears off the crusty ends and stirs the egg into the bubbling cheese. Originating from the Black Sea region of Adjara, it's a meal in itself and a centerpiece of Georgian hospitality.",
    recipe:
      "Make a yeasted dough with flour, warm milk, butter, and a pinch of sugar. After rising, shape into oval boats with raised edges. Fill with a mix of crumbled sulguni and imeruli cheese (or substitute with mozzarella and feta). Bake at 250°C for 12-15 minutes until golden. Remove from oven, create a well in the center, crack in a raw egg, and add a generous knob of butter. Serve immediately.",
    origin: "Batumi, Georgia",
    cuisine: "Georgian",
    category: "Bread",
    latitude: 41.6168,
    longitude: 41.6367,
  },
  {
    name: "Rendang Padang",
    description:
      "Often called the world's most flavorful curry, rendang is a dry coconut curry from the Minangkabau people of West Sumatra. Beef is slow-cooked for hours in coconut milk with lemongrass, galangal, turmeric leaves, and a complex rempah (spice paste) until the liquid evaporates and the meat turns dark, tender, and intensely concentrated. True rendang is never soupy — it's meant to be shelf-stable, originally created for long journeys.",
    recipe:
      "Blend shallots, garlic, ginger, galangal, lemongrass, and dried chilies into a paste. Sear 1kg cubed beef in coconut oil, then add the paste and cook until fragrant. Pour in 800ml coconut milk, add turmeric leaves, kaffir lime leaves, and a cinnamon stick. Simmer uncovered on low heat for 3-4 hours, stirring occasionally, until the liquid is fully absorbed and the meat is dark and caramelized.",
    origin: "West Sumatra, Indonesia",
    cuisine: "Indonesian",
    category: "Curry",
    latitude: -0.7399,
    longitude: 100.8,
  },
  {
    name: "Mole Negro",
    description:
      "The most complex and revered of Oaxaca's seven moles, mole negro requires over 30 ingredients and days of preparation. Charred chilhuacle negro chilies give it a distinctive near-black color, while chocolate, plantain, and burnt tortillas add depth. It's traditionally served at weddings and Day of the Dead celebrations over turkey, its layers of flavor unfolding with every bite — smoky, bitter, sweet, and earthy all at once.",
    recipe:
      "Toast and rehydrate chilhuacle negro, mulato, and pasilla chilies. Char tomatoes, tomatillos, onions, and garlic. Fry plantain slices and burn tortillas until black. Blend everything with chocolate, cinnamon, cloves, cumin, oregano, and chicken broth. Strain and cook in lard for 45 minutes, stirring constantly. Simmer for another 2 hours. Serve over slow-cooked turkey with rice.",
    origin: "Oaxaca, Mexico",
    cuisine: "Oaxacan",
    category: "Sauce",
    latitude: 17.0732,
    longitude: -96.7266,
  },
  {
    name: "Saksang",
    description:
      "A ceremonial dish of the Batak people from North Sumatra, saksang is pork slow-cooked in its own blood with a fragrant mix of andaliman pepper (Sichuan-like), galangal, lemongrass, and kaffir lime leaves. The blood thickens into a rich, dark sauce with an earthy depth. Served at weddings and major celebrations, it's considered the pinnacle of Batak cuisine.",
    recipe:
      "Cube 1kg pork shoulder. In a wok, fry the spice paste (shallots, garlic, ginger, galangal, chilies, andaliman pepper) until fragrant. Add the pork and sear. Pour in 400ml pig's blood, coconut milk, lemongrass stalks, kaffir lime leaves, and a turmeric leaf. Simmer uncovered for 2-3 hours until the sauce is thick and dark. Season with salt.",
    origin: "North Sumatra, Indonesia",
    cuisine: "Batak",
    category: "Stew",
    latitude: 2.5893,
    longitude: 98.6738,
  },
  {
    name: "Tolma",
    description:
      "Armenia's answer to dolma, tolma wraps spiced lamb and rice in tender grape leaves, but what sets it apart is the generous use of fresh herbs — tarragon, basil, cilantro, and summer savory. Traditionally made in enormous batches for family gatherings, each household has its own recipe. Served warm with a garlic-yogurt sauce, the herbs perfume every bite with a freshness unusual in stuffed-leaf dishes.",
    recipe:
      "Mix ground lamb with rice, finely chopped onion, tomato paste, and generous handfuls of minced tarragon, basil, cilantro, and summer savory. Season with salt, pepper, and a pinch of cinnamon. Wrap tablespoons of filling in blanched grape leaves. Pack tightly in a pot, cover with beef broth, weigh down with a plate, and simmer for 50 minutes. Serve with yogurt mixed with crushed garlic.",
    origin: "Yerevan, Armenia",
    cuisine: "Armenian",
    category: "Appetizer",
    latitude: 40.1872,
    longitude: 44.5152,
  },
  {
    name: "Lanzhou Beef Noodles",
    description:
      "The art of Lanzhou hand-pulled noodles (la mian) is a spectacle — a single lump of dough is stretched and folded into hundreds of uniform strands in under a minute. The clear beef broth is simmered for hours with bones, star anise, and cardamom. Served with paper-thin radish slices, chili oil, cilantro, and garlic sprouts. Authentic shops in Lanzhou open at 6 AM and close when the broth runs out.",
    recipe:
      "For broth: simmer beef bones with star anise, cardamom, fennel seeds, and dried tangerine peel for 6 hours. Strain and season. For noodles: knead a high-gluten dough with alkaline water, rest for 2 hours, then pull into desired thickness (9 official widths). Cook noodles in boiling water for 30 seconds. Ladle broth over noodles, top with braised beef slices, radish, chili oil, cilantro, and garlic sprouts.",
    origin: "Lanzhou, China",
    cuisine: "Chinese (Northwestern)",
    category: "Noodles",
    latitude: 36.0611,
    longitude: 103.8343,
  },
  {
    name: "Thieboudienne",
    description:
      "Senegal's national dish — a one-pot masterpiece of broken rice cooked in a rich tomato sauce with a whole stuffed fish (usually thiof grouper), cassava, eggplant, cabbage, and bitter tomato. The rice absorbs the complex flavors of the broth, developing a prized crust at the bottom of the pot called xonn. Every cook's version is different, but the communal eating from a shared platter is universal.",
    recipe:
      "Stuff a whole grouper with a paste of parsley, garlic, and Scotch bonnet pepper. Fry the fish until golden, set aside. In the same oil, fry onions, tomato paste, and tamarind. Add water, bring to a boil, then add vegetables (cassava, eggplant, cabbage, carrot, bitter tomato) in stages by cooking time. Remove vegetables, add broken rice to the broth, lay the fish on top, cover and steam until rice is tender.",
    origin: "Saint-Louis, Senegal",
    cuisine: "Senegalese",
    category: "Rice Dish",
    latitude: 16.0179,
    longitude: -16.4896,
  },
  {
    name: "Mansaf",
    description:
      "Jordan's ceremonial national dish, mansaf is lamb cooked in jameed — a fermented dried yogurt reconstituted into a tangy, creamy sauce. Served on a massive platter over flatbread and rice, garnished with pine nuts and almonds. Eating mansaf traditionally means standing around the platter and using only your right hand to form balls of rice and meat. The jameed gives it a distinctive sour-savory flavor found nowhere else.",
    recipe:
      "Dissolve jameed (dried yogurt balls) in warm water, stirring until smooth and creamy. Boil lamb shanks with onion, cardamom, and bay leaves until tender. Combine the lamb with the jameed sauce and simmer for 30 minutes. Lay shrak (thin flatbread) on a large platter, spoon over rice, arrange lamb pieces on top, pour over the jameed sauce, and garnish with toasted almonds and pine nuts.",
    origin: "Amman, Jordan",
    cuisine: "Jordanian",
    category: "Rice Dish",
    latitude: 31.9454,
    longitude: 35.9284,
  },
  {
    name: "Cuy Asado",
    description:
      "Roasted guinea pig has been a staple of Andean cuisine for over 5,000 years. In Cusco, cuy is rubbed with huacatay (black mint) and ají panca paste, then roasted whole in a clay oven or on a spit. The skin turns impossibly crispy while the meat stays tender and gamey-sweet, somewhere between rabbit and dark chicken. Served with potatoes and rocoto pepper sauce at celebrations and Sunday family meals.",
    recipe:
      "Clean and butterfly a whole guinea pig. Rub inside and out with a paste of huacatay, ají panca, garlic, cumin, and salt. Let marinate for 4 hours. Skewer on a wooden spit and roast over hot coals, turning frequently, for about 45 minutes until the skin is golden and crackling. Alternatively, roast in a 200°C oven for 1 hour. Serve with boiled potatoes and salsa de rocoto.",
    origin: "Cusco, Peru",
    cuisine: "Peruvian (Andean)",
    category: "Roast",
    latitude: -13.532,
    longitude: -71.9675,
  },
  {
    name: "Açaí na Tigela",
    description:
      "Before açaí bowls became a global trend, Amazonian communities in Belém were eating açaí as a savory staple — thick, unsweetened purple pulp served alongside fried fish and cassava flour. The modern açaí na tigela (açaí in a bowl) is a frozen, lightly sweetened version topped with granola, banana, and guaraná syrup. In Belém, it's consumed daily, almost like bread, and the best comes from fruit picked that morning.",
    recipe:
      "Blend 400g frozen açaí pulp with a splash of cold water (no banana or juice — keep it pure). The consistency should be thick like soft-serve. Pour into a bowl. Top with sliced banana, granola, and a drizzle of guaraná syrup or honey. In Belém style, sprinkle cassava flour (farinha de tapioca) on top instead of granola.",
    origin: "Belém, Brazil",
    cuisine: "Brazilian",
    category: "Dessert",
    latitude: -1.4558,
    longitude: -48.5024,
  },
  {
    name: "Plov",
    description:
      "Uzbekistan's plov (pilaf) is a one-pot rice dish of near-religious significance — every region, city, and family has their own recipe. The Tashkent version layers rice over a base of caramelized onions, carrots cut in long julienne, tender lamb, and whole heads of garlic buried in the rice. The key is the zirvak (the base) which must cook slowly to develop deep flavor. Traditionally prepared by men in a massive cast-iron kazan over open flame for celebrations.",
    recipe:
      "In a large kazan (or Dutch oven), heat cottonseed oil until smoking. Sear 1kg lamb shoulder chunks until browned. Add 500g julienned carrots and 500g sliced onions, cook until golden. Add cumin, coriander, salt, and barberries. Pour in water to cover, then nestle whole garlic heads into the mixture. Layer 700g soaked basmati rice on top without stirring. Add water to just cover the rice, cover tightly, and cook on low heat for 40 minutes. Flip onto a platter to serve.",
    origin: "Tashkent, Uzbekistan",
    cuisine: "Uzbek",
    category: "Rice Dish",
    latitude: 41.2995,
    longitude: 69.2401,
  },
  {
    name: "Bánh Xèo",
    description:
      "Vietnam's crispy crepe — a turmeric-yellow rice flour batter sizzling in a hot pan, filled with pork, shrimp, bean sprouts, and mung beans. The name literally means 'sizzling cake' from the sound the batter makes hitting the oil. Eaten by wrapping pieces in lettuce and herbs (mint, perilla, basil), then dipping in nước chấm. Southern versions are large and crispy; central Vietnamese versions are smaller and chewier.",
    recipe:
      "Mix rice flour, coconut milk, turmeric, and water into a thin batter. Let rest 1 hour. Heat a well-oiled non-stick pan until very hot. Pour a thin layer of batter, swirl to coat, then immediately add sliced pork belly, shrimp, bean sprouts, and sliced scallions on one half. Cover and cook 3 minutes until the edges are crispy and golden. Fold in half and serve with lettuce leaves, fresh herbs, and nước chấm.",
    origin: "Ho Chi Minh City, Vietnam",
    cuisine: "Vietnamese",
    category: "Street Food",
    latitude: 10.8231,
    longitude: 106.6297,
  },
  {
    name: "Doro Wat",
    description:
      "Ethiopia's most celebratory dish — chicken stew slow-cooked in berbere spice and nit'ir kibbeh (spiced clarified butter) until the sauce turns deep red and velvety. Hard-boiled eggs are added at the end, scoring them so they absorb the sauce. Eaten communally by tearing off pieces of injera (sourdough flatbread) and scooping up the stew. The berbere — a complex blend of chili, fenugreek, cardamom, and dozens of other spices — defines Ethiopian cooking.",
    recipe:
      "Slowly caramelize 6 large diced onions in nit'ir kibbeh (butter simmered with turmeric, cardamom, and fenugreek) for 45 minutes until deep brown. Add 3 tbsp berbere spice and tomato paste, cook 10 minutes. Add chicken pieces (scored to the bone), turn to coat, then add water to barely cover. Simmer 45 minutes. Add peeled hard-boiled eggs, scored with a knife, for the last 15 minutes. Season with salt and a squeeze of lemon.",
    origin: "Addis Ababa, Ethiopia",
    cuisine: "Ethiopian",
    category: "Stew",
    latitude: 8.9806,
    longitude: 38.7578,
  },
  {
    name: "Halo-Halo",
    description:
      "The Philippines' maximalist dessert — a towering glass of shaved ice layered with sweet beans, jellies, coconut strips, jackfruit, purple yam (ube) ice cream, leche flan, and evaporated milk. The name means 'mix-mix' because you stir it all together before eating. Every ingredient adds a different texture — crunchy, chewy, creamy, icy — making each spoonful an adventure. Best eaten on sweltering Manila afternoons.",
    recipe:
      "In a tall glass, layer: sweetened kidney beans, chickpeas, kaong (sugar palm fruit), nata de coco, sweet macapuno coconut strings, jackfruit strips, and pinipig (puffed rice). Pack with shaved ice. Top with a scoop of ube ice cream and a slice of leche flan. Pour evaporated milk over the top. Serve with a long spoon. Mix everything together before eating.",
    origin: "Manila, Philippines",
    cuisine: "Filipino",
    category: "Dessert",
    latitude: 14.5995,
    longitude: 120.9842,
  },
  {
    name: "Kokoreç",
    description:
      "Istanbul's iconic street food — seasoned lamb intestines wrapped around a spit of sweetbreads and offal, roasted over charcoal until crackling, then chopped on a hot griddle with tomatoes and peppers before being stuffed into crusty bread. The outside is impossibly crispy, the inside rich and savory. Best eaten at 2 AM outside a meyhane (tavern). The EU tried to ban it; Turkey refused.",
    recipe:
      "Clean lamb intestines thoroughly, then braid them around a horizontal spit loaded with diced lamb sweetbreads, hearts, and lungs seasoned with oregano, cumin, red pepper flakes, and salt. Roast over charcoal, turning constantly, for about 1 hour until the outside is deeply crispy. Remove from the spit and chop on a hot griddle with diced tomatoes, green peppers, and more oregano. Stuff into half a crusty bread roll.",
    origin: "Istanbul, Turkey",
    cuisine: "Turkish",
    category: "Street Food",
    latitude: 41.0082,
    longitude: 28.9784,
  },
  {
    name: "Pierogi Ruskie",
    description:
      "Poland's most beloved dumpling — despite the name ('Russian-style'), these are deeply Polish, named after the Ruś region (now Ukraine). The filling is a simple, perfect combination of mashed potatoes, farmer's cheese (twaróg), and fried onions. Boiled then optionally pan-fried in butter until golden, served with sour cream and crispy onions. Every Polish grandmother's recipe is slightly different, and every one of them is correct.",
    recipe:
      "Make dough: mix flour, warm water, egg, salt, and a splash of oil. Knead until smooth, rest 30 minutes. For filling: combine mashed potatoes with crumbled twaróg (farmer's cheese) and fried diced onion. Season with salt and white pepper. Roll dough thin, cut circles, fill each with a tablespoon of filling, fold and seal edges with a fork. Boil in salted water until they float (3-4 minutes). Optionally pan-fry in butter. Serve with sour cream and more fried onions.",
    origin: "Kraków, Poland",
    cuisine: "Polish",
    category: "Dumpling",
    latitude: 50.0647,
    longitude: 19.945,
  },
  {
    name: "Bunny Chow",
    description:
      "Durban's legendary street food — a hollowed-out loaf of white bread filled with spicy curry. Created by the city's Indian community in the 1940s as a portable meal, the bread soaks up the curry from the inside, creating layers of texture from crunchy crust to sauce-saturated center. Traditionally made with mutton or bean curry. Eaten with your hands, tearing off pieces of bread to scoop the curry. The 'bunny' name has nothing to do with rabbits — it likely derives from 'bania,' a merchant caste.",
    recipe:
      "Make a fragrant lamb curry: fry onions, garlic, ginger, then add curry leaves, garam masala, turmeric, cumin, and coriander. Add diced lamb, tomatoes, and potatoes. Simmer until tender (about 1.5 hours). Take an unsliced quarter loaf of white bread, hollow out the center (reserve the bread plug). Fill with hot curry, cap with the bread plug. Serve immediately with sambals (grated carrot and chili).",
    origin: "Durban, South Africa",
    cuisine: "South African",
    category: "Street Food",
    latitude: -29.8587,
    longitude: 31.0218,
  },
  {
    name: "Khao Soi",
    description:
      "Northern Thailand's iconic curry noodle soup — egg noodles in a coconut-curry broth topped with crispy fried noodles, pickled mustard greens, shallots, and lime. The broth is rich with lemongrass, turmeric, and dried chili paste, straddling the line between Thai and Burmese flavors. Chiang Mai's old city is dotted with legendary khao soi shops, each with fiercely loyal regulars. The crispy noodle topping provides a textural contrast that makes this dish unforgettable.",
    recipe:
      "Make curry paste: blend dried red chilies, shallots, garlic, ginger, turmeric, coriander root, and shrimp paste. Fry the paste in oil until fragrant, then add coconut cream and stir until oil separates. Add chicken legs and coat in the paste. Pour in coconut milk and chicken stock, simmer 25 minutes. Cook egg noodles, reserve some for frying until crispy. Serve broth and chicken over noodles, topped with crispy noodles, pickled mustard greens, sliced shallots, and lime wedges.",
    origin: "Chiang Mai, Thailand",
    cuisine: "Thai (Northern)",
    category: "Noodles",
    latitude: 18.7883,
    longitude: 98.9853,
  },
];

// ── Restaurant seeding (Mapbox — kept for Phase 2) ──────────────────────

const CHARLOTTE_BBOX = {
  minLng: -81.06,
  minLat: 35.0,
  maxLng: -80.6,
  maxLat: 35.44,
};

const CATEGORIES = ["restaurant", "bar"];
const GRID_SIZE = 4;

interface MapboxFeature {
  properties: {
    mapbox_id: string;
    name: string;
    full_address?: string;
    coordinates: { longitude: number; latitude: number };
    poi_category?: string[];
  };
}

interface MapboxResponse {
  features: MapboxFeature[];
}

function buildQuadrants() {
  const lngStep =
    (CHARLOTTE_BBOX.maxLng - CHARLOTTE_BBOX.minLng) / GRID_SIZE;
  const latStep =
    (CHARLOTTE_BBOX.maxLat - CHARLOTTE_BBOX.minLat) / GRID_SIZE;

  const quadrants: string[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const minLng = CHARLOTTE_BBOX.minLng + i * lngStep;
      const minLat = CHARLOTTE_BBOX.minLat + j * latStep;
      const maxLng = minLng + lngStep;
      const maxLat = minLat + latStep;
      quadrants.push(`${minLng},${minLat},${maxLng},${maxLat}`);
    }
  }
  return quadrants;
}

async function fetchCategory(
  category: string,
  bbox: string,
  token: string
): Promise<MapboxFeature[]> {
  const url = new URL(
    `https://api.mapbox.com/search/searchbox/v1/category/${category}`
  );
  url.searchParams.set("bbox", bbox);
  url.searchParams.set("limit", "25");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`Failed: ${category} bbox=${bbox} status=${res.status}`);
    return [];
  }
  const data: MapboxResponse = await res.json();
  return data.features ?? [];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedRestaurants() {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.log("Skipping restaurant seeding (no MAPBOX_ACCESS_TOKEN)");
    return;
  }

  const quadrants = buildQuadrants();
  const allFeatures: MapboxFeature[] = [];

  for (const category of CATEGORIES) {
    for (const bbox of quadrants) {
      console.log(`Fetching ${category} in ${bbox}...`);
      const features = await fetchCategory(category, bbox, token);
      allFeatures.push(...features);
      await delay(150);
    }
  }

  const seen = new Set<string>();
  const unique = allFeatures.filter((f) => {
    const id = f.properties.mapbox_id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  console.log(
    `Fetched ${allFeatures.length} total, ${unique.length} unique locations`
  );

  let inserted = 0;
  for (const f of unique) {
    const { mapbox_id, name, full_address, coordinates, poi_category } =
      f.properties;

    await prisma.restaurant.upsert({
      where: { id: mapbox_id },
      update: {
        name,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        address: full_address ?? null,
        category: poi_category?.[0] ?? null,
        syncedAt: new Date(),
      },
      create: {
        id: mapbox_id,
        name,
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        address: full_address ?? null,
        category: poi_category?.[0] ?? null,
      },
    });
    inserted++;
  }

  console.log(`Upserted ${inserted} restaurants/bars into database`);
}

// ── Dish seeding ────────────────────────────────────────────────────────

async function seedDishes() {
  console.log("Seeding dishes...");

  // Check for slug collisions
  const slugs = DISHES.map((d) => slugify(d.name));
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length > 0) {
    console.warn(`WARNING: Slug collisions detected: ${dupes.join(", ")}`);
  }

  for (const dish of DISHES) {
    const slug = slugify(dish.name);
    await prisma.dish.upsert({
      where: { slug },
      update: { ...dish },
      create: { ...dish, slug },
    });
  }

  console.log(`Seeded ${DISHES.length} dishes`);
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  await seedDishes();
  await seedRestaurants();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
