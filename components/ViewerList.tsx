import React, { useEffect, useState } from 'react';

interface Viewer {
  identity: string;
  email: string;
  displayName: string;
  wants_to_join: boolean;
  canJoin: boolean;
}

interface ViewerListProps {
  isHost?: boolean;
  emit: (event: string, payload?: any) => void;
  latestEvent: { event: string; payload: any } | null;
}

export default function ViewerList({ isHost, emit, latestEvent }: ViewerListProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);

  useEffect(() => {
    if (!latestEvent) return;
    const { event, payload } = latestEvent;

    if (event === 'viewer-list') {
      setViewers(payload.viewers);
    }

    if (event === 'viewer-joined') {
      setViewers((prev) => [...prev, payload.viewer]);
    }

    if (event === 'viewer-left') {
      setViewers((prev) => prev.filter((v) => v.identity !== payload.identity));
    }

    if (event === 'viewer-updated') {
      setViewers((prev) =>
        prev.map((v) => (v.identity === payload.viewer.identity ? payload.viewer : v))
      );
    }
  }, [latestEvent]);

  const handleEmit = (event: string, identity: string) => {
    emit(event, { identity });
  };

  return (
    <ul className="space-y-1 w-full bg-gray-800 py-1 text-sm">
      {viewers.map((viewer) => (
        <li
          key={viewer.identity}
          className={`p-2 flex flex-col gap-1 ${
            viewer.wants_to_join ? 'bg-blue-800' : 'bg-blue-500'
          }`}
        >
          <div className="font-semibold text-white">{viewer.displayName || viewer.identity}</div>

          {viewer.wants_to_join && (
            <div className="text-yellow-300 text-xs">
              ✋ Wants to Join
              {isHost && (
                <button
                  onClick={() => handleEmit('approve-join', viewer.identity)}
                  className="ml-2 bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-white text-xs"
                >
                  ✅ Approve
                </button>
              )}
            </div>
          )}

          {viewer.canJoin && isHost && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleEmit('mute-viewer', viewer.identity)}
                className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-white text-xs"
              >
                🔇 Mute
              </button>
              <button
                onClick={() => handleEmit('kick-viewer', viewer.identity)}
                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-white text-xs"
              >
                ❌ Kick
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
