// context/AuthContext.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, getIdToken, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthState {
  user: User | null
  idToken: string | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({
  user: null,
  idToken: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(firebaseUser)
    setLoading(false)

    if (firebaseUser) {
      const token = await getIdToken(firebaseUser)
      setIdToken(token)
    } else {
      setIdToken(null)
    }
  })

  return () => unsubscribe()
}, [])
  useEffect(() => {
  if (!user) return

  const refreshInterval = setInterval(async () => {
    const newToken = await user.getIdToken(true)
    setIdToken(newToken)
  }, 10 * 60 * 1000) // refresh every 10 minutes

  return () => clearInterval(refreshInterval)
}, [user])

  return (
    <AuthContext.Provider value={{ user, idToken, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
