'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Initializes Firebase App and returns initialized SDK instances.
 * Handles both production (App Hosting) and development (Config Object) environments.
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  const apps = getApps();

  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    try {
      // In App Hosting, initializeApp() without args picks up env vars automatically.
      // We merge with firebaseConfig to ensure local fallbacks work and storageBucket is present.
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.warn('Firebase initialization warning:', e);
      firebaseApp = getApp();
    }
  }

  return getSdks(firebaseApp);
}

/**
 * Returns initialized Firebase SDKs for a given FirebaseApp instance.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  // We rely on the bucket defined in the app options (from initializeApp).
  // Passing it explicitly can sometimes cause URI formatting issues in certain environments.
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
