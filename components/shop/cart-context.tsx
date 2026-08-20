"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  unitLabel: string;
  imageUrl?: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) {
  return `kuku-cart-${slug}`;
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [slug]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey(slug), JSON.stringify(items));
  }, [items, slug, ready]);

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.productId === item.productId);
      if (existing) {
        return prev.map((p) =>
          p.productId === item.productId
            ? { ...p, quantity: p.quantity + qty }
            : p
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const setQty = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.productId === productId ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  };

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, setQty, removeItem, clear, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
