import { getAuth, getIdToken, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";

export const signInWithGoogle = async () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const idToken = await getIdToken(user);

    console.log("✅ Signed in:", user.displayName);
    console.log("🔐 ID Token:", idToken);

    return { user, idToken };
  } catch (err) {
    console.error("❌ Sign-in failed:", err);
    throw err;
  }
};

export const signOut = async () => {
  const auth = getAuth();
  try {
    await firebaseSignOut(auth);
    console.log("👋 Signed out successfully");
  } catch (err) {
    console.error("❌ Sign-out failed:", err);
  }
};
