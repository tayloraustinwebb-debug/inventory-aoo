"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes, ClipboardList, Search, Plus, Minus, Warehouse, Truck, ShoppingCart,
  AlertTriangle, Share2, Smartphone, Tablet, Bell, DollarSign, Pencil, Trash2,
  ArrowRightLeft, Cloud, ShieldCheck, Users, Sparkles, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { compactNumber, currency } from "@/lib/utils";
import { categories, locations, seedItems, units, type InventoryItem } from "@/lib/seed";

const STORAGE_KEY = "paint-pals-real-app-starter-v1";
const views = ["dashboard", "inventory", "reorder", "prices", "team", "settings"] as const;
type AppView = (typeof views)[number];

const supabase = createClient();

type DbInventoryItem = {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  quantity: number;
  min_stock: number;
  unit_cost: number;
  location_type: string | null;
  sublocation: string | null;
  brand: string | null;
  notes: string | null;
  preferred_store: string | null;
  product_url: string | null;
  assigned_to: string | null;
  status: string | null;
  cheapest_store: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_price_checked_at: string | null;
};

function mapDbItem(item: DbInventoryItem): InventoryItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category || "Misc",
    unit: item.unit || "pcs",
    quantity: item.quantity,
    minStock: item.min_stock,
    unitCost: Number(item.unit_cost || 0),
    locationType: (item.location_type as "Van" | "Shop") || "Shop",
    sublocation: item.sublocation || "",
    brand: item.brand || "",
    notes: item.notes || "",
    preferredStore: item.preferred_store || "",
    productUrl: item.product_url || "",
    assignedTo: item.assigned_to || "",
    status: (item.status as "in_stock" | "reorder") || "in_stock",
    cheapestStore: item.cheapest_store || "",
    lastUpdated: item.updated_at || new Date().toISOString(),
    priceUpdatedAt: item.last_price_checked_at || new Date().toISOString(),
  };
}

async function fetchWorkspaceId() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No authenticated user found.");
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (error) throw error;

  return data.workspace_id as string;
}

async function fetchInventoryItems(workspaceId: string) {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbItem);
}

function StatCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="rounded-[28px] border border-white/60 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-white p-3 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-[28px] border border-white/60 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function InventoryApp({ initialView = "dashboard" }: { initialView?: AppView }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>(initialView);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");
  const [workspaceName, setWorkspaceName] = useState("Paint Pals Inventory Cloud");
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [livePricingEnabled, setLivePricingEnabled] = useState(false);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState(true);
  const [teamAccessEnabled, setTeamAccessEnabled] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "Masking",
    unit: "rolls",
    quantity: 0,
    minStock: 0,
    unitCost: 0,
    locationType: "Van" as "Van" | "Shop",
    sublocation: "",
    brand: "",
    notes: "",
    preferredStore: "",
    productUrl: "",
    assignedTo: ""
  });

  useEffect(() => {
  async function load() {
    try {
      const foundWorkspaceId = await fetchWorkspaceId();
      setWorkspaceId(foundWorkspaceId);

      const {
  data: { user },
} = await supabase.auth.getUser();

setUserEmail(user?.email ?? null);

      const dbItems = await fetchInventoryItems(foundWorkspaceId);
      setItems(dbItems);
    } catch (error) {
      console.error("Failed to load inventory items", error);
      setItems([]);
    }
  }

  load();
}, []);
  

  const filteredItems = useMemo(() => {
    return items
      .filter((item) =>
        [item.name, item.category, item.locationType, item.sublocation, item.brand, item.notes, item.preferredStore, item.assignedTo]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .filter((item) => (locationFilter === "All" ? true : item.locationType === locationFilter))
      .filter((item) => {
        if (stockFilter === "low") return item.quantity <= item.minStock;
        if (stockFilter === "healthy") return item.quantity > item.minStock;
        if (stockFilter === "reorder") return item.quantity <= item.minStock;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search, locationFilter, stockFilter]);

  const reorderItems = useMemo(() => items.filter((item) => item.quantity <= item.minStock), [items]);

  const stats = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const vanUnits = items.filter((item) => item.locationType === "Van").reduce((sum, item) => sum + item.quantity, 0);
    const shopUnits = items.filter((item) => item.locationType === "Shop").reduce((sum, item) => sum + item.quantity, 0);
    const inventoryValue = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const lowStock = items.filter((item) => item.quantity <= item.minStock).length;
    return { totalUnits, vanUnits, shopUnits, inventoryValue, lowStock, totalLines: items.length };
  }, [items]);

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "", category: "Masking", unit: "rolls", quantity: 0, minStock: 0, unitCost: 0,
      locationType: "Van", sublocation: "", brand: "", notes: "", preferredStore: "", productUrl: "", assignedTo: ""
    });
  }

  function openNew() { resetForm(); setEditorOpen(true); }

  function openEdit(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      name: item.name, category: item.category, unit: item.unit, quantity: item.quantity,
      minStock: item.minStock, unitCost: item.unitCost, locationType: item.locationType,
      sublocation: item.sublocation, brand: item.brand, notes: item.notes,
      preferredStore: item.preferredStore, productUrl: item.productUrl, assignedTo: item.assignedTo
    });
    setEditorOpen(true);
  }

  async function saveItem() {
  if (!form.name.trim()) return;
    if (!workspaceId) return;

  const payload = {
    name: form.name,
    category: form.category,
    unit: form.unit,
    quantity: Number(form.quantity || 0),
    min_stock: Number(form.minStock || 0),
    unit_cost: Number(form.unitCost || 0),
    location_type: form.locationType,
    sublocation: form.sublocation,
    brand: form.brand,
    notes: form.notes,
    preferred_store: form.preferredStore,
    product_url: form.productUrl,
    assigned_to: form.assignedTo,
    status:
      Number(form.quantity || 0) <= Number(form.minStock || 0)
        ? "reorder"
        : "in_stock",
    cheapest_store: form.preferredStore || "—",
    updated_at: new Date().toISOString(),
    last_price_checked_at: new Date().toISOString(),
    workspace_id: workspaceId,
  };

  try {
    if (editingId) {
      const { error } = await supabase
        .from("inventory_items")
        .update(payload)
        .eq("id", editingId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("inventory_items").insert(payload);
      if (error) throw error;
    }

    const dbItems = await fetchInventoryItems(workspaceId);
    setItems(dbItems);
    setEditorOpen(false);
    resetForm();
  } catch (error) {
    console.error("Failed to save item", error);
  }
}

  async function adjustQuantity(id: string, delta: number) {
    if (!workspaceId) return;
    
  const current = items.find((item) => item.id === id);
  if (!current) return;

  const nextQty = Math.max(0, current.quantity + delta);

  try {
    const { error } = await supabase
      .from("inventory_items")
      .update({
        quantity: nextQty,
        status: nextQty <= current.minStock ? "reorder" : "in_stock",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    const dbItems = await fetchInventoryItems(workspaceId);
    setItems(dbItems);
  } catch (error) {
    console.error("Failed to adjust quantity", error);
  }
}

  async function deleteItem(id: string) {
  if (!workspaceId) return;

  try {
    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id);

    if (error) throw error;

    const dbItems = await fetchInventoryItems(workspaceId);
    setItems(dbItems);
  } catch (error) {
    console.error("Failed to delete item", error);
  }
}

  async function moveItem(id: string) {
  if (!workspaceId) return;

  const current = items.find((item) => item.id === id);
  if (!current) return;

  const nextLocation = current.locationType === "Van" ? "Shop" : "Van";

  try {
    const { error } = await supabase
      .from("inventory_items")
      .update({
        location_type: nextLocation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    const dbItems = await fetchInventoryItems(workspaceId);
    setItems(dbItems);
  } catch (error) {
    console.error("Failed to move item", error);
  }
}
  function simulatePriceCheck(item: InventoryItem) {
    const query = encodeURIComponent(`${item.brand || ""} ${item.name}`.trim());
    window.open(`https://www.google.com/search?tbm=shop&q=${query}`, "_blank", "noopener,noreferrer");
  }

  const inventoryCards = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory" className="pl-9" />
          </div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Locations</SelectItem>
              <SelectItem value="Van">Van</SelectItem>
              <SelectItem value="Shop">Shop</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Tabs value={stockFilter} onValueChange={setStockFilter}>
          <TabsList className="grid h-auto w-full max-w-[420px] grid-cols-4 rounded-2xl border border-white/70 bg-white/75 p-1 shadow-sm">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="low">Low</TabsTrigger>
            <TabsTrigger value="healthy">Healthy</TabsTrigger>
            <TabsTrigger value="reorder">Reorder</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredItems.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-[24px] border border-dashed border-slate-200 bg-white/60 p-8 text-center text-sm text-slate-500">
            No supplies match your filters.
          </motion.div>
        ) : (
          filteredItems.map((item) => (
            <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-[26px] border border-white/70 bg-white/80 p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                    <Badge className="rounded-full border-0 bg-slate-100 text-slate-700">{item.category}</Badge>
                    <Badge className="rounded-full border-0 bg-blue-100 text-blue-700">{item.locationType}</Badge>
                    {item.quantity <= item.minStock ? <Badge className="rounded-full border-0 bg-orange-100 text-orange-700">Reorder</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                    <span>Qty: <strong className="text-slate-800">{item.quantity} {item.unit}</strong></span>
                    <span>Min: <strong className="text-slate-800">{item.minStock}</strong></span>
                    <span>Spot: <strong className="text-slate-800">{item.sublocation || "—"}</strong></span>
                    <span>Cost: <strong className="text-slate-800">{currency(item.unitCost)}</strong></span>
                    <span>Total: <strong className="text-slate-800">{currency(item.quantity * item.unitCost)}</strong></span>
                    <span>Cheapest: <strong className="text-slate-800">{item.cheapestStore || item.preferredStore || "—"}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>Assigned: <strong className="text-slate-800">{item.assignedTo || "—"}</strong></span>
                    <span>Last updated: <strong className="text-slate-800">{new Date(item.lastUpdated).toLocaleDateString()}</strong></span>
                  </div>
                  {item.notes ? <p className="text-sm text-slate-600">{item.notes}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => adjustQuantity(item.id, -1)}><Minus className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => adjustQuantity(item.id, 1)}><Plus className="h-4 w-4" /></Button>
                  <Button variant="outline" onClick={() => moveItem(item.id)}><ArrowRightLeft className="mr-2 h-4 w-4" />Move</Button>
                  <Button variant="outline" onClick={() => simulatePriceCheck(item)}><Search className="mr-2 h-4 w-4" />Price Check</Button>
                  <Button variant="outline" onClick={() => openEdit(item)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                  <Button variant="outline" onClick={() => deleteItem(item.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(167,139,250,0.18),_transparent_20%),linear-gradient(180deg,_#f8fbff_0%,_#eef4fb_100%)] p-3 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/45 p-3 shadow-[0_25px_90px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:p-5">
          <div className="pointer-events-none absolute -left-8 top-4 h-40 w-40 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-8 top-8 h-40 w-40 rounded-full bg-violet-200/35 blur-3xl" />
          <div className="relative z-10 space-y-6">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-4 xl:grid-cols-[1.35fr,0.9fr]">
              <SectionCard title={workspaceName} subtitle="Starter build for a real phone and tablet app with cloud sync, team access, reorder workflows, and live pricing architecture." action={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Supply</Button>}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"><Smartphone className="h-3.5 w-3.5" />iPhone / Android Ready</div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"><Tablet className="h-3.5 w-3.5" />Tablet Layout</div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"><Cloud className="h-3.5 w-3.5" />Cloud App Architecture</div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"><Users className="h-3.5 w-3.5" />Team Collaboration</div>
                </div>
              </SectionCard>

              <SectionCard title="Live App Stack" subtitle="What powers the real build.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="font-semibold text-slate-900">Frontend</p><p className="mt-1 text-sm text-slate-500">Next.js + mobile-first UI + PWA installability</p></div>
                  <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="font-semibold text-slate-900">Database</p><p className="mt-1 text-sm text-slate-500">Supabase for live sync, auth, and storage</p></div>
                  <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="font-semibold text-slate-900">Auth</p><p className="mt-1 text-sm text-slate-500">Magic link or email login</p></div>
                  <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="font-semibold text-slate-900">Pricing Engine</p><p className="mt-1 text-sm text-slate-500">Retail APIs + scheduled refresh jobs</p></div>
                </div>
              </SectionCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.04 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard title="Inventory Lines" value={compactNumber(stats.totalLines)} subtitle="Tracked supply types" icon={ClipboardList} />
              <StatCard title="Total Units" value={compactNumber(stats.totalUnits)} subtitle="All units on hand" icon={Boxes} />
              <StatCard title="Van Units" value={compactNumber(stats.vanUnits)} subtitle="Ready for jobs" icon={Truck} />
              <StatCard title="Shop Units" value={compactNumber(stats.shopUnits)} subtitle="Warehouse stock" icon={Warehouse} />
              <StatCard title="Low Stock" value={compactNumber(stats.lowStock)} subtitle="Needs reorder" icon={AlertTriangle} />
              <StatCard title="Inventory Value" value={currency(stats.inventoryValue)} subtitle="Total supply value" icon={DollarSign} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }} className="grid gap-5 xl:grid-cols-[1.55fr,0.9fr]">
              <div className="space-y-5">
                <SectionCard title="App Navigation" subtitle="The starter is organized into business-ready modules.">
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    {views.map((view) => (
                      <button key={view} onClick={() => setActiveView(view)} className={`rounded-2xl border px-4 py-3 text-sm font-semibold capitalize transition ${activeView === view ? "border-slate-900 bg-slate-900 text-white" : "border-white/70 bg-white/80 text-slate-700 hover:bg-white"}`}>
                        {view}
                      </button>
                    ))}
                  </div>
                </SectionCard>

                {activeView === "dashboard" && (
                  <SectionCard title="Dashboard" subtitle="The main daily view for owner and crew.">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                        <p className="text-sm font-semibold text-slate-900">What the live app will do</p>
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <div className="flex items-start gap-3"><Cloud className="mt-0.5 h-4 w-4 text-blue-600" />Realtime cloud sync between devices</div>
                          <div className="flex items-start gap-3"><Users className="mt-0.5 h-4 w-4 text-blue-600" />Shared logins for owner and crew</div>
                          <div className="flex items-start gap-3"><Bell className="mt-0.5 h-4 w-4 text-blue-600" />Push alerts for low stock and price changes</div>
                          <div className="flex items-start gap-3"><BarChart3 className="mt-0.5 h-4 w-4 text-blue-600" />Usage and spend tracking</div>
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                        <p className="text-sm font-semibold text-slate-900">Installable app feel</p>
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 text-violet-600" />Premium iOS and Android style</div>
                          <div className="flex items-start gap-3"><Smartphone className="mt-0.5 h-4 w-4 text-violet-600" />Home screen install as a PWA</div>
                          <div className="flex items-start gap-3"><Tablet className="mt-0.5 h-4 w-4 text-violet-600" />Tablet layout for shop use</div>
                          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-violet-600" />Role-based permissions</div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {activeView === "inventory" && <SectionCard title="Inventory" subtitle="Track van and shop supplies with live controls.">{inventoryCards}</SectionCard>}

                {activeView === "reorder" && (
                  <SectionCard title="Reorder Center" subtitle="Items currently under threshold.">
                    <div className="space-y-3">
                      {reorderItems.length === 0 ? <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-500 shadow-sm">Nothing needs reordering right now.</div> : reorderItems.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{item.name}</p>
                              <p className="text-sm text-slate-500">{item.locationType} • {item.sublocation || "—"} • {currency(item.unitCost)} each</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="rounded-full border-0 bg-orange-100 text-orange-700">{item.quantity} / min {item.minStock}</Badge>
                              <Button variant="outline" onClick={() => simulatePriceCheck(item)}><ShoppingCart className="mr-2 h-4 w-4" />Shop Price</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {activeView === "prices" && (
                  <SectionCard title="Pricing Engine" subtitle="How the real app will handle cheapest-price tracking.">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">Already in this starter</p>
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <div>• Unit cost and total inventory value</div>
                          <div>• Preferred store and product link fields</div>
                          <div>• Price check button for live Google Shopping lookup</div>
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">Needs live backend later</p>
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          <div>• Retail APIs or approved data providers</div>
                          <div>• Scheduled price refresh jobs</div>
                          <div>• Price history and cheapest-store logic</div>
                          <div>• Product matching by SKU, UPC, brand, and title</div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {activeView === "team" && (
                  <SectionCard title="Team Access" subtitle="Shared owner and crew workflows.">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">Roles</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <div>• Owner: full access</div>
                          <div>• Manager: inventory edits and reorder approval</div>
                          <div>• Crew: quantity updates and supply checkouts</div>
                        </div>
                      </div>
                      <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                        <p className="font-semibold text-slate-900">Sharing</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <div>• Invite by email or magic link</div>
                          <div>• Shared live edits on the same inventory</div>
                          <div>• Per-user audit trail on changes</div>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {activeView === "settings" && (
                  <SectionCard title="App Settings" subtitle="Production feature flags.">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[24px] bg-white/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Cloud Sync</p><p className="text-sm text-slate-500">Realtime shared database</p></div><Switch checked={cloudSyncEnabled} onCheckedChange={setCloudSyncEnabled} /></div></div>
                      <div className="rounded-[24px] bg-white/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Live Pricing</p><p className="text-sm text-slate-500">Automatic price refreshes</p></div><Switch checked={livePricingEnabled} onCheckedChange={setLivePricingEnabled} /></div></div>
                      <div className="rounded-[24px] bg-white/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Push Alerts</p><p className="text-sm text-slate-500">Low stock and cost alerts</p></div><Switch checked={pushAlertsEnabled} onCheckedChange={setPushAlertsEnabled} /></div></div>
                      <div className="rounded-[24px] bg-white/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Team Access</p><p className="text-sm text-slate-500">Crew invitations and permissions</p></div><Switch checked={teamAccessEnabled} onCheckedChange={setTeamAccessEnabled} /></div></div>
                      <div className="rounded-[24px] bg-white/80 p-4 shadow-sm lg:col-span-2"><Label className="mb-2 block">Workspace Name</Label><Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} /></div>
                    </div>
                  </SectionCard>
                )}
              </div>

              <div className="space-y-5">
                <SectionCard title="Owner Panel" subtitle="Quick business controls.">
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Cloud Sync Status</p><p className="text-xs text-slate-500">Connect Supabase next.</p></div><Badge className="rounded-full border-0 bg-emerald-100 text-emerald-700">{cloudSyncEnabled ? "Enabled" : "Off"}</Badge></div></div>
                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Live Price Engine</p><p className="text-xs text-slate-500">Automatic pricing needs external APIs.</p></div><Badge className="rounded-full border-0 bg-slate-100 text-slate-700">{livePricingEnabled ? "Planned On" : "Preview Only"}</Badge></div></div>
                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Push Alerts</p><p className="text-xs text-slate-500">Low stock reminders for owner and crew.</p></div><Badge className="rounded-full border-0 bg-blue-100 text-blue-700">{pushAlertsEnabled ? "Enabled" : "Disabled"}</Badge></div></div>
                  </div>
                </SectionCard>

                <SectionCard title="Build Notes" subtitle="What is in the starter.">
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="font-semibold text-slate-900">Included now</p><p className="mt-2">Van and shop inventory, reorder list, supply costs, inventory value, premium mobile UI, route structure, and Supabase starter files.</p></div>
                    <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="font-semibold text-slate-900">Add next</p><p className="mt-2">Real logins, shared live syncing, push notifications, and automatic price scanning.</p></div>
                  </div>
                </SectionCard>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <div className="p-1">
            <DialogHeader><DialogTitle className="text-2xl font-black tracking-tight text-slate-900">{editingId ? "Edit Supply" : "Add Supply"}</DialogTitle></DialogHeader>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>Supply Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label><Select value={form.locationType} onValueChange={(value: "Van" | "Shop") => setForm({ ...form, locationType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{locations.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Unit</Label><Select value={form.unit} onValueChange={(value) => setForm({ ...form, unit: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Storage Spot</Label><Input value={form.sublocation} onChange={(e) => setForm({ ...form, sublocation: e.target.value })} /></div>
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Low Stock Threshold</Label><Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Unit Cost</Label><Input type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
              <div className="space-y-2"><Label>Preferred Store</Label><Input value={form.preferredStore} onChange={(e) => setForm({ ...form, preferredStore: e.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Product URL</Label><Input value={form.productUrl} onChange={(e) => setForm({ ...form, productUrl: e.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Assigned To</Label><Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setEditorOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={saveItem}>Save Supply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
