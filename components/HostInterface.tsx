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
  const hasConnected = useRef(false);

  useEffect(() => {
    const connectAsHost = async () => {
      if (hasConnected.current) return;
      hasConnected.current = true;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/host-token`);
      const { token } = await res.json();
      const room = new Room();
      roomRef.current = room;

      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);

      const videoTrack = await createLocalVideoTrack();
      const audioTrack = await createLocalAudioTrack();
      room.localParticipant.publishTrack(videoTrack);
      room.localParticipant.publishTrack(audioTrack);

      const localVideoEl = document.createElement('video');
      localVideoEl.autoplay = true;
      localVideoEl.muted = true;
      localVideoEl.playsInline = true;
      localVideoEl.className = 'w-full max-w-md rounded-lg shadow bg-black';
      document.getElementById('host-grid')?.appendChild(localVideoEl);
      videoTrack.attach(localVideoEl);

      room.on('participantConnected', () => setViewerCount(room.numParticipants));
      room.on('participantDisconnected', () => setViewerCount(room.numParticipants));

      room.on('trackSubscribed', async (track, publication, participant) => {
  if (participant.identity === room.localParticipant.identity) return;
  if (track.kind !== 'video') return;

  let container = document.getElementById(`video-container-${participant.identity}`);
  if (!container) {
    container = document.createElement('div');
    container.id = `video-container-${participant.identity}`;
    container.className = 'flex flex-col items-center';

    const videoEl = document.createElement('video');
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.className = 'w-full max-w-md rounded-lg shadow bg-black';

    // Fetch real name from backend
    let nameLabel = participant.identity;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/name/${participant.identity}`);
      const data = await res.json();
      if (data.name) nameLabel = data.name;
    } catch (err) {
      console.warn("Couldn't fetch viewer name", err);
    }

    const label = document.createElement('div');
    label.textContent = nameLabel;
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
        className=" w-[85vw] flex flex-wrap items-center justify-center gap-4"
      ></div>

      <div className="w-[15vw] flex flex-col items-center">
        <div className="text-sm text-gray-300 bg-blue-700 w-full">👥 Viewers: {viewerCount}</div>
        <ViewerList isHost={true} />
      </div>
    </div>
  );
}
