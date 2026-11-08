import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { validationExceptionFactory } from './common/validation-exception.factory';

/**
 * Global configuration shared by main.ts and the e2e tests,
 * so the tests run against exactly the same app as production.
 */
export function configureApp(app: INestApplication): void {
  // Behind a hosting proxy (Railway, Render…), trust X-Forwarded-For so that rate limiting
  // and the captcha see the visitor's real IP instead of the proxy's
  if (process.env.TRUST_PROXY === 'true') {
    (app as NestExpressApplication).set('trust proxy', 1);
  }

  // Reads the httpOnly session cookie of the back-office (request.cookies)
  app.use(cookieParser());

  // credentials: true lets the browser send and receive the session cookie across origins
  // (the origin must then be explicit, never "*")
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001', credentials: true });

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
