
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
import { 
  Map as MapIcon, 
  MousePointer2, 
  Trash2, 
  CheckCircle2, 
  Search, 
  Layers, 
  Plus, 
  Minus,
  Maximize2
} from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MapMeasurementToolProps {
  onApply: (feet: number) => void;
  address?: string;
}

export function MapMeasurementTool({ onApply, address }: MapMeasurementToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
  const [totalFeet, setTotalFeet] = useState(0);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street'>('satellite');
  const [searchQuery, setSearchQuery] = useState(address || "");
  const containerRef = useRef<HTMLDivElement>(null);

  const satelliteImage = PlaceHolderImages.find(img => img.id === 'satellite-map')?.imageUrl || "https://picsum.photos/seed/sat/800/600";
  const streetImage = PlaceHolderImages.find(img => img.id === 'street-map')?.imageUrl || "https://picsum.photos/seed/map/800/600";

  const SCALE_FACTOR = 0.5; // Simulated: 1 pixel = 0.5 feet

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
          Measure on Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-white z-20">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" />
                Google Maps Measurement Tool
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Trace the proposed fence line on the property below to calculate total footage.
              </p>
            </div>
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search property address..." 
                className="pl-10 h-10 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </DialogHeader>

        <div 
          className="flex-1 relative bg-slate-200 overflow-hidden cursor-crosshair group" 
          onClick={handleMapClick} 
          ref={containerRef}
        >
          {/* Map Layer Rendering */}
          <div className="absolute inset-0 transition-opacity duration-500">
            <Image 
              src={mapLayer === 'satellite' ? satelliteImage : streetImage} 
              alt="Google Map Integration" 
              fill 
              className="object-cover pointer-events-none select-none transition-transform duration-1000 group-active:scale-[1.01]"
              data-ai-hint={mapLayer === 'satellite' ? "satellite map" : "street map"}
            />
          </div>
          
          {/* Drawing Canvas */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-md">
            {points.length > 0 && points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="hsl(var(--primary))" strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="2" fill="hsl(var(--primary))" />
              </g>
            ))}
            {points.length > 1 && (
              <polyline
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {points.length > 1 && (
              <polyline
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="8,4"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Map UI Overlays */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur-sm p-1 rounded-lg shadow-lg border flex flex-col">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" title="Zoom In"><Plus className="h-4 w-4" /></Button>
              <Separator />
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" title="Zoom Out"><Minus className="h-4 w-4" /></Button>
            </div>
            <Button 
              variant="secondary" 
              size="icon" 
              className="bg-white/95 backdrop-blur-sm shadow-lg border h-8 w-8"
              onClick={() => setMapLayer(mapLayer === 'satellite' ? 'street' : 'satellite')}
              title="Toggle Layers"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>

          {points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white pointer-events-none transition-opacity duration-300">
              <div className="bg-slate-900/80 p-6 rounded-2xl text-center space-y-4 backdrop-blur-md border border-white/20 animate-in fade-in zoom-in-95">
                <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/50">
                  <MousePointer2 className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-xl font-black">Start Drawing</p>
                  <p className="text-sm opacity-70">Click anywhere on the property to begin tracing the fence.</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-6 animate-in slide-in-from-bottom-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Calculated Length</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black font-mono text-white leading-none">{totalFeet}</span>
                <span className="text-sm font-bold text-slate-400">FT</span>
              </div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-bold">
                {points.length} Points Tracked
              </Badge>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase font-black tracking-tighter">
                <Maximize2 className="h-3 w-3" /> Scale Corrected
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-slate-50 flex justify-between items-center sm:justify-between">
          <Button variant="ghost" onClick={handleReset} className="text-destructive hover:bg-destructive/10 gap-2">
            <Trash2 className="h-4 w-4" /> Clear All Points
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleApply} 
              disabled={totalFeet === 0} 
              className="gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" /> Apply {totalFeet} FT to Section
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
