import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import { hc } from 'hono/client';
import './App.css';
import { AppType } from '../functions';

function App() {
  const [count, setCount] = useState(0);
  const [remote, setRemote] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchStuff() {
      const resp = await hc<AppType>('').api.hello.$get({
        query: { name: 'test' },
      });
      setRemote(await resp.text());
    }

    fetch('/apis/test');

    fetchStuff();
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
      <p className="read-the-docs">Remote text: {remote}</p>
    </>
  );
}

export default App;
