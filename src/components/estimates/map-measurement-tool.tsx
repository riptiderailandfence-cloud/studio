
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
  Maximize2,
  Navigation,
  Loader2,
  Info
} from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
  const [isSearching, setIsSearching] = useState(false);
  const [currentMapId, setCurrentMapId] = useState<'satellite-map' | 'satellite-map-alt'>('satellite-map');
  const containerRef = useRef<HTMLDivElement>(null);

  const satelliteImage = PlaceHolderImages.find(img => img.id === currentMapId)?.imageUrl || "https://picsum.photos/seed/sat/800/600";
  const streetImage = PlaceHolderImages.find(img => img.id === 'street-map')?.imageUrl || "https://picsum.photos/seed/map/800/600";

  const SCALE_FACTOR = 0.5; // Simulated: 1 pixel = 0.5 feet

  useEffect(() => {
    if (address) setSearchQuery(address);
  }, [address]);

  const handleMapClick = (e: React.MouseEvent) => {
    if (!containerRef.current || isSearching) return;
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

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setPoints([]); // Clear points when "moving" to a new address

    // Simulate Google Maps Geocoding & Pan
    setTimeout(() => {
      setIsSearching(false);
      // Toggle between two satellite seeds to simulate moving to a new property
      setCurrentMapId(prev => prev === 'satellite-map' ? 'satellite-map-alt' : 'satellite-map');
    }, 1200);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPoints([]);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b bg-card z-20 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-black tracking-tight">
                  Property Measurement
                </DialogTitle>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                  Powered by Google Maps Data
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="flex-1 max-w-md relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter property address..." 
                  className="pl-10 h-10 shadow-sm bg-secondary/30 border-none focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isSearching} className="h-10 px-6 font-bold">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>
          </div>
        </DialogHeader>

        <div 
          className="flex-1 relative bg-slate-200 overflow-hidden cursor-crosshair group" 
          onClick={handleMapClick} 
          ref={containerRef}
        >
          {/* Map Layer Rendering */}
          <div className={cn("absolute inset-0 transition-opacity duration-700", isSearching ? "opacity-40" : "opacity-100")}>
            <Image 
              src={mapLayer === 'satellite' ? satelliteImage : streetImage} 
              alt="Google Maps View" 
              fill 
              className="object-cover pointer-events-none select-none transition-transform duration-1000 group-active:scale-[1.005]"
              data-ai-hint={mapLayer === 'satellite' ? "satellite map" : "street map"}
              priority
            />
          </div>

          {/* Search Loading Overlay */}
          {isSearching && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/20 backdrop-blur-[2px]">
              <div className="bg-white p-4 rounded-full shadow-2xl border animate-bounce">
                <Navigation className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
          )}
          
          {/* Drawing Canvas */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-lg z-10">
            {points.length > 0 && points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="6" fill="white" stroke="hsl(var(--primary))" strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="2.5" fill="hsl(var(--primary))" />
                {i === points.length - 1 && (
                  <text x={p.x + 10} y={p.y - 10} className="text-[10px] font-black fill-white drop-shadow-md">
                    Point {i + 1}
                  </text>
                )}
              </g>
            ))}
            {points.length > 1 && (
              <polyline
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
              />
            )}
            {points.length > 1 && (
              <polyline
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="10,5"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Google Maps Style UI Overlays */}
          <div className="absolute top-4 left-4 flex flex-col gap-3 z-20" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white shadow-xl rounded-lg border flex flex-col overflow-hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-slate-50" title="Zoom In"><Plus className="h-5 w-5" /></Button>
              <Separator />
              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-slate-50" title="Zoom Out"><Minus className="h-5 w-5" /></Button>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                variant="secondary" 
                size="icon" 
                className={cn("bg-white shadow-xl border h-10 w-10 transition-all", mapLayer === 'street' && "bg-primary text-white border-primary")}
                onClick={() => setMapLayer(mapLayer === 'satellite' ? 'street' : 'satellite')}
                title="Toggle Layers"
              >
                <Layers className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" className="bg-white shadow-xl border h-10 w-10">
                <Navigation className="h-5 w-5 rotate-45" />
              </Button>
            </div>
          </div>

          {/* Info Badge */}
          <div className="absolute top-4 right-4 z-20" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 border border-white/10">
              <Info className="h-3 w-3 text-primary" />
              1px ≈ 0.5ft (Standard Resolution)
            </div>
          </div>

          {/* Empty State Instructions */}
          {points.length === 0 && !isSearching && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-white pointer-events-none z-10">
              <div className="bg-slate-900/90 p-8 rounded-3xl text-center space-y-4 backdrop-blur-lg border border-white/10 shadow-2xl scale-95 animate-in fade-in zoom-in-95">
                <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto border-2 border-primary/50">
                  <MousePointer2 className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Trace Your Fence</h3>
                  <p className="text-sm text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                    Click along the property lines to accurately calculate project footage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attribution & Compass */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 pointer-events-none">
            <div className="h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center border">
              <div className="font-black text-slate-400 text-xs">N</div>
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded">
              © 2023 Google • Imagery © Landsat / Copernicus
            </div>
          </div>

          {/* Real-time Stats Panel */}
          <div 
            className="absolute bottom-6 right-6 bg-slate-900/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-8 animate-in slide-in-from-bottom-6 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase text-primary tracking-widest">Fence Length</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black font-mono text-white tabular-nums leading-none tracking-tighter">{totalFeet}</span>
                <span className="text-lg font-bold text-slate-500">FT</span>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-12 bg-white/10" />
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{points.length} nodes connected</span>
              </div>
              <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${Math.min(100, (points.length / 10) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-secondary/20 flex justify-between items-center sm:justify-between z-20">
          <Button variant="ghost" onClick={handleReset} className="text-destructive hover:bg-destructive/10 gap-2 h-11 px-6">
            <Trash2 className="h-4 w-4" /> Reset Points
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 px-8 font-bold" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleApply} 
              disabled={totalFeet === 0 || isSearching} 
              className="h-11 px-10 gap-2 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-5 w-5" /> Apply to Section
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
