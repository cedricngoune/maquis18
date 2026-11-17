/**
 * Prompts used to generate the photos with an AI image model.
 * Written in English: image models follow English prompts more precisely.
 * The shared style keeps the whole menu consistent (same plates, light and palette).
 */

const STYLE =
  'Professional food photography for a restaurant menu. Served on a handmade terracotta ceramic plate ' +
  'on a dark wooden table, warm natural side light, shallow depth of field, appetizing and realistic, ' +
  '3/4 overhead angle. Earthy palette of terracotta, ochre and deep green. ' +
  'No text, no logo, no watermark, no people, no hands.';

/** What each dish of the seed menu looks like (keys = dish names, as in the database) */
export const DISH_SCENES: Record<string, string> = {
  'Attiéké poisson braisé':
    'A whole grilled tilapia with charred skin on a bed of fluffy attiéké (fermented cassava couscous), with sliced raw red onion, tomato, fresh green chili and a lime wedge',
  'Foutou banane, sauce graine':
    'A smooth round ball of foutou (pounded plantain and cassava) next to a bowl of deep red-orange palm nut soup with tender pieces of meat',
  'Mafé de bœuf':
    'Beef mafé: chunks of beef and carrots stewed in a rich, glossy peanut sauce, served with a dome of white rice',
  'Poulet yassa':
    'Chicken yassa: grilled chicken pieces covered with golden caramelized onions, lemon slices and green olives, served with fragrant white rice',
  'Riz gras':
    'West African "riz gras": rice cooked in a spicy tomato sauce, deep orange color, with vegetables and pieces of meat',
  'Mafé de légumes':
    'Vegetarian peanut stew with sweet potato, carrots, cabbage and okra in a creamy peanut sauce, served with white rice',
  Alloco: 'Golden fried ripe plantain slices (alloco), slightly caramelized, with a small bowl of red chili sauce',
  'Attiéké nature': 'A small bowl of plain, fluffy, pale attiéké (cassava couscous)',
  Bissap:
    'A tall glass of deep crimson iced hibiscus drink (bissap) with fresh mint leaves, dried hibiscus flowers on the table',
  Gingembre: 'A glass of cloudy pale-yellow fresh ginger juice with a lime slice, fresh ginger root on the table',
  Bouye: 'A glass of creamy off-white baobab fruit drink (bouye), an open baobab fruit pod on the table',
  Dégué: 'A bowl of dégué: small millet grains in sweet creamy yogurt, with a hint of vanilla',
  Beignets: 'Small round golden West African doughnuts (puff-puff) dusted with powdered sugar, in a small basket',
};

/** Prompt for any dish: its known scene, or a description built from the menu text */
export function buildDishPrompt(dish: { name: string; description: string }): string {
  const scene = DISH_SCENES[dish.name] ?? `West African dish "${dish.name}": ${dish.description}`;
  return `${scene}. ${STYLE}`;
}

/** Photos of the website itself (written to apps/web/public/images) */
export const SITE_IMAGES = [
  {
    file: 'hero.webp',
    prompt:
      'Wide shot of a generous West African table in a cozy Paris restaurant: attiéké with grilled fish, a bowl of beef mafé, ' +
      'fried plantains, glasses of crimson bissap. Warm evening light, terracotta walls, green plants. ' +
      'Professional food photography, realistic, no people, no text, no logo.',
  },
  {
    file: 'story.webp',
    prompt:
      "Close-up of a cook's hands (no face visible) stirring a peanut mafé sauce in a large pot in a warm family kitchen, " +
      'steam rising, spices, onions and tomatoes on a wooden counter. Documentary style, warm natural light, realistic, no text.',
  },
];
