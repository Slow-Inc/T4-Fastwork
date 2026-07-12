import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the Next.js frontend to call this API (chat SSE etc.).
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Backend runs on 4100 (Next.js frontend uses 3000; 4000 is taken by another
  // local project on this machine). Override with the PORT env var.
  await app.listen(process.env.PORT ?? 4100);
}
void bootstrap();
