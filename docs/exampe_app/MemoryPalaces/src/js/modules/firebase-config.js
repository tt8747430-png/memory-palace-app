/**
 * Firebase client-side configuration.
 *
 * SECURITY NOTE: This API key is a *client identifier*, not a secret.
 * By Firebase design it is safe to include in client-side code.
 * Actual data security is enforced by Firestore Security Rules which
 * should restrict reads/writes to `request.auth.uid == resource.data.uid`.
 * Never rely on client-side code to enforce access control.
 *
 * @see https://firebase.google.com/docs/projects/api-keys
 */
// Firebase v11 modular config — measurementId is optional
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAJX-eNuUrAHSbnQ3S5vnN0_SSaPqJ0joE',
  authDomain: 'memory-palace-test.firebaseapp.com',
  projectId: 'memory-palace-test',
  storageBucket: 'memory-palace-test.firebasestorage.app',
  messagingSenderId: '822262869598',
  appId: '1:822262869598:web:0539d3837e45fc60320ecf',
  measurementId: 'G-4BEZ8V6F8W',
};

/** Required fields for Firebase client setup (measurementId is optional). */
const REQUIRED_FIREBASE_FIELDS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

/** True when all required Firebase config values are present and non-empty. */
export const IS_FIREBASE_CONFIGURED = REQUIRED_FIREBASE_FIELDS.every(
  (field) => typeof FIREBASE_CONFIG[field] === 'string' && FIREBASE_CONFIG[field].trim().length > 0,
);
