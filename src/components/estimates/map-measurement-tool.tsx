
"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, MousePointer2, Trash2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";

interface MapMeasurementToolProps {
  onApply: (feet: number) => void;
  address?: string;
}

export function MapMeasurementTool({ onApply, address }: MapMeasurementToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
  const [totalFeet, setTotalFeet] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapImage = PlaceHolderImages.find(img => img.id === 'satellite-map')?.imageUrl || "https://picsum.photos/seed/map/800/600";

  const SCALE_FACTOR = 0.5; // Mock: 1 pixel = 0.5 feet

  const handleMapClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([...points, { x, y }]);
  };

  useEffect(() => {
    if (points.length < 2) {
      setTotalFeet(0);
      return;
    }

    let dist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      const d = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      dist += d;
    }
    setTotalFeet(Math.round(dist * SCALE_FACTOR));
  }, [points]);

  const handleReset = () => setPoints([]);

  const handleApply = () => {
    onApply(totalFeet);
    setIsOpen(false);
    setPoints([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/50 hover:bg-primary/5 text-[10px] h-7 px-2">
          <MapIcon className="h-3 w-3" />
          Measure from Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            Google Maps Property Measurement
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {address ? `Tracing property for: ${address}` : "Click points on the map to trace your fence line."}
          </p>
        </DialogHeader>

        <div 
          className="flex-1 relative bg-secondary/20 overflow-hidden cursor-crosshair" 
          onClick={handleMapClick} 
          ref={containerRef}
        >
          <Image 
            src={mapImage} 
            alt="Satellite Map" 
            fill 
            className="object-cover pointer-events-none select-none"
            data-ai-hint="satellite map"
          />
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {points.length > 0 && points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" />
            ))}
            {points.length > 1 && (
              <polyline
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
            )}
          </svg>

          {points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white p-8 text-center">
              <div className="space-y-4">
                <MousePointer2 className="h-12 w-12 mx-auto animate-bounce" />
                <p className="text-xl font-bold">Click to start tracing</p>
                <p className="text-sm opacity-80">Click along the property boundary where the fence will be installed.</p>
              </div>
            </div>
          )}

          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border-2 border-primary flex items-center gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Total Length</p>
              <p className="text-3xl font-black font-mono text-primary">{totalFeet} <span className="text-sm">FT</span></p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="text-[10px]">{points.length} Points</Badge>
              <p className="text-[10px] text-muted-foreground">Scale: 1px = 0.5ft</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-secondary/10 flex justify-between items-center sm:justify-between">
          <Button variant="ghost" onClick={handleReset} className="text-destructive gap-2">
            <Trash2 className="h-4 w-4" /> Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={totalFeet === 0} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Use This Measurement
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
