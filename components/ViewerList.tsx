import React, { useEffect, useState } from 'react'
interface Viewer {
  identity: string;
  email: string;
  displayName: string;
  wants_to_join: boolean;
  canJoin: boolean;
}

export default function ViewerList({isHost }: { isHost?: boolean }) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stream/viewers`
      );
      const data = await res.json();
      setViewers(data);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);
  const approveJoin = async (identity: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/approve-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity }),
    });
  };

  return (
    <ul className="space-y-1 w-full bg-gray-800 py-1">
      {Object.entries(viewers).map(([key, info]) => (
        <li
          key={key}
          className={`p-2  ${
            info.wants_to_join ? "bg-blue-800" : "bg-blue-500"
          }`}
        >
          {info.displayName || key}
          {(info.wants_to_join) && (
            <span className="text-red-400">
              {" "}
              {!isHost ? "✋ Wants to Join" :
              <button
            onClick={() => approveJoin(info.identity || key)}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm rounded"
          >
            ✅ Join
          </button>}
              
            </span>
            
          )}
          
        </li>
      ))}
    </ul>
  );
}