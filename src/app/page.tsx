"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Ruler, ClipboardCheck, Users, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <span className="font-bold text-xl tracking-tight text-primary">PillarPath</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild><Link href="/dashboard">Login</Link></Button>
          <Button asChild><Link href="/dashboard">Get Started</Link></Button>
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