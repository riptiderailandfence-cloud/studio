"use client";

import { useState } from "react";
import { SAMPLE_STYLES, SAMPLE_MATERIALS } from "@/lib/mock-data";
import { Style } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Info, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StyleOptimizer } from "@/components/styles/style-optimizer";

export default function StylesPage() {
  const [styles] = useState<Style[]>(SAMPLE_STYLES);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fence Styles</h2>
          <p className="text-muted-foreground">Define your core fence, post, and gate styles with Bill of Materials.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Style
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {styles.map((style) => (
          <Card key={style.id} className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost"><Settings2 className="h-4 w-4" /></Button>
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{style.type}</Badge>
                <Badge variant="secondary">per {style.measurementBasis}</Badge>
              </div>
              <CardTitle>{style.name}</CardTitle>
              <CardDescription>{style.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Estimated Cost:</span>
                <span className="text-xl font-bold text-primary">${style.costPerUnit.toFixed(2)}</span>
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
    </div>
  );
}