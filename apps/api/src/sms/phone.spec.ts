import { maskPhone, toFrenchE164 } from './phone';

describe('toFrenchE164', () => {
  it.each([
    ['06 12 34 56 78', '+33612345678'],
    ['06.12.34.56.78', '+33612345678'],
    ['06-12-34-56-78', '+33612345678'],
    ['0612345678', '+33612345678'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['01 55 10 62 63', '+33155106263'],
  ])('converts "%s" to %s', (input, expected) => {
    expect(toFrenchE164(input)).toBe(expected);
  });
});

describe('maskPhone', () => {
  it('only keeps the country code, the first digit and the last two digits', () => {
    expect(maskPhone('+33612345678')).toBe('+336 •• •• •• 78');
  });
});
