import { BadRequestException, type ValidationError } from '@nestjs/common';
import type { ApiErrorResponse } from '@maquis18/shared';

/**
 * Flattens class-validator errors into { "field": "message" }.
 * Nested objects and arrays get dotted keys: "days.2.closesAt".
 */
function collectErrors(validationErrors: ValidationError[], parentPath = '', errors: Record<string, string> = {}) {
  for (const error of validationErrors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const firstMessage = Object.values(error.constraints ?? {})[0];

    if (firstMessage) {
      errors[path] = firstMessage;
    } else if (error.children?.length) {
      collectErrors(error.children, path, errors);
    } else {
      errors[path] = 'Valeur invalide.';
    }
  }
  return errors;
}

/**
 * Turns class-validator errors into { message, errors: { field: message } }
 * so the front can show each message under the right field.
 */
export function validationExceptionFactory(validationErrors: ValidationError[]) {
  const body: ApiErrorResponse = {
    statusCode: 400,
    message: 'Certains champs sont invalides.',
    errors: collectErrors(validationErrors),
  };
  return new BadRequestException(body);
}
