import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

type HealthStatus = { status: 'ok' };

/**
 * Liveness/readiness probes. Kept dependency-free for now; a readiness check
 * that pings the database can be layered in once the DB module exists.
 * Exempt from rate limiting so frequent probes aren't throttled.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatus {
    return { status: 'ok' };
  }

  @Get('live')
  live(): HealthStatus {
    return { status: 'ok' };
  }

  @Get('ready')
  ready(): HealthStatus {
    return { status: 'ok' };
  }
}
