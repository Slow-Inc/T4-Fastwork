'use client';

import dynamic from 'next/dynamic';
import { useBotEnabled } from '@/components/site/v3/bot-toggle';

/** Code-split the r3f robot stage (ssr:false) so three.js never runs on the
 *  server; critical copy renders first and the robot mounts after (§14.14). */
const Stage = dynamic(
  () => import('./lab4-robot-stage').then((m) => m.Lab4RobotStage),
  { ssr: false, loading: () => null },
);

/** Honours the hide-the-bot preference before three.js is ever fetched. */
export function Lab4RobotStageLazy() {
  return useBotEnabled() ? <Stage /> : null;
}
