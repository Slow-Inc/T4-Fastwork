'use client';

import Image from 'next/image';
import { useBotEnabled } from './bot-toggle';

/**
 * The T4 Bot peeking over the oversized wordmark — the one placement that gives
 * the character site-wide presence (§14.2.1) without a second WebGL canvas.
 * ~15 KB static render, `aria-hidden`, out of the reading path, and it obeys the
 * hide-the-bot preference.
 */
export function FootBot({ pose = 'wave' }: { pose?: 'wave' | 'idle' | 'shrug' }) {
  if (!useBotEnabled()) return null;
  return (
    <Image
      className="v3-foot-bot"
      src={`/brand/t4bot-${pose}.webp`}
      alt=""
      width={512}
      height={512}
      aria-hidden
    />
  );
}
