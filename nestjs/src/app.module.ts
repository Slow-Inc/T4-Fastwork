import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // Loads .env.local into process.env at boot (nest start doesn't otherwise).
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    HealthModule,
    ChatModule,
  ],
})
export class AppModule {}
