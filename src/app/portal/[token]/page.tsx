"use client";

import { use, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  CreditCard, 
  MapPin, 
  Calendar,
  AlertCircle,
  FileText,
  ShieldCheck,
  Download,
  Printer,
  Loader2
} from "lucide-react";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Estimate } from "@/lib/types";

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const firestore = useFirestore();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    async function findEstimate() {
      if (!token) return;
      setLoading(true);
      try {
        // We use a collectionGroup query to find the estimate by its clientAccessToken across all tenants
        const q = query(collectionGroup(firestore, 'estimates'), where('clientAccessToken', '==', token));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const data = snap.docs[0].data() as Estimate;
          setEstimate({ ...data, id: snap.docs[0].id });
          if (data.status === 'deposit_paid' || data.status === 'scheduled' || data.status === 'completed') {
            setPaid(true);
          }
        }
      } catch (error) {
        console.error("Error fetching estimate:", error);
      } finally {
        setLoading(false);
      }
    }
    findEstimate();
  }, [firestore, token]);

  const handlePayment = async () => {
    if (!estimate || !token) return;
    
    // Simulate Magic Payment Process
    setPaid(true);
    
    try {
      // Find the specific doc path again to update
      const q = query(collectionGroup(firestore, 'estimates'), where('clientAccessToken', '==', token));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          status: 'deposit_paid',
          depositPaidAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Failed to update status after payment:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-bold text-slate-500">Loading your project portal...</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full border-2 shadow-xl">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Portal Link Expired</CardTitle>
            <CardDescription>We couldn't find a valid estimate matching this secure token. Please contact your contractor for a new link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
            <span className="font-bold text-lg tracking-tight text-primary">PillarPath Portal</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print PDF
            </Button>
          </div>
        </div>

        <Card className="border-2 shadow-2xl overflow-hidden print:shadow-none print:border-none">
          <CardHeader className="bg-slate-900 text-white p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-widest font-black mb-1">Project Estimate</p>
                <h2 className="text-4xl font-black font-mono">#{estimate.id.slice(-8).toUpperCase()}</h2>
              </div>
              <div className="text-right">
                <Badge variant={paid ? "default" : "secondary"} className={`text-sm px-4 py-1 font-bold ${paid ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                  {paid ? "DEPOSIT PAID" : "PENDING ACCEPTANCE"}
                </Badge>
                <p className="text-xs opacity-60 mt-2 font-medium">Live Status Tracking</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-10">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Client & Location
                </h3>
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-900">{estimate.customerSnapshot?.name}</p>
                  <p className="text-slate-600 leading-relaxed">{estimate.jobAddress}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Project Timeline
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Issued On</span>
                    <span className="font-bold">{estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString() : 'Today'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className="font-bold text-primary capitalize">{estimate.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-6">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Scope of Work
              </h3>
              <div className="space-y-4">
                {estimate.lineItems?.map((item, idx) => (
                  <div key={idx} className="group border-2 border-slate-100 rounded-2xl p-6 bg-white">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-2xl font-black text-slate-900">{item.styleName || 'Custom Fencing'}</h4>
                          <Badge variant="outline" className="font-bold">{item.quantity} units</Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-3xl font-black text-slate-900 font-mono">${(item.sellPrice || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col md:flex-row justify-end gap-8">
              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Project Subtotal</span>
                  <span className="font-mono font-bold">${estimate.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Estimated Tax</span>
                  <span className="font-mono font-bold">${estimate.totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-3xl font-black text-slate-900 pt-4 border-t-2 border-slate-900 mt-2">
                  <span>TOTAL</span>
                  <span className="font-mono">${estimate.totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-200">
              <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Terms of Service
              </h4>
              <div className="text-[10px] text-slate-400 leading-relaxed space-y-2 uppercase">
                <p>1. ACCEPTANCE: Confirmation upon payment of the security deposit.</p>
                <p>2. PAYMENT: A deposit is required to secure a production date. Final balance is due upon completion.</p>
              </div>
            </div>
          </CardContent>

          {!paid ? (
            <CardFooter className="bg-slate-100 p-8 flex flex-col gap-6 print:hidden">
              <div className="flex items-center gap-6 p-6 bg-white border-2 border-primary/20 rounded-2xl w-full shadow-sm">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CreditCard className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-black text-slate-900">Security Deposit Required</p>
                  <p className="text-sm text-slate-500 font-medium">Accept and pay to lock in your date.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary font-mono">${estimate.totals.depositRequired.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Deposit Amount</p>
                </div>
              </div>
              <Button onClick={handlePayment} className="w-full h-16 text-xl font-black gap-3 shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all">
                <CheckCircle2 className="h-6 w-6" />
                ACCEPT & PAY DEPOSIT
              </Button>
            </CardFooter>
          ) : (
            <CardFooter className="bg-green-50 p-10 flex flex-col items-center gap-4 text-center print:hidden">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 border-4 border-white shadow-xl">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-3xl font-black text-green-900">Project Secured!</h3>
              <p className="text-green-800 text-lg max-w-lg font-medium">
                We've received your deposit of <span className="font-black">${estimate.totals.depositRequired.toFixed(2)}</span>. Our team will contact you shortly.
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
