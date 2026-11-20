"use client";

import { useEffect, useState } from "react";
import { Ban, Search, ShieldCheck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "../shared/status-badge";
import { Pagination } from "../shared/pagination";
import { api } from "@/lib/client-api";
import { formatDate, formatINR } from "@/lib/format";
import type { AdminUser } from "@/types";

type ListResponse = { users: AdminUser[]; pagination: { page: number; pages: number; total: number } };

export function AdminUsersView() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  function load() {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    api<ListResponse>(`/admin/users?${params}`).then(setData).catch(() => null);
  }

  // Debounced server-side search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(); }, [page]);

  async function toggleBlock(user: AdminUser) {
    try {
      await api(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE" }),
      });
      toast.success(user.status === "ACTIVE" ? `${user.name} blocked` : `${user.name} unblocked`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  const users = data?.users ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Customers</h1>
        {data && <span className="text-sm text-muted-foreground">({data.pagination.total} registered)</span>}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or phone…" className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {!data ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-125 text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3 font-medium">Customer</th>
                    <th className="p-3 font-medium">Phone</th>
                    <th className="p-3 font-medium">Orders</th>
                    <th className="p-3 font-medium">Lifetime value</th>
                    <th className="p-3 font-medium">Joined</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
                      <td className="p-3 font-semibold">{u.orderCount}</td>
                      <td className="p-3 font-semibold">{formatINR(u.totalSpent)}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="p-3"><StatusBadge status={u.status} /></td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant={u.status === "ACTIVE" ? "outline" : "secondary"}
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => toggleBlock(u)}
                        >
                          {u.status === "ACTIVE" ? (
                            <><Ban className="h-3.5 w-3.5 text-destructive" /> Block</>
                          ) : (
                            <><Undo2 className="h-3.5 w-3.5" /> Unblock</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No customers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data && <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Blocked users cannot sign in. Admin accounts are managed separately and not listed here.
      </p>
    </div>
  );
}
