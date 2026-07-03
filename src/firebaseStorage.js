import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';

const CLOUD_TEAM_ID = import.meta.env.VITE_TEAM_ID || 'default';

let firebaseApp = null;
let firebaseServices = null;
let authPromise = null;

const parseFirebaseConfig = () => {
  const rawConfig = import.meta.env.VITE_FIREBASE_CONFIG;

  if (rawConfig) {
    try {
      const parsed = JSON.parse(rawConfig);
      if (parsed?.apiKey && parsed?.projectId) return parsed;
    } catch (error) {
      console.warn('VITE_FIREBASE_CONFIGを読み込めませんでした。', error);
    }
  }

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  return config.apiKey && config.projectId ? config : null;
};

export const isCloudConfigured = () => Boolean(parseFirebaseConfig());

const getFirebaseServices = () => {
  if (!isCloudConfigured()) return null;
  if (firebaseServices) return firebaseServices;

  firebaseApp = firebaseApp || initializeApp(parseFirebaseConfig());
  firebaseServices = {
    auth: getAuth(firebaseApp),
    db: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
  return firebaseServices;
};

export const ensureCloudUser = async () => {
  const services = getFirebaseServices();
  if (!services) return null;
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      services.auth,
      async (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
          return;
        }

        try {
          const credential = await signInAnonymously(services.auth);
          resolve(credential.user);
        } catch (error) {
          authPromise = null;
          reject(error);
        }
      },
      (error) => {
        authPromise = null;
        reject(error);
      }
    );
  });

  return authPromise;
};

const clientDocPath = (clientKey, section, id = 'current') =>
  ['teams', CLOUD_TEAM_ID, 'clients', clientKey, section, id];

const dataUrlToExtension = (dataUrl = '') => {
  if (dataUrl.includes('image/svg+xml')) return 'svg';
  if (dataUrl.includes('image/jpeg')) return 'jpg';
  return 'png';
};

const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchDataUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`画像を取得できませんでした: ${response.status}`);
  return blobToDataUrl(await response.blob());
};

export const loadClientDraftFromCloud = async (clientKey) => {
  const services = getFirebaseServices();
  if (!services) return null;

  await ensureCloudUser();
  const snapshot = await getDoc(doc(services.db, ...clientDocPath(clientKey, 'drafts')));
  return snapshot.exists() ? snapshot.data()?.draft || null : null;
};

export const saveClientDraftToCloud = async (clientKey, draft) => {
  const services = getFirebaseServices();
  if (!services) return;

  await ensureCloudUser();
  await setDoc(
    doc(services.db, ...clientDocPath(clientKey, 'drafts')),
    {
      draft,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const loadArtworksFromCloud = async (clientKey) => {
  const services = getFirebaseServices();
  if (!services) return [];

  await ensureCloudUser();
  const snapshot = await getDocs(collection(services.db, ...clientDocPath(clientKey, 'artworks').slice(0, -1)));
  const artworks = await Promise.all(
    snapshot.docs.map(async (itemDoc) => {
      const data = itemDoc.data();
      let dataUrl = data.dataUrl || '';

      if (!dataUrl && data.downloadUrl) {
        try {
          dataUrl = await fetchDataUrl(data.downloadUrl);
        } catch (error) {
          console.warn(`${data.name || itemDoc.id}をクラウドから読み込めませんでした。`, error);
        }
      }

      return {
        id: data.id || itemDoc.id,
        name: data.name || itemDoc.id,
        type: data.type || 'image/png',
        dataUrl
      };
    })
  );

  return artworks.filter((artwork) => artwork.dataUrl);
};

export const saveArtworkToCloud = async (clientKey, artwork) => {
  const services = getFirebaseServices();
  if (!services || !artwork?.id || !artwork?.dataUrl) return;

  await ensureCloudUser();
  const extension = dataUrlToExtension(artwork.dataUrl);
  const storagePath = `teams/${CLOUD_TEAM_ID}/clients/${clientKey}/artworks/${artwork.id}.${extension}`;
  const storageRef = ref(services.storage, storagePath);

  await uploadString(storageRef, artwork.dataUrl, 'data_url');
  const downloadUrl = await getDownloadURL(storageRef);

  await setDoc(
    doc(services.db, ...clientDocPath(clientKey, 'artworks', artwork.id)),
    {
      id: artwork.id,
      name: artwork.name,
      type: artwork.type || (await dataUrlToBlob(artwork.dataUrl)).type || 'image/png',
      storagePath,
      downloadUrl,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const saveArtworksToCloud = async (clientKey, artworks) => {
  if (!isCloudConfigured() || !Array.isArray(artworks)) return;
  await Promise.all(artworks.map((artwork) => saveArtworkToCloud(clientKey, artwork)));
};

export const deleteArtworkFromCloud = async (clientKey, artwork) => {
  const services = getFirebaseServices();
  if (!services || !artwork?.id) return;

  await ensureCloudUser();
  const artworkDoc = doc(services.db, ...clientDocPath(clientKey, 'artworks', artwork.id));
  const snapshot = await getDoc(artworkDoc);
  const storagePath = snapshot.exists() ? snapshot.data()?.storagePath : null;

  await deleteDoc(artworkDoc);
  if (storagePath) {
    await deleteObject(ref(services.storage, storagePath)).catch((error) => {
      console.warn('Storage上のイラストを削除できませんでした。', error);
    });
  }
};
