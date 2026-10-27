// SmartBite Pro — built-in product database (per 100 g, or per 100 ml for drinks).
// "approx: true" means typical values — verify with the pack.
// Exact values sourced from Open Food Facts India / Balaji website where noted.

import { INDIA } from './india-db.js';

const P = (o) => ({ veg: true, allergens: [], approx: true, barcode: '', packG: 50, drink: false, ...o });

export const PRODUCTS = [
  // ---------- Lay's (real ingredient lists shared by the team) ----------
  P({ id: 'lays-classic-salted', brand: "Lay's", name: 'Classic Salted', cat: 'Chips', barcode: '8901491101837', packG: 50, approx: false,
      src: 'Open Food Facts (India pack)',
      n: { kcal: 554, fat: 35.5, sat: 14, carbs: 51.7, sugar: 2.6, fibre: 0, protein: 7, sodium: 204 },
      ing: ['Potato', 'Edible vegetable oil', 'Salt'] }),
  P({ id: 'lays-magic-masala', brand: "Lay's", name: "India's Magic Masala", cat: 'Chips', barcode: '8901491000789', packG: 50, approx: true,
      src: 'Open Food Facts (fat, sat fat, sodium); other values approx',
      n: { kcal: 536, fat: 33.1, sat: 12.5, carbs: 52, sugar: 3, fibre: 2, protein: 6.5, sodium: 993 },
      ing: ['Potato', 'Edible vegetable oil', 'Spices and condiments', 'Iodised salt and black salt', 'Sugar', 'Maltodextrin', 'Tomato powder', 'Acidity regulators', 'Flavouring substances', 'Anticaking agent', 'Permitted colour'] }),
  P({ id: 'lays-spanish-tomato-tango', brand: "Lay's", name: 'Spanish Tomato Tango', cat: 'Chips', packG: 50,
      n: { kcal: 540, fat: 33, sat: 13, carbs: 54, sugar: 4, fibre: 2, protein: 6.5, sodium: 650 },
      ing: ['Potato', 'Edible vegetable oil', 'Sugar', 'Salt', 'Tomato powder', 'Red chilli powder', 'Garlic powder', 'Black pepper powder', 'Clove powder', 'Cinnamon powder', 'Wheat fibre', 'Dextrose'],
      allergens: ['gluten'] }),
  P({ id: 'lays-chile-limon', brand: "Lay's", name: 'Chile Limón', cat: 'Chips', packG: 50,
      n: { kcal: 540, fat: 33, sat: 13, carbs: 54, sugar: 3, fibre: 2, protein: 6.5, sodium: 700 },
      ing: ['Potato', 'Edible vegetable oil', 'Sugar', 'Salt', 'Red chilli powder', 'Garlic powder', 'Onion powder', 'Lime juice powder'] }),
  P({ id: 'lays-cheese-tbc', brand: "Lay's", name: 'Cheese Flavour', cat: 'Chips', packG: 50,
      n: { kcal: 545, fat: 34, sat: 13.5, carbs: 52, sugar: 4, fibre: 2, protein: 7, sodium: 750 },
      ing: ['Potato', 'Edible vegetable oil', 'Sugar', 'Iodised salt', 'Milk solids', 'Spices and condiments', 'Maltodextrin', 'Cheese powder', 'Hydrolysed vegetable protein', 'Flavouring substances', 'Flavour enhancers (627, 631)'],
      allergens: ['milk'] }),
  P({ id: 'lays-cream-onion', brand: "Lay's", name: 'American Style Cream & Onion', cat: 'Chips', packG: 50,
      n: { kcal: 545, fat: 33, sat: 13, carbs: 53, sugar: 4, fibre: 2, protein: 7, sodium: 700 },
      ing: ['Potato', 'Edible vegetable oil', 'Sugar', 'Salt', 'Milk solids', 'Onion powder', 'Maltodextrin', 'Spices and condiments', 'Flavouring substances', 'Flavour enhancers (627, 631)'],
      allergens: ['milk'] }),

  // ---------- Balaji ----------
  P({ id: 'balaji-crunchem-salted', brand: 'Balaji', name: 'Crunchem Simply Salted Wafers', cat: 'Chips', packG: 40, approx: false,
      src: 'balajiwafers.com',
      n: { kcal: 554, fat: 32.9, sat: 15.7, carbs: 53.4, sugar: 0.8, fibre: 7.2, protein: 7.7, sodium: 385 },
      ing: ['Potato (89%)', 'Edible vegetable oil (Palmolein)', 'Edible common salt (0.4%)'] }),
  P({ id: 'balaji-masala-masti', brand: 'Balaji', name: 'Masala Masti Wafers', cat: 'Chips', barcode: '8906010500030', packG: 30,
      n: { kcal: 539, fat: 33, sat: 15, carbs: 53, sugar: 2, fibre: 3, protein: 6.5, sodium: 700 },
      ing: ['Potato', 'Edible vegetable oil (Palmolein)', 'Spices and condiments', 'Salt', 'Sugar', 'Black salt', 'Acidity regulator', 'Flavouring substances'] }),
  P({ id: 'balaji-peri-peri', brand: 'Balaji', name: 'Peri Peri Wafers', cat: 'Chips', packG: 40,
      n: { kcal: 537, fat: 32.1, sat: 15, carbs: 55.7, sugar: 3, fibre: 3, protein: 6.4, sodium: 700 },
      ing: ['Potato', 'Edible vegetable oil (Palmolein)', 'Spices and condiments', 'Salt', 'Sugar', 'Acidity regulator', 'Flavouring substances'] }),
  P({ id: 'balaji-chaat-chaska', brand: 'Balaji', name: 'Chaat Chaska Wafers', cat: 'Chips', packG: 40,
      n: { kcal: 545, fat: 32.2, sat: 15, carbs: 53.5, sugar: 3, fibre: 3, protein: 7.4, sodium: 750 },
      ing: ['Potato', 'Edible vegetable oil (Palmolein)', 'Spices and condiments', 'Salt', 'Black salt', 'Sugar', 'Dry mango powder', 'Acidity regulator'] }),
  P({ id: 'balaji-plain-khakhra', brand: 'Balaji', name: 'Plain Khakhra', cat: 'Snacks', packG: 200,
      n: { kcal: 348, fat: 21.5, sat: 9, carbs: 61.3, sugar: 1, fibre: 6, protein: 10.1, sodium: 600 },
      ing: ['Wheat flour', 'Edible vegetable oil', 'Salt', 'Spices'], allergens: ['gluten'] }),

  // ---------- Namkeen & snacks ----------
  P({ id: 'haldiram-aloo-bhujia', brand: "Haldiram's", name: 'Aloo Bhujia', cat: 'Namkeen', packG: 200,
      n: { kcal: 560, fat: 38, sat: 17, carbs: 42, sugar: 2, fibre: 4, protein: 11, sodium: 900 },
      ing: ['Potato', 'Gram flour (besan)', 'Edible vegetable oil', 'Moth bean flour', 'Salt', 'Spices', 'Black salt'] }),
  P({ id: 'bikaji-bhujia', brand: 'Bikaji', name: 'Bikaneri Bhujia', cat: 'Namkeen', packG: 200,
      n: { kcal: 570, fat: 40, sat: 18, carbs: 40, sugar: 2, fibre: 4, protein: 12, sodium: 850 },
      ing: ['Moth bean flour', 'Gram flour', 'Edible vegetable oil', 'Salt', 'Spices and condiments'] }),
  P({ id: 'haldiram-moong-dal', brand: "Haldiram's", name: 'Moong Dal', cat: 'Namkeen', packG: 200,
      n: { kcal: 480, fat: 26, sat: 11, carbs: 40, sugar: 1, fibre: 6, protein: 22, sodium: 500 },
      ing: ['Moong dal', 'Edible vegetable oil', 'Salt'] }),
  P({ id: 'kurkure-masala-munch', brand: 'Kurkure', name: 'Masala Munch', cat: 'Snacks', packG: 75,
      n: { kcal: 550, fat: 33, sat: 15, carbs: 58, sugar: 3, fibre: 2, protein: 6, sodium: 750 },
      ing: ['Rice meal', 'Edible vegetable oil', 'Corn meal', 'Gram meal', 'Spices and condiments', 'Salt', 'Sugar', 'Black salt', 'Acidity regulator (330)', 'Flavour enhancers (627, 631)', 'Anticaking agent (551)'] }),
  P({ id: 'bingo-mad-angles', brand: 'Bingo!', name: 'Mad Angles Achaari Masti', cat: 'Snacks', packG: 72,
      n: { kcal: 510, fat: 26, sat: 12, carbs: 63, sugar: 4, fibre: 3, protein: 7, sodium: 800 },
      ing: ['Wheat flour', 'Edible vegetable oil', 'Corn grits', 'Rice grits', 'Spices and condiments', 'Salt', 'Sugar', 'Acidity regulators (330, 296)', 'Flavour enhancers (627, 631)'], allergens: ['gluten'] }),
  P({ id: 'tata-roasted-chana', brand: 'Tata Sampann', name: 'Roasted Chana', cat: 'Healthy snacks', packG: 200,
      n: { kcal: 370, fat: 6, sat: 1, carbs: 58, sugar: 2, fibre: 15, protein: 20, sodium: 25 },
      ing: ['Bengal gram (chana)'] }),

  // ---------- Biscuits & breakfast ----------
  P({ id: 'parle-g', brand: 'Parle', name: 'Parle-G Glucose Biscuits', cat: 'Biscuits', packG: 80,
      n: { kcal: 454, fat: 13, sat: 6.3, carbs: 77, sugar: 25.5, fibre: 1, protein: 6.7, sodium: 230 },
      ing: ['Wheat flour', 'Sugar', 'Edible vegetable oil (palm)', 'Invert sugar syrup', 'Milk solids', 'Raising agents (503, 500)', 'Salt', 'Emulsifiers'], allergens: ['gluten', 'milk'] }),
  P({ id: 'good-day-cashew', brand: 'Britannia', name: 'Good Day Cashew Cookies', cat: 'Biscuits', packG: 100,
      n: { kcal: 509, fat: 23, sat: 11, carbs: 69, sugar: 25, fibre: 1.5, protein: 7, sodium: 300 },
      ing: ['Wheat flour', 'Sugar', 'Edible vegetable oil', 'Cashew (5%)', 'Butter', 'Milk solids', 'Raising agents', 'Salt', 'Emulsifiers', 'Flavouring substances'], allergens: ['gluten', 'milk', 'tree nuts'] }),
  P({ id: 'marie-gold', brand: 'Britannia', name: 'Marie Gold', cat: 'Biscuits', packG: 120,
      n: { kcal: 450, fat: 11, sat: 5.5, carbs: 77, sugar: 21, fibre: 2, protein: 8, sodium: 370 },
      ing: ['Wheat flour', 'Sugar', 'Edible vegetable oil', 'Invert syrup', 'Milk solids', 'Raising agents', 'Salt', 'Emulsifiers'], allergens: ['gluten', 'milk'] }),
  P({ id: 'kelloggs-chocos', brand: "Kellogg's", name: 'Chocos', cat: 'Breakfast', packG: 375,
      n: { kcal: 387, fat: 2.5, sat: 1, carbs: 82, sugar: 26, fibre: 5, protein: 9, sodium: 300 },
      ing: ['Whole wheat flour', 'Sugar', 'Cocoa solids', 'Maize grits', 'Salt', 'Vitamins and minerals', 'Flavouring substances'], allergens: ['gluten'] }),
  P({ id: 'saffola-oats', brand: 'Saffola', name: 'Classic Masala Oats', cat: 'Breakfast', packG: 40,
      n: { kcal: 385, fat: 8, sat: 1.4, carbs: 66, sugar: 4, fibre: 10, protein: 12, sodium: 1050 },
      ing: ['Rolled oats', 'Dehydrated vegetables', 'Spices', 'Salt', 'Sugar', 'Edible vegetable oil', 'Flavour enhancer (627, 631)'] }),

  // ---------- Noodles ----------
  P({ id: 'maggi-masala', brand: 'Maggi', name: '2-Minute Masala Noodles', cat: 'Instant food', packG: 70,
      n: { kcal: 427, fat: 15.7, sat: 7.5, carbs: 60, sugar: 2, fibre: 2, protein: 8.5, sodium: 1100 },
      ing: ['Refined wheat flour (maida)', 'Palm oil', 'Salt', 'Wheat gluten', 'Thickeners (508, 412)', 'Acidity regulators (501, 500)', 'Masala tastemaker (spices, salt, sugar, onion, garlic, flavour enhancer 635)'], allergens: ['gluten'] }),
  P({ id: 'yippee-magic-masala', brand: 'Sunfeast YiPPee!', name: 'Magic Masala Noodles', cat: 'Instant food', packG: 70,
      n: { kcal: 450, fat: 18, sat: 8, carbs: 63, sugar: 2, fibre: 2, protein: 8, sodium: 1000 },
      ing: ['Refined wheat flour (maida)', 'Edible vegetable oil', 'Salt', 'Thickener (412)', 'Acidity regulator', 'Tastemaker (spices, salt, sugar, flavour enhancer 627, 631)'], allergens: ['gluten'] }),

  // ---------- Dairy ----------
  P({ id: 'amul-butter', brand: 'Amul', name: 'Pasteurised Butter', cat: 'Dairy', packG: 100,
      n: { kcal: 722, fat: 80, sat: 51, carbs: 0, sugar: 0, fibre: 0, protein: 0.5, sodium: 650 },
      ing: ['Milk fat', 'Common salt', 'Permitted natural colour (annatto)'], allergens: ['milk'] }),
  P({ id: 'amul-kool', brand: 'Amul', name: 'Kool Kesar Milk', cat: 'Drinks', drink: true, packG: 180,
      n: { kcal: 85, fat: 2.5, sat: 1.6, carbs: 13, sugar: 12, fibre: 0, protein: 3, sodium: 50 },
      ing: ['Toned milk', 'Sugar', 'Saffron', 'Cardamom', 'Stabilizer', 'Permitted colour'], allergens: ['milk'] }),
  P({ id: 'mother-dairy-dahi', brand: 'Mother Dairy', name: 'Classic Dahi', cat: 'Dairy', packG: 400,
      n: { kcal: 67, fat: 3.1, sat: 2, carbs: 4.7, sugar: 4.7, fibre: 0, protein: 3.4, sodium: 50 },
      ing: ['Pasteurised toned milk', 'Active cultures'], allergens: ['milk'] }),
  P({ id: 'amul-taaza', brand: 'Amul', name: 'Taaza Toned Milk', cat: 'Dairy', drink: true, packG: 500,
      n: { kcal: 58, fat: 3, sat: 1.9, carbs: 4.7, sugar: 4.7, fibre: 0, protein: 3, sodium: 45 },
      ing: ['Toned milk'], allergens: ['milk'] }),

  // ---------- Drinks ----------
  P({ id: 'frooti', brand: 'Parle Agro', name: 'Frooti Mango Drink', cat: 'Drinks', drink: true, packG: 200,
      n: { kcal: 65, fat: 0, sat: 0, carbs: 16, sugar: 15.6, fibre: 0, protein: 0, sodium: 20 },
      ing: ['Water', 'Mango pulp (19.5%)', 'Sugar', 'Acidity regulator (330)', 'Antioxidant (300)', 'Flavouring substances'] }),
  P({ id: 'maaza', brand: 'Maaza', name: 'Mango Drink', cat: 'Drinks', drink: true, packG: 250,
      n: { kcal: 64, fat: 0, sat: 0, carbs: 16, sugar: 15.6, fibre: 0, protein: 0, sodium: 25 },
      ing: ['Water', 'Mango pulp', 'Sugar', 'Acidity regulator (330)', 'Antioxidant (300)', 'Preservative (211)', 'Flavouring substances'] }),
  P({ id: 'real-mixed-fruit', brand: 'Real', name: 'Mixed Fruit Juice', cat: 'Drinks', drink: true, packG: 1000,
      n: { kcal: 56, fat: 0, sat: 0, carbs: 14, sugar: 13, fibre: 0, protein: 0.3, sodium: 15 },
      ing: ['Water', 'Mixed fruit concentrates and pulps', 'Sugar', 'Acidity regulator (330)', 'Antioxidant (300)'] }),
  P({ id: 'paper-boat-aam-panna', brand: 'Paper Boat', name: 'Aam Panna', cat: 'Drinks', drink: true, packG: 200,
      n: { kcal: 50, fat: 0, sat: 0, carbs: 12.5, sugar: 12, fibre: 0, protein: 0, sodium: 180 },
      ing: ['Water', 'Raw mango pulp', 'Sugar', 'Black salt', 'Cumin', 'Mint', 'Acidity regulator (330)'] }),
  P({ id: 'thums-up', brand: 'Thums Up', name: 'Thums Up Cola', cat: 'Drinks', drink: true, packG: 300,
      n: { kcal: 42, fat: 0, sat: 0, carbs: 10.5, sugar: 10.5, fibre: 0, protein: 0, sodium: 10 },
      ing: ['Carbonated water', 'Sugar', 'Acidity regulator (338)', 'Caffeine', 'Colour (150d)', 'Flavouring substances'], caffeine: true }),
  P({ id: 'bournvita', brand: 'Cadbury', name: 'Bournvita Health Drink Powder', cat: 'Drinks mix', packG: 500,
      n: { kcal: 387, fat: 1.8, sat: 1, carbs: 86, sugar: 32, fibre: 3, protein: 7, sodium: 250 },
      ing: ['Cereal extract', 'Sugar', 'Cocoa solids', 'Milk solids', 'Liquid glucose', 'Vitamins and minerals', 'Emulsifier', 'Colour (150c)', 'Flavouring substances'], allergens: ['gluten', 'milk'] }),
  P({ id: 'horlicks-classic', brand: 'Horlicks', name: 'Classic Malt', cat: 'Drinks mix', packG: 500,
      n: { kcal: 377, fat: 2, sat: 1, carbs: 79, sugar: 15, fibre: 2, protein: 11, sodium: 280 },
      ing: ['Malted barley', 'Wheat flour', 'Milk solids', 'Sugar', 'Minerals', 'Vitamins', 'Salt'], allergens: ['gluten', 'milk'] }),

  // ---------- Sweets & sauces ----------
  P({ id: 'dairy-milk', brand: 'Cadbury', name: 'Dairy Milk', cat: 'Chocolate', packG: 50,
      n: { kcal: 534, fat: 30, sat: 18, carbs: 57, sugar: 56, fibre: 1, protein: 7.7, sodium: 100 },
      ing: ['Sugar', 'Milk solids', 'Cocoa butter', 'Cocoa solids', 'Emulsifiers (442, 476)', 'Flavouring substances'], allergens: ['milk', 'soy'] }),
  P({ id: 'amul-dark-55', brand: 'Amul', name: 'Dark Chocolate 55%', cat: 'Chocolate', packG: 150,
      n: { kcal: 560, fat: 37, sat: 22, carbs: 48, sugar: 40, fibre: 7, protein: 7, sodium: 20 },
      ing: ['Cocoa solids', 'Sugar', 'Cocoa butter', 'Emulsifier (322)', 'Vanilla flavour'], allergens: ['soy'] }),
  P({ id: 'kissan-ketchup', brand: 'Kissan', name: 'Fresh Tomato Ketchup', cat: 'Sauces', packG: 500,
      n: { kcal: 125, fat: 0.1, sat: 0, carbs: 30, sugar: 28, fibre: 1, protein: 1.3, sodium: 900 },
      ing: ['Tomato paste', 'Sugar', 'Water', 'Salt', 'Acidity regulator (260)', 'Thickener (1422)', 'Preservative (211)', 'Spices'] }),
  // ---------- More Indian brands, verified Indian pack values (see india-db.js) ----------
  ...INDIA,
];

