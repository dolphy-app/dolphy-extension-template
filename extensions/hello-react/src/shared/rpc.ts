import { defineRpc } from '@dolphy-app/extension-sdk';
import { z } from 'zod';

// imported by both parts: the name and the schemas of the call. Both sides
// validate with them, and the data crosses the process boundary as JSON.
export const greet = defineRpc({
  name: 'hello.greet',
  input: z.object({ name: z.string().min(1).max(50) }),
  output: z.object({ greeting: z.string() }),
});
