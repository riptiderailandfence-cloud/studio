
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
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
    async function initializeWorkspace() {
      if (!user || isUserLoading || isProfileLoading || setupInProgress) return;

      // Deterministic check: Does this user have a confirmed tenant context?
      if (profile && profile.tenantId) return;

      setSetupInProgress(true);
      
      try {
        const deterministicTenantId = user.uid;
        const userRef = doc(firestore, 'users', user.uid);
        const tenantRef = doc(firestore, 'tenants', deterministicTenantId);
        const settingsRef = doc(firestore, 'tenants', deterministicTenantId, 'settings', 'general');

        // Check if settings already exist to prevent overwriting business name with defaults
        const settingsSnap = await getDoc(settingsRef);
        const settingsExists = settingsSnap.exists();

        const batch = [];

        // 1. Ensure User Profile exists
        batch.push(setDoc(userRef, {
          id: user.uid,
          tenantId: deterministicTenantId, 
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'New User',
          role: 'Owner',
          active: true,
          updatedAt: serverTimestamp(),
        }, { merge: true }));

        // 2. Ensure Tenant record exists
        batch.push(setDoc(tenantRef, {
          id: deterministicTenantId,
          name: "My Fencing Business",
          ownerUserId: user.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true }));

        // 3. Ensure Settings exist (only write defaults if truly missing)
        if (!settingsExists) {
          batch.push(setDoc(settingsRef, {
            tenantId: deterministicTenantId,
            businessName: "My Fencing Business",
            email: user.email || '',
            pricingMethod: 'margin',
            profitPct: 30,
            updatedAt: serverTimestamp()
          }));
        }

        await Promise.all(batch);
        
        // Brief pause to allow Firestore internal state to settle
        setTimeout(() => setSetupInProgress(false), 800);
      } catch (error) {
        console.error("Critical: Workspace initialization failed:", error);
        setSetupInProgress(false);
      }
    }

    initializeWorkspace();
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
