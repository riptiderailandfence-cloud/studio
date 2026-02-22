"use client";

import { useState } from "react";
import { SAMPLE_CREW } from "@/lib/mock-data";
import { CrewMember } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, DollarSign, Clock } from "lucide-react";

export default function CrewPage() {
  const [crew] = useState<CrewMember[]>(SAMPLE_CREW);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Crew Management</h2>
          <p className="text-muted-foreground">Manage your field teams and their labor rates.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Crew Member
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {crew.map((member) => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Fence Specialist</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between rounded-md bg-secondary/50 p-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" /> Hourly Rate
                  </div>
                  <div className="font-mono font-bold">${member.hourlyRate}/hr</div>
                </div>
                <div className="flex items-center justify-between rounded-md border p-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" /> Labor Rate
                  </div>
                  <div className="font-mono text-sm">${member.laborRate || 0}/ft</div>
                </div>
                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">View Schedule</Button>
                  <Button variant="outline" size="sm" className="flex-1">Edit Rates</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}