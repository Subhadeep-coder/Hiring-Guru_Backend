import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import * as MongoDBStore from 'connect-mongodb-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS Configuration
  app.enableCors({
    origin: configService.get('FRONTEND_URL'), // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const MongoStore = MongoDBStore(session);
  const store = new MongoStore({
    uri: configService.get<string>('DATABASE_URL') || "",
    collection: 'sessions',
  });

  // Session Configuration
  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET') || "",
      resave: false,
      saveUninitialized: false,
      store: store,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  // Passport Configuration
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cookieParser());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 5000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📊 Google OAuth: http://localhost:${port}/api/user/auth/google`);
  console.log(`🐙 GitHub OAuth: http://localhost:${port}/api/user/auth/github`);
}

bootstrap();