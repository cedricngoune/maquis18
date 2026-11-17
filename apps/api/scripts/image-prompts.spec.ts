import { DISH_SCENES, SITE_IMAGES, buildDishPrompt } from './image-prompts';

describe('image prompts', () => {
  it('has a scene for every dish of the seed menu', () => {
    expect(Object.keys(DISH_SCENES)).toHaveLength(13);
  });

  it('adds the shared style to the dish scene', () => {
    const prompt = buildDishPrompt({ name: 'Alloco', description: '' });
    expect(prompt).toContain('fried ripe plantain');
    expect(prompt).toContain('terracotta ceramic plate');
    expect(prompt).toContain('No text');
  });

  it('builds a prompt from the menu text for a dish added later in the admin', () => {
    const prompt = buildDishPrompt({ name: 'Thiéboudienne', description: 'Riz au poisson et légumes' });
    expect(prompt).toContain('"Thiéboudienne": Riz au poisson et légumes');
  });

  it('describes the hero and story photos of the site', () => {
    expect(SITE_IMAGES.map((image) => image.file)).toEqual(['hero.webp', 'story.webp']);
  });
});
