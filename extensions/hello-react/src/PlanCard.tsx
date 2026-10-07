import { useApp, useRpc } from '@dolphy-app/extension-sdk/react';
import { useState } from 'react';
import { greet } from './shared/rpc.ts';

// a card inside "Today's plan". `useRpc(greet)` calls the server part with the
// shared contract; `useApp()` is the list of window capabilities.
export const PlanCard = () => {
  const app = useApp();
  const sayHello = useRpc(greet);
  const [greeting, setGreeting] = useState('');

  const onGreet = async () => {
    try {
      const reply = await sayHello({ name: 'Dolphy' });
      setGreeting(reply.greeting);
      app.notify(reply.greeting);
    } catch (error) {
      // React does not catch the errors of event handlers: report them here
      app.notify(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    }
  };

  // the window colors reach a React component as CSS variables
  return (
    <section
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 8,
        border: '1px solid rgba(var(--v-theme-on-surface), 0.2)',
        color: 'rgb(var(--v-theme-on-surface))',
      }}
    >
      <p>Hello from hello-react, drawn into the daily plan.</p>
      <p data-role="greeting">{greeting}</p>
      <button type="button" onClick={() => void onGreet()}>
        Ask the server to greet
      </button>
    </section>
  );
};
