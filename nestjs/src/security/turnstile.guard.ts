import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  TURNSTILE_VERIFIER,
  type TurnstileVerifier,
} from './turnstile.verifier';

/**
 * Cloudflare Turnstile gate for the chat endpoint. Feature-flagged: when
 * `TURNSTILE_SECRET` is unset the guard is a no-op (dev/local), so the app runs
 * without a key. When set, a valid token is required (Turnstile is pass/fail).
 */
@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(
    @Inject(TURNSTILE_VERIFIER) private readonly verifier: TurnstileVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!process.env.TURNSTILE_SECRET) return true; // feature off

    const req = context.switchToHttp().getRequest<{
      body?: { turnstileToken?: string };
    }>();
    const token = req.body?.turnstileToken;
    if (!token) throw new ForbiddenException('Turnstile token missing');

    const { success } = await this.verifier.verify(token);
    if (!success) {
      throw new ForbiddenException('Turnstile verification failed');
    }
    return true;
  }
}
