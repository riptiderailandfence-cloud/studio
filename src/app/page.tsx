"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Ruler, ClipboardCheck, Users, ShieldCheck, LogOut, LayoutDashboard } from "lucide-react";
import { useUser, useAuth, initiateGoogleSignIn, initiateSignOut } from "@/firebase";

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignIn = () => {
    initiateGoogleSignIn(auth);
  };

  const handleSignOut = () => {
    initiateSignOut(auth);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <span className="font-bold text-xl tracking-tight text-primary">PillarPath</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          {isUserLoading ? (
            <div className="h-9 w-24 animate-pulse bg-slate-100 rounded-md" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-700">Hi, {user.displayName || user.email?.split('@')[0]}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-primary">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button size="sm" asChild className="gap-2">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleSignIn} className="gap-2 border-slate-200 hover:bg-slate-50 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-slate-900">
                  Precision Estimating for <span className="text-primary">Fence Professionals</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-slate-500 md:text-xl dark:text-slate-400">
                  The all-in-one OS for your fence business. CRM, estimating, BOM builder, and AI-powered pricing.
                </p>
              </div>
              <div className="space-x-4">
                <Button size="lg" className="px-8" asChild><Link href="/dashboard">Enter Dashboard</Link></Button>
                <Button size="lg" variant="outline" className="px-8" asChild><Link href="/portal/sample-token">View Client Portal Demo</Link></Button>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <Ruler className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Smart Estimating</h3>
                <p className="text-slate-500">Build complex styles with individual material components and calculate costs in seconds.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <ClipboardCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Client Deposits</h3>
                <p className="text-slate-500">Integrated Magic checkout for seamless deposit payments directly from your estimates.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full text-primary">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Crew Tracking</h3>
                <p className="text-slate-500">Manage labor rates and job assignments to keep your field teams running efficiently.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-slate-500">© 2023 PillarPath SaaS. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">Terms of Service</Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
