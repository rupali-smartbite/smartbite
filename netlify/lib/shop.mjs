// SmartBite Shop catalogue: the one source of truth for products and prices.
// The app reads it through GET /api/shop, and the future payment step must take
// prices from here (never from the browser).
//
// sample: true  -> shown in the shop but cannot be bought ("Sample listing").
// When a brand partner joins, add their real product with sample: false, a real
// brand name, price, stock and photo, and it becomes buyable.
//
// img: N -> photo stored in the app's asset store as meal-N (see /api/asset).
// per100: typical nutrition per 100 g or 100 ml.

export const SHOP_CATS = ['Snacks', 'Millets', 'Spreads', 'Sweet bites', 'Drinks'];

export const SHOP = [
  { id: 'makhana-peri', name: 'Roasted Makhana, Peri Peri', brand: 'Sample brand', cat: 'Snacks', size: '80 g', price: 149, mrp: 179, img: 200, verdict: 'Good',
    highlights: ['Roasted, not fried', 'Light and crunchy', 'No palm oil'], per100: { kcal: 380, protein: 9.5, sugar: 1.5, fat: 9, sodium: 520 }, sample: true },
  { id: 'ragi-chips', name: 'Ragi Millet Chips', brand: 'Sample brand', cat: 'Millets', size: '60 g', price: 99, mrp: 120, img: 201, verdict: 'Okay in moderation',
    highlights: ['Made with finger millet', 'Baked', 'Good source of calcium'], per100: { kcal: 450, protein: 8, sugar: 2, fat: 16, sodium: 640 }, sample: true },
  { id: 'jowar-puffs', name: 'Jowar Puffs, Tangy Tomato', brand: 'Sample brand', cat: 'Millets', size: '70 g', price: 89, mrp: 99, img: 202, verdict: 'Okay in moderation',
    highlights: ['Sorghum millet', 'Puffed, not fried', 'Kids tiffin size'], per100: { kcal: 410, protein: 9, sugar: 4, fat: 10, sodium: 600 }, sample: true },
  { id: 'chana-masala', name: 'Roasted Chana, Masala', brand: 'Sample brand', cat: 'Snacks', size: '200 g', price: 119, mrp: 140, img: 203, verdict: 'Good',
    highlights: ['High protein', 'High fibre', 'Only roasted gram and spices'], per100: { kcal: 370, protein: 20, sugar: 2, fat: 6, sodium: 420 }, sample: true },
  { id: 'date-bites', name: 'Date and Nut Energy Bites', brand: 'Sample brand', cat: 'Sweet bites', size: '12 pieces', price: 249, mrp: 299, img: 204, verdict: 'Okay in moderation',
    highlights: ['Sweetened only with dates', 'No refined sugar', 'Almonds and cashews'], per100: { kcal: 400, protein: 8, sugar: 45, fat: 15, sodium: 10 }, sample: true },
  { id: 'peanut-butter', name: 'Natural Peanut Butter, Unsweetened', brand: 'Sample brand', cat: 'Spreads', size: '350 g', price: 299, mrp: 349, img: 205, verdict: 'Good',
    highlights: ['100% roasted peanuts', 'No added sugar or oil', 'High protein'], per100: { kcal: 610, protein: 27, sugar: 4, fat: 50, sodium: 10 }, sample: true },
  { id: 'multigrain-cookies', name: 'Multigrain Cookies, No Maida', brand: 'Sample brand', cat: 'Sweet bites', size: '150 g', price: 159, mrp: 180, img: 206, verdict: 'Okay in moderation',
    highlights: ['Whole wheat, oats and ragi', 'Jaggery sweetened', 'No maida'], per100: { kcal: 470, protein: 8, sugar: 18, fat: 19, sodium: 280 }, sample: true },
  { id: 'kokum-drink', name: 'Kokum Cooler, No Added Sugar', brand: 'Sample brand', cat: 'Drinks', size: '250 ml', price: 60, mrp: 70, img: 207, verdict: 'Good',
    highlights: ['Real kokum', 'No added sugar', 'Cooling summer drink'], per100: { kcal: 12, protein: 0, sugar: 2.5, fat: 0, sodium: 40 }, sample: true },
  { id: 'trail-mix', name: 'Trail Mix, Nuts and Seeds', brand: 'Sample brand', cat: 'Snacks', size: '150 g', price: 229, mrp: 260, img: 208, verdict: 'Good',
    highlights: ['Almonds, pumpkin and sunflower seeds', 'No added salt', 'Healthy fats'], per100: { kcal: 560, protein: 18, sugar: 12, fat: 42, sodium: 15 }, sample: true },
];
