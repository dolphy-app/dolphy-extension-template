import type { PanelProps } from '@dolphy-app/extension-sdk';
import { usePanel } from '@dolphy-app/extension-sdk/react';
import { useEffect, useState } from 'react';

// `reactComponent` draws this component with React and gives it the props of
// the panel; `usePanel()` is the handle with `call` for the commands of the
// extension
export const HelloPanel = ({ props }: PanelProps) => {
  const panel = usePanel();
  const [message, setMessage] = useState('');
  // the app opens the panel again with new properties: the component renders again
  const name =
    typeof props === 'object' && props !== null && 'name' in props
      ? String(props.name)
      : 'world';

  const load = async () => {
    // `call` returns the JSON the `data` command of this extension replied with
    const data = await panel.call('acme.hello-react.data');
    if (typeof data === 'object' && data !== null && 'message' in data) {
      setMessage(String(data.message));
    }
  };
  useEffect(() => {
    void load();
  }, []);

  return (
    <section style={{ padding: 16 }}>
      <h2>Hello, {name}!</h2>
      <p>{message}</p>
      <button type="button" onClick={() => void load()}>
        Reload
      </button>
    </section>
  );
};
