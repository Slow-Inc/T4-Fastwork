import { Controller, Get } from '@nestjs/common';

type HealthStatus = { status: 'ok' };

/**
 * Liveness/readiness probes. Kept dependency-free for now; a readiness check
 * that pings the database can be layered in once the DB module exists.
 */
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
