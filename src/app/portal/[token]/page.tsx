"use client";

import { use, useState } from "react";
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
  Printer
} from "lucide-react";
import { SAMPLE_STYLES } from "@/lib/mock-data";

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [paid, setPaid] = useState(false);

  // Mock estimate data for the "Example Quote"
  const estimate = {
    id: "EST-9921",
    customer: "John Doe",
    address: "123 Oak Lane, Springfield, OR 97477",
    date: "October 27, 2023",
    expiryDate: "November 27, 2023",
    status: paid ? "deposit_paid" : "sent",
    lineItems: [
      { 
        id: "1", 
        styleId: "style_1", 
        name: "6ft Privacy Cedar", 
        qty: 120, 
        price: 4200.50,
        details: "Premium Western Red Cedar, 3-rail construction, 4x4 treated posts set in 80lb concrete."
      }
    ],
    subtotal: 4200.50,
    tax: 336.04,
    total: 4536.54,
    deposit: 2268.27
  };

  const handlePayment = () => {
    // Simulate Magic Payment Process
    setPaid(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
            <span className="font-bold text-lg tracking-tight text-primary">PillarPath Portal</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </div>

        <Card className="border-2 shadow-2xl overflow-hidden print:shadow-none print:border-none">
          <CardHeader className="bg-slate-900 text-white p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-widest font-black mb-1">Project Estimate</p>
                <h2 className="text-4xl font-black font-mono">{estimate.id}</h2>
              </div>
              <div className="text-right">
                <Badge variant={paid ? "default" : "secondary"} className={`text-sm px-4 py-1 font-bold ${paid ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                  {paid ? "DEPOSIT PAID" : "PENDING ACCEPTANCE"}
                </Badge>
                <p className="text-xs opacity-60 mt-2 font-medium">Valid until {estimate.expiryDate}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-10">
            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Client & Location
                </h3>
                <div className="space-y-1">
                  <p className="text-xl font-black text-slate-900">{estimate.customer}</p>
                  <p className="text-slate-600 leading-relaxed">{estimate.address}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Estimate Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Issued On</span>
                    <span className="font-bold">{estimate.date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Prepared By</span>
                    <span className="font-bold text-primary">Evergreen Fencing Co.</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Scope of Work */}
            <div className="space-y-6">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Scope of Work
              </h3>
              <div className="space-y-4">
                {estimate.lineItems.map(item => (
                  <div key={item.id} className="group border-2 border-slate-100 rounded-2xl p-6 bg-white hover:border-primary/20 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="text-2xl font-black text-slate-900">{item.name}</h4>
                          <Badge variant="outline" className="font-bold">{item.qty} FT</Badge>
                        </div>
                        <p className="text-slate-500 leading-relaxed max-w-xl">
                          {item.details}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-3xl font-black text-slate-900 font-mono">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1">Item Subtotal</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Financial Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="flex-1 max-w-md space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-400">Notes & Exclusions</h4>
                <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                  <li>Client responsible for underground utilities identification.</li>
                  <li>Final linear footage may vary slightly upon installation.</li>
                  <li>Includes removal and disposal of existing debris from installation.</li>
                </ul>
              </div>
              
              <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold">${estimate.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-mono font-bold">${estimate.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-3xl font-black text-slate-900 pt-4 border-t-2 border-slate-900 mt-2">
                  <span>TOTAL</span>
                  <span className="font-mono">${estimate.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Terms & Legal */}
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-200">
              <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Terms of Service
              </h4>
              <div className="text-[10px] text-slate-400 leading-relaxed space-y-2 uppercase">
                <p>1. ACCEPTANCE: This estimate is an offer to perform work at the prices stated for a period of 30 days. Acceptance is confirmed upon payment of the security deposit.</p>
                <p>2. PAYMENT: A 50% deposit is required to secure a production date. Final balance is due upon completion of the installation. Late fees apply after 15 days.</p>
                <p>3. PERMITS: Contractor will assist with permit applications, but final approval from HOA or local municipalities is the client's responsibility unless otherwise specified.</p>
              </div>
            </div>
          </CardContent>

          {/* Call to Action Footer */}
          {!paid ? (
            <CardFooter className="bg-slate-100 p-8 flex flex-col gap-6 print:hidden">
              <div className="flex items-center gap-6 p-6 bg-white border-2 border-primary/20 rounded-2xl w-full shadow-sm">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CreditCard className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-black text-slate-900">50% Security Deposit Required</p>
                  <p className="text-sm text-slate-500 font-medium">Accept this quote and pay your deposit online to lock in your installation date.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary font-mono">${estimate.deposit.toFixed(2)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Deposit Amount</p>
                </div>
              </div>
              <Button onClick={handlePayment} className="w-full h-16 text-xl font-black gap-3 shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]">
                <CheckCircle2 className="h-6 w-6" />
                ACCEPT & PAY DEPOSIT VIA MAGIC
              </Button>
            </CardFooter>
          ) : (
            <CardFooter className="bg-green-50 p-10 flex flex-col items-center gap-4 text-center print:hidden">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 border-4 border-white shadow-xl">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="text-3xl font-black text-green-900">Project Secured!</h3>
              <p className="text-green-800 text-lg max-w-lg font-medium">
                We've received your deposit of <span className="font-black">${estimate.deposit.toFixed(2)}</span>. 
                Our team has been notified and will contact you within 24 hours to finalize your installation schedule.
              </p>
              <div className="flex gap-4 mt-6">
                <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-100 font-bold px-8">
                  View Receipt
                </Button>
                <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-100 font-bold px-8" onClick={() => window.print()}>
                  Print Quote
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        <div className="flex items-center gap-2 justify-center text-slate-400 text-xs font-bold uppercase tracking-widest pb-12 print:hidden">
          <AlertCircle className="h-4 w-4" />
          <span>Secure Transaction Powered by Magic Checkout</span>
        </div>
      </div>
    </div>
  );
}
