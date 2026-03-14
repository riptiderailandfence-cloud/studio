
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Initializes Firebase App and returns initialized SDK instances.
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;
  const apps = getApps();

  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.warn('Firebase initialization warning:', e);
      firebaseApp = getApp();
    }
  }

  return getSdks(firebaseApp);
}

/**
 * Returns initialized Firebase SDKs.
 * Explicitly provides the storage bucket from config to prevent domain mismatches.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp, firebaseConfig.storageBucket)
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
