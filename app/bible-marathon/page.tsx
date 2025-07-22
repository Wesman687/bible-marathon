'use client'
import { HostInterface } from '@/components/HostInterface';
import { ViewerInterface } from '@/components/ViewerInterface';
import { useState, useEffect, useRef } from 'react';
export default function BibleMarathonMeetApp() {
  const [isHost, setIsHost] = useState(false);
  const [joined, setJoined] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 w-full">
      {!joined ? (
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">📖 Bible Marathon Broadcast</h1>
          <p>Select your role:</p>
          <button
            onClick={() => {
              setIsHost(true);
              setJoined(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded shadow"
          >
            I am the Host
          </button>
          <button
            onClick={() => {
              setIsHost(false);
              setJoined(true);
            }}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded shadow"
          >
            I am a Viewer
          </button>
        </div>
      ) : isHost ? (
        <HostInterface />
      ) : (
        <ViewerInterface />
      )}
    </div>
  );
}
