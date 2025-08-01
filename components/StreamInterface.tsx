import { useEffect, useRef, useState } from 'react';
import {
  Room,
  Track,
  RemoteParticipant,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from 'livekit-client';
import { useStreamSocket } from '@/hooks/useStreamSocket';
import ViewerList from './ViewerList';
import { GuestJoinModal } from './GuestJoinModal';

export function StreamInterface() {
  const roomRef = useRef<Room | null>(null);
  const peerRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const [identity, setIdentity] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [canStream, setCanStream] = useState(false);
  const [showModal, setShowModal] = useState(true);

  const { emit, latestEvent } = useStreamSocket(identity ?? 'anon', (event, payload) => {
    if (event === 'permission') {
      setCanStream(payload.canStream);
    }
  });

  const connectToRoom = async (identity: string, isHost: boolean) => {
    const tokenRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/stream/${isHost ? 'host-token' : 'viewer-token'}`,
      {
        method: isHost ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isHost
          ? undefined
          : JSON.stringify({
              displayName: identity,
              email: null,
            }),
      }
    );

    const tokenData = await tokenRes.json();
    const finalToken = tokenData.token;
    const finalIdentity = isHost ? tokenData.identity ?? identity : tokenData.name;

    const room = new Room();
    roomRef.current = room;
    setIdentity(finalIdentity);
    await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, finalToken);

    if (isHost || canStream) {
      const videoTrack = await createLocalVideoTrack();
      const audioTrack = await createLocalAudioTrack();
      room.localParticipant.publishTrack(videoTrack);
      room.localParticipant.publishTrack(audioTrack);

      const videoEl = document.createElement('video');
      videoEl.autoplay = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.className = 'w-full max-w-md rounded-lg shadow bg-black';
      document.getElementById('stream-grid')?.appendChild(videoEl);
      videoTrack.attach(videoEl);
    }

    room.on('trackSubscribed', async (track, publication, participant) => {
      if (participant.identity === room.localParticipant.identity) return;

      let container = document.getElementById(`video-container-${participant.identity}`);
      if (!container) {
        container = document.createElement('div');
        container.id = `video-container-${participant.identity}`;
        container.className = 'flex flex-col items-center';

        const videoEl = document.createElement('video');
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.className = 'w-full max-w-md rounded-lg shadow bg-black';

        const label = document.createElement('div');
        label.className = 'mt-1 text-sm text-white';
        label.textContent = participant.identity;

        const micIndicator = document.createElement('span');
        micIndicator.className = 'text-xs text-green-400 mt-1';
        micIndicator.textContent = publication.isMuted ? '🔇 Muted' : '🎤 Mic On';

        container.appendChild(videoEl);
        container.appendChild(label);
        container.appendChild(micIndicator);
        document.getElementById('stream-grid')?.appendChild(container);

        peerRefs.current.set(participant.identity, videoEl);
        track.attach(videoEl);

        // Fetch display name from backend
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/name/${participant.identity}`);
          const data = await res.json();
          if (data.name) label.textContent = data.name;
        } catch (err) {
          console.warn('Name fetch failed:', err);
        }
      }
    });
  };

  const handleViewerRegistration = async (name: string, isHost: boolean) => {
    setShowModal(false);
    setIsHost(isHost);
    await connectToRoom(name, isHost);
  };

  return (
    <div className="p-4 flex">
      <div id="stream-grid" className="w-[85vw] flex flex-wrap items-center justify-center gap-4"></div>

      <div className="w-[15vw] flex flex-col items-center">
        {identity && <ViewerList isHost={isHost} emit={emit} latestEvent={latestEvent} />}
      </div>

      {showModal && (
        <GuestJoinModal
          name={null}
          onClose={() => setShowModal(false)}
          handleViewerRegistration={handleViewerRegistration}
        />
      )}
    </div>
  );
}
