// src/pages/marathon/viewer.tsx
import { useEffect, useState } from 'react';

interface LiveInfo {
  name: string;
  reference: string;      // e.g. “John 3:16-21”
  streamUrl?: string;     // future HLS/WebRTC URL
}

export default function Viewer() {
  const [info, setInfo] = useState<LiveInfo | null>(null);

  useEffect(() => {
    // Poll FastAPI every 5 s – swap for WebSocket later
    const fetchNow = async () => {
      const res = await fetch('/api/marathon/current');
      if (res.ok) setInfo(await res.json());
    };
    fetchNow();
    const id = setInterval(fetchNow, 5_000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-gray-800 px-4">
      <h1 className="text-3xl font-bold mb-2">Bible-Reading Marathon</h1>
      {info ? (
        <>
          <p className="text-xl mb-6">
            <strong>{info.name}</strong> is reading <em>{info.reference}</em>
          </p>

          {/*  ⬇️  PLACEHOLDER video – replace with real stream   */}
          <div className="w-full max-w-[720px] aspect-video bg-black/80 rounded shadow" />

          <p className="mt-4 text-sm text-gray-500">
            Video will appear automatically when a reader is live.
          </p>
        </>
      ) : (
        <p>Loading current reader…</p>
      )}
    </main>
  );
}