// ---------- Fresh / cooked reference (per serving) ----------
export const FRESH = [
  { name: 'Roti / chapati', serv: '1 piece (40 g)', kcal: 120, protein: 3, carbs: 18, fat: 3.5, sugar: 0, sodium: 120 },
  { name: 'Phulka', serv: '1 piece (30 g)', kcal: 70, protein: 2.5, carbs: 15, fat: 0.4, sugar: 0, sodium: 80 },
  { name: 'Plain paratha', serv: '1 piece (70 g)', kcal: 220, protein: 4.5, carbs: 28, fat: 9, sugar: 0, sodium: 200 },
  { name: 'Steamed rice', serv: '1 katori (150 g)', kcal: 195, protein: 4, carbs: 43, fat: 0.4, sugar: 0, sodium: 5 },
  { name: 'Jeera rice', serv: '1 katori (150 g)', kcal: 240, protein: 4, carbs: 42, fat: 6, sugar: 0, sodium: 250 },
  { name: 'Dal tadka', serv: '1 katori (150 g)', kcal: 180, protein: 9, carbs: 22, fat: 6, sugar: 1, sodium: 400 },
  { name: 'Rajma', serv: '1 katori (150 g)', kcal: 210, protein: 10, carbs: 28, fat: 6, sugar: 2, sodium: 450 },
  { name: 'Chole', serv: '1 katori (150 g)', kcal: 240, protein: 10, carbs: 30, fat: 9, sugar: 3, sodium: 480 },
  { name: 'Paneer butter masala', serv: '1 katori (150 g)', kcal: 350, protein: 13, carbs: 12, fat: 26, sugar: 6, sodium: 600 },
  { name: 'Palak paneer', serv: '1 katori (150 g)', kcal: 250, protein: 12, carbs: 9, fat: 18, sugar: 2, sodium: 450 },
  { name: 'Aloo sabzi', serv: '1 katori (150 g)', kcal: 180, protein: 3, carbs: 24, fat: 8, sugar: 2, sodium: 380 },
  { name: 'Bhindi sabzi', serv: '1 katori (120 g)', kcal: 140, protein: 3, carbs: 12, fat: 9, sugar: 3, sodium: 300 },
  { name: 'Curd / dahi', serv: '1 katori (100 g)', kcal: 60, protein: 3.4, carbs: 4.7, fat: 3, sugar: 4.7, sodium: 50 },
  { name: 'Raita', serv: '1 katori (100 g)', kcal: 90, protein: 3.5, carbs: 6, fat: 5, sugar: 4, sodium: 250 },
  { name: 'Papad (roasted)', serv: '1 piece', kcal: 35, protein: 2, carbs: 6, fat: 0.3, sugar: 0, sodium: 300 },
  { name: 'Papad (fried)', serv: '1 piece', kcal: 80, protein: 2, carbs: 6, fat: 5, sugar: 0, sodium: 300 },
  { name: 'Pickle (achar)', serv: '1 tbsp (15 g)', kcal: 35, protein: 0.2, carbs: 1, fat: 3.5, sugar: 0.5, sodium: 400 },
  { name: 'Gulab jamun', serv: '1 piece', kcal: 150, protein: 2, carbs: 24, fat: 6, sugar: 20, sodium: 30 },
  { name: 'Poha', serv: '1 plate (150 g)', kcal: 250, protein: 5, carbs: 40, fat: 8, sugar: 3, sodium: 400 },
  { name: 'Upma', serv: '1 plate (150 g)', kcal: 250, protein: 6, carbs: 35, fat: 9, sugar: 2, sodium: 450 },
  { name: 'Idli', serv: '2 pieces', kcal: 130, protein: 4, carbs: 26, fat: 0.5, sugar: 0, sodium: 250 },
  { name: 'Plain dosa', serv: '1 piece', kcal: 170, protein: 4, carbs: 28, fat: 5, sugar: 0, sodium: 300 },
  { name: 'Sambar', serv: '1 katori (150 g)', kcal: 130, protein: 6, carbs: 18, fat: 4, sugar: 3, sodium: 500 },
  { name: 'Vada pav', serv: '1 piece', kcal: 300, protein: 6, carbs: 40, fat: 13, sugar: 3, sodium: 600 },
  { name: 'Pav bhaji', serv: '1 plate', kcal: 450, protein: 10, carbs: 60, fat: 19, sugar: 8, sodium: 1100 },
  { name: 'Samosa', serv: '1 piece', kcal: 260, protein: 4, carbs: 28, fat: 15, sugar: 1, sodium: 350 },
  { name: 'Banana', serv: '1 medium', kcal: 105, protein: 1.3, carbs: 27, fat: 0.4, sugar: 14, sodium: 1 },
  { name: 'Apple', serv: '1 medium', kcal: 95, protein: 0.5, carbs: 25, fat: 0.3, sugar: 19, sodium: 2 },
  { name: 'Mango', serv: '1 cup (165 g)', kcal: 100, protein: 1.4, carbs: 25, fat: 0.6, sugar: 23, sodium: 2 },
  { name: 'Guava', serv: '1 medium', kcal: 68, protein: 2.6, carbs: 14, fat: 1, sugar: 9, sodium: 2 },
  { name: 'Papaya', serv: '1 cup (145 g)', kcal: 60, protein: 0.7, carbs: 15, fat: 0.4, sugar: 11, sodium: 12 },
];

