import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { ChatModule } from './chat/chat.module';
import { GithubModule } from './github/github.module';
import { GithubGenerateModule } from './github/github-generate.module';
import { GithubCurateModule } from './github/github-curate.module';
import { GithubMemberSyncModule } from './github/github-member-sync.module';
import { CaseStudyModule } from './github/github-case-study.module';
import { RankModule } from './rank/rank.module';

@Module({
  imports: [
    // Loads .env.local into process.env at boot (nest start doesn't otherwise).
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // IP rate limiting: 30 requests / 60s. Applied globally (health opts out).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    HealthModule,
    ChatModule,
    GithubModule,
    GithubGenerateModule,
    GithubCurateModule,
    GithubMemberSyncModule,
    CaseStudyModule,
    RankModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
