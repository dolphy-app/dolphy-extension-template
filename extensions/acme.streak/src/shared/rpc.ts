import { defineRpc } from '@dolphy-app/extension-sdk';
import { z } from 'zod';

// imported by both parts: the name and the schemas of the call. Both sides
// validate with them, and the data crosses the process boundary as JSON.
export const streakRpc = defineRpc({
  name: 'streak.status',
  input: z.object({}),
  output: z.object({
    days: z.number().int().min(0),
    atRisk: z.boolean(),
  }),
});
