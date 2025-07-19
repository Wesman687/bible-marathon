// src/pages/marathon/stage.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};
initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();

export default function Stage() {
  const vid = useRef<HTMLVideoElement>(null);
  const [me, setMe] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setMe), []);

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (vid.current) vid.current.srcObject = stream;
      // TODO: send stream to FastAPI signalling server (WebRTC) here
    } catch (err) {
      alert('Camera / mic permission denied.');
      console.error(err);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-slate-50 text-gray-800 p-4">
      <h1 className="text-3xl font-bold mb-4">Reader Staging Room</h1>

      {!me ? (
        <button
          onClick={() => signInWithPopup(auth, provider)}
          className="px-6 py-2 rounded bg-emerald-600 text-white shadow"
        >
          Sign in with Google
        </button>
      ) : (
        <>
          <p className="mb-4">Hi, {me.displayName || me.email}</p>
          <button
            onClick={() => signOut(auth)}
            className="mb-6 text-sm underline"
          >
            Log out
          </button>

          <button
            onClick={startPreview}
            className="px-6 py-2 rounded bg-emerald-600 text-white shadow mb-4"
          >
            Start Camera Preview
          </button>

          <video
            ref={vid}
            autoPlay
            muted
            playsInline
            className="w-full max-w-[720px] aspect-video bg-black/80 rounded shadow"
          />
        </>
      )}
    </main>
  );
}
