"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApiResponse, PaginatedResponse, SubscriberRecord } from "@/types";

type SortBy = "createdAt" | "updatedAt" | "firstName" | "lastName" | "email";

type StatusFilter = "all" | "active" | "unsubscribed";

export function SubscriberTable() {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PaginatedResponse<SubscriberRecord>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });

  useEffect(() => {
    let active = true;

    const fetchSubscribers = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search,
        status,
        tag,
        sortBy,
        sortOrder,
        page: String(page),
        pageSize: String(pageSize),
      });

      try {
        const res = await fetch(`/api/subscribers?${params.toString()}`, { cache: "no-store" });
        const payload: ApiResponse<PaginatedResponse<SubscriberRecord>> = await res.json();

        if (!res.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Failed to fetch subscribers");
        }

        if (active) {
          setResponse(payload.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to fetch subscribers");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSubscribers();

    return () => {
      active = false;
    };
  }, [search, status, tag, sortBy, sortOrder, page, pageSize]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(response.total / response.pageSize));
  }, [response.total, response.pageSize]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle>Subscribers</CardTitle>
        <div className="grid gap-3 md:grid-cols-5">
          <Input
            placeholder="Search name, email, phone"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            className="md:col-span-2"
          />
          <Input
            placeholder="Filter tag"
            value={tag}
            onChange={(event) => {
              setPage(1);
              setTag(event.target.value);
            }}
          />
          <Select
            value={status}
            onValueChange={(value: StatusFilter) => {
              setPage(1);
              setStatus(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(value: SortBy) => {
                setPage(1);
                setSortBy(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
                <SelectItem value="firstName">First name</SelectItem>
                <SelectItem value="lastName">Last name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {response.items.map((subscriber) => (
              <TableRow key={subscriber.id} className="hover:bg-slate-50">
                <TableCell>
                  <Link className="font-medium text-indigo-600 hover:text-indigo-500" href={`/subscribers/${subscriber.id}`}>
                    {[subscriber.firstName, subscriber.lastName].filter(Boolean).join(" ") || "Unnamed Subscriber"}
                  </Link>
                </TableCell>
                <TableCell>{subscriber.email ?? "-"}</TableCell>
                <TableCell>{subscriber.phone ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={subscriber.smsConsent ? "success" : "muted"}>{subscriber.smsConsent ? "Active" : "Unsubscribed"}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {subscriber.tags.length ? subscriber.tags.map((item) => <Badge key={item} variant="secondary">{item}</Badge>) : "-"}
                  </div>
                </TableCell>
                <TableCell>{new Date(subscriber.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}

            {!loading && response.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `Showing ${response.items.length} of ${response.total} subscribers`}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPage(1);
                setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
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
        </div>
      </CardContent>
    </Card>
  );
}
