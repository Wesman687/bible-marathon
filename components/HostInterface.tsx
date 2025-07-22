import { useEffect, useRef, useState } from 'react';
import {
  Room,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
  RemoteParticipant,
} from 'livekit-client';
import ViewerList from './ViewerList';

export function HostInterface() {
  const roomRef = useRef<Room | null>(null);
  const peerRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [viewerCount, setViewerCount] = useState(0);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    const connectAsHost = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/host-token`);
      const { token } = await res.json();
      const room = new Room();
      roomRef.current = room;

      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

      const videoTrack = await createLocalVideoTrack();
      const audioTrack = await createLocalAudioTrack();
      room.localParticipant.publishTrack(videoTrack);
      room.localParticipant.publishTrack(audioTrack);

      room.on('participantConnected', () => setViewerCount(room.numParticipants));
      room.on('participantDisconnected', () => setViewerCount(room.numParticipants));

      room.on('trackSubscribed', (track, publication, participant) => {
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
          label.textContent = participant.identity === 'host' ? 'Host' : participant.identity;
          label.className = 'mt-1 text-sm text-white';

          const micIndicator = document.createElement('span');
          micIndicator.className = 'text-xs text-green-400 mt-1';
          micIndicator.textContent = publication.isMuted ? '🔇 Muted' : '🎤 Mic On';

          container.appendChild(videoEl);
          container.appendChild(label);
          container.appendChild(micIndicator);
          document.getElementById('host-grid')?.appendChild(container);

          peerRefs.current.set(participant.identity, videoEl);
          track.attach(videoEl);
        }
      });
    };

    connectAsHost();
  }, []);


  return (
    <div className="p-4 flex ">
      <div
        id="host-grid"
        className=" w-[85vw] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4"
      ></div>

      <div className="w-[15vw] flex flex-col items-center">
        <div className="text-sm text-gray-300 bg-blue-700 w-full">👥 Viewers: {viewerCount}</div>
        <ViewerList isHost={true} />
      </div>
    </div>
  );
}