// ---------- Additive & ingredient decoder ----------
// level: 0 fine, 1 minor, 2 limit, 3 avoid for kids
export const ADDITIVES = [
  { k: ['627'], name: 'Disodium guanylate (627)', what: 'Flavour enhancer that boosts savoury taste, usually used with MSG-type seasonings.', level: 2, note: 'Can be made from fish or meat — check the green dot if you are vegetarian/Jain.' },
  { k: ['631'], name: 'Disodium inosinate (631)', what: 'Flavour enhancer that works with 627 to make snacks taste "moreish".', level: 2, note: 'Often animal-derived — check the green dot.' },
  { k: ['635'], name: 'Ribonucleotides (635)', what: 'Mix of 627 + 631 flavour enhancers.', level: 2, note: 'May be animal-derived.' },
  { k: ['621', 'msg', 'monosodium glutamate'], name: 'Monosodium glutamate (621)', what: 'Flavour enhancer (MSG). Safe in normal amounts but adds sodium.', level: 1 },
  { k: ['maltodextrin'], name: 'Maltodextrin', what: 'Highly processed starch powder used to carry flavour. Raises blood sugar quickly.', level: 1 },
  { k: ['hydrolysed vegetable protein', 'hvp'], name: 'Hydrolysed vegetable protein', what: 'Protein broken down to give a meaty/savoury taste. Sign of ultra-processing.', level: 1 },
  { k: ['flavouring substances', 'flavour', 'flavor'], name: 'Flavouring substances', what: 'Added flavours (natural, nature-identical or artificial). Exact chemicals are not listed.', level: 1 },
  { k: ['permitted colour', 'colour'], name: 'Permitted colour', what: 'Added colour to make the food look brighter. Not needed for nutrition.', level: 2 },
  { k: ['150d', '150c'], name: 'Caramel colour (150c/150d)', what: 'Brown colour used in colas and malt drinks.', level: 2 },
  { k: ['102', 'tartrazine'], name: 'Tartrazine (102)', what: 'Yellow artificial colour. Linked to hyperactivity in some children.', level: 3 },
  { k: ['110', 'sunset yellow'], name: 'Sunset Yellow (110)', what: 'Orange artificial colour. Linked to hyperactivity in some children.', level: 3 },
  { k: ['acidity regulator', '330', 'citric acid'], name: 'Acidity regulator (e.g. citric acid 330)', what: 'Gives sourness and keeps flavour stable. Generally safe.', level: 0 },
  { k: ['296'], name: 'Malic acid (296)', what: 'Sour taste from fruit acid. Generally safe.', level: 0 },
  { k: ['338', 'phosphoric acid'], name: 'Phosphoric acid (338)', what: 'Acid in colas. Too much may affect teeth and bones.', level: 2 },
  { k: ['anticaking', '551'], name: 'Anticaking agent (e.g. 551)', what: 'Stops powders from clumping. Generally safe.', level: 0 },
  { k: ['500', '501', '503', 'raising agent'], name: 'Raising agents (500/501/503)', what: 'Baking soda / ammonium bicarbonate to make biscuits light. Safe.', level: 0 },
  { k: ['emulsifier', '322', '442', '476', '471', 'lecithin'], name: 'Emulsifiers (322/442/476/471)', what: 'Help oil and water mix. Common in chocolates and biscuits.', level: 1 },
  { k: ['412', '508', '1422', 'thickener', 'stabilizer'], name: 'Thickeners/stabilisers', what: 'Make texture smooth or thick (guar gum 412, etc.).', level: 0 },
  { k: ['211', 'sodium benzoate', 'preservative'], name: 'Preservative (e.g. sodium benzoate 211)', what: 'Stops spoilage. Best limited, especially in drinks for kids.', level: 2 },
  { k: ['300', 'antioxidant', 'ascorbic'], name: 'Antioxidant (Vitamin C, 300)', what: 'Keeps colour and flavour fresh. Safe.', level: 0 },
  { k: ['260', 'acetic'], name: 'Acetic acid (260)', what: 'Vinegar acid. Safe.', level: 0 },
  { k: ['palmolein', 'palm oil'], name: 'Palm oil / palmolein', what: 'Cheap frying oil high in saturated fat.', level: 1 },
  { k: ['caffeine'], name: 'Caffeine', what: 'Stimulant. Not recommended for children or in pregnancy in large amounts.', level: 3 },
  { k: ['invert sugar', 'liquid glucose', 'dextrose', 'glucose syrup'], name: 'Added sugar syrups', what: 'Hidden forms of sugar.', level: 1 },
  { k: ['sucralose', '955', 'aspartame', '951', 'acesulfame', '950'], name: 'Artificial sweetener', what: 'Zero-calorie sweetener. Not advised for young children.', level: 2 },
];

