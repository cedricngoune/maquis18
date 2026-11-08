import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Maquis 18 API')
    .setDescription('API du restaurant Maquis 18 ')
    .setVersion('0.3.0')
    .addBearerAuth() // "Authorize" button in Swagger to test the admin routes with a token
    .addCookieAuth('maquis18_admin') // …or with the session cookie set by POST /auth/login
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(process.env.PORT ?? 5000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  // APP_URL : URL publique (prod derrière un proxy/domaine). Sinon, adresse réelle du serveur.
  const baseUrl = (process.env.APP_URL ?? (await app.getUrl()))
    .replace('[::1]', 'localhost')
    .replace('127.0.0.1', 'localhost')
    .replace('0.0.0.0', 'localhost')
    .replace(/\/$/, '');
  Logger.log(
    `[${process.env.NODE_ENV ?? 'development'}] Server is running on ${baseUrl} — documentation sur ${baseUrl}/docs`,
    'Bootstrap',
  );
}

bootstrap();
