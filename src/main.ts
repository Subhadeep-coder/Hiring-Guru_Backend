import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import session from 'express-session'; // Changed from * as session
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import MongoStore from 'connect-mongo';

// Create Express server instance for Vercel
const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const configService = app.get(ConfigService);

  // CORS Configuration
  app.enableCors({
    origin: configService.get('FRONTEND_URL'), // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Session Configuration with connect-mongo (more reliable for Vercel)
  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET') || '',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: configService.get<string>('DATABASE_URL') || '',
        touchAfter: 24 * 3600, // lazy session update
        collectionName: 'sessions',
      }),
      name: 'hiring-guru-token',
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

  // Initialize the app for Vercel (don't listen on a port)
  await app.init();

  console.log('🚀 Application initialized for Vercel deployment');
}

// Initialize the application
bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
});

// Export the Express server for Vercel
export default server;
