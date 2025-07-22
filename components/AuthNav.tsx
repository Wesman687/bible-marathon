'use client';

import { useAuth } from "@/lib/AuthContext";
import { signInWithGoogle, signOut } from "@/lib/firebase.auth";
import  bible  from "@/assets/bible.png"
import { useRef, useState } from "react";
import Image from "next/image";


export function AuthNav() {
  const { user } = useAuth();
  const [hovering, setHovering] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="px-4 py-2 border border-brandBlue text-brandBlue rounded-full shadow-md hover:bg-brandBlue/10 transition-transform duration-200 hover:scale-105"
      >
        Login / Register
      </button>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHovering(true);
      }}
      onMouseLeave={() => {
        hoverTimeout.current = setTimeout(() => {
          setHovering(false);
        }, 300); // 300ms delay before hiding
      }}
    >
      <Image
        src={user.photoURL || bible}
        alt="Profile"
        width={40}
        height={40}
        className="w-10 h-10 rounded-full border cursor-pointer hover:opacity-80"
        title="Click to sign out"
      />
{hovering && (
  <div
    className="absolute top-full mt-2 right-0 bg-white text-gray-800 px-4 py-2 rounded shadow-lg text-sm z-50 cursor-pointer hover:bg-gray-100 whitespace-nowrap"
    onClick={() => signOut()}
  >
    Log out
  </div>
)}
    </div>
  );
}