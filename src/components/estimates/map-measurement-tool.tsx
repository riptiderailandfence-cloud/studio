
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Map as MapIcon, 
  MousePointer2, 
  Trash2, 
  Search, 
  Loader2,
  Info,
  Navigation,
  Plus,
  Minus,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary, 
  MapControl, 
  ControlPosition,
  Marker
} from "@vis.gl/react-google-maps";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface MapMeasurementToolProps {
  onApply: (feet: number) => void;
  address?: string;
}

/**
 * A declarative Polyline component for @vis.gl/react-google-maps
 */
function Polyline({ path }: { path: google.maps.LatLngLiteral[] }) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#2563eb",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: map,
      clickable: false
    });

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [map, path]);

  return null;
}

function MapContent({ address, onApply, closeDialog }: MapMeasurementToolProps & { closeDialog: () => void }) {
  const map = useMap();
  const geometryLib = useMapsLibrary("geometry");
  const placesLib = useMapsLibrary("places");
  const { toast } = useToast();
  
  const [points, setPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const [totalFeet, setTotalFeet] = useState(0);
  const [searchQuery, setSearchQuery] = useState(address || "");
  const [isSearching, setIsSearching] = useState(false);
  const [searchMarker, setSearchMarker] = useState<google.maps.LatLngLiteral | null>(null);

  // Calculate distance whenever points change
  useEffect(() => {
    if (!geometryLib || points.length < 2) {
      setTotalFeet(0);
      return;
    }

    const path = points.map(p => new google.maps.LatLng(p.lat, p.lng));
    const meters = geometryLib.spherical.computeLength(path);
    setTotalFeet(Math.round(meters * 3.28084)); // Convert to feet
  }, [points, geometryLib]);

  const handleMapClick = useCallback((e: any) => {
    // In @vis.gl, the detail contains the raw LatLng
    const latLng = e.detail?.latLng;
    if (!latLng) return;
    
    setPoints(prev => [...prev, { lat: latLng.lat(), lng: latLng.lng() }]);
  }, []);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !placesLib || !map) return;

    setIsSearching(true);
    
    try {
      // Use standard Geocoding or Places lookup
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const location = results[0].geometry.location;
          const viewport = results[0].geometry.viewport;
          
          if (viewport) {
            map.fitBounds(viewport);
          } else {
            map.setCenter(location);
            map.setZoom(20);
          }
          
          setSearchMarker(location.toJSON());
          setPoints([]); // Clear points when moving to a new property
        } else {
          toast({
            title: "Location Not Found",
            description: "Could not find the specified address. Please try again.",
            variant: "destructive"
          });
        }
        setIsSearching(false);
      });
    } catch (err) {
      console.error("Search error:", err);
      setIsSearching(false);
    }
  }, [searchQuery, placesLib, map, toast]);

  const handleReset = () => {
    setPoints([]);
    setTotalFeet(0);
  };

  const handleApply = () => {
    onApply(totalFeet);
    closeDialog();
  };

  return (
    <div className="relative w-full h-full bg-slate-100">
      <Map
        defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
        defaultZoom={4}
        mapId="MEASUREMENT_MAP"
        mapTypeId="satellite"
        onClick={handleMapClick}
        gestureHandling="greedy"
        disableDefaultUI={true}
        clickableIcons={false}
        className="w-full h-full"
      >
        {/* Render the search marker if it exists */}
        {searchMarker && (
          <Marker position={searchMarker} title="Project Location" />
        )}

        {/* Render measurement points */}
        {points.map((point, index) => (
          <Marker 
            key={`${index}-${point.lat}-${point.lng}`} 
            position={point}
            label={{
              text: (index + 1).toString(),
              color: "white",
              fontSize: "10px",
              fontWeight: "bold"
            }}
          />
        ))}

        {/* Render the polyline connecting points */}
        <Polyline path={points} />

        {/* Top Search Bar */}
        <MapControl position={ControlPosition.TOP_LEFT}>
          <div className="m-4 flex gap-2 pointer-events-none" onClick={(e) => e.stopPropagation()}>
            <form 
              className="flex bg-white/95 backdrop-blur shadow-xl rounded-xl border p-1 w-80 pointer-events-auto"
              onSubmit={handleSearch}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Property address..." 
                  className="pl-10 h-10 border-0 focus-visible:ring-0 shadow-none bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                type="submit"
                variant="ghost" 
                size="icon" 
                disabled={isSearching} 
                className="h-10 w-10"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </MapControl>

        {/* Bottom Stats & Action Bar */}
        <MapControl position={ControlPosition.BOTTOM_LEFT}>
          <div className="m-4 flex flex-col gap-4 pointer-events-none" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 p-4 min-w-[220px] flex items-center gap-4 pointer-events-auto">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Total Length</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono tracking-tighter">{totalFeet}</span>
                  <span className="text-xs font-bold text-slate-500">FT</span>
                </div>
              </div>
              <Separator orientation="vertical" className="h-10 bg-white/10" />
              <div className="flex flex-col gap-1.5">
                <Badge variant="outline" className="text-[9px] border-white/20 text-white h-5 bg-white/5">
                  {points.length} Nodes
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleReset} 
                  className="h-6 text-[10px] px-0 justify-start text-destructive hover:text-destructive hover:bg-transparent"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Reset
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleApply} 
              className="bg-primary hover:bg-primary/90 text-white shadow-lg font-bold h-12 w-full rounded-xl gap-2 pointer-events-auto"
              disabled={totalFeet === 0}
            >
              <Check className="h-4 w-4" /> Apply to Segment
            </Button>
          </div>
        </MapControl>

        {/* Zoom Controls */}
        <MapControl position={ControlPosition.RIGHT_BOTTOM}>
          <div className="m-4 flex flex-col gap-2 pointer-events-none" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/95 backdrop-blur shadow-lg rounded-xl border flex flex-col overflow-hidden pointer-events-auto">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-secondary" title="Zoom In" onClick={() => map?.setZoom((map.getZoom() || 0) + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Separator />
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none hover:bg-secondary" title="Zoom Out" onClick={() => map?.setZoom((map.getZoom() || 0) - 1)}>
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </MapControl>

        {/* Floating Tooltip Instruction */}
        {points.length === 0 && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-3">
              <MousePointer2 className="h-4 w-4 text-primary animate-pulse" />
              <p className="text-sm font-medium text-white">Tap map to trace fence line</p>
            </div>
          </div>
        )}
      </Map>
    </div>
  );
}

export function MapMeasurementTool({ onApply, address }: MapMeasurementToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Using the provided user API key directly in the component for functionality
  const apiKey = "AIzaSyC-4Uk3IhQ_OAsM2y1YSmse9eg66BE1Z_E";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/50 hover:bg-primary/5 text-[10px] h-7 px-2">
          <MapIcon className="h-3 w-3" />
          Measure on Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">Property Trace</DialogTitle>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <Info className="h-3 w-3" /> Satellite Measurement Mode
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8">Close</Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden bg-slate-100">
          <APIProvider apiKey={apiKey}>
            <MapContent address={address} onApply={onApply} closeDialog={() => setIsOpen(false)} />
          </APIProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
