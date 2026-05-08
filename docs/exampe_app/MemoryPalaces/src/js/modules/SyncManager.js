/**
 * SyncManager – Cloud synchronisation via Firebase Firestore + Google Auth.
 *
 * Sync strategy:
 *  • On sign-in  → merge local ↔ cloud (most-recent updatedAt wins per palace;
 *                  highest practiceCount wins per practice session).
 *  • On create / update palace → upload that palace to Firestore.
 *  • On delete palace          → remove it from Firestore.
 *  • On record practice        → upload the whole sessions map.
 *  • Manual pull               → download cloud data and merge locally.
 */
import { FIREBASE_CONFIG, IS_FIREBASE_CONFIGURED } from './firebase-config.js';
import { Logger } from './Logger.js';

/**
 * Firebase SDK version — pinned for reproducibility.
 *
 * SRI NOTE: Dynamic `import()` does not support `integrity` attributes
 * (no browser has shipped this as of March 2026). As a compensating control
 * we (a) pin the exact version, (b) verify the SDK self-reports the expected
 * version after loading, and (c) serve the page with a strict CSP that only
 * allows scripts from `https://www.gstatic.com` (see vercel.json & index.html).
 *
 * If/when Import Maps gain `integrity` support (TC39 proposal), migrate to that.
 * Alternatively, vendor the Firebase modules into the repo for true SRI via
 * `<script type="module" integrity="...">`.
 */
