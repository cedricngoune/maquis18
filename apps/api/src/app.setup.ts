import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { validationExceptionFactory } from './common/validation-exception.factory';

/**
 * Global configuration shared by main.ts and the e2e tests,
 * so the tests run against exactly the same app as production.
 */
export function configureApp(app: INestApplication): void {
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001' });

  // Validates every request body against its DTO (class-validator decorators)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties that are not in the DTO
      forbidNonWhitelisted: true, // …and rejects the request if there are any
      transform: true, // turns the JSON body into a DTO instance (runs @Transform)
      exceptionFactory: validationExceptionFactory,
    }),
  );
}
