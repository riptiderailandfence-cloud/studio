
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
  Navigation
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary, 
  MapControl, 
  ControlPosition 
} from "@vis.gl/react-google-maps";

interface MapMeasurementToolProps {
  onApply: (feet: number) => void;
  address?: string;
}

function MapContent({ address, onApply, closeDialog }: MapMeasurementToolProps & { closeDialog: () => void }) {
  const map = useMap();
  const geometryLib = useMapsLibrary("geometry");
  const placesLib = useMapsLibrary("places");
  
  const [points, setPoints] = useState<google.maps.LatLngLiteral[]>([]);
  const [totalFeet, setTotalFeet] = useState(0);
  const [searchQuery, setSearchQuery] = useState(address || "");
  const [isSearching, setIsSearching] = useState(false);
  
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Update polyline as points change
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;
    
    // Clear existing polyline
    if (polylineRef.current) polylineRef.current.setMap(null);

    polylineRef.current = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: "#2563eb",
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: map
    });

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [map, points]);

  // Update markers and calculate distance
  useEffect(() => {
    if (!map || !geometryLib || typeof google === 'undefined') return;

    // Clear existing markers
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
        }
      })
    );

    if (points.length > 1) {
      const path = points.map(p => new google.maps.LatLng(p.lat, p.lng));
      const meters = geometryLib.spherical.computeLength(path);
      setTotalFeet(Math.round(meters * 3.28084)); // Convert meters to feet
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
    const service = new google.maps.places.PlacesService(map);
    
    service.findPlaceFromQuery(
      { query: searchQuery, fields: ["geometry"] },
      (results, status) => {
        setIsSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
          map.setCenter(results[0].geometry.location);
          map.setZoom(20);
          setPoints([]); // Reset points on new property search
        }
      }
    );
  }, [searchQuery, placesLib, map]);

  const handleReset = () => {
    setPoints([]);
    setTotalFeet(0);
  };

  const handleApply = () => {
    onApply(totalFeet);
    closeDialog();
  };

  return (
    <>
      <Map
        defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
        defaultZoom={4}
        mapId="MEASUREMENT_MAP"
        mapTypeId="satellite"
        onClick={handleMapClick}
        gestureHandling="greedy"
        disableDefaultUI={true}
        className="w-full h-full"
      >
        <MapControl position={ControlPosition.TOP_LEFT}>
          <div className="p-4 bg-white/95 backdrop-blur shadow-lg rounded-br-xl flex flex-col gap-3 border-b border-r">
            <form onSubmit={handleSearch} className="flex gap-2 w-80">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search property address..." 
                  className="pl-10 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="icon" disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </MapControl>

        <MapControl position={ControlPosition.TOP_RIGHT}>
          <div className="p-4">
            <Button onClick={handleApply} className="bg-primary hover:bg-primary/90 shadow-lg">
              Apply {totalFeet} FT
            </Button>
          </div>
        </MapControl>

        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900/80 p-6 rounded-2xl text-white text-center space-y-2 backdrop-blur border border-white/20">
              <MousePointer2 className="h-8 w-8 mx-auto mb-2 text-primary animate-pulse" />
              <h3 className="font-bold">Trace Your Fence Line</h3>
              <p className="text-xs opacity-70">Click on the map to place measurement markers.</p>
            </div>
          </div>
        )}
      </Map>

      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-6 bg-slate-900/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/10">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-primary tracking-widest">Calculated Length</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black font-mono text-white tabular-nums tracking-tighter">{totalFeet}</span>
            <span className="text-lg font-bold text-slate-500 uppercase">FT</span>
          </div>
        </div>
        <Separator orientation="vertical" className="h-12 bg-white/10" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-white">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>{points.length} nodes placed</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs bg-transparent text-white border-white/20 hover:bg-white/10">
            <Trash2 className="h-3 w-3 mr-2" /> Clear All
          </Button>
        </div>
      </div>
    </>
  );
}

export function MapMeasurementTool({ onApply, address }: MapMeasurementToolProps) {
  const [isOpen, setIsOpen] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/50 hover:bg-primary/5 text-[10px] h-7 px-2">
          <MapIcon className="h-3 w-3" />
          Measure on Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black">Property Measurement</DialogTitle>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <Info className="h-3 w-3" /> Accurate spherical measurement via Google Maps
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative">
          <APIProvider apiKey={apiKey}>
            <MapContent address={address} onApply={onApply} closeDialog={() => setIsOpen(false)} />
          </APIProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
