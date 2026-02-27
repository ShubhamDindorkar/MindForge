"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { InventoryItem, Transaction } from "./types";
import {
  inventoryItems as seedItems,
  transactions as seedTransactions,
} from "./mock-data";
import { generateId } from "./utils";

interface InventoryContextValue {
  items: InventoryItem[];
  transactions: Transaction[];
  addItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  getItem: (id: string) => InventoryItem | undefined;
  getItemBySku: (sku: string) => InventoryItem | undefined;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(
  undefined
);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(seedItems);
  const [transactions, setTransactions] =
    useState<Transaction[]>(seedTransactions);

  const addItem = useCallback(
    (data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newItem: InventoryItem = {
        ...data,
        id: `inv-${generateId()}`,
        createdAt: now,
        updatedAt: now,
      };
      setItems((prev) => [newItem, ...prev]);
    },
    []
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<InventoryItem>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        )
      );
    },
    []
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addTransaction = useCallback(
    (data: Omit<Transaction, "id">) => {
      const tx: Transaction = { ...data, id: `txn-${generateId()}` };
      setTransactions((prev) => [tx, ...prev]);

      setItems((prev) =>
        prev.map((item) => {
          if (item.id === data.itemId) {
            const newQty =
              data.type === "in"
                ? item.quantity + data.quantity
                : Math.max(0, item.quantity - data.quantity);
            return {
              ...item,
              quantity: newQty,
              updatedAt: new Date().toISOString(),
            };
          }
          return item;
        })
      );
    },
    []
  );

  const getItem = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  const getItemBySku = useCallback(
    (sku: string) => items.find((item) => item.sku === sku),
    [items]
  );

  return (
    <InventoryContext.Provider
      value={{
        items,
        transactions,
        addItem,
        updateItem,
        deleteItem,
        addTransaction,
        getItem,
        getItemBySku,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return ctx;
}
