"use client";

import { useState, useMemo } from "react";
import { useInventory } from "@/_lib/inventory-context";
import { CATEGORIES, LOCATIONS } from "@/_lib/mock-data";
import { formatCurrency } from "@/_lib/utils";
import type { InventoryItem } from "@/_lib/types";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/_components/ui/card";
import { Badge } from "@/_components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/_components/ui/dialog";
import { Label } from "@/_components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/_components/ui/select";
import { Textarea } from "@/_components/ui/textarea";
import { Separator } from "@/_components/ui/separator";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

type SortKey =
  | "name"
  | "sku"
  | "category"
  | "quantity"
  | "unitCost"
  | "totalValue"
  | "status";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 8;

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  quantity: 0,
  unitCost: 0,
  sellPrice: 0,
  reorderPoint: 0,
  location: "",
  description: "",
};

function getStatus(item: InventoryItem) {
  if (item.quantity === 0) return "Out of Stock";
  if (item.quantity <= item.reorderPoint) return "Low Stock";
  return "In Stock";
}

function getStatusVariant(status: string) {
  if (status === "Out of Stock") return "destructive" as const;
  if (status === "Low Stock") return "warning" as const;
  return "success" as const;
}

export default function InventoryPage() {
  const { items, addItem, updateItem, deleteItem } = useInventory();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return Array.from(cats).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "sku":
          return dir * a.sku.localeCompare(b.sku);
        case "category":
          return dir * a.category.localeCompare(b.category);
        case "quantity":
          return dir * (a.quantity - b.quantity);
        case "unitCost":
          return dir * (a.unitCost - b.unitCost);
        case "totalValue":
          return (
            dir * (a.quantity * a.unitCost - b.quantity * b.unitCost)
          );
        case "status": {
          const order = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 };
          return (
            dir *
            (order[getStatus(a) as keyof typeof order] -
              order[getStatus(b) as keyof typeof order])
          );
        }
        default:
          return 0;
      }
    });

    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function openAddDialog() {
    setEditingItem(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditDialog(item: InventoryItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      unitCost: item.unitCost,
      sellPrice: item.sellPrice,
      reorderPoint: item.reorderPoint,
      location: item.location,
      description: item.description ?? "",
    });
    setFormOpen(true);
  }

  function openDeleteDialog(item: InventoryItem) {
    setDeletingItem(item);
    setDeleteOpen(true);
  }

  function handleSave() {
    const data = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      quantity: Number(form.quantity),
      unitCost: Number(form.unitCost),
      sellPrice: Number(form.sellPrice),
      reorderPoint: Number(form.reorderPoint),
      location: form.location,
      description: form.description || undefined,
    };

    if (editingItem) {
      updateItem(editingItem.id, data);
    } else {
      addItem(data);
    }

    setFormOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  }

  function handleDelete() {
    if (deletingItem) {
      deleteItem(deletingItem.id);
    }
    setDeleteOpen(false);
    setDeletingItem(null);
  }

  const canSave =
    form.name.trim() !== "" &&
    form.sku.trim() !== "" &&
    form.category !== "" &&
    form.location !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your stock items, quantities, and details.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {sorted.length} item{sorted.length !== 1 ? "s" : ""} found
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {(
                    [
                      ["name", "Name"],
                      ["sku", "SKU"],
                      ["category", "Category"],
                      ["quantity", "Qty"],
                      ["unitCost", "Unit Cost"],
                      ["totalValue", "Total Value"],
                      ["status", "Status"],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th key={key} className="px-4 py-3 text-left font-medium">
                      <button
                        onClick={() => handleSort(key)}
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        {label}
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No items found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => {
                    const status = getStatus(item);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {item.sku}
                        </td>
                        <td className="px-4 py-3">{item.category}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatCurrency(item.quantity * item.unitCost)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(status)}>
                            {status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the details of this inventory item."
                : "Fill in the details to add a new inventory item."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Name</Label>
                <Input
                  id="item-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-sku">SKU</Label>
                <Input
                  id="item-sku"
                  value={form.sku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sku: e.target.value }))
                  }
                  placeholder="e.g. ELEC-PCB-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-qty">Quantity</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quantity: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-cost">Unit Cost</Label>
                <Input
                  id="item-cost"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.unitCost}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      unitCost: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-sell">Sell Price</Label>
                <Input
                  id="item-sell"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.sellPrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sellPrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-reorder">Reorder Point</Label>
                <Input
                  id="item-reorder"
                  type="number"
                  min={0}
                  value={form.reorderPoint}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      reorderPoint: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={form.location}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, location: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-desc">Description (optional)</Label>
              <Textarea
                id="item-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of the item"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deletingItem?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
