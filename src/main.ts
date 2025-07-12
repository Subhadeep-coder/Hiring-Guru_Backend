import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// For Vercel deployment - using connect-mongo instead of connect-mongodb-session
import MongoStore from 'connect-mongo';

// Create Express instance for Vercel
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

  // For local development
  if (process.env.NODE_ENV !== 'production') {
    const port = configService.get('PORT') || 5000;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}/api`);
    console.log(
      `📊 Google OAuth: http://localhost:${port}/api/user/auth/google`,
    );
    console.log(
      `🐙 GitHub OAuth: http://localhost:${port}/api/user/auth/github`,
    );
  } else {
    // For Vercel deployment - just initialize
    await app.init();
    console.log('🚀 Application initialized for Vercel deployment');
  }
}

// Handle initialization errors
bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});

// Export the server instance for Vercel
export default server;
