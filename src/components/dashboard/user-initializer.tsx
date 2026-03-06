
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, collection } from 'firebase/firestore';
import { Loader2 } from "lucide-react";

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
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // 1. If we are still loading Auth or Profile, we aren't ready
    if (isUserLoading || isProfileLoading) {
      return;
    }

    // 2. If user is logged in but no profile exists, initialize them
    if (user && !profile && !hasAttemptedInit) {
      setHasAttemptedInit(true);
      
      const userRef = doc(firestore, 'users', user.uid);
      const newTenantId = doc(collection(firestore, 'tenants')).id; 
      const tenantName = user.displayName ? `${user.displayName}'s Fencing Co.` : 'My Fencing Business';

      // Initialize User Profile with tenant membership
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

      // Initialize Tenant Record
      const tenantRef = doc(firestore, 'tenants', newTenantId);
      setDocumentNonBlocking(tenantRef, {
        id: newTenantId,
        name: tenantName,
        ownerUserId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Initialize Default Settings
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

      // Artificial delay to allow Firestore indexing propagation
      setTimeout(() => {
        setIsAuthReady(true);
      }, 2000);
    } 
    // 3. If profile exists, check if it has a tenantId before signaling ready
    else if (profile?.tenantId) {
      setIsAuthReady(true);
    }
  }, [user, isUserLoading, profile, isProfileLoading, firestore, hasAttemptedInit]);

  // Block rendering until the profile is confirmed or initialization has stabilized
  if (isUserLoading || isProfileLoading || (user && !isAuthReady)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            {profile ? "Entering workspace..." : "Configuring your business..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
