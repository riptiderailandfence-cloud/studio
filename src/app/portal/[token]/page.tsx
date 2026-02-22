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
  AlertCircle
} from "lucide-react";
import { SAMPLE_STYLES } from "@/lib/mock-data";

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [paid, setPaid] = useState(false);

  // Mock estimate derived from token
  const estimate = {
    id: "EST-9921",
    customer: "John Doe",
    address: "123 Oak Lane, Springfield",
    date: "Oct 27, 2023",
    status: paid ? "deposit_paid" : "sent",
    lineItems: [
      { id: "1", styleId: "style_1", qty: 120, price: 4200.50 }
    ],
    total: 4536.54,
    deposit: 2268.27
  };

  const handlePayment = () => {
    // Simulate Magic Payment
    setPaid(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-black text-xl mb-4">P</div>
          <h1 className="text-2xl font-bold">PillarPath Estimate</h1>
          <p className="text-muted-foreground">Evergreen Fencing Co. has prepared a quote for your project.</p>
        </div>

        <Card className="border-2 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-80 uppercase tracking-widest font-bold">Estimate ID</p>
                <h2 className="text-3xl font-black">{estimate.id}</h2>
              </div>
              <Badge variant={paid ? "default" : "secondary"} className="text-md px-4 py-1">
                {estimate.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2"><MapPin className="h-4 w-4" /> Job Location</h3>
                <p className="text-muted-foreground">{estimate.address}</p>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Calendar className="h-4 w-4" /> Quote Date</h3>
                <p className="text-muted-foreground">{estimate.date}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Project Scope</h3>
              <div className="space-y-4">
                {estimate.lineItems.map(item => {
                  const style = SAMPLE_STYLES.find(s => s.id === item.styleId);
                  return (
                    <div key={item.id} className="flex justify-between items-center bg-secondary/30 p-4 rounded-lg">
                      <div>
                        <p className="font-bold text-lg">{style?.name}</p>
                        <p className="text-sm text-muted-foreground">{item.qty} Linear Feet • {style?.description}</p>
                      </div>
                      <p className="font-mono font-bold">${item.price.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">$4,200.50</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="font-mono">$336.04</span>
              </div>
              <div className="flex justify-between text-2xl font-black pt-4 border-t">
                <span>TOTAL</span>
                <span className="font-mono">${estimate.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>

          {!paid ? (
            <CardFooter className="bg-secondary/50 p-8 flex flex-col gap-6">
              <div className="flex items-center gap-4 p-4 bg-white border rounded-xl w-full">
                <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">50% Deposit Required</p>
                  <p className="text-xs text-muted-foreground">To schedule your project, a security deposit is needed.</p>
                </div>
                <p className="text-xl font-black text-primary font-mono">${estimate.deposit.toFixed(2)}</p>
              </div>
              <Button onClick={handlePayment} className="w-full h-14 text-lg gap-2 shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90">
                <CheckCircle2 className="h-5 w-5" />
                Accept & Pay Deposit via Magic
              </Button>
            </CardFooter>
          ) : (
            <CardFooter className="bg-green-50 p-8 flex flex-col items-center gap-4 text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold text-green-900">Deposit Paid!</h3>
              <p className="text-green-800">We've received your deposit of ${estimate.deposit.toFixed(2)}. Our scheduling team will contact you shortly to set a date for your fence installation.</p>
              <Button variant="outline" className="mt-4 border-green-200 text-green-700 hover:bg-green-100">Download Receipt</Button>
            </CardFooter>
          )}
        </Card>

        <div className="flex items-center gap-2 justify-center text-muted-foreground text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Secure transaction powered by Magic Checkout</span>
        </div>
      </div>
    </div>
  );
}