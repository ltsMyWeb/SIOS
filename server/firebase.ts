import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type ServiceAccountConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function readServiceAccountFromEnv(): ServiceAccountConfig | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
        };
      }
    } catch (error) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function isFirebaseConfigured() {
  return readServiceAccountFromEnv() !== null;
}

export function describeFirebaseIssue(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("firestore.googleapis.com") ||
    message.includes("Cloud Firestore API has not been used") ||
    message.includes("PERMISSION_DENIED")
  ) {
    return "Firestore is not enabled for this Firebase project yet. Turn on Firestore in the Firebase console, then refresh the app.";
  }
  if (message.includes("Could not load the default credentials")) {
    return "Firebase credentials are invalid or incomplete. Update the service account settings and restart the app.";
  }
  return null;
}

export function getFirestoreDb(): Firestore | null {
  const credentials = readServiceAccountFromEnv();
  if (!credentials) return null;

  if (!getApps().length) {
    initializeApp({
      credential: cert(credentials),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  return getFirestore();
}

export async function probeFirestore() {
  const db = getFirestoreDb();
  if (!db) {
    return {
      provider: "firebase" as const,
      configured: false,
      detail:
        "Firebase backend is not connected yet. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to enable persistent storage.",
    };
  }

  try {
    await db.collection("classes").limit(1).get();
    return { provider: "firebase" as const, configured: true, detail: undefined };
  } catch (error) {
    return {
      provider: "firebase" as const,
      configured: false,
      detail:
        describeFirebaseIssue(error) ??
        "Firebase credentials are present, but the database is not reachable yet. Check the Firebase project setup and try again.",
    };
  }
}
