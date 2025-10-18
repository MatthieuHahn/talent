import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

let app;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);

    // Enable global validation pipe with transformation
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        whitelist: true,
      }),
    );

    // Enable CORS for frontend communication
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    await app.init();
  }
  return app;
}

// For Vercel serverless deployment
export default async function handler(req, res) {
  const app = await bootstrap();
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
}

// For local development
if (require.main === module) {
  async function startServer() {
    const app = await bootstrap();
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`🚀 Backend server is running on http://localhost:${port}`);
  }
  startServer();
}
