"use client";

import { useState, useMemo } from "react";
import { SAMPLE_STYLES, SAMPLE_MATERIALS } from "@/lib/mock-data";
import { Style } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Info, Settings2, FilterX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StyleOptimizer } from "@/components/styles/style-optimizer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StylesPage() {
  const [styles] = useState<Style[]>(SAMPLE_STYLES);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filteredStyles = useMemo(() => {
    return styles.filter((style) => {
      const matchesCategory = categoryFilter === "ALL" || style.category.toUpperCase() === categoryFilter.replace('_', ' ');
      return matchesCategory;
    });
  }, [styles, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fence Styles</h2>
          <p className="text-muted-foreground">Define your core fence, post, and gate styles with Bill of Materials.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Style
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="ALL">All Styles</TabsTrigger>
            <TabsTrigger value="WOOD">Wood</TabsTrigger>
            <TabsTrigger value="CHAIN_LINK">Chain Link</TabsTrigger>
            <TabsTrigger value="ALUMINUM">Aluminum</TabsTrigger>
            <TabsTrigger value="VINYL">Vinyl</TabsTrigger>
            <TabsTrigger value="OTHER">Other</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredStyles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStyles.map((style) => (
            <Card key={style.id} className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost"><Settings2 className="h-4 w-4" /></Button>
              </div>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{style.type}</Badge>
                  <Badge variant="secondary">{style.category}</Badge>
                </div>
                <CardTitle>{style.name}</CardTitle>
                <CardDescription>{style.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">Estimated Cost:</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary">${style.costPerUnit.toFixed(2)}</span>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">per {style.measurementBasis}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-muted-foreground tracking-widest">
                    <span>Bill of Materials</span>
                    <Info className="h-3 w-3" />
                  </div>
                  <div className="space-y-1">
                    {style.bom.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1 border-b border-dashed last:border-0">
                        <span>{item.materialName}</span>
                        <span className="font-mono text-muted-foreground">x {item.qtyPerUnit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <StyleOptimizer style={style} materials={SAMPLE_MATERIALS} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-card">
          <FilterX className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-lg font-semibold">No styles found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            We couldn't find any styles in the "{categoryFilter}" category.
          </p>
          <Button 
            variant="link" 
            onClick={() => setCategoryFilter("ALL")}
            className="mt-2"
          >
            Show all styles
          </Button>
        </div>
      )}
    </div>
  );
}
