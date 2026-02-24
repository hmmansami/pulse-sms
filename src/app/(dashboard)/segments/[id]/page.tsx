"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApiResponse, SegmentRecord, SubscriberDetailRecord } from "@/types";

type SegmentDetailPayload = {
  segment: SegmentRecord;
  members: SubscriberDetailRecord[];
  totalMembers: number;
  page: number;
  pageSize: number;
};

export default function SegmentDetailPage({ params }: { params: { id: string } }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SegmentDetailPayload | null>(null);

  const loadSegment = async (targetPage = page) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/segments/${params.id}?page=${targetPage}&pageSize=20`, { cache: "no-store" });
      const result: ApiResponse<SegmentDetailPayload> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "Failed to load segment");
      }

      setPayload(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load segment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSegment(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, params.id]);

  const evaluateSegment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/segments/${params.id}/evaluate`, {
        method: "POST",
      });

      const result: ApiResponse<{ subscriberCount: number }> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to evaluate segment");
      }

      await loadSegment(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate segment");
      setLoading(false);
    }
  };

  const totalPages = payload ? Math.max(1, Math.ceil(payload.totalMembers / payload.pageSize)) : 1;

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Segment Detail</h1>
          <p className="text-sm text-muted-foreground">Review rules, segment membership, and evaluation status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/segments">Back</Link>
          </Button>
          <Button onClick={evaluateSegment} disabled={loading}>
            Evaluate Segment
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>{payload?.segment.name ?? "Loading..."}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{payload?.segment.description ?? "No description"}</p>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">{payload?.segment.rules.logic.toUpperCase() ?? "-"}</Badge>
            <span>{payload?.segment.rules.conditions.length ?? 0} conditions</span>
            <span>{payload?.segment.subscriberCount ?? 0} members</span>
          </div>
          <div className="space-y-2">
            {(payload?.segment.rules.conditions ?? []).map((condition, index) => (
              <div key={`${condition.field}-${index}`} className="rounded-md border p-2 text-sm">
                {condition.field} {condition.operator} {Array.isArray(condition.value) ? condition.value.join(", ") : String(condition.value)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payload?.members ?? []).map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link href={`/subscribers/${member.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                      {[member.firstName, member.lastName].filter(Boolean).join(" ") || "Unnamed Subscriber"}
                    </Link>
                  </TableCell>
                  <TableCell>{member.email ?? "-"}</TableCell>
                  <TableCell>{member.phone ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={member.smsConsent ? "success" : "muted"}>{member.smsConsent ? "Active" : "Unsubscribed"}</Badge>
                  </TableCell>
                  <TableCell>{member.tags.join(", ") || "-"}</TableCell>
                </TableRow>
              ))}

              {!loading && (payload?.members.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No members in this segment
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
