'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, collection } from 'firebase/firestore';

/**
 * Ensures a user document exists in Firestore for the authenticated user.
 * This is required by the security rules to permit access to tenant data.
 */
export function UserInitializer({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Memoize the document reference for the user profile
  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);

  useEffect(() => {
    // Only attempt to initialize once per session if profile is missing for a logged-in user
    if (!isUserLoading && user && !isProfileLoading && !profile && !hasAttemptedInit) {
      setHasAttemptedInit(true);
      const userRef = doc(firestore, 'users', user.uid);
      
      // Generate a new tenantId if one doesn't exist for this user
      // In a real app, this might involve a UI flow for creating or joining a tenant.
      // For now, we'll auto-assign a new, unique tenant ID.
      const newTenantId = doc(collection(firestore, 'tenants')).id; 

      setDocumentNonBlocking(userRef, {
        id: user.uid,
        tenantId: newTenantId, // Assign a dynamically generated unique tenantId
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
