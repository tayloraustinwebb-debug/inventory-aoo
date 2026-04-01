export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  unitCost: number;
  locationType: "Van" | "Shop";
  sublocation: string;
  brand: string;
  notes: string;
  preferredStore: string;
  productUrl: string;
  assignedTo: string;
  status: "in_stock" | "reorder";
  cheapestStore: string;
  lastUpdated: string;
  priceUpdatedAt: string;
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const categories = [
  "Masking",
  "Tape",
  "Protection",
  "Rollers & Covers",
  "Brushes",
  "Prep",
  "Spray Supplies",
  "Cabinet Supplies",
  "Misc",
];

export const units = ["pcs", "rolls", "packs", "boxes", "gallons", "quarts", "kits"];
export const locations = ["Van", "Shop"] as const;

export function seedItems(): InventoryItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: uid(),
      name: '9" Roller Covers',
      category: "Rollers & Covers",
      unit: "pcs",
      quantity: 24,
      minStock: 8,
      unitCost: 4.99,
      locationType: "Van",
      sublocation: "Van Shelf A",
      brand: "Purdy",
      notes: "Good for walls and ceilings",
      preferredStore: "Sherwin-Williams",
      productUrl: "",
      assignedTo: "Taylor",
      status: "in_stock",
      cheapestStore: "Sherwin-Williams",
      lastUpdated: now,
      priceUpdatedAt: now
    },
    {
      id: uid(),
      name: '12" Masking Paper Rolls',
      category: "Masking",
      unit: "rolls",
      quantity: 10,
      minStock: 4,
      unitCost: 12.5,
      locationType: "Shop",
      sublocation: "Rack 2",
      brand: "Trimaco",
      notes: "Cabinet jobs and floor protection",
      preferredStore: "Home Depot",
      productUrl: "",
      assignedTo: "Shop",
      status: "in_stock",
      cheapestStore: "Home Depot",
      lastUpdated: now,
      priceUpdatedAt: now
    },
    {
      id: uid(),
      name: "1.5\" Painter's Tape",
      category: "Tape",
      unit: "rolls",
      quantity: 15,
      minStock: 6,
      unitCost: 7.49,
      locationType: "Van",
      sublocation: "Drawer",
      brand: "3M",
      notes: "General masking",
      preferredStore: "Lowe's",
      productUrl: "",
      assignedTo: "Taylor",
      status: "in_stock",
      cheapestStore: "Lowe's",
      lastUpdated: now,
      priceUpdatedAt: now
    },
    {
      id: uid(),
      name: "Plastic Sheets",
      category: "Protection",
      unit: "rolls",
      quantity: 7,
      minStock: 3,
      unitCost: 18.99,
      locationType: "Shop",
      sublocation: "Rack 1",
      brand: "Trimaco",
      notes: "Dust and overspray protection",
      preferredStore: "Home Depot",
      productUrl: "",
      assignedTo: "Shop",
      status: "in_stock",
      cheapestStore: "Home Depot",
      lastUpdated: now,
      priceUpdatedAt: now
    },
    {
      id: uid(),
      name: "Hand Masking Rolls",
      category: "Masking",
      unit: "rolls",
      quantity: 5,
      minStock: 5,
      unitCost: 28.99,
      locationType: "Van",
      sublocation: "Van Shelf B",
      brand: "3M",
      notes: "Low stock alert example",
      preferredStore: "Amazon",
      productUrl: "",
      assignedTo: "Crew",
      status: "reorder",
      cheapestStore: "Amazon",
      lastUpdated: now,
      priceUpdatedAt: now
    }
  ];
}
