import { getAuth, getIdToken, GoogleAuthProvider, signInWithPopup } from "firebase/auth"



export const signInWithGoogle = async () => {
  const auth = getAuth()
  const provider = new GoogleAuthProvider()

  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const idToken = await getIdToken(user)

    console.log("✅ Signed in:", user.displayName)
    console.log("🔐 ID Token:", idToken)

    return { user, idToken }
  } catch (err) {
    console.error("❌ Sign-in failed:", err)
    throw err
  }
}