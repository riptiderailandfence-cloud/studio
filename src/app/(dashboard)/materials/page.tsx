"use client";

import { useState, useMemo } from "react";
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
import { Plus, Search, Tag, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filteredMaterials = useMemo(() => {
    return SAMPLE_MATERIALS.filter((mat) => {
      const matchesSearch = 
        mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mat.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "ALL" || mat.category.toUpperCase() === categoryFilter.replace('_', ' ');
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

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

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search materials..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-auto overflow-x-auto">
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="WOOD">Wood</TabsTrigger>
            <TabsTrigger value="CHAIN_LINK">Chain Link</TabsTrigger>
            <TabsTrigger value="ALUMINUM">Aluminum</TabsTrigger>
            <TabsTrigger value="VINYL">Vinyl</TabsTrigger>
            <TabsTrigger value="OTHER">Other</TabsTrigger>
          </TabsList>
        </Tabs>
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
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map((mat) => (
                <TableRow key={mat.id}>
                  <TableCell className="font-medium">{mat.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {mat.category}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{mat.unit.replace('_', ' ')}</TableCell>
                  <TableCell className="font-mono">${mat.unitCost.toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <FilterX className="h-8 w-8 opacity-20" />
                    <p>No materials found matching your criteria.</p>
                    {(searchTerm || categoryFilter !== "ALL") && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => { setSearchTerm(""); setCategoryFilter("ALL"); }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
