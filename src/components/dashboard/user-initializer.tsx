
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

/**
 * Ensures a user document and tenant workspace exist in Firestore.
 * Uses the User's UID as the deterministic Tenant ID for the primary owner.
 */
export function UserInitializer({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);
  const [setupInProgress, setSetupInProgress] = useState(false);

  useEffect(() => {
    // We only trigger setup if:
    // 1. Auth is loaded and a user exists
    // 2. Profile read is finished
    // 3. Either profile is missing entirely OR it exists but is missing a tenantId
    if (!isUserLoading && user && !isProfileLoading && (!profile || !profile.tenantId) && !setupInProgress) {
      setSetupInProgress(true);
      
      const userRef = doc(firestore, 'users', user.uid);
      // Use the user's UID as the deterministic tenant ID for owners.
      const deterministicTenantId = user.uid; 
      const tenantRef = doc(firestore, 'tenants', deterministicTenantId);
      const settingsRef = doc(firestore, 'tenants', deterministicTenantId, 'settings', 'general');

      // Create all three base documents. We use setDoc with merge: true 
      // to ensure we don't accidentally wipe existing user data.
      Promise.all([
        setDoc(userRef, {
          id: user.uid,
          tenantId: deterministicTenantId, 
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'New User',
          role: 'Owner',
          active: true,
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(tenantRef, {
          id: deterministicTenantId,
          name: "My Fencing Business",
          ownerUserId: user.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(settingsRef, {
          tenantId: deterministicTenantId,
          businessName: "My Fencing Business",
          email: user.email || '',
          pricingMethod: 'margin',
          profitPct: 30,
          updatedAt: serverTimestamp()
        }, { merge: true })
      ]).then(() => {
        // Small delay to allow Firestore propagation before rendering app children
        setTimeout(() => setSetupInProgress(false), 500);
      }).catch((error) => {
        console.error("Critical: Workspace setup failed:", error);
        setSetupInProgress(false);
      });
    }
  }, [user, isUserLoading, profile, isProfileLoading, firestore, setupInProgress]);

  // Block rendering until we have a confirmed user AND a profile with a valid tenantId
  const isReady = !isUserLoading && !isProfileLoading && !setupInProgress && profile && profile.tenantId;

  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">Configuring Workspace</p>
            <p className="text-xs text-muted-foreground">Initializing secure business profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
