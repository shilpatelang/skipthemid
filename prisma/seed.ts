import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { PrismaClient } from "../src/generated/prisma";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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
  },
  {
  name: "Chislic",
  description: "South Dakota's best-kept secret, bite sized cubes of lamb (or venison, or beef) deep fried or grilled until crusty on the outside and juicy within, seasoned with nothing more than garlic salt and served on toothpicks with a sleeve of saltine crackers. Brought to the Great Plains by German-Russian immigrants in the 1870s, chislic is practically unknown outside the state, yet inside it, you'll find it at every bar, VFW hall, and county fair. South Dakota declared it the official state 'nosh' in 2018, cementing its status as a hyper-regional treasure.",
  origin: "Mitchell, South Dakota, USA",
  cuisine: "Great Plains / German-Russian American",
  category: "Street Food",
  latitude: 43.7095,
  longitude: -98.0298,
  imageUrl: "/dishimage/chislic.jpg",
  },
  {
  name: "Sonker",
  description: "A deep-dish fruit dessert unique to Surry County, North Carolina, and virtually unknown anywhere else. Unlike a cobbler or pie, sonker uses a thin, pourable batter poured over heaps of fruit (sweet potato, strawberry, or peach are the classics), then baked in an oversized dish until bubbly and golden. The real magic is the 'dip,' a warm, pourable milk sauce ladled generously over each serving. The town of Mt. Airy even has a Sonker Trail, a driving tour of the few bakeries and kitchens that still make it. Ask for sonker 50 miles away and you'll get blank stares.",
  origin: "Mt. Airy, North Carolina, USA",
  cuisine: "Appalachian",
  category: "Dessert",
  latitude: 36.4993,
  longitude: -80.6073,
  imageUrl: "/dishimage/sonker.jpg",
  },
  {
  name: "Booyah",
  description: "A thick, communal stew cooked outdoors in massive cast-iron kettles (sometimes 50+ gallons) over wood fires, simmered for two days straight with chicken, beef, oxtails, and whatever vegetables are in season. Whole communities gather to stir the pot in shifts. The name likely derives from the French 'bouillon,' carried over by Belgian and French-Canadian settlers in northeast Wisconsin. Outside the Fox Valley and Door County, almost nobody knows what booyah is. Inside those communities, it anchors church fundraisers, fire department benefits, and fall festivals. No two batches are ever the same.",
  origin: "Green Bay, Wisconsin, USA",
  cuisine: "Upper Midwest / Belgian-American",
  category: "Stew",
  latitude: 44.5133,
  longitude: -88.0133,
  imageUrl: "/dishimage/booyah.jpg",
  },
  {
  name: "Cochinita Pibil",
  description: "Whole pork shoulder marinated overnight in achiote paste and bitter orange juice, wrapped in banana leaves, and slow-roasted in an underground pit (a pib) for 8+ hours until it shreds at the touch. The achiote turns the meat a vivid burnt orange. Served on tortillas with habanero-spiked pickled red onions and a ladle of the rendered cooking juices. It's a Mayan technique that predates the Spanish arrival, originally made with wild boar or deer. In the Yucatán it's Sunday breakfast food; outside the peninsula, even within Mexico, authentic pibil is rare.",
  origin: "Mérida, Yucatán, Mexico",
  cuisine: "Yucatecan / Mayan",
  category: "Roast",
  latitude: 20.9674,
  longitude: -89.6237,
  imageUrl: "/dishimage/cochinita-pibil.jpg",
  },
  {
  name: "Pouding Chômeur",
  description: "Literally 'unemployed man's pudding,' invented by Québécois factory workers during the Great Depression. Simple cake batter is poured into a pan, then hot maple syrup is poured right on top. As it bakes, the batter rises and the syrup sinks, creating a self-saucing dessert with a caramelized, sticky bottom layer and a fluffy cake top. It's on every diner and cabane à sucre menu in Québec but almost completely unknown in anglophone Canada, let alone the rest of the continent. A masterclass in making something extraordinary from almost nothing.",
  origin: "Montréal, Québec, Canada",
  cuisine: "Québécois",
  category: "Dessert",
  latitude: 45.5017,
  longitude: -73.5673,
  imageUrl: "/dishimage/pouding-chomeur.jpg",
  },
  {
  name: "Geoduck Sashimi",
  description: "The geoduck (pronounced 'gooey-duck') is a grotesquely large burrowing clam native to Puget Sound, with a siphon that can extend over a meter long. Pacific Northwest Indigenous peoples have harvested it for millennia. Prepared as sashimi, the siphon is blanched for seconds, ice-shocked, and sliced paper-thin to reveal a translucent, ivory flesh with an ocean-sweet crunch unlike any other shellfish. It's prized in Japanese and Chinese cuisine (most of the Pacific Northwest harvest is exported to Asia), yet largely ignored by American diners. A single geoduck can live over 150 years.",
  origin: "Seattle, Washington, USA",
  cuisine: "Pacific Northwest / Indigenous Coastal",
  category: "Seafood",
  latitude: 47.6062,
  longitude: -122.3321,
  imageUrl: "/dishimage/geoduck-sashimi.jpg",
  },
  {
  name: "Pepperoni Roll",
  description: "A soft, yeasted bread roll with sticks or slices of pepperoni baked inside, invented in 1927 by Giuseppe Argiro at the Country Club Bakery in Fairmont, West Virginia. Designed as a portable, no-refrigeration-needed lunch for coal miners who couldn't carry anything perishable into the deep shafts, the pepperoni's fat renders during baking and soaks into the bread from within. The rolls are eaten at room temperature, exactly as the miners did. West Virginia passed a special exemption from USDA labeling laws just so bakeries could keep selling them. Outside Appalachian West Virginia, they're nearly impossible to find.",
  origin: "Fairmont, West Virginia, USA",
  cuisine: "Appalachian / Italian-American",
  category: "Bread",
  latitude: 39.4851,
  longitude: -80.1428,
  imageUrl: "/dishimage/pepperoni-roll.jpg",
  },
  {
  name: "Ployes",
  description: "Paper-thin buckwheat crepes from the Acadian communities straddling the Maine/New Brunswick border, specifically the St. John River Valley around Madawaska. Made from just buckwheat flour, wheat flour, water, and baking powder, the batter is poured onto a hot griddle and cooked on one side only until the surface is covered in tiny bubbles. Ployes are never flipped. They're used as an edible wrapper for everything: cretons (pork spread), baked beans, chicken stew, or simply rolled up with butter and maple syrup. The Madawaska Acadian Festival crowns a ploye-eating champion every year.",
  origin: "Madawaska, Maine, USA",
  cuisine: "Acadian",
  category: "Bread",
  latitude: 47.3517,
  longitude: -68.3312,
  imageUrl: "/dishimage/ployes.jpg",
  imageCredit: "Photo: Marknj30",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en",
  },
  {
  name: "Horseshoe Sandwich",
  description: "Springfield, Illinois' proudest and most absurd culinary creation: thick-cut toast topped with a choice of meat (usually ham or hamburger patties), blanketed in a rich Welsh rarebit cheese sauce, then buried under a mountain of french fries. The name comes from the shape of the original ham cut (horseshoe) and the fries standing in for nails. Invented in 1928 at the Leland Hotel, it remains a fiercely local obsession. Every restaurant in Springfield has its own version, and residents will argue endlessly about who makes the best cheese sauce. Order one anywhere else in Illinois and you'll get confused looks.",
  origin: "Springfield, Illinois, USA",
  cuisine: "Midwestern American",
  category: "Sandwich",
  latitude: 39.7817,
  longitude: -89.6501,
  imageUrl: "/dishimage/horseshoe-sandwich.jpg",
  },
  {
  name: "Litti Chokha",
  description: "Roasted whole wheat dough balls stuffed with sattu (roasted gram flour) mixed with ajwain, mustard oil, and spices, charred directly over cow dung cakes or wood fire until smoky and crackly. Served smashed open and drenched in ghee alongside chokha, a rustic mash of fire roasted eggplant, tomato, and potato seasoned with raw mustard oil and green chilies. It's the defining food of Bihar and Jharkhand, eaten by everyone from farmers to politicians, yet almost completely unknown outside the Hindi belt. The sattu filling is a powerhouse of protein that sustained laborers and travelers for centuries before protein bars existed.",
  origin: "Patna, Bihar, India",
  cuisine: "Bihari",
  category: "Street Food",
  latitude: 25.6093,
  longitude: 85.1376,
  imageUrl: "/dishimage/litti-chokha.jpg",
  imageCredit: "Photo: Amrita Nityanand Singh",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  {
  name: "Pathar Ka Gosht",
  description: "Thin slices of marinated lamb or goat cooked directly on a scorching hot granite slab, sizzling tableside. The meat is marinated in a paste of raw papaya, ginger, garlic, green chilies, and a squeeze of lime, then slapped onto the heated stone where it sears in seconds. The granite retains heat so evenly that the meat cooks without any oil, developing a smoky char while staying impossibly tender inside. Invented in the royal kitchens of the Nizam of Hyderabad, it was originally a hunting camp technique where flat river stones served as improvised griddles. Today it survives in a handful of Old City restaurants near the Charminar, served with roomali roti so thin you can read a newspaper through it.",
  origin: "Hyderabad, Telangana, India",
  cuisine: "Hyderabadi",
  category: "Grilled Meat",
  latitude: 17.3616,
  longitude: 78.4747,
  imageUrl: "/dishimage/pathar-ka-gosht.jpg",
  imageCredit: "Photo: Shaharbano",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  {
  name: "Kottu Roti",
  description: "Sri Lanka's ultimate late night street food, made by rhythmically chopping leftover godamba roti (a flaky flatbread) on a flat iron griddle with two heavy metal blades, mixing it with shredded vegetables, egg, and a choice of chicken, mutton, or cheese in a spiced curry sauce. The rapid clanging of blades against the griddle creates a percussive symphony that echoes through every street corner after dark, essentially advertising itself. Each kottu stall has its own signature rhythm. The roti shreds absorb the curry sauce while keeping their chew, creating a texture somewhere between fried rice and pasta. Invented in Colombo's street stalls in the 1960s, it was born purely as a way to use up day old roti, and became the island's most iconic comfort food entirely by accident.",
  origin: "Colombo, Sri Lanka",
  cuisine: "Sri Lankan",
  category: "Street Food",
  latitude: 6.9271,
  longitude: 79.8612,
  imageUrl: "/dishimage/kottu-roti.jpg",
  imageCredit: "Photo: Hasindu Pabasara",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  {
  name: "Smoked Pork with Bamboo Shoot",
  description: "A dish that shatters every assumption about what Indian food is. Chunks of pork belly are smoked over wood fires for days until intensely flavored, then slow cooked with fermented bamboo shoot, fiery Raja Mircha (one of the world's hottest chilies), and axone (fermented soybean paste that adds a deep, funky umami). There are no curries, no cream, no familiar spice blends. Naga cuisine sits at the crossroads of Southeast Asian and Tibetan food traditions, completely distinct from anything in the rest of India. This dish is daily fare in Naga households and the centerpiece of community feasts called 'khichui,' yet remains almost entirely unknown even to most Indians. The bamboo shoot's sour tang against the pork's smokiness creates a flavor profile that exists nowhere else on the subcontinent.",
  origin: "Kohima, Nagaland, India",
  cuisine: "Naga",
  category: "Stew",
  latitude: 25.6751,
  longitude: 94.1086,
  imageUrl: "/dishimage/smoked-pork-with_bamboo.jpg",
  imageCredit: "Photo: Satdeep Gill",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  {
  name: "Shorshe Ilish",
  description: "The crown jewel of Bengali cuisine on both sides of the border, this dish pairs Hilsa (ilish), the most revered and expensive fish in South Asia, with a pungent sauce of freshly ground black and yellow mustard seeds, mustard oil, green chilies, and turmeric. The whole preparation is steamed or gently simmered so the Hilsa's famously delicate, oil rich flesh stays intact while absorbing the sharp, nose clearing heat of raw mustard. Hilsa is an anadromous fish that migrates from the Bay of Bengal into river systems during monsoon season, and its arrival triggers near hysteria in Dhaka and Kolkata. Prices skyrocket, smuggling across the India Bangladesh border spikes, and families plan entire meals around a single prized fish. No other ingredient on the subcontinent commands this level of cultural obsession. The bones are many and treacherous, but devotees consider navigating them part of the ritual.",
  origin: "Dhaka, Bangladesh",
  cuisine: "Bengali",
  category: "Seafood",
  latitude: 23.8103,
  longitude: 90.4125,
  imageUrl: "/dishimage/shorshe-ilish.jpg",
  imageCredit: "Photo: রিজওয়ান আহমেদ",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  {
  name: "Goshtaba",
  description: "The grand finale of the Wazwan, Kashmir's legendary 36 course feast served at weddings and celebrations. Goshtaba are enormous, impossibly smooth lamb meatballs pounded by hand for hours using a wooden mallet on a stone slab until the meat becomes a mousse like paste with not a single fiber remaining. The balls are poached gently in a silky yogurt sauce infused with fennel, dry ginger, and Kashmiri saffron. A proper Wazwan requires a team of vaste wazas (master chefs) working through the night, and goshtaba is always served last as the signal that the feast is complete. Guests eat from shared copper plates called traem, four people per plate. If the goshtaba arrives and you can detect any graininess in the meatball, the waza considers it a personal failure. The texture should be so fine it practically dissolves. Outside the Kashmir Valley, almost no one makes it authentically because the pounding technique takes years to master.",
  origin: "Srinagar, Kashmir, India",
  cuisine: "Kashmiri",
  category: "Curry",
  latitude: 34.0837,
  longitude: 74.7973,
  imageUrl: "/dishimage/goshtaba.jpg",
  },
  {
  name: "Sorpotel",
  description: "A fiery, tangy stew of pork meat, liver, and heart simmered in a dark sauce of toddy vinegar, roasted spices, and tamarind that gets better with each passing day. Sorpotel is never eaten the day it's made. It's cooked days before Christmas or a feast and left to mature at room temperature, the vinegar acting as both preservative and flavor catalyst, deepening into something richer and more complex with every reheat. The dish arrived with Portuguese colonizers in the 16th century (from the Portuguese 'sarapatel') but Goan cooks transformed it beyond recognition, adding Kashmiri chilies, cumin, cloves, and the crucial feni vinegar that gives it a punch no European version ever had. At Goan Catholic weddings, sorpotel is served alongside sannas (steamed rice cakes), beef tongue (lingua), and warm pav. The best sorpotel is always on day three.",
  origin: "Panaji, Goa, India",
  cuisine: "Goan",
  category: "Stew",
  latitude: 15.4909,
  longitude: 73.8278,
  imageUrl: "/dishimage/sorpotel.jpg",
  imageCredit: "Photo: Sidhesh Kanodia",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  },
  {
  name: "Ker Sangri",
  description: "A dish that could only exist in the Thar Desert, made entirely from wild plants that survive where almost nothing else grows. Ker are tiny, tart berries from a thorny bush (Capparis decidua) and sangri are long, slender beans from the khejri tree, Rajasthan's sacred 'tree of life.' Both are sun dried and stored for months, then rehydrated and cooked with dried red chilies, dried mango powder (amchur), and mustard oil into a tangy, spicy, intensely concentrated dish. No fresh vegetables, no water to spare, no refrigeration needed. It's survival cuisine perfected over centuries by desert communities where the nearest market could be a two day camel ride away. During the great Rajasthan famines, ker sangri kept entire villages alive. The khejri tree itself is so revered that the Bishnoi community famously gave their lives protecting them from being felled in the 18th century. Outside western Rajasthan, even most Indians have never encountered it.",
  origin: "Jaisalmer, Rajasthan, India",
  cuisine: "Rajasthani (Marwari)",
  category: "Vegetable Dish",
  latitude: 26.9157,
  longitude: 70.9083,
  imageUrl: "/dishimage/ker-sangri.jpg",
  },
  {
  name: "Khar",
  description: "An ancient Assamese dish built around an ingredient found nowhere else in Indian cooking: khar, an alkaline filtrate made by burning the skin of a specific variety of banana (bhim kol) to ash, then filtering water through it. This pale, amber liquid becomes the base of the dish, into which raw papaya, pulses, or fish are simmered with minimal spices. The khar liquid gives the dish a distinctive slippery, almost soapy quality and a deeply earthy, mineral flavor that takes getting used to but becomes addictive. It's always served as the first course of a traditional Assamese meal (an Assamese thali begins with khar and ends with tenga, a sour dish). The banana peel ash acts as a natural antacid, and Assamese communities have used it medicinally for centuries. The technique of creating alkaline cooking agents from plant ash connects it to Mesoamerican nixtamalization and Chinese kansui noodles, yet these traditions developed entirely independently. Outside Assam, even within the rest of Northeast India, khar is virtually unknown.",
  origin: "Guwahati, Assam, India",
  cuisine: "Assamese",
  category: "Appetizer",
  latitude: 26.1445,
  longitude: 91.7362,
  imageUrl: "/dishimage/khar.jpg",
  imageCredit: "Photo: Soyuz Sharma",
  imageLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
  }
];

// ── Filter taxonomy ─────────────────────────────────────────────────────
// Maps each dish name to structured fields used for /dishes browse filters.
// MUST contain an entry for every dish in DISHES — the seed throws otherwise.
//
// Allowed values:
//   continent: africa | asia | europe | north-america | south-america | oceania
//   course:    street-food | main | dessert | appetizer | side | snack
//   dietType:  vegan | vegetarian | non-vegetarian | contains-egg

interface DishTaxonomy {
  continent: string;
  country: string;
  region?: string;
  course: string;
  dietType: string;
}

const TAXONOMY: Record<string, DishTaxonomy> = {
  "Jackfruit & Banana Blossom Skewers": { continent: "asia", country: "india", region: "kerala", course: "street-food", dietType: "vegan" },
  "Ceviche de Conchas Negras": { continent: "south-america", country: "peru", region: "tumbes", course: "appetizer", dietType: "non-vegetarian" },
  "Adjarian Khachapuri": { continent: "asia", country: "georgia", region: "adjara", course: "main", dietType: "contains-egg" },
  "Rendang Padang": { continent: "asia", country: "indonesia", region: "west-sumatra", course: "main", dietType: "non-vegetarian" },
  "Mole Negro": { continent: "north-america", country: "mexico", region: "oaxaca", course: "side", dietType: "vegetarian" },
  "Saksang": { continent: "asia", country: "indonesia", region: "north-sumatra", course: "main", dietType: "non-vegetarian" },
  "Tolma": { continent: "asia", country: "armenia", course: "appetizer", dietType: "non-vegetarian" },
  "Lanzhou Beef Noodles": { continent: "asia", country: "china", region: "gansu", course: "main", dietType: "non-vegetarian" },
  "Thieboudienne": { continent: "africa", country: "senegal", course: "main", dietType: "non-vegetarian" },
  "Mansaf": { continent: "asia", country: "jordan", course: "main", dietType: "non-vegetarian" },
  "Cuy Asado": { continent: "south-america", country: "peru", region: "cusco", course: "main", dietType: "non-vegetarian" },
  "Açaí na Tigela": { continent: "south-america", country: "brazil", region: "para", course: "dessert", dietType: "vegan" },
  "Plov": { continent: "asia", country: "uzbekistan", course: "main", dietType: "non-vegetarian" },
  "Bánh Xèo": { continent: "asia", country: "vietnam", course: "street-food", dietType: "non-vegetarian" },
  "Doro Wat": { continent: "africa", country: "ethiopia", course: "main", dietType: "non-vegetarian" },
  "Halo-Halo": { continent: "asia", country: "philippines", course: "dessert", dietType: "vegetarian" },
  "Kokoreç": { continent: "asia", country: "turkey", course: "street-food", dietType: "non-vegetarian" },
  "Pierogi Ruskie": { continent: "europe", country: "poland", course: "main", dietType: "vegetarian" },
  "Bunny Chow": { continent: "africa", country: "south-africa", region: "kwazulu-natal", course: "street-food", dietType: "non-vegetarian" },
  "Khao Soi": { continent: "asia", country: "thailand", region: "chiang-mai", course: "main", dietType: "non-vegetarian" },
  "Caldillo de Congrio": { continent: "south-america", country: "chile", course: "main", dietType: "non-vegetarian" },
  "Seco de Chivo": { continent: "south-america", country: "ecuador", course: "main", dietType: "non-vegetarian" },
  "Jiggs’ Dinner": { continent: "north-america", country: "canada", region: "newfoundland", course: "main", dietType: "non-vegetarian" },
  "Akutaq": { continent: "north-america", country: "usa", region: "alaska", course: "dessert", dietType: "non-vegetarian" },
  "Piki Bread": { continent: "north-america", country: "usa", region: "arizona", course: "side", dietType: "vegan" },
  "Chislic": { continent: "north-america", country: "usa", region: "south-dakota", course: "snack", dietType: "non-vegetarian" },
  "Sonker": { continent: "north-america", country: "usa", region: "north-carolina", course: "dessert", dietType: "contains-egg" },
  "Booyah": { continent: "north-america", country: "usa", region: "wisconsin", course: "main", dietType: "non-vegetarian" },
  "Cochinita Pibil": { continent: "north-america", country: "mexico", region: "yucatan", course: "main", dietType: "non-vegetarian" },
  "Pouding Chômeur": { continent: "north-america", country: "canada", region: "quebec", course: "dessert", dietType: "contains-egg" },
  "Geoduck Sashimi": { continent: "north-america", country: "usa", region: "washington", course: "appetizer", dietType: "non-vegetarian" },
  "Pepperoni Roll": { continent: "north-america", country: "usa", region: "west-virginia", course: "snack", dietType: "non-vegetarian" },
  "Ployes": { continent: "north-america", country: "usa", region: "maine", course: "side", dietType: "vegan" },
  "Horseshoe Sandwich": { continent: "north-america", country: "usa", region: "illinois", course: "main", dietType: "non-vegetarian" },
  "Litti Chokha": { continent: "asia", country: "india", region: "bihar", course: "street-food", dietType: "vegetarian" },
  "Pathar Ka Gosht": { continent: "asia", country: "india", region: "telangana", course: "main", dietType: "non-vegetarian" },
  "Kottu Roti": { continent: "asia", country: "sri-lanka", course: "street-food", dietType: "non-vegetarian" },
  "Smoked Pork with Bamboo Shoot": { continent: "asia", country: "india", region: "nagaland", course: "main", dietType: "non-vegetarian" },
  "Shorshe Ilish": { continent: "asia", country: "bangladesh", course: "main", dietType: "non-vegetarian" },
  "Goshtaba": { continent: "asia", country: "india", region: "kashmir", course: "main", dietType: "non-vegetarian" },
  "Sorpotel": { continent: "asia", country: "india", region: "goa", course: "main", dietType: "non-vegetarian" },
  "Ker Sangri": { continent: "asia", country: "india", region: "rajasthan", course: "side", dietType: "vegan" },
  "Khar": { continent: "asia", country: "india", region: "assam", course: "side", dietType: "vegetarian" },
};

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
    for (const w of warnings) console.warn(w);
    console.warn("\nProceeding with seeding despite warnings above.\n");
  }

  // Guard: every dish must have a taxonomy entry before we touch the DB
  const missing = DISHES.filter((d) => !TAXONOMY[d.name]).map((d) => d.name);
  if (missing.length > 0) {
    throw new Error(
      `Missing TAXONOMY entries for: ${missing.join(", ")}. Add them to seed.ts.`
    );
  }

  for (const dish of DISHES) {
    const slug = slugify(dish.name);
    const recipe = recipes?.[slug];
    const taxo = TAXONOMY[dish.name];

    await prisma.dish.upsert({
      where: { slug },
      update: {
        ...dish,
        ...taxo,
        ingredients: recipe?.ingredients ?? undefined,
        steps: recipe?.steps ?? undefined,
        prepTime: recipe?.prepTime ?? undefined,
        cookTime: recipe?.cookTime ?? undefined,
        servings: recipe?.servings ?? undefined,
      },
      create: {
        ...dish,
        ...taxo,
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
