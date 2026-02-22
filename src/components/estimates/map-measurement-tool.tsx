
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Update polyline as points change
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;
    
    if (polylineRef.current) polylineRef.current.setMap(null);

    polylineRef.current = new google.maps.Polyline({
      path: points,
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
  }, [map, points]);

  // Update markers and calculate distance
  useEffect(() => {
    if (!map || !geometryLib || typeof google === 'undefined') return;

    markersRef.current.forEach(marker => marker.setMap(null));
    
    markersRef.current = points.map((point, index) => 
      new google.maps.Marker({
        position: point,
        map: map,
        label: {
          text: (index + 1).toString(),
          color: "white",
          fontSize: "10px",
          fontWeight: "bold"
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "white",
          scale: 8
        },
        clickable: false
      })
    );

    if (points.length > 1) {
      const path = points.map(p => new google.maps.LatLng(p.lat, p.lng));
      const meters = geometryLib.spherical.computeLength(path);
      setTotalFeet(Math.round(meters * 3.28084));
    } else {
      setTotalFeet(0);
    }
  }, [map, points, geometryLib]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setPoints(prev => [...prev, e.latLng!.toJSON()]);
  }, []);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !placesLib || !map) return;

    setIsSearching(true);
    
    try {
      // @ts-ignore
      if (placesLib.Place) {
        // @ts-ignore
        const { places } = await placesLib.Place.searchByText({
          textQuery: searchQuery,
          fields: ['location', 'viewport'],
        });

        if (places && places.length > 0) {
          const place = places[0];
          const location = place.location?.toJSON();
          
          if (place.viewport) {
            map.fitBounds(place.viewport);
          } else if (location) {
            map.setCenter(location);
            map.setZoom(20);
          }
          
          if (location) {
            setSearchMarker(location);
          }
          
          setPoints([]);
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Places API error:", err);
    }

    setIsSearching(false);
    toast({
      title: "Location Not Found",
      description: "Could not find the specified address. Please try again.",
      variant: "destructive"
    });
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
    <div className="relative w-full h-full">
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
        {/* Searched Location Marker */}
        {searchMarker && (
          <Marker position={searchMarker} title="Job Site" />
        )}

        {/* Top Controls: Search Bar */}
        <MapControl position={ControlPosition.TOP_LEFT}>
          <div className="m-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
            <form 
              className="flex bg-white/95 backdrop-blur shadow-xl rounded-xl border p-1 w-80"
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

        {/* Bottom Controls: Stats & Apply */}
        <MapControl position={ControlPosition.BOTTOM_LEFT}>
          <div className="m-4 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-white/10 p-4 min-w-[200px] flex items-center gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Length</p>
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
              className="bg-primary hover:bg-primary/90 text-white shadow-lg font-bold h-12 w-full rounded-xl gap-2"
              disabled={totalFeet === 0}
            >
              <Check className="h-4 w-4" /> Apply to Segment
            </Button>
          </div>
        </MapControl>

        {/* Zoom Controls */}
        <MapControl position={ControlPosition.RIGHT_BOTTOM}>
          <div className="m-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/95 backdrop-blur shadow-lg rounded-xl border flex flex-col overflow-hidden">
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

        {/* Instruction Hint */}
        {points.length === 0 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-xl flex items-center gap-3">
              <MousePointer2 className="h-4 w-4 text-primary animate-pulse" />
              <p className="text-sm font-medium text-white">Click map to trace fence line</p>
            </div>
          </div>
        )}
      </Map>
    </div>
  );
}

export function MapMeasurementTool({ onApply, address }: MapMeasurementToolProps) {
  const [isOpen, setIsOpen] = useState(false);
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
                <DialogTitle className="text-lg font-black tracking-tight">Project Measurement</DialogTitle>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <Info className="h-3 w-3" /> Satellite Property Trace
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8">Close</Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <MapContent address={address} onApply={onApply} closeDialog={() => setIsOpen(false)} />
            </APIProvider>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <MapIcon className="h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="text-xl font-bold text-slate-900">Map Service Unavailable</h3>
              <p className="text-muted-foreground max-w-sm">
                Google Maps API key is missing. Please check your configuration.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
