
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, collection } from 'firebase/firestore';

/**
 * Ensures a user document and their initial tenant workspace exist in Firestore.
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
      
      // 1. Generate unique IDs for the new tenant
      const userRef = doc(firestore, 'users', user.uid);
      const newTenantId = doc(collection(firestore, 'tenants')).id; 
      const tenantName = user.displayName ? `${user.displayName}'s Fencing Co.` : 'My Fencing Business';

      // 2. Initialize User Profile with tenant membership
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        tenantId: newTenantId,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'New User',
        role: 'Owner',
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 3. Initialize Tenant Record
      const tenantRef = doc(firestore, 'tenants', newTenantId);
      setDocumentNonBlocking(tenantRef, {
        id: newTenantId,
        name: tenantName,
        ownerUserId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 4. Initialize Default Settings (prevents permission errors on initial dashboard reads)
      const settingsRef = doc(firestore, 'tenants', newTenantId, 'settings', 'general');
      setDocumentNonBlocking(settingsRef, {
        tenantId: newTenantId,
        businessName: tenantName,
        email: user.email || '',
        pricingMethod: 'margin',
        profitPct: 30,
        salesTaxRate: 8.25,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  }, [user, isUserLoading, profile, isProfileLoading, firestore, hasAttemptedInit]);

  return <>{children}</>;
}
