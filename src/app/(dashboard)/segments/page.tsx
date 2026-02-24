"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApiResponse, PaginatedResponse, SegmentRecord } from "@/types";

export default function SegmentsPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<SegmentRecord>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });

  useEffect(() => {
    let active = true;

    const fetchSegments = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          search,
          page: "1",
          pageSize: "50",
          sortBy: "updatedAt",
          sortOrder: "desc",
        });

        const response = await fetch(`/api/segments?${params.toString()}`, { cache: "no-store" });
        const payload: ApiResponse<PaginatedResponse<SegmentRecord>> = await response.json();

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to fetch segments");
        }

        if (active) {
          setData(payload.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to fetch segments");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSegments();

    return () => {
      active = false;
    };
  }, [search]);

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Segments</h1>
          <p className="text-sm text-muted-foreground">Dynamic audience groups built from profile and behavior rules.</p>
        </div>
        <Button asChild>
          <Link href="/segments/new">New Segment</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Segment List</CardTitle>
          <Input placeholder="Search segments" value={search} onChange={(event) => setSearch(event.target.value)} className="max-w-sm" />
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Logic</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((segment) => (
                <TableRow key={segment.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Link href={`/segments/${segment.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                      {segment.name}
                    </Link>
                  </TableCell>
                  <TableCell>{segment.description ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{segment.rules.logic.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>{segment.rules.conditions.length}</TableCell>
                  <TableCell>{segment.subscriberCount}</TableCell>
                  <TableCell>{new Date(segment.updatedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {!loading && data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No segments found
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
