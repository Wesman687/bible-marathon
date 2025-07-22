import { useEffect, useRef, useState } from 'react';
import { createLocalAudioTrack, createLocalVideoTrack, RemoteParticipant, RemoteTrackPublication, Room, Track } from 'livekit-client';
import { GuestJoinModal } from './GuestJoinModal';
import { signInWithGoogle } from '@/lib/firebase.auth';
import { useAuth } from '@/lib/AuthContext';

export function ViewerInterface() {
    const [wantsToJoin, setWantsToJoin] = useState(false);
    const [showModal, setShowModal] = useState(true); // always show modal first
    const videoRef = useRef<HTMLVideoElement>(null);
    const roomRef = useRef<Room | null>(null);
    const { user } = useAuth();
    const [displayName, setName] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [joinedStream, setJoinedStream] = useState<boolean>(false)
    const peerRefs = useRef<Map<string, HTMLVideoElement>>(new Map());


    const raiseHand = async () => {
        const identity = roomRef?.current?.localParticipant.identity
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/request-to-stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity }),
        });
        setWantsToJoin(!wantsToJoin);
    };

    const joinStream = async (identity: string) => {
        if (!roomRef.current) return;
        await disconnectViewer();

        // get upgraded token from backendf
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/approved-viewer-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity }),
        });
        const { token } = await res.json();

        const room = new Room();
        roomRef.current = room;

        room.on('trackSubscribed', handleTrackSubscribed);

        await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
        setIsConnected(true);


        const videoTrack = await createLocalVideoTrack();
        const audioTrack = await createLocalAudioTrack();

        await roomRef.current.localParticipant.publishTrack(videoTrack);
        await roomRef.current.localParticipant.publishTrack(audioTrack);

        // Create a video element for this viewer
        let videoEl = peerRefs.current.get(identity);
        if (!videoEl) {
            videoEl = document.createElement('video');
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.muted = true; // prevent audio feedback
            videoEl.className = 'w-full max-w-md rounded-lg shadow bg-black';
            document.getElementById('viewer-grid')?.appendChild(videoEl);
            peerRefs.current.set(identity, videoEl);
        }

        videoTrack.attach(videoEl);
        setJoinedStream(true)
    };
    const handleViewerRegistration = async () => {
        let identity = roomRef.current?.localParticipant.identity;

        // If not connected yet, connect and wait for identity
        if (!identity) {
            await connectAsViewer();
            identity = roomRef.current?.localParticipant.identity;
            console.log("identity: ", identity);
        }   

        if (!displayName) {
            console.error("displayName");
            return;
        }

        const email = user?.email || "guest@email.com";

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/register-viewer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity, displayName, email }),
        });
    };

    const handleTrackSubscribed = (
        track: Track,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
    ) => {
        if (participant.identity === roomRef.current?.localParticipant.identity) return;
        if (track.kind === Track.Kind.Video) {
            let videoEl = peerRefs.current.get(participant.identity);
            if (!videoEl) {
                videoEl = document.createElement('video');
                videoEl.autoplay = true;
                videoEl.playsInline = true;
                videoEl.className = 'w-full max-w-md rounded-lg shadow bg-black';
                document.getElementById('viewer-grid')?.appendChild(videoEl);
                peerRefs.current.set(participant.identity, videoEl);
            }
            track.attach(videoEl);
        } else if (track.kind === Track.Kind.Audio) {
            const audioEl = track.attach();
            audioEl.autoplay = true;
            audioEl.controls = false;
            document.body.appendChild(audioEl);
            audioEl.play().catch(() => {
                console.warn('Audio playback blocked until user interacts.');
            });
        }
    };
