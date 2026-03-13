
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, collection, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

/**
 * Ensures a user document exists in Firestore for the authenticated user.
 * This is required by the security rules to permit access to tenant data.
 * This component gates the application until the setup is confirmed.
 */
export function UserInitializer({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Memoize the document reference for the user profile
  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  const [setupInProgress, setSetupInProgress] = useState(false);

  useEffect(() => {
    // Only proceed if auth is loaded, user is present, and profile has been checked
    if (!isUserLoading && user && !isProfileLoading && !profile && !setupInProgress) {
      setSetupInProgress(true);
      
      const userRef = doc(firestore, 'users', user.uid);
      const newTenantId = doc(collection(firestore, 'tenants')).id; 
      const tenantRef = doc(firestore, 'tenants', newTenantId);
      const settingsRef = doc(firestore, 'tenants', newTenantId, 'settings', 'general');

      // We use Promise.all to ensure all critical docs are created
      // before the UI allows the user to proceed.
      Promise.all([
        setDoc(userRef, {
          id: user.uid,
          tenantId: newTenantId, 
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'New User',
          role: 'Owner',
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(tenantRef, {
          id: newTenantId,
          name: "My Fencing Business",
          ownerUserId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(settingsRef, {
          tenantId: newTenantId,
          businessName: "My Fencing Business",
          email: user.email || '',
          pricingMethod: 'margin',
          profitPct: 30,
          salesTaxRate: 0,
          updatedAt: serverTimestamp()
        })
      ]).then(() => {
        setSetupInProgress(false);
      }).catch((error) => {
        console.error("Critical: Workspace setup failed:", error);
        setSetupInProgress(false);
      });
    }
  }, [user, isUserLoading, profile, isProfileLoading, firestore, setupInProgress]);

  // Gate the application until the profile is confirmed or setup is done
  if (isUserLoading || isProfileLoading || setupInProgress || (user && !profile)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">Configuring Workspace</p>
            <p className="text-xs text-muted-foreground">Preparing your business profile and security...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