const FB_VER = '11.6.0';
const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}`;

export class SyncManager {
  constructor() {
    this.isConfigured = IS_FIREBASE_CONFIGURED;
    this.isReady = false;
    this.initFailed = false;
    this.user = null;
    this.db = null;
    this.auth = null;
    this._fb = {};
    this._authCallbacks = [];

    if (this.isConfigured) {
      /* c8 ignore next */
      void this._init();
    }
  }

  /* ─── Initialisation ──────────────────────────────────────────────────── */

  /* c8 ignore start -- Firebase SDK loaded from CDN; covered by integration tests */
  async _init() {
    try {
      const [
        { initializeApp },
        {
          getAuth,
          GoogleAuthProvider,
          signInWithPopup,
          signInWithRedirect,
          getRedirectResult,
          signOut,
          onAuthStateChanged,
        },
        { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, writeBatch },
      ] = await Promise.all([
        import(`${FB_BASE}/firebase-app.js`),
        import(`${FB_BASE}/firebase-auth.js`),
        import(`${FB_BASE}/firebase-firestore.js`),
      ]);

      // Store helpers for later use
      Object.assign(this._fb, {
        GoogleAuthProvider,
        signInWithPopup,
        signInWithRedirect,
        getRedirectResult,
        signOut,
        collection,
        doc,
        setDoc,
        getDoc,
        getDocs,
        deleteDoc,
        writeBatch,
      });

      const app = initializeApp(FIREBASE_CONFIG);

      // Runtime SDK version check — compensating control for missing SRI.
      // Firebase app exposes SDK_VERSION; abort if it doesn't match the pinned version.
      const sdkVersion = app?.options?._sdkVersion ?? app?.SDK_VERSION;
      if (typeof sdkVersion === 'string' && !sdkVersion.includes(FB_VER)) {
        Logger.error('Firebase SDK version mismatch', { expected: FB_VER, got: sdkVersion });
        this.initFailed = true;
        return;
      }

      this.auth = getAuth(app);
      this.db = getFirestore(app);
      this.isReady = true;

      // Completes pending redirect sign-in flows on mobile/popup-restricted browsers.
      await this._fb.getRedirectResult(this.auth).catch(() => null);

      onAuthStateChanged(this.auth, (user) => {
        this.user = user;
        this._authCallbacks.forEach((cb) => cb(user));
      });
    } catch (err) {
      Logger.error('Firebase init failed', { error: String(err) });
      this.initFailed = true;
    }
  }
  /* c8 ignore stop */

  /* ─── Auth ────────────────────────────────────────────────────────────── */

  onAuthStateChange(cb) {
    this._authCallbacks.push(cb);
  }

  isSignedIn() {
    return !!this.user;
  }

  getUserInfo() {
    if (!this.user) return null;
    return {
      name: this.user.displayName,
      email: this.user.email,
      photoURL: this.user.photoURL,
      uid: this.user.uid,
    };
  }

  async signIn() {
    if (!this.isReady) throw new Error('Firebase not ready');
    const provider = new this._fb.GoogleAuthProvider();
    try {
      await this._fb.signInWithPopup(this.auth, provider);
    } catch (err) {
      const code = err?.code || '';
      const shouldFallback =
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment';

      if (shouldFallback) {
        await this._fb.signInWithRedirect(this.auth, provider);
        return;
      }
      throw err;
    }
  }

  async signOut() {
    if (!this.isReady) return;
    await this._fb.signOut(this.auth);
  }

  /* ─── Single-palace operations ────────────────────────────────────────── */

  async uploadPalace(palace) {
    if (!this._canSync()) return false;
    try {
      const ref = this._palaceRef(palace.id);
      await this._fb.setDoc(ref, palace);
      return true;
    } catch (err) {
      Logger.error('uploadPalace failed', { error: String(err) });
      return false;
    }
  }

  async removeCloudPalace(id) {
    if (!this._canSync()) return false;
    try {
      await this._fb.deleteDoc(this._palaceRef(id));
      await this._setDeletionEntry(id, new Date().toISOString());
      return true;
    } catch (err) {
      Logger.error('removeCloudPalace failed', { error: String(err) });
      return false;
    }
  }

  /* ─── Sessions ────────────────────────────────────────────────────────── */

  async uploadSessions(sessions) {
    if (!this._canSync()) return false;
    try {
      const ref = this._fb.doc(this.db, 'users', this.user.uid, 'data', 'sessions');
      await this._fb.setDoc(ref, { sessions, updatedAt: new Date().toISOString() });
      return true;
    } catch (err) {
      Logger.error('uploadSessions failed', { error: String(err) });
      return false;
    }
  }

  /* ─── Full merge sync ─────────────────────────────────────────────────── */

  /**
   * Download cloud data, merge with local, re-upload merged result.
   * Returns { palaces, sessions } merged object, or null on failure.
   */
  async fullSync(localPalaces, localSessions) {
    if (!this._canSync()) return null;

    try {
      const [cloudPalaces, cloudSessions] = await Promise.all([
        this._loadCloudPalaces(),
        this._loadCloudSessions(),
      ]);
      const deletionMap = await this._loadDeletionMap();

      // ── Merge palaces ──────────────────────────────────────────────────
      const mergedMap = new Map();

      for (const local of localPalaces) {
        const deletedAt = deletionMap[local.id];
        const localTs = new Date(local.updatedAt || local.createdAt || 0).getTime();
        const deletedTs = deletedAt ? new Date(deletedAt).getTime() : 0;
        if (!deletedAt || localTs > deletedTs) {
          mergedMap.set(local.id, local);
        }
      }

      for (const cp of cloudPalaces) {
        const deletedAt = deletionMap[cp.id];
        if (deletedAt) continue;

        if (!mergedMap.has(cp.id)) {
          mergedMap.set(cp.id, cp);
        } else {
          const local = mergedMap.get(cp.id);
          const localTs = new Date(local.updatedAt || local.createdAt || 0).getTime();
          const cloudTs = new Date(cp.updatedAt || cp.createdAt || 0).getTime();
          if (cloudTs > localTs) mergedMap.set(cp.id, cp);
        }
      }
      const mergedPalaces = [...mergedMap.values()];

      // If a palace exists again after a delete tombstone, clear that tombstone.
      const revivedIds = mergedPalaces
        .map((p) => p.id)
        .filter((id) => Object.prototype.hasOwnProperty.call(deletionMap, id));
      if (revivedIds.length > 0) {
        await this._removeDeletionEntries(revivedIds);
      }

      // ── Merge sessions ─────────────────────────────────────────────────
      const mergedSessions = { ...localSessions };
      if (cloudSessions) {
        for (const [palaceId, cs] of Object.entries(cloudSessions)) {
          const ls = mergedSessions[palaceId];
          if (!ls || (cs.practiceCount || 0) > (ls.practiceCount || 0)) {
            mergedSessions[palaceId] = cs;
          }
        }
      }

      // ── Re-upload merged result ────────────────────────────────────────
      await Promise.all([
        this._uploadAllPalaces(mergedPalaces),
        this.uploadSessions(mergedSessions),
      ]);

      return { palaces: mergedPalaces, sessions: mergedSessions };
    } catch (err) {
      Logger.error('fullSync failed', { error: String(err) });
      return null;
    }
  }

  /* ─── Private helpers ─────────────────────────────────────────────────── */

  _canSync() {
    return this.isReady && this.isSignedIn();
  }

  _palaceRef(id) {
    return this._fb.doc(this.db, 'users', this.user.uid, 'palaces', id);
  }

  async _loadCloudPalaces() {
    const col = this._fb.collection(this.db, 'users', this.user.uid, 'palaces');
    const snap = await this._fb.getDocs(col);
    return snap.docs.map((d) => d.data());
  }

  async _loadCloudSessions() {
    try {
      const ref = this._fb.doc(this.db, 'users', this.user.uid, 'data', 'sessions');
      const snap = await this._fb.getDoc(ref);
      return snap.exists() ? snap.data().sessions : {};
    } catch {
      return {};
    }
  }

  async _loadDeletionMap() {
    try {
      const ref = this._fb.doc(this.db, 'users', this.user.uid, 'data', 'deletions');
      const snap = await this._fb.getDoc(ref);
      return snap.exists() ? snap.data().palaceDeletedAt || {} : {};
    } catch {
      return {};
    }
  }

  async _setDeletionEntry(id, deletedAtIso) {
    const ref = this._fb.doc(this.db, 'users', this.user.uid, 'data', 'deletions');
    const current = await this._loadDeletionMap();
    current[id] = deletedAtIso;
    await this._fb.setDoc(ref, { palaceDeletedAt: current }, { merge: true });
  }

  async _removeDeletionEntries(ids) {
    if (!ids.length) return;
    const ref = this._fb.doc(this.db, 'users', this.user.uid, 'data', 'deletions');
    const current = await this._loadDeletionMap();
    ids.forEach((id) => {
      delete current[id];
    });
    await this._fb.setDoc(ref, { palaceDeletedAt: current }, { merge: true });
  }

  async _uploadAllPalaces(palaces) {
    if (!palaces.length) return;
    // Firestore batch limit = 500 writes; chunk by 400 to be safe
    for (let i = 0; i < palaces.length; i += 400) {
      const batch = this._fb.writeBatch(this.db);
      palaces.slice(i, i + 400).forEach((p) => {
        batch.set(this._palaceRef(p.id), p);
      });
      await batch.commit();
    }
  }
}
