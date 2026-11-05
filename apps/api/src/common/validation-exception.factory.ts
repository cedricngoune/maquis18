import { BadRequestException, type ValidationError } from '@nestjs/common';
import type { ApiErrorResponse } from '@maquis18/shared';

/**
 * Turns class-validator errors into { message, errors: { field: message } }
 * so the front can show each message under the right field.
 */
export function validationExceptionFactory(validationErrors: ValidationError[]) {
  const errors: Record<string, string> = {};

  for (const error of validationErrors) {
    const firstMessage = Object.values(error.constraints ?? {})[0];
    errors[error.property] = firstMessage ?? 'Valeur invalide.';
  }

  const body: ApiErrorResponse = {
    statusCode: 400,
    message: 'Certains champs sont invalides.',
    errors,
  };
  return new BadRequestException(body);
}
