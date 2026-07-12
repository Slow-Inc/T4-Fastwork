import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  RECAPTCHA_VERIFIER,
  type RecaptchaVerifier,
} from './recaptcha.verifier';

const MIN_SCORE = 0.5;

/**
 * reCAPTCHA v3 gate for the chat endpoint. Feature-flagged: when
 * `RECAPTCHA_SECRET` is unset the guard is a no-op (dev/local), so the app runs
 * without a key. When set, a valid token scoring ≥ 0.5 is required.
 */
@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(
    @Inject(RECAPTCHA_VERIFIER) private readonly verifier: RecaptchaVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!process.env.RECAPTCHA_SECRET) return true; // feature off

    const req = context.switchToHttp().getRequest<{
      body?: { recaptchaToken?: string };
    }>();
    const token = req.body?.recaptchaToken;
    if (!token) throw new ForbiddenException('reCAPTCHA token missing');

    const { success, score } = await this.verifier.verify(token);
    if (!success || score < MIN_SCORE) {
      throw new ForbiddenException('reCAPTCHA verification failed');
    }
    return true;
  }
}
