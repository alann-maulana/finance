import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as _firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();
// Always prompt account selection so users can switch accounts
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Opens a Google sign-in popup and returns the authenticated user.
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs out the current user from Firebase.
 */
export async function signOut(): Promise<void> {
  await _firebaseSignOut(auth);
}

export { auth };
