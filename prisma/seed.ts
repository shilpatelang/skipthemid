import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { PrismaClient } from "../src/generated/prisma";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createInterface } from "readline";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function bigrams(str: string): Set<string> {
  const s = normalize(str);
  const bg = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i + 2));
  return bg;
}

function diceCoefficient(a: string, b: string): number {
  const bgA = bigrams(a);
  const bgB = bigrams(b);
  if (bgA.size === 0 && bgB.size === 0) return 1;
  if (bgA.size === 0 || bgB.size === 0) return 0;
  let intersection = 0;
  for (const bg of bgA) if (bgB.has(bg)) intersection++;
  return (2 * intersection) / (bgA.size + bgB.size);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function checkDuplicates(dishes: typeof DISHES): string[] {
  const warnings: string[] = [];
  const NAME_THRESHOLD = 0.5;
  const GEO_NAME_THRESHOLD = 0.35;
  const GEO_DISTANCE_KM = 100;

  for (let i = 0; i < dishes.length; i++) {
    for (let j = i + 1; j < dishes.length; j++) {
      const a = dishes[i];
      const b = dishes[j];
      const sim = diceCoefficient(a.name, b.name);

      const sameCuisine = normalize(a.cuisine) === normalize(b.cuisine);
      const sameCategory = normalize(a.category) === normalize(b.category);
      const dist = haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
      const geoClose = dist < GEO_DISTANCE_KM;

      let flagged = false;

      if (sim >= NAME_THRESHOLD) {
        flagged = true;
      } else if (sim >= GEO_NAME_THRESHOLD && geoClose && (sameCuisine || sameCategory)) {
        flagged = true;
      }

      if (flagged) {
        let msg = `⚠ POSSIBLE DUPLICATE:\n  "${a.name}" ↔ "${b.name}" (name similarity: ${Math.round(sim * 100)}%)`;
        const shared: string[] = [];
        if (sameCuisine) shared.push(a.cuisine);
        if (sameCategory) shared.push(a.category);
        if (geoClose) shared.push(`~${Math.round(dist)}km apart`);
        if (shared.length > 0) msg += `\n  Both: ${shared.join(", ")}`;
        warnings.push(msg);
      }
    }
  }
  return warnings;
}

async function confirmContinue(warnings: string[]): Promise<boolean> {
  for (const w of warnings) console.warn(w);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("\nContinue seeding? (y/N) ", (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

// ── Dish seed data ──────────────────────────────────────────────────────

const DISHES = [
  {
    name: "Jackfruit & Banana Blossom Skewers",
    description:
      "A beloved Kerala street food where young jackfruit and banana blossoms are marinated in a fiery blend of Kashmiri chili, turmeric, and coconut oil, then grilled over charcoal until smoky and caramelized. The jackfruit's meaty texture absorbs the spices beautifully, while the banana blossom adds a delicate, slightly bitter contrast. Vendors in Kochi's Fort area serve these with a tangy tamarind-date chutney.",
    origin: "Kerala, India",
    cuisine: "South Indian",
    category: "Street Food",
    latitude: 9.9312,
    longitude: 76.2673,
    imageUrl: "/dishimage/jackfruit-banana-blossom-skewers.jpg",
  },
  {
    name: "Ceviche de Conchas Negras",
    description:
      "A prized delicacy from Peru's northern coast, this ceviche features black clams (conchas negras) harvested from the mangrove swamps of Tumbes. The clams are cured in lime juice with sliced red onions, ají limo peppers, and cilantro. Unlike regular ceviche, the conchas negras have a rich, briny intensity that pairs perfectly with the sharp citrus. Traditionally served in the shell with cancha (toasted corn).",
    origin: "Tumbes, Peru",
    cuisine: "Peruvian",
    category: "Seafood",
    latitude: -3.5669,
    longitude: -80.4515,
    imageUrl: "/dishimage/ceviche-de-conchas-negras.jpg",
  },
  {
    name: "Adjarian Khachapuri",
    description:
      "Georgia's most dramatic cheese bread — a boat-shaped dough cradling molten sulguni and imeruli cheeses, topped with a raw egg and a pat of butter just before serving. The diner tears off the crusty ends and stirs the egg into the bubbling cheese. Originating from the Black Sea region of Adjara, it's a meal in itself and a centerpiece of Georgian hospitality.",
    origin: "Batumi, Georgia",
    cuisine: "Georgian",
    category: "Bread",
    latitude: 41.6168,
    longitude: 41.6367,
    imageUrl: "/dishimage/adjarian-khachapuri.jpg",
  },
  {
    name: "Rendang Padang",
    description:
      "Often called the world's most flavorful curry, rendang is a dry coconut curry from the Minangkabau people of West Sumatra. Beef is slow-cooked for hours in coconut milk with lemongrass, galangal, turmeric leaves, and a complex rempah (spice paste) until the liquid evaporates and the meat turns dark, tender, and intensely concentrated. True rendang is never soupy — it's meant to be shelf-stable, originally created for long journeys.",
    origin: "West Sumatra, Indonesia",
    cuisine: "Indonesian",
    category: "Curry",
    latitude: -0.7399,
    longitude: 100.8,
    imageUrl: "/dishimage/rendang-padang.jpg",
  },
  {
    name: "Mole Negro",
    description:
      "The most complex and revered of Oaxaca's seven moles, mole negro requires over 30 ingredients and days of preparation. Charred chilhuacle negro chilies give it a distinctive near-black color, while chocolate, plantain, and burnt tortillas add depth. It's traditionally served at weddings and Day of the Dead celebrations over turkey, its layers of flavor unfolding with every bite — smoky, bitter, sweet, and earthy all at once.",
    origin: "Oaxaca, Mexico",
    cuisine: "Oaxacan",
    category: "Sauce",
    latitude: 17.0732,
    longitude: -96.7266,
    imageUrl: "/dishimage/mole-negro.jpg",
  },
  {
    name: "Saksang",
    description:
      "A ceremonial dish of the Batak people from North Sumatra, saksang is pork slow-cooked in its own blood with a fragrant mix of andaliman pepper (Sichuan-like), galangal, lemongrass, and kaffir lime leaves. The blood thickens into a rich, dark sauce with an earthy depth. Served at weddings and major celebrations, it's considered the pinnacle of Batak cuisine.",
    origin: "North Sumatra, Indonesia",
    cuisine: "Batak",
    category: "Stew",
    latitude: 2.5893,
    longitude: 98.6738,
    imageUrl: "/dishimage/saksang.jpg",
  },
  {
    name: "Tolma",
    description:
      "Armenia's answer to dolma, tolma wraps spiced lamb and rice in tender grape leaves, but what sets it apart is the generous use of fresh herbs — tarragon, basil, cilantro, and summer savory. Traditionally made in enormous batches for family gatherings, each household has its own recipe. Served warm with a garlic-yogurt sauce, the herbs perfume every bite with a freshness unusual in stuffed-leaf dishes.",
    origin: "Yerevan, Armenia",
    cuisine: "Armenian",
    category: "Appetizer",
    latitude: 40.1872,
    longitude: 44.5152,
    imageUrl: "/dishimage/tolma.jpg",
    imageCredit: "Tiia Monto",
    imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  {
    name: "Lanzhou Beef Noodles",
    description:
      "The art of Lanzhou hand-pulled noodles (la mian) is a spectacle — a single lump of dough is stretched and folded into hundreds of uniform strands in under a minute. The clear beef broth is simmered for hours with bones, star anise, and cardamom. Served with paper-thin radish slices, chili oil, cilantro, and garlic sprouts. Authentic shops in Lanzhou open at 6 AM and close when the broth runs out.",
    origin: "Lanzhou, China",
    cuisine: "Chinese (Northwestern)",
    category: "Noodles",
    latitude: 36.0611,
    longitude: 103.8343,
    imageUrl: "/dishimage/lanzhou-beef-noodles.jpg",
  },
  {
    name: "Thieboudienne",
    description:
      "Senegal's national dish — a one-pot masterpiece of broken rice cooked in a rich tomato sauce with a whole stuffed fish (usually thiof grouper), cassava, eggplant, cabbage, and bitter tomato. The rice absorbs the complex flavors of the broth, developing a prized crust at the bottom of the pot called xonn. Every cook's version is different, but the communal eating from a shared platter is universal.",
    origin: "Saint-Louis, Senegal",
    cuisine: "Senegalese",
    category: "Rice Dish",
    latitude: 16.0179,
    longitude: -16.4896,
    imageUrl: "/dishimage/thieboudienne.jpg",
  },
  {
    name: "Mansaf",
    description:
      "Jordan's ceremonial national dish, mansaf is lamb cooked in jameed — a fermented dried yogurt reconstituted into a tangy, creamy sauce. Served on a massive platter over flatbread and rice, garnished with pine nuts and almonds. Eating mansaf traditionally means standing around the platter and using only your right hand to form balls of rice and meat. The jameed gives it a distinctive sour-savory flavor found nowhere else.",
    origin: "Amman, Jordan",
    cuisine: "Jordanian",
    category: "Rice Dish",
    latitude: 31.9454,
    longitude: 35.9284,
    imageUrl: "/dishimage/mansaf.jpg",
    imageCredit: "Photo by Ben Meyer",
    imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en" 
  },
  {
    name: "Cuy Asado",
    description:
      "Roasted guinea pig has been a staple of Andean cuisine for over 5,000 years. In Cusco, cuy is rubbed with huacatay (black mint) and ají panca paste, then roasted whole in a clay oven or on a spit. The skin turns impossibly crispy while the meat stays tender and gamey-sweet, somewhere between rabbit and dark chicken. Served with potatoes and rocoto pepper sauce at celebrations and Sunday family meals.",
    origin: "Cusco, Peru",
    cuisine: "Peruvian (Andean)",
    category: "Roast",
    latitude: -13.532,
    longitude: -71.9675,
    imageUrl: "/dishimage/cuy-asado.jpg",
    imageCredit: "Photo by Pedro M. Martínez Corada",
    imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  {
    name: "Açaí na Tigela",
    description:
      "Before açaí bowls became a global trend, Amazonian communities in Belém were eating açaí as a savory staple — thick, unsweetened purple pulp served alongside fried fish and cassava flour. The modern açaí na tigela (açaí in a bowl) is a frozen, lightly sweetened version topped with granola, banana, and guaraná syrup. In Belém, it's consumed daily, almost like bread, and the best comes from fruit picked that morning.",
    origin: "Belém, Brazil",
    cuisine: "Brazilian",
    category: "Dessert",
    latitude: -1.4558,
    longitude: -48.5024,
    imageUrl: "/dishimage/acai-na-tigela.jpg",
  },
  {
    name: "Plov",
    description:
      "Uzbekistan's plov (pilaf) is a one-pot rice dish of near-religious significance — every region, city, and family has their own recipe. The Tashkent version layers rice over a base of caramelized onions, carrots cut in long julienne, tender lamb, and whole heads of garlic buried in the rice. The key is the zirvak (the base) which must cook slowly to develop deep flavor. Traditionally prepared by men in a massive cast-iron kazan over open flame for celebrations.",
    origin: "Tashkent, Uzbekistan",
    cuisine: "Uzbek",
    category: "Rice Dish",
    latitude: 41.2995,
    longitude: 69.2401,
    imageUrl: "/dishimage/plov.jpg",
  },
  {
    name: "Bánh Xèo",
    description:
      "Vietnam's crispy crepe — a turmeric-yellow rice flour batter sizzling in a hot pan, filled with pork, shrimp, bean sprouts, and mung beans. The name literally means 'sizzling cake' from the sound the batter makes hitting the oil. Eaten by wrapping pieces in lettuce and herbs (mint, perilla, basil), then dipping in nước chấm. Southern versions are large and crispy; central Vietnamese versions are smaller and chewier.",
    origin: "Ho Chi Minh City, Vietnam",
    cuisine: "Vietnamese",
    category: "Street Food",
    latitude: 10.8231,
    longitude: 106.6297,
    imageUrl: "/dishimage/banh-xeo.jpg",
  },
  {
    name: "Doro Wat",
    description:
      "Ethiopia's most celebratory dish — chicken stew slow-cooked in berbere spice and nit'ir kibbeh (spiced clarified butter) until the sauce turns deep red and velvety. Hard-boiled eggs are added at the end, scoring them so they absorb the sauce. Eaten communally by tearing off pieces of injera (sourdough flatbread) and scooping up the stew. The berbere — a complex blend of chili, fenugreek, cardamom, and dozens of other spices — defines Ethiopian cooking.",
    origin: "Addis Ababa, Ethiopia",
    cuisine: "Ethiopian",
    category: "Stew",
    latitude: 8.9806,
    longitude: 38.7578,
    imageUrl: "/dishimage/Doro-Wat-banner-1.jpg",
  },
  {
    name: "Halo-Halo",
    description:
      "The Philippines' maximalist dessert — a towering glass of shaved ice layered with sweet beans, jellies, coconut strips, jackfruit, purple yam (ube) ice cream, leche flan, and evaporated milk. The name means 'mix-mix' because you stir it all together before eating. Every ingredient adds a different texture — crunchy, chewy, creamy, icy — making each spoonful an adventure. Best eaten on sweltering Manila afternoons.",
    origin: "Manila, Philippines",
    cuisine: "Filipino",
    category: "Dessert",
    latitude: 14.5995,
    longitude: 120.9842,
    imageUrl: "/dishimage/halo-halo.jpg",
  },
  {
    name: "Kokoreç",
    description:
      "Istanbul's iconic street food — seasoned lamb intestines wrapped around a spit of sweetbreads and offal, roasted over charcoal until crackling, then chopped on a hot griddle with tomatoes and peppers before being stuffed into crusty bread. The outside is impossibly crispy, the inside rich and savory. Best eaten at 2 AM outside a meyhane (tavern). The EU tried to ban it; Turkey refused.",
    origin: "Istanbul, Turkey",
    cuisine: "Turkish",
    category: "Street Food",
    latitude: 41.0082,
    longitude: 28.9784,
    imageUrl: "/dishimage/kokorec.jpg",
  },
  {
    name: "Pierogi Ruskie",
    description:
      "Poland's most beloved dumpling — despite the name ('Russian-style'), these are deeply Polish, named after the Ruś region (now Ukraine). The filling is a simple, perfect combination of mashed potatoes, farmer's cheese (twaróg), and fried onions. Boiled then optionally pan-fried in butter until golden, served with sour cream and crispy onions. Every Polish grandmother's recipe is slightly different, and every one of them is correct.",
    origin: "Kraków, Poland",
    cuisine: "Polish",
    category: "Dumpling",
    latitude: 50.0647,
    longitude: 19.945,
    imageUrl: "/dishimage/pierogi-ruskie.jpg",
  },
  {
    name: "Bunny Chow",
    description:
      "Durban's legendary street food — a hollowed-out loaf of white bread filled with spicy curry. Created by the city's Indian community in the 1940s as a portable meal, the bread soaks up the curry from the inside, creating layers of texture from crunchy crust to sauce-saturated center. Traditionally made with mutton or bean curry. Eaten with your hands, tearing off pieces of bread to scoop the curry. The 'bunny' name has nothing to do with rabbits — it likely derives from 'bania,' a merchant caste.",
    origin: "Durban, South Africa",
    cuisine: "South African",
    category: "Street Food",
    latitude: -29.8587,
    longitude: 31.0218,
    imageUrl: "/dishimage/bunny-chow.jpg",
  },
  {
    name: "Khao Soi",
    description:
      "Northern Thailand's iconic curry noodle soup — egg noodles in a coconut-curry broth topped with crispy fried noodles, pickled mustard greens, shallots, and lime. The broth is rich with lemongrass, turmeric, and dried chili paste, straddling the line between Thai and Burmese flavors. Chiang Mai's old city is dotted with legendary khao soi shops, each with fiercely loyal regulars. The crispy noodle topping provides a textural contrast that makes this dish unforgettable.",
    origin: "Chiang Mai, Thailand",
    cuisine: "Thai (Northern)",
    category: "Noodles",
    latitude: 18.7883,
    longitude: 98.9853,
    imageUrl: "/dishimage/khao-soi.jpg",
  },
  {
  name: "Caldillo de Congrio",
  description: "A rich, velvety Chilean fish stew made with Golden or Red Conger eel. The dish is celebrated for its deep oceanic flavors, enhanced by a base of white wine, heavy cream, and aromatic vegetables. It is traditionally served in a paila (clay bowl) to maintain its piping-hot temperature, often garnished with fresh shrimp or mussels.",
  origin: "San Antonio, Chile",
  cuisine: "Chilean",
  category: "Seafood Stew",
  latitude: -33.5833,
  longitude: -71.6167,
  imageUrl: "/dishimage/caldillo-de-congrio.jpg",
  imageCredit: "Photo: Carlos Varela",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en",
  },
  {
  name: "Seco de Chivo",
  description: "A centerpiece of Ecuadorian celebration dining, this slow-cooked goat stew is prized for its complex, tangy sauce. Traditionally braised in Chicha de Jora (fermented corn beer) or tart Naranjilla juice, the meat becomes exceptionally tender while the sauce thickens with a base of achiote, peppers, and cilantro. It is almost always served with 'Arroz Amarillo' (yellow rice) and sweet fried plantains.",
  origin: "Santa Elena, Ecuador",
  cuisine: "Ecuadorian",
  category: "Stew",
  latitude: -2.2262,
  longitude: -80.8587,
  imageUrl: "/dishimage/seco-de-chivo.jpg",
  imageCredit: "By Aaroncato89 - Own work, CC BY-SA 4.0", // CC license alternative to Unsplash
  imageLicenseUrl: "https://commons.wikimedia.org/w/index.php?curid=26943940",
  },
  {
  name: "Jiggs’ Dinner",
  description: "The soul of Newfoundland Sunday gatherings, this 'boiled dinner' is a masterclass in one-pot efficiency. It centers around salt beef (cured in brine) boiled alongside cabbage, potatoes, carrots, and turnip. The defining element is the 'Pease Pudding'—yellow split peas tied in a cotton bag and boiled in the same pot until they reach a buttery, mashable consistency. It is traditionally finished with a drizzle of turkey gravy and a side of pickled beets.",
  origin: "St. John's, Canada",
  cuisine: "Newfoundland",
  category: "Boiled Dinner",
  latitude: 47.5615,
  longitude: -52.7126,
  imageUrl: "/dishimage/jiggs-dinner.jpg",
  imageCredit: "Photo: Alycmy, CC BY-SA 4.0", 
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en",
  },
  {
  name: "Akutaq",
  description: "A profound staple of Indigenous Alaskan culture, Akutaq (meaning 'to mix') is a unique, non-dairy 'ice cream' designed for high-calorie sustenance in Arctic climates. Traditionally, it is made by hand-whipping reindeer fat or seal oil until light and fluffy, then folding in fresh snow and wild tundra berries like cloudberries (aqpik) or lingonberries. The result is a savory-sweet, creamy mousse that represents a deep connection to the land and seasonal harvests.",
  origin: "Bethel, Alaska, USA",
  cuisine: "Yup'ik / Indigenous Alaskan",
  category: "Dessert",
  latitude: 60.7922,
  longitude: -161.7558,
  imageUrl: "/dishimage/akutaq.jpg",
  },
  {
  name: "Piki Bread",
  description: "A ceremonial masterpiece of the Hopi people, Piki is a paper-thin, crisp bread made from finely ground blue corn and culinary juniper ash. The ash not only provides its distinctive smoky-blue hue but also unlocks essential vitamins through nixtamalization. Each sheet is hand-smeared onto a specialized 'Piki stone'—a highly polished sandstone slab heated over a cedar fire—then meticulously rolled while still warm. It has a delicate, popcorn-like flavor and a texture that dissolves instantly on the tongue.",
  origin: "Hopi Reservation, Arizona",
  cuisine: "Hopi / Native American",
  category: "Ceremonial Bread",
  latitude: 35.8753,
  longitude: -110.5110,
  imageUrl: "/dishimage/piki-bread.jpg",
  imageCredit: "Photo: Alan Levine",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en",
  }
];

// ── JSON data loaders ───────────────────────────────────────────────────

interface RecipeData {
  ingredients: { name: string; amount: string; unit: string }[];
  steps: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
}

interface PlaceData {
  name: string;
  address?: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

function loadJson<T>(filename: string): Record<string, T> | null {
  const path = resolve(__dirname, "..", "data", filename);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

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

  const recipes = loadJson<RecipeData>("recipes.json");
  const places = loadJson<PlaceData[]>("places.json");

  if (recipes) console.log(`Loaded recipes for ${Object.keys(recipes).length} dishes`);
  if (places) console.log(`Loaded places for ${Object.keys(places).length} dishes`);

  const slugs = DISHES.map((d) => slugify(d.name));
  const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupes.length > 0) {
    console.warn(`WARNING: Slug collisions detected: ${dupes.join(", ")}`);
  }

  const warnings = checkDuplicates(DISHES);
  if (warnings.length > 0) {
    const proceed = await confirmContinue(warnings);
    if (!proceed) {
      console.log("Aborted. Fix duplicates and re-run.");
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  for (const dish of DISHES) {
    const slug = slugify(dish.name);
    const recipe = recipes?.[slug];

    await prisma.dish.upsert({
      where: { slug },
      update: {
        ...dish,
        ingredients: recipe?.ingredients ?? undefined,
        steps: recipe?.steps ?? undefined,
        prepTime: recipe?.prepTime ?? undefined,
        cookTime: recipe?.cookTime ?? undefined,
        servings: recipe?.servings ?? undefined,
      },
      create: {
        ...dish,
        slug,
        ingredients: recipe?.ingredients ?? undefined,
        steps: recipe?.steps ?? undefined,
        prepTime: recipe?.prepTime ?? undefined,
        cookTime: recipe?.cookTime ?? undefined,
        servings: recipe?.servings ?? undefined,
      },
    });

    // Seed places for this dish
    const dishPlaces = places?.[slug];
    if (dishPlaces && dishPlaces.length > 0) {
      const dbDish = await prisma.dish.findUnique({ where: { slug } });
      if (dbDish) {
        // Clear existing places for this dish, then re-insert
        await prisma.place.deleteMany({ where: { dishId: dbDish.id } });
        for (const place of dishPlaces) {
          await prisma.place.create({
            data: {
              name: place.name,
              address: place.address ?? null,
              city: place.city,
              country: place.country,
              latitude: place.latitude,
              longitude: place.longitude,
              dishId: dbDish.id,
            },
          });
        }
      }
    }
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
