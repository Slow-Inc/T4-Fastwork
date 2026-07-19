'use client';

import dynamic from 'next/dynamic';

/** Code-split the r3f robot stage (ssr:false) so three.js never runs on the
 *  server; critical copy renders first and the robot mounts after (§14.14). */
export const Lab4RobotStageLazy = dynamic(
  () => import('./lab4-robot-stage').then((m) => m.Lab4RobotStage),
  { ssr: false, loading: () => null },
);
