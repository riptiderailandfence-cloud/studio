'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

/**
 * Ensures a user document exists in Firestore for the authenticated user.
 * This is required by the security rules to permit access to tenant data.
 */
export function UserInitializer({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const userRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);

  useEffect(() => {
    // Only attempt to initialize once per session if profile is missing
    if (!isUserLoading && user && !isProfileLoading && !profile && !hasAttemptedInit) {
      setHasAttemptedInit(true);
      const docRef = doc(firestore, 'users', user.uid);
      
      setDocumentNonBlocking(docRef, {
        id: user.uid,
        tenantId: 'tenant_1', // Default tenant for prototype mode
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'New User',
        role: 'Owner',
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  }, [user, isUserLoading, profile, isProfileLoading, firestore, hasAttemptedInit]);

  return <>{children}</>;
}
