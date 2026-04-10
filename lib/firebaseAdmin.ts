import * as admin from "firebase-admin";

const initAdmin = () => {
  if (admin.apps.length > 0) return admin.app();

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.SERVICE_CLIENT_EMAIL;
  const privateKey = process.env.SERVICE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin credentials missing. Server-side operations may fail.");
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Al ejecutar en local o en ciertos entornos, hay que manejar las nuevas líneas de la clave privada
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error("Firebase Admin Initialization Error:", error);
    return null;
  }
};

const app = initAdmin();

export const adminDb = app ? app.firestore() : null as any;
export const adminAuth = app ? app.auth() : null as any;
export const adminStorage = app ? app.storage() : null as any;
