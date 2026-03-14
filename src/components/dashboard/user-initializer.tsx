'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
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

      const deterministicTenantId = user.uid;
      
      // If profile exists and is correctly pointing to the deterministic tenant, check if we need to set up missing pieces
      if (profile && profile.tenantId === deterministicTenantId) {
        // Double check settings exist
        const settingsRef = doc(firestore, 'tenants', deterministicTenantId, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) return; // Fully initialized
      }

      setSetupInProgress(true);
      
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const tenantRef = doc(firestore, 'tenants', deterministicTenantId);
        const settingsRef = doc(firestore, 'tenants', deterministicTenantId, 'settings', 'general');

        const batch = writeBatch(firestore);

        // 1. Ensure User Profile exists and is correctly linked
        // We use merge: true to avoid overwriting existing data if only tenantId was missing
        batch.set(userRef, {
          id: user.uid,
          tenantId: deterministicTenantId, 
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'New User',
          role: 'Owner',
          active: true,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // 2. Ensure Tenant record exists
        batch.set(tenantRef, {
          id: deterministicTenantId,
          name: profile?.businessName || "My Fencing Business",
          ownerUserId: user.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // 3. Ensure Settings exist (check first to avoid overwriting custom values)
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
          batch.set(settingsRef, {
            tenantId: deterministicTenantId,
            businessName: "My Fencing Business",
            email: user.email || '',
            pricingMethod: 'margin',
            profitPct: 30,
            salesTaxRate: 8.25,
            crewSize: 2,
            avgHourlyRate: 35,
            dailyProduction: 100,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        await batch.commit();
        
        // Pause briefly to ensure propagation
        setTimeout(() => setSetupInProgress(false), 500);
      } catch (error) {
        console.error("Workspace initialization error:", error);
        setSetupInProgress(false);
      }
    }

    initializeWorkspace();
  }, [user, isUserLoading, profile, isProfileLoading, firestore, setupInProgress]);

  // Block rendering until we have a confirmed user AND a profile with the correct deterministic ID
  const isReady = !isUserLoading && !isProfileLoading && !setupInProgress && profile && profile.tenantId === user?.uid;

  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">Syncing Production Workspace</p>
            <p className="text-xs text-muted-foreground">Connecting to your secure business database...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}