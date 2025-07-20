/* === app/stage/page.tsx === */
'use client'
import ModalMessage from '@/components/modals/ModalMessage';
import { useAuth } from '@/lib/AuthContext';
import { signInWithGoogle } from '@/lib/firebase.auth';
import { Dialog } from '@headlessui/react';
import { useEffect, useRef, useState } from 'react'
import { createLocalAudioTrack, createLocalVideoTrack, Room } from 'livekit-client';

export default function Stage() {
  const vid = useRef<HTMLVideoElement>(null)
  const { user, idToken } = useAuth()
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedURL, setRecordedURL] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [recording, setRecording] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(15)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const playbackRef = useRef<HTMLVideoElement | null>(null)
  const recordingChunks = useRef<Blob[]>([])
  const [modalMsg, setModalMsg] = useState<string | null>(null)
  const [showMsgModal, setShowMsgModal] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [room, setRoom] = useState('')

  useEffect(() => {

    navigator.mediaDevices.enumerateDevices().then(devices => {
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'))
      setAudioDevices(devices.filter(d => d.kind === 'audioinput'))
    })

  }, [])
  
  useEffect(() => {
    if (!stream) return

    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setAudioLevel(avg / 256)
      requestAnimationFrame(updateVolume)
    }

    updateVolume()

    // CLEANUP
    return () => {
      // Closing the audio context safely
      audioCtx.close().catch(err => {
        console.error('Failed to close audio context', err)
      })
    }
  }, [stream])


  const startPreview = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideo ? { deviceId: selectedVideo } : true,
        audio: selectedAudio ? { deviceId: selectedAudio } : true,
      })
      if (vid.current) vid.current.srcObject = userStream
      setStream(userStream)
    } catch (err) {
      alert('Camera / mic permission denied.')
      console.error(err)
    }
  }

  const stopPreview = () => {
    stream?.getTracks().forEach(track => track.stop())
    if (vid.current) vid.current.srcObject = null
    setStream(null)
    setAudioLevel(0)
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setRecording(false)
    setCountdown(15)

    // Clean up previous URL if needed
    if (recordedURL) {
      URL.revokeObjectURL(recordedURL)
      setRecordedURL(null)
    }
  }
const startStream = async () => {
  if (!user) return showMessage("❌ Not signed in.");

  const token = await user.getIdToken(true); // force refresh

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    const data = await res.json();
    showMessage("✅ Stream started!");
    setStreaming(true);    
    setRoom(data.room);
    await connectToRoom(data.token)
  } else {
    showMessage("❌ Failed to start stream.");
  }
};

