// SmartBite verified Indian-market products (per 100 g, or per 100 ml for drinks).
//
// Why this file exists: the same product sells with different recipes in different
// countries. Sprite in the UK has 3.3 g sugar per 100 ml, in India 9.8 g, in the US 10.7 g.
// Picking a random country's entry is what made Sprite score 2 one day and 3 the next.
// These entries are the Indian pack values, so a matched product always gets the same,
// correct verdict.
//
// Source: Open Food Facts India pack entries (label photos checked by contributors), with
// obvious typing errors in that data corrected (for example sodium typed in micrograms).
// Red Bull and Nutella use the maker's published label (same recipe sold in India).
// nova: processing level (1 = unprocessed ... 4 = ultra-processed).
// When a brand changes its recipe, update the numbers here from the new pack.

const D = (o) => ({ veg: true, allergens: [], ing: [], approx: false, verified: true, src: 'SmartBite verified (India pack)', ...o });
const n = (kcal, fat, sat, carbs, sugar, fibre, protein, sodium) => ({ kcal, fat, sat, carbs, sugar, fibre, protein, sodium });

export const INDIA = [
  // ---------- Cold drinks ----------
  D({ id: 'in-sprite', brand: 'Sprite', name: 'Sprite Lime & Lemon', cat: 'Drinks', drink: true, barcode: '8901764032905', packG: 250, nova: 4, n: n(40, 0, 0, 10, 9.8, 0, 0, 14) }),
  D({ id: 'in-coca-cola', brand: 'Coca-Cola', name: 'Coca-Cola', cat: 'Drinks', drink: true, barcode: '8901764012914', packG: 250, nova: 4, caffeine: true, n: n(44, 0, 0, 10.9, 10.6, 0, 0, 8.5) }),
  D({ id: 'in-pepsi', brand: 'Pepsi', name: 'Pepsi', cat: 'Drinks', drink: true, barcode: '8902080104581', packG: 250, nova: 4, caffeine: true, n: n(43, 0, 0, 10.9, 10.9, 0, 0, 3) }),
  D({ id: 'in-limca', brand: 'Limca', name: "Limca Lime 'n' Lemoni", cat: 'Drinks', drink: true, barcode: '8901764052279', packG: 250, nova: 4, n: n(44, 0, 0, 11.1, 10.7, 0, 0, 0) }),
  D({ id: 'in-mountain-dew', brand: 'Mountain Dew', name: 'Mountain Dew', cat: 'Drinks', drink: true, barcode: '8902080364022', packG: 250, nova: 4, caffeine: true, n: n(49, 0, 0, 12.3, 12.3, 0, 0, 8) }),
  D({ id: 'in-mirinda', brand: 'Mirinda', name: 'Mirinda Orange', cat: 'Drinks', drink: true, barcode: '8902080001170', packG: 250, nova: 4, n: n(55, 0, 0, 13.8, 13.8, 0, 0, 6) }),
  D({ id: 'in-appy-fizz', brand: 'Appy Fizz', name: 'Appy Fizz Sparkling Apple Drink', cat: 'Drinks', drink: true, barcode: '8902579002039', packG: 250, nova: 4, n: n(51.8, 0, 0, 12.95, 12.9, 0, 0, 21) }),
  D({ id: 'in-sting', brand: 'Sting', name: 'Sting Energy Drink', cat: 'Drinks', drink: true, barcode: '8902080495023', packG: 250, nova: 4, caffeine: true, n: n(28, 0, 0, 7, 6.8, 0, 0, 41) }),
  D({ id: 'in-red-bull', brand: 'Red Bull', name: 'Red Bull Energy Drink', cat: 'Drinks', drink: true, barcode: '', packG: 250, nova: 4, caffeine: true, src: "Maker's published label", n: n(46, 0, 0, 11, 11, 0, 0, 40) }),
  // ---------- Juices, dairy drinks, drink mixes ----------
  D({ id: 'in-tropicana-orange', brand: 'Tropicana', name: 'Orange Delight', cat: 'Drinks', drink: true, barcode: '8902080002085', packG: 180, nova: 4, n: n(50, 0, 0, 12.4, 12, 0, 0.1, 34) }),
  D({ id: 'in-b-natural-orange', brand: 'B Natural', name: 'Orange Juice', cat: 'Drinks', drink: true, barcode: '8901725100131', packG: 1000, nova: 4, n: n(48.7, 0, 0, 12.5, 11.7, 0, 0, 11.4) }),
  D({ id: 'in-real-coconut', brand: 'Real Activ', name: 'Coconut Water', cat: 'Drinks', drink: true, barcode: '8901207032677', packG: 200, nova: 3, n: n(20, 0, 0, 5, 4.6, 0, 0, 25) }),
  D({ id: 'in-amul-kool-elaichi', brand: 'Amul', name: 'Kool Elaichi Milk', cat: 'Drinks', drink: true, barcode: '8901262152228', packG: 180, nova: 4, allergens: ['milk'], n: n(90.6, 3.11, 1.89, 12.5, 12.5, 0, 3.11, 43) }),
  D({ id: 'in-amul-lassi', brand: 'Amul', name: 'Lassi', cat: 'Dairy', drink: true, barcode: '8901262200189', packG: 200, nova: 3, allergens: ['milk'], n: n(88.5, 2.1, 1.25, 14.5, 14.5, 0, 2.1, 30) }),
  D({ id: 'in-amul-masti-chaas', brand: 'Amul', name: 'Masti Spiced Buttermilk', cat: 'Dairy', drink: true, barcode: '8901262200196', packG: 200, nova: 3, allergens: ['milk'], n: n(28.5, 1.5, 0.95, 1.8, 1.8, 0, 1.5, 250) }),
  D({ id: 'in-glucon-d', brand: 'Glucon-D', name: 'Glucon-D Regular', cat: 'Drinks mix', barcode: '8901542016226', packG: 125, nova: 3, n: n(360, 0, 0, 90, 90, 0, 0, 0) }),
  D({ id: 'in-tang-orange', brand: 'Tang', name: 'Orange Drink Powder', cat: 'Drinks mix', barcode: '7622202051647', packG: 500, nova: 4, n: n(388, 0, 0, 94.1, 92.9, 0, 0, 35) }),

  // ---------- Namkeen and chips ----------
  D({ id: 'in-haldiram-bhujia-sev', brand: "Haldiram's", name: 'Bhujia Sev', cat: 'Namkeen', barcode: '8904004400083', packG: 400, nova: 4, n: n(601, 43.5, 11.5, 37.1, 0, 4.85, 12.9, 771) }),
  D({ id: 'in-haldiram-khatta-meetha', brand: "Haldiram's", name: 'Khatta Meetha', cat: 'Namkeen', barcode: '8906070320135', packG: 200, nova: 4, allergens: ['peanut'], n: n(500, 35.7, 11.7, 38.6, 3.2, 0, 10.7, 620) }),
  D({ id: 'in-uncle-chipps', brand: 'Uncle Chipps', name: 'Plain Salted', cat: 'Chips', barcode: '8901491435000', packG: 50, nova: 4, n: n(548, 35, 15.8, 52, 0.6, 0, 6.7, 600) }),
  D({ id: 'in-bingo-tedhe-medhe', brand: 'Bingo!', name: 'Tedhe Medhe Masala Tadka', cat: 'Snacks', barcode: '8901725118914', packG: 90, nova: 4, n: n(546, 32.8, 15.5, 57.3, 1.7, 0, 5.5, 738) }),
  D({ id: 'in-too-yumm-karare', brand: 'Too Yumm!', name: 'Karare Masala Blast', cat: 'Snacks', barcode: '8906090574495', packG: 65, nova: 4, n: n(471, 19.5, 4.5, 68, 4.7, 3.4, 5.9, 970) }),
  D({ id: 'in-pringles-original', brand: 'Pringles', name: 'Original', cat: 'Chips', barcode: '8886467122392', packG: 107, nova: 4, allergens: ['gluten'], n: n(523, 27.9, 14, 62.8, 0.4, 0, 5, 468) }),

  // ---------- Biscuits ----------
  D({ id: 'in-hide-and-seek', brand: 'Parle', name: 'Hide & Seek Chocolate Chip Cookies', cat: 'Biscuits', barcode: '8901719130144', packG: 100, nova: 4, allergens: ['gluten', 'milk'], n: n(480, 18.3, 11.4, 73.1, 32.6, 0, 5.8, 114) }),
  D({ id: 'in-bourbon', brand: 'Britannia', name: 'Bourbon', cat: 'Biscuits', barcode: '8901063139336', packG: 100, nova: 4, allergens: ['gluten', 'milk'], n: n(493.5, 20.3, 10.1, 72.7, 38.3, 0, 5, 47.6) }),
  D({ id: 'in-oreo', brand: 'Oreo', name: 'Vanilla Creme Biscuits', cat: 'Biscuits', barcode: '7622201428501', packG: 120, nova: 4, allergens: ['gluten', 'soy'], n: n(483, 19.6, 9.7, 71.9, 38.8, 0, 5.2, 420) }),
  D({ id: 'in-jim-jam', brand: 'Britannia', name: 'Jim Jam', cat: 'Biscuits', barcode: '8901063029217', packG: 100, nova: 4, allergens: ['gluten', 'milk'], n: n(483, 19, 9.5, 73, 33.5, 0, 5, 214) }),
  D({ id: 'in-dark-fantasy', brand: 'Sunfeast', name: 'Dark Fantasy Choco Fills', cat: 'Biscuits', barcode: '8901725132873', packG: 75, nova: 4, allergens: ['gluten', 'milk', 'soy'], n: n(504, 25, 11.4, 63.9, 37.6, 0, 5.7, 40) }),
  D({ id: 'in-moms-magic', brand: 'Sunfeast', name: "Mom's Magic Cashew & Almond", cat: 'Biscuits', barcode: '8901725007652', packG: 75, nova: 4, allergens: ['gluten', 'milk', 'tree nuts'], n: n(504, 23.3, 11.3, 67, 22.2, 0, 6.5, 172) }),
  D({ id: 'in-milk-bikis', brand: 'Britannia', name: 'Milk Bikis', cat: 'Biscuits', barcode: '8901063012530', packG: 100, nova: 4, allergens: ['gluten', 'milk'], n: n(459, 13.5, 6.5, 77, 26.4, 0, 7.4, 304) }),
  D({ id: 'in-nutrichoice-digestive', brand: 'Britannia', name: 'NutriChoice Digestive', cat: 'Biscuits', barcode: '8901063142022', packG: 250, nova: 4, allergens: ['gluten'], n: n(481, 20.9, 10.4, 68, 13.1, 7.3, 9.1, 368) }),
  D({ id: 'in-unibic-cashew', brand: 'Unibic', name: 'Cashew Cookies', cat: 'Biscuits', barcode: '8906009078021', packG: 75, nova: 4, allergens: ['gluten', 'milk', 'tree nuts'], n: n(496, 23.8, 11.9, 63, 25, 0, 7.5, 123) }),

  // ---------- Chocolates and sweets ----------
  D({ id: 'in-munch', brand: 'Nestlé', name: 'Munch', cat: 'Chocolate', barcode: '8901058000702', packG: 20, nova: 4, allergens: ['gluten', 'milk', 'soy'], n: n(435, 23.4, 23.1, 50, 32.9, 0, 6, 89) }),
  D({ id: 'in-perk', brand: 'Cadbury', name: 'Perk', cat: 'Chocolate', barcode: '7622201758639', packG: 13, nova: 4, allergens: ['gluten', 'milk', 'soy'], n: n(512, 25.4, 20, 67.9, 44.9, 0, 3.7, 99) }),
  D({ id: 'in-gems', brand: 'Cadbury', name: 'Gems', cat: 'Sweets', barcode: '7622201798260', packG: 8, nova: 4, allergens: ['milk', 'soy'], n: n(468, 17.5, 17.3, 75.1, 70, 0, 3.6, 74) }),
  D({ id: 'in-kitkat', brand: 'Nestlé', name: 'KitKat', cat: 'Chocolate', barcode: '8901058868036', packG: 37, nova: 4, allergens: ['gluten', 'milk', 'soy'], n: n(518, 25.7, 23, 63.8, 48.7, 2.6, 8, null) }),
  D({ id: 'in-nutella', brand: 'Nutella', name: 'Hazelnut Spread with Cocoa', cat: 'Spreads', barcode: '', packG: 350, nova: 4, src: "Maker's published label", allergens: ['milk', 'tree nuts', 'soy'], n: n(539, 30.9, 10.6, 57.5, 56.3, 0, 6.3, 43) }),
  D({ id: 'in-kissan-jam', brand: 'Kissan', name: 'Mixed Fruit Jam', cat: 'Spreads', barcode: '8901030922787', packG: 500, nova: 4, n: n(285, 0.1, 0, 70.5, 68.1, 0.7, 0.3, 51) }),

  // ---------- Noodles and breakfast ----------
  D({ id: 'in-top-ramen-curry', brand: 'Nissin', name: 'Top Ramen Curry Noodles', cat: 'Instant food', barcode: '8901014003181', packG: 70, nova: 4, allergens: ['gluten'], n: n(445, 15.1, 8.7, 66.5, 2.9, 0, 8.9, 1742) }),
  D({ id: 'in-maggi-atta', brand: 'Maggi', name: 'Atta Noodles Masala', cat: 'Instant food', barcode: '8901058858860', packG: 72.5, nova: 4, allergens: ['gluten'], n: n(422, 14.6, 7.4, 60.6, 2.8, 6, 12, 1100) }),
  D({ id: 'in-corn-flakes', brand: "Kellogg's", name: 'Corn Flakes Original', cat: 'Breakfast', barcode: '8901499008183', packG: 250, nova: 4, n: n(380, 1, 0.67, 87, 8.33, 2.67, 6.67, 500) }),
  D({ id: 'in-quaker-oats', brand: 'Quaker', name: 'Oats', cat: 'Breakfast', barcode: '8901491103794', packG: 400, nova: 1, allergens: ['gluten'], n: n(407, 9.5, 1.9, 68.5, 1.8, 10, 11.8, 9.5) }),
  D({ id: 'in-saffola-oats', brand: 'Saffola', name: 'Oats (plain)', cat: 'Breakfast', barcode: '8901088213608', packG: 1000, nova: 1, allergens: ['gluten'], n: n(369, 8, 1.6, 66.8, 0.5, 10.4, 12.6, 5) }),

  // ---------- Dairy ----------
  D({ id: 'in-amul-cheese-slices', brand: 'Amul', name: 'Cheese Slices', cat: 'Dairy', barcode: '8901262020015', packG: 200, nova: 4, allergens: ['milk'], n: n(311, 25, 16, 1.5, 1.5, 0, 20, 1200) }),
  D({ id: 'in-epigamia-mishti-doi', brand: 'Epigamia', name: 'Mishti Doi', cat: 'Dairy', barcode: '8906059638329', packG: 80, nova: 3, allergens: ['milk'], n: n(136, 5, 3.75, 17.5, 17.5, 0, 5, 79) }),
];