useEffect(() => {
    if (displayName) {
        handleViewerRegistration();
    }
}, [displayName]);

    const connectAsViewer = async () => {
        const email = user?.email || "guest@email.com"
        const useName = displayName || user?.displayName || "Guest"
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/viewer-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName: useName, email }),
            });

            const { token, name } = await res.json();
            setName(name)
            const room = new Room();
            roomRef.current = room;


            room.on('trackSubscribed', handleTrackSubscribed);

            room.on('disconnected', () => setIsConnected(false));
            room.on('connectionStateChanged', (state) => {
                if (state === 'connected') setIsConnected(true);
                else if (state === 'disconnected') setIsConnected(false);
            });

            await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
            setIsConnected(true);

            if (user) {
                setName(user.displayName)
            } else {
                const savedName = localStorage.getItem('guestDisplayName') || '';
                if (savedName) {
                    setName(savedName)
                } else {
                    setShowModal(true);
                }
            }
        } catch (err) {
            setIsConnected(false);
        }
    };


    const disconnectViewer = () => {
        roomRef.current?.disconnect();
        roomRef.current = null;
        peerRefs.current.clear();
        const container = document.getElementById('viewer-grid');
        if (container) container.innerHTML = '';
        setIsConnected(false);
    };

    const toggleConnection = () => {
        if (isConnected) {
            disconnectViewer();
        } else {
            connectAsViewer();
        }
    };
    useEffect(() => {
        if (!isConnected || !roomRef.current) return;

        const interval = setInterval(async () => {
            const identity = roomRef?.current?.localParticipant.identity;
            if (!identity) return;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/can-join/${identity}`);
            const data = await res.json();

            if (data.canJoin && !data.isJoined) {
              clearInterval(interval);
              await joinStream(identity);
            }
        }, 3000); // poll every 3 seconds

        return () => clearInterval(interval);
    }, [isConnected]);
    return (
        <div className="p-4  flex items-center justify-center flex-col">
            <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold">👀 Viewer Interface</h2>
                <h3 className="text-lg font-semibold text-white">{displayName}</h3>
                <div
                    className={`w-3 h-3 rounded-full ${isConnected ? "bg-red-500" : "bg-red-900"
                        }`}
                    title={isConnected ? "Connected" : "Disconnected"}
                ></div>
                {!isConnected && (
                    <span className="text-sm text-red-400">(disconnected)</span>
                )}
                <button
                    onClick={toggleConnection}
                    className="ml-auto text-xs text-white bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
                >
                    {isConnected ? "Disconnect" : "Reconnect"}
                </button>
            </div>

            <p>You are currently watching the live broadcast.</p>
            <div
                id="viewer-grid"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4"
            >
                {joinedStream && (
                    <video
                        autoPlay
                        playsInline
                        muted
                        ref={videoRef}
                        className="w-full max-w-md rounded-lg shadow bg-black"
                    />
                )}
            </div>

            <div className="mt-6">
                <button
                    onClick={raiseHand}
                    className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded"
                >
                    {wantsToJoin
                        ? "Requested Join / Cancel"
                        : "✋ Raise Hand / Request to Join"}
                </button>
                {joinedStream && (
                    <div className="mt-2">
                        <button
                            onClick={async () => {
                                const identity = roomRef.current?.localParticipant.identity;
                                const localParticipant = roomRef.current?.localParticipant;
                                if (localParticipant) {
                                    const tracks = Array.from(
                                        localParticipant.trackPublications.values()
                                    )
                                        .map((pub) => pub.track)
                                        .filter((track) => !!track);
                                    await localParticipant.unpublishTracks(tracks);
                                }
                                const videoEl = peerRefs.current.get(identity || "");
                                if (videoEl) {
                                    videoEl.remove();
                                    peerRefs.current.delete(identity || "");
                                }
                                setJoinedStream(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                        >
                            ❌ Leave Stream
                        </button>
                    </div>
                )}
            </div>

            {!user && (
                <div className="mt-6 bg-white/80 p-6 rounded-lg shadow text-gray-700">
                    <p className="mb-4 font-medium text-lg">
                        Please sign in with your Google account to access camera and
                        streaming features.
                    </p>
                    <button
                        onClick={async () => {
                            try {
                                const { user } = await signInWithGoogle();
                                alert(`Welcome, ${user.displayName}!`);
                            } catch {
                                alert("Google sign-in failed.");
                            }
                        }}
                        className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                    >
                        Sign in with Google
                    </button>
                </div>
            )}
            {showModal && (
                <GuestJoinModal
                    name={user?.displayName || ""}
                    setName={setName}
                    onClose={() => {
                        setShowModal(false)
                }}

                />
            )}
        </div>
    );
}