async function connectToRoom(token: string) {
  const room = new Room();

  await room.connect("wss://bible-marathon-u8u03jr8.livekit.cloud", token);

  // Publish microphone
  const micTrack = await createLocalAudioTrack();
  await room.localParticipant.publishTrack(micTrack);

const videoTrack = await createLocalVideoTrack({
  facingMode: "user", // optional
});
await room.localParticipant.publishTrack(videoTrack);

// Show your video in the preview
if (vid.current) {
  vid.current.srcObject = new MediaStream([videoTrack.mediaStreamTrack]);
}
  console.log("✅ Connected and published mic");
  room.on('trackPublished', (pub, participant) => {
  console.log(`🎙️ Track published by ${participant.identity}:`, pub);
});
  room.on('participantConnected', (participant) => {
    console.log(`🔵 ${participant.identity} joined`);
  });
  room.on('trackSubscribed', (track, publication, participant) => {
  console.log(`✅ Subscribed to track from ${participant.identity}`, track);

  if (track.kind === 'video' && vid.current) {
    vid.current.srcObject = new MediaStream([track.mediaStreamTrack]);
  }
});

  return room;
}
  const stopStream = async () => {
    if (!user) return showMessage("❌ Not signed in.");

    const token = await user.getIdToken(true); // force refresh
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // ✅ needed to avoid 422
    })

    if (res.ok) {
      showMessage("✅ Stream stopped!");
      setStreaming(false)
    } else {
      showMessage("Failed to stop stream.");
    }
  };

  const showMessage = (msg: string) => {
    setModalMsg(msg)
    setShowMsgModal(true)
  }

  const handleClose = () => {
    setShowMsgModal(false)
    setModalMsg(null)
  }
  const testRecording = () => {
    if (!stream || recording) return

    const recorder = new MediaRecorder(stream)
    recordingChunks.current = [] // reset chunks

    recorder.ondataavailable = e => recordingChunks.current.push(e.data)

    recorder.onstop = () => {
      const blob = new Blob(recordingChunks.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setRecordedURL(url)
      setShowModal(true)
      setRecording(false)
    }

    recorder.start()
    setMediaRecorder(recorder)
    setRecording(true)

    let timeLeft = 15
    setCountdown(timeLeft)
    countdownIntervalRef.current = setInterval(() => {
      timeLeft--
      setCountdown(timeLeft)
      if (timeLeft <= 0) {
        stopRecording()
      }
    }, 1000)
  }



  return (
    <div className="w-full max-w-6xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Reader Staging Room {room}</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <video
            ref={vid}
            playsInline
            autoPlay
            className="w-full aspect-video bg-black/80 object-cover rounded-lg shadow mb-2"
          />
          {stream && (
            <div className="h-2 bg-green-400 rounded-full mb-2" style={{ width: `${audioLevel * 100}%` }} title="Mic level"></div>
          )}
        </div>

        <div className="w-full md:w-80 text-left bg-white/90 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>

          <label className="block mb-2 font-medium">Camera Source:</label>
          <select
            value={selectedVideo || ''}
            onChange={e => setSelectedVideo(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          >
            <option value="">Default</option>
            {videoDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>{device.label || 'Camera'}</option>
            ))}
          </select>

          <label className="block mb-2 font-medium">Microphone Source:</label>
          <select
            value={selectedAudio || ''}
            onChange={e => setSelectedAudio(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          >
            <option value="">Default</option>
            {audioDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>{device.label || 'Microphone'}</option>
            ))}
          </select>

          {stream && (
            <div className="space-y-2">
              <button
                onClick={testRecording}
                disabled={recording}
                className="w-full px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
              >
                {recording ? `Recording... (${countdown}s)` : 'Test Mic & Camera (15s)'}
              </button>
              {recording && (
                <button
                  onClick={stopRecording}
                  className="w-full px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Stop Early
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {!user ? (
          <div className="bg-white/80 p-6 rounded-lg shadow text-gray-700">
            <p className="mb-4 font-medium text-lg">
              Please sign in with your Google account to access camera and streaming features.
            </p>
            <button
              onClick={async () => {
                try {
                  const { user, idToken } = await signInWithGoogle()
                  // Optional: Store `idToken` or trigger any post-login action here
                  alert(`Welcome, ${user.displayName}!`)
                } catch {
                  alert("Google sign-in failed.")
                }
              }}
              className="px-6 py-2 rounded-full bg-brandBlue text-white font-semibold shadow hover:bg-brandBlue/90 transition"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-lg font-medium">Hi, {user.displayName || user.email}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {!stream ? (
                <button
                  onClick={startPreview}
                  className="px-5 py-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"
                >
                  Start Camera Preview
                </button>
              ) : (
                <button
                  onClick={stopPreview}
                  className="px-5 py-2 rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                >
                  Stop Camera Preview
                </button>
              )}
              {!streaming ? <button
                onClick={() => startStream()}
                className="px-5 py-2 rounded-full bg-orange-500 text-white shadow hover:bg-orange-600"
              >
                Go Live
              </button> :
                <button
                  onClick={() => stopStream()}
                  className="px-5 py-2 rounded-full bg-orange-500 text-white shadow hover:bg-orange-600"
                >
                  Stop Live
                </button>}

            </div>
           
          </div>
        )}
      </div>
      <ModalMessage message={modalMsg} show={showMsgModal} onClose={handleClose} />
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center">
          <Dialog.Panel className="bg-white rounded-lg p-6 shadow-xl max-w-2xl w-full">
            <Dialog.Title className="text-xl font-bold mb-4">Playback Test</Dialog.Title>
            {recordedURL && (
              <video
                ref={playbackRef}
                src={recordedURL}
                controls
                className="w-full rounded border border-gray-300"
              />
            )}
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => {
                  if (playbackRef.current) {
                    playbackRef.current.currentTime = 0
                    playbackRef.current.play()
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Replay
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
