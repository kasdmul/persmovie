import admin from 'firebase-admin';
import { App, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
    const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SDK_CONFIG_BASE64;
    if (!serviceAccountBase64) {
        console.warn("FIREBASE_ADMIN_SDK_CONFIG_BASE64 is not set. This is expected for local development without a database, but required for production deployment.");
        return null;
    }
    try {
        const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        return JSON.parse(serviceAccountJson);
    } catch(e) {
        console.error("Error parsing FIREBASE_ADMIN_SDK_CONFIG_BASE64:", e);
        return null;
    }
}

function getFirebaseApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }
    
    const serviceAccount = getServiceAccount();
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!serviceAccount || !projectId) {
        console.warn("Firebase credentials not found, initializing a placeholder app. Database operations will be disabled.");
        // Initialize with a dummy project ID if none is available to prevent crashing.
        return initializeApp({projectId: "placeholder-project"});
    }
    
    return initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
    });
}

let db: admin.firestore.Firestore | null = null;

export function getDb(): admin.firestore.Firestore | null {
    const app = getFirebaseApp();
    const serviceAccount = getServiceAccount();

    // Only return a DB instance if we have proper credentials.
    if (!serviceAccount) {
        return null;
    }

    if (db === null) {
        db = getFirestore(app);
    }
    return db;
}
