import type { ValidationError } from '@nestjs/common';
import { validationExceptionFactory } from './validation-exception.factory';

describe('validationExceptionFactory', () => {
  it('keeps the first message of each invalid field', () => {
    const errors = [
      { property: 'email', constraints: { isEmail: 'E-mail invalide.', maxLength: 'Trop long.' } },
      { property: 'guests', constraints: { max: 'Trop de personnes.' } },
    ] as ValidationError[];

    const response = validationExceptionFactory(errors).getResponse();

    expect(response).toEqual({
      statusCode: 400,
      message: 'Certains champs sont invalides.',
      errors: { email: 'E-mail invalide.', guests: 'Trop de personnes.' },
    });
  });

  it('falls back to a generic message when a field has no constraint message', () => {
    const response = validationExceptionFactory([{ property: 'date' } as ValidationError]).getResponse();

    expect(response).toMatchObject({ errors: { date: 'Valeur invalide.' } });
  });
});
