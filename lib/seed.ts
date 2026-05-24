import { Dish } from "./types";

// Helper: YouTube search fallback URL from a dish name.
export function youtubeSearch(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " recipe")}`;
}

// Starter set. Protein values are per-serving estimates (approximate).
// Expand toward ~100 dishes using this same structure.
export const SEED_DISHES: Dish[] = [
  {
    id: "idli", name: "Idli", nameTamil: "இட்லி",
    meals: ["breakfast", "dinner"],
    ingredients: ["2 cups idli rice", "1 cup urad dal", "1 tsp fenugreek seeds", "Salt to taste"],
    steps: [
      "Soak rice and dal separately for 4 to 6 hours.",
      "Grind to a smooth batter, mix, add salt, ferment overnight.",
      "Pour into idli moulds and steam 10 to 12 minutes.",
      "Serve hot with sambar and chutney.",
    ],
    proteinGrams: 6, youtubeUrl: youtubeSearch("Idli"), isCustom: false,
  },
  {
    id: "dosa", name: "Dosa", nameTamil: "தோசை",
    meals: ["breakfast", "dinner"],
    ingredients: ["3 cups dosa rice", "1 cup urad dal", "1 tsp fenugreek seeds", "Salt to taste", "Oil for cooking"],
    steps: [
      "Soak rice and dal 4 to 6 hours, grind to batter, ferment overnight.",
      "Heat a tawa, pour a ladle of batter and spread thin.",
      "Drizzle oil, cook until golden and crisp.",
      "Serve with chutney and sambar.",
    ],
    proteinGrams: 7, youtubeUrl: youtubeSearch("Plain Dosa"), isCustom: false,
  },
  {
    id: "ven-pongal", name: "Ven Pongal", nameTamil: "வெண் பொங்கல்",
    meals: ["breakfast"],
    ingredients: ["1 cup raw rice", "0.5 cup moong dal", "1 tsp pepper", "1 tsp cumin", "Ginger, ghee, cashews, curry leaves"],
    steps: [
      "Dry roast moong dal lightly.",
      "Pressure cook rice and dal together until soft.",
      "Temper pepper, cumin, ginger, cashews and curry leaves in ghee.",
      "Mix into the rice, add salt, serve hot.",
    ],
    proteinGrams: 9, youtubeUrl: youtubeSearch("Ven Pongal"), isCustom: false,
  },
  {
    id: "pesarattu", name: "Pesarattu", nameTamil: "பெசரட்டு",
    meals: ["breakfast", "dinner"],
    ingredients: ["1 cup whole green gram", "1 green chilli", "Small piece ginger", "Salt", "Oil"],
    steps: [
      "Soak green gram 4 hours.",
      "Grind with chilli, ginger and salt to a batter.",
      "Spread thin on a hot tawa, drizzle oil, cook both sides.",
      "Serve with ginger chutney.",
    ],
    proteinGrams: 14, youtubeUrl: youtubeSearch("Pesarattu"), isCustom: false,
  },
  {
    id: "sambar-rice", name: "Sambar Sadam", nameTamil: "சாம்பார் சாதம்",
    meals: ["lunch"],
    ingredients: ["1 cup rice", "0.5 cup toor dal", "Mixed vegetables", "Sambar powder", "Tamarind", "Tempering spices"],
    steps: [
      "Pressure cook rice, dal and vegetables.",
      "Add tamarind extract, sambar powder and salt, simmer.",
      "Temper mustard, curry leaves and red chilli, add in.",
      "Serve hot with ghee and appalam.",
    ],
    proteinGrams: 12, youtubeUrl: youtubeSearch("Sambar Sadam"), isCustom: false,
  },
  {
    id: "curd-rice", name: "Thayir Sadam", nameTamil: "தயிர் சாதம்",
    meals: ["lunch", "dinner"],
    ingredients: ["1.5 cups cooked rice", "1 cup curd", "0.25 cup milk", "Ginger, green chilli", "Mustard, curry leaves"],
    steps: [
      "Mash cooked rice lightly, cool.",
      "Mix in curd, milk and salt.",
      "Temper mustard, chilli, ginger and curry leaves, add in.",
      "Garnish with coriander, serve chilled.",
    ],
    proteinGrams: 9, youtubeUrl: youtubeSearch("Curd Rice"), isCustom: false,
  },
  {
    id: "lemon-rice", name: "Elumichai Sadam", nameTamil: "எலுமிச்சை சாதம்",
    meals: ["lunch"],
    ingredients: ["2 cups cooked rice", "2 lemons", "Peanuts", "Chana dal, urad dal", "Turmeric, curry leaves"],
    steps: [
      "Temper dals, peanuts, chilli and curry leaves with turmeric.",
      "Add to cooked rice with salt.",
      "Squeeze lemon juice, mix gently.",
      "Serve warm.",
    ],
    proteinGrams: 7, youtubeUrl: youtubeSearch("Lemon Rice"), isCustom: false,
  },
  {
    id: "chicken-chettinad", name: "Chettinad Chicken", nameTamil: "செட்டிநாடு கோழி",
    meals: ["lunch", "dinner"],
    ingredients: ["500g chicken", "Onion, tomato", "Chettinad masala", "Coconut", "Curry leaves"],
    steps: [
      "Dry roast and grind the Chettinad spices with coconut.",
      "Saute onions, tomato and chicken.",
      "Add the ground masala and water, cook until done.",
      "Finish with curry leaves, serve with rice or dosa.",
    ],
    proteinGrams: 32, youtubeUrl: youtubeSearch("Chettinad Chicken"), isCustom: false,
  },
  {
    id: "egg-kuzhambu", name: "Muttai Kuzhambu", nameTamil: "முட்டை குழம்பு",
    meals: ["lunch", "dinner"],
    ingredients: ["4 boiled eggs", "Onion, tomato", "Tamarind", "Sambar powder", "Coconut paste"],
    steps: [
      "Saute onion and tomato, add spice powders.",
      "Add tamarind extract and coconut paste, simmer.",
      "Slip in the boiled eggs, cook a few minutes.",
      "Serve with rice.",
    ],
    proteinGrams: 18, youtubeUrl: youtubeSearch("Egg Kuzhambu"), isCustom: false,
  },
];