export const ALLERGENS = ['peanut', 'milk', 'gluten', 'soy', 'egg', 'tree nuts', 'sesame'];

export const ALLERGEN_WORDS = {
  peanut: ['peanut', 'groundnut', 'moongphali'],
  milk: ['milk', 'cheese', 'butter', 'whey', 'cream', 'paneer', 'curd', 'ghee', 'lactose', 'casein'],
  gluten: ['wheat', 'maida', 'atta', 'barley', 'rye', 'oats', 'gluten', 'semolina', 'suji'],
  soy: ['soy', 'soya'],
  egg: ['egg'],
  'tree nuts': ['cashew', 'almond', 'pista', 'walnut', 'hazelnut', 'kaju', 'badam'],
  sesame: ['sesame', 'til'],
};

// Brand -> parent company (for "Made by" line). Checked in order, case-insensitive.
export const COMPANIES = [
  [/lay'?s|kurkure|uncle chipps|cheetos|doritos|quaker|pepsi|7 ?up|mountain dew|mirinda|tropicana|sting|slice\b|lehar/i, 'PepsiCo'],
  [/coca[- ]?cola|thums ?up|sprite|fanta|limca|maaza|minute maid|kinley|charged/i, 'The Coca-Cola Company'],
  [/cadbury|bournvita|oreo|5 ?star|perk|gems|dairy milk|silk|bournville|toblerone|milka|tang\b/i, 'Mondelez International'],
  [/maggi|nestl|kit ?kat|munch|milkybar|nescaf|polo\b|bar-one|everyday|cerelac/i, 'Nestlé'],
  [/amul/i, 'Amul (GCMMF)'], [/britannia|good day|marie gold|bourbon|50-50|treat\b|nutrichoice|milk bikis/i, 'Britannia Industries'],
  [/parle|hide ?& ?seek|krackjack|monaco|melody|mango bite|kismi|frooti|appy|bailley|smoothies/i, 'Parle'],
  [/sunfeast|bingo|yippee|dark fantasy|ashirvaad|aashirvaad|b natural|fabelle|candyman/i, 'ITC Limited'],
  [/haldiram/i, "Haldiram's"], [/balaji/i, 'Balaji Wafers'], [/bikaji/i, 'Bikaji Foods'], [/prataap|yellow diamond/i, 'Prataap Snacks'],
  [/kwality wall|cornetto|magnum|kissan|knorr|horlicks|boost\b|bru\b|lipton|brooke bond/i, 'Hindustan Unilever'],
  [/mother dairy/i, 'Mother Dairy'], [/havmor/i, 'Havmor (Lotte)'], [/vadilal/i, 'Vadilal'], [/baskin/i, 'Baskin-Robbins'],
  [/kellogg|chocos|pringles/i, "Kellogg's / Kellanova"], [/saffola|parachute/i, 'Marico'], [/tata\b|tata sampann|tetley|himalayan/i, 'Tata Consumer Products'],
  [/paper boat/i, 'Hector Beverages'], [/real\b|dabur|hajmola/i, 'Dabur'], [/patanjali/i, 'Patanjali Ayurved'], [/mtr\b/i, 'MTR Foods (Orkla)'],
  [/snickers|m&m|twix|mars\b|bounty|galaxy|maltesers|skittles|pedigree/i, 'Mars Inc.'], [/ferrero|nutella|kinder|tic tac|rocher/i, 'Ferrero'],
  [/hershey|reese|kisses\b/i, "The Hershey Company"], [/lindt|ghirardelli/i, 'Lindt & Sprüngli'], [/haribo/i, 'Haribo'],
  [/red ?bull/i, 'Red Bull GmbH'], [/monster/i, 'Monster Beverage'], [/ben ?& ?jerry|carte d'or|walls?\b|algida|ola\b/i, 'Unilever / The Magnum Ice Cream Co.'],
  [/häagen|haagen/i, 'General Mills / Froneri'], [/walkers|tostitos|ruffles|smiths/i, 'PepsiCo'], [/pringles/i, 'Kellanova'],
];
export function companyOf(p) {
  if (p && p.company) return p.company;
  const s = `${(p && p.brand) || ''} ${(p && p.name) || ''}`;
  for (const [re, c] of COMPANIES) if (re.test(s)) return c;
  return null;
}
