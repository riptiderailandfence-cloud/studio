"use client";

import { useState } from "react";
import { SAMPLE_MATERIALS } from "@/lib/mock-data";
import { Material } from "@/lib/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MaterialsPage() {
  const [materials] = useState<Material[]>(SAMPLE_MATERIALS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Materials</h2>
          <p className="text-muted-foreground">Manage material inventory and unit costs used for styles.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Material
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search materials..." className="pl-10" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((mat) => (
              <TableRow key={mat.id}>
                <TableCell className="font-medium">{mat.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {mat.category}
                  </div>
                </TableCell>
                <TableCell>{mat.unit}</TableCell>
                <TableCell className="font-mono">${mat.unitCost.toFixed(2)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}