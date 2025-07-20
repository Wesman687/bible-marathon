'use client'
import { useEffect, useState, useRef } from 'react'
import {
  Room,
  RemoteTrackPublication,
  RemoteParticipant,
  Track,
} from 'livekit-client'

export default function Viewer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [connected, setConnected] = useState(false)
  const [roomName, setRoomName] = useState('')
  const roomRef = useRef<Room | null>(null)

  const connectToLiveKit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stream/current`)
      const { token, room } = await res.json()
      setRoomName(room)

      const roomStream = new Room()
      roomRef.current = roomStream

      roomStream.on('trackSubscribed', (track, publication, participant) => {
        console.log(`📺 Track subscribed: ${track.kind} from ${participant.identity}`)
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current)
        }
      })

      roomStream.on('participantConnected', (participant) => {
        console.log(`👤 Participant joined: ${participant.identity}`)
      })



      await roomStream.connect('wss://bible-marathon-u8u03jr8.livekit.cloud', token)
      setConnected(true)



    } catch (err) {
      console.error('Viewer failed to connect to LiveKit', err)
      setConnected(false)
    }
  }

  useEffect(() => {
    connectToLiveKit()

    const intervalId = setInterval(() => {
      if (!connected) connectToLiveKit()
    }, 8000)

    return () => {
      clearInterval(intervalId)
      roomRef.current?.disconnect()
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [connected])

  return (
    <div className="text-center">
      <h1 className="text-xl font-semibold mb-4">
        📖 Live Reader {roomName ? `(${roomName})` : '0'}
      </h1>

      <div className="w-full max-w-[720px] aspect-video bg-black/80 rounded shadow mx-auto overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full rounded"
        />
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {connected
          ? '📺 Connected to live room!'
          : '⏳ Connecting to stream...'}
      </p>
    </div>
  )
}
