
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

/**
 * Ensures a user document and tenant workspace exist in Firestore.
 * Uses the User's UID as the deterministic Tenant ID for the primary owner
 * to ensure persistent access across sessions and eliminate ghost tenants.
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
    // Only proceed if auth is loaded, user is present, and profile check is done
    if (!isUserLoading && user && !isProfileLoading && (!profile || !profile.tenantId) && !setupInProgress) {
      setSetupInProgress(true);
      
      const userRef = doc(firestore, 'users', user.uid);
      // For the primary owner, we use their UID as the initial Tenant ID 
      // to guarantee deterministic workspace retrieval.
      const deterministicTenantId = user.uid; 
      const tenantRef = doc(firestore, 'tenants', deterministicTenantId);
      const settingsRef = doc(firestore, 'tenants', deterministicTenantId, 'settings', 'general');

      Promise.all([
        setDoc(userRef, {
          id: user.uid,
          tenantId: deterministicTenantId, 
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'New User',
          role: 'Owner',
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(tenantRef, {
          id: deterministicTenantId,
          name: "My Fencing Business",
          ownerUserId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true }),
        setDoc(settingsRef, {
          tenantId: deterministicTenantId,
          businessName: "My Fencing Business",
          email: user.email || '',
          pricingMethod: 'margin',
          profitPct: 30,
          salesTaxRate: 0,
          updatedAt: serverTimestamp()
        }, { merge: true })
      ]).then(() => {
        setSetupInProgress(false);
      }).catch((error) => {
        console.error("Critical: Workspace setup failed:", error);
        setSetupInProgress(false);
      });
    }
  }, [user, isUserLoading, profile, isProfileLoading, firestore, setupInProgress]);

  if (isUserLoading || isProfileLoading || setupInProgress || (user && !profile)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">Configuring Workspace</p>
            <p className="text-xs text-muted-foreground">Synchronizing your business profile and security...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
