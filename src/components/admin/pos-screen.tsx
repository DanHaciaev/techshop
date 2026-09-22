"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { createPosSale } from "@/lib/actions/pos";
import { chargeCard, getConnectedTerminals, isAgentOnline, printReceipt, type PosTerminal } from "@/lib/pos-agent";
import { useDict, useLocale } from "@/i18n/locale-provider";
import { pick } from "@/i18n/pick";
import { formatPrice, cn } from "@/lib/utils";

type PosProduct = {
  id: string;
  categoryId: string | null;
  name: string;
  nameRo: string;
  price: number;
  image: string;
  sku: string;
  stocksByStore: Record<string, number>;
};

type PosStore = { id: string; name: string; nameRo: string };
type PosCategory = { id: string; name: string; nameRo: string };
type PosCategoryTree = PosCategory & { children: PosCategory[] };

type CartLine = { productId: string; quantity: number };

type Step = "idle" | "charging" | "saving";

export function PosScreen({
  role,
  stores,
  initialStoreId,
  tree,
  products,
}: {
  role: "ADMIN" | "SELLER";
  stores: PosStore[];
  initialStoreId: string | null;
  tree: PosCategoryTree[];
  products: PosProduct[];
}) {
  const dict = useDict();
  const locale = useLocale();
  const t = dict.admin.pos;

  const [storeId, setStoreId] = useState(initialStoreId);
  const [search, setSearch] = useState("");
  const [topCategoryId, setTopCategoryId] = useState<string | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [terminalChoices, setTerminalChoices] = useState<PosTerminal[] | null>(null);

  const stockFor = (p: PosProduct) => (storeId ? (p.stocksByStore[storeId] ?? 0) : 0);

  const activeTop = tree.find((c) => c.id === topCategoryId) ?? null;

  function selectTop(id: string | null) {
    setTopCategoryId(id);
    setSubCategoryId(null);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products;
    if (subCategoryId) {
      list = list.filter((p) => p.categoryId === subCategoryId);
    } else if (topCategoryId) {
      const childIds = new Set((activeTop?.children ?? []).map((c) => c.id));
      list = list.filter((p) => p.categoryId === topCategoryId || (p.categoryId && childIds.has(p.categoryId)));
    }
    if (!q) return list;
    return list.filter((p) => pick(p.name, p.nameRo, locale).toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search, locale, topCategoryId, subCategoryId, activeTop]);

  const cartLines = useMemo(
    () =>
      cart.map((line) => {
        const product = products.find((p) => p.id === line.productId)!;
        return { ...line, product };
      }),
    [cart, products]
  );
  const total = cartLines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  function addToCart(product: PosProduct) {
    setError(null);
    setSuccess(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      const available = stockFor(product);
      if (existing) {
        if (existing.quantity >= available) return prev;
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (available <= 0) return prev;
      return [...prev, { productId: product.id, quantity: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l;
          const product = products.find((p) => p.id === productId)!;
          const next = Math.min(stockFor(product), Math.max(0, l.quantity + delta));
          return { ...l, quantity: next };
        })
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function resetSale() {
    setCart([]);
    setPayment("cash");
    setTerminalChoices(null);
  }

  async function completeSale(terminalId?: string) {
    setError(null);
    try {
      const result = await createPosSale({
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        paymentMethod: payment,
        storeId: role === "ADMIN" ? (storeId ?? undefined) : undefined,
      });
      if ("error" in result) {
        setError(result.error);
        setStep("idle");
        return;
      }
      setSuccess(t.saleSuccess(result.orderId.slice(-8).toUpperCase()));
      resetSale();
      setStep("idle");

      const online = await isAgentOnline();
      if (online) {
        const printed = await printReceipt(`${window.location.origin}/pos-receipt/${result.orderId}`);
        if (!printed.ok) setError(t.printFailed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("idle");
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    setError(null);
    setSuccess(null);
    setTerminalChoices(null);

    if (payment === "cash") {
      setStep("saving");
      await completeSale();
      return;
    }

    setStep("charging");
    const online = await isAgentOnline();
    if (!online) {
      setError(t.agentOffline);
      setStep("idle");
      return;
    }
    const terminals = await getConnectedTerminals();
    if (terminals.length === 0) {
      setError(t.noTerminals);
      setStep("idle");
      return;
    }
    if (terminals.length > 1) {
      setTerminalChoices(terminals);
      setStep("idle");
      return;
    }
    await chargeAndComplete(terminals[0].id);
  }

  async function chargeAndComplete(terminalId: string) {
    setTerminalChoices(null);
    setStep("charging");
    const result = await chargeCard(total, terminalId);
    if (!result.ok) {
      setError(result.declined ? `${t.declined}${result.error ? `: ${result.error}` : ""}` : (result.error ?? t.declined));
      setStep("idle");
      return;
    }
    setStep("saving");
    await completeSale(terminalId);
  }

  const busy = step !== "idle";

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {role === "ADMIN" ? (
            <select
              value={storeId ?? ""}
              onChange={(e) => {
                setStoreId(e.target.value || null);
                setCart([]);
              }}
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {pick(s.name, s.nameRo, locale)}
                </option>
              ))}
            </select>
          ) : null}
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto overflow-y-hidden no-scrollbar">
          <button
            type="button"
            onClick={() => selectTop(null)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              topCategoryId === null ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground hover:border-primary/60"
            )}
          >
            {t.allCategories}
          </button>
          {tree.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectTop(c.id)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                topCategoryId === c.id ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground hover:border-primary/60"
              )}
            >
              {pick(c.name, c.nameRo, locale)}
            </button>
          ))}
        </div>

        {activeTop && activeTop.children.length > 0 ? (
          <div className="flex gap-1.5 overflow-x-auto overflow-y-hidden no-scrollbar">
            <button
              type="button"
              onClick={() => setSubCategoryId(null)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                subCategoryId === null ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              {t.allCategories}
            </button>
            {activeTop.children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSubCategoryId(c.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  subCategoryId === c.id ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted hover:text-foreground"
                )}
              >
                {pick(c.name, c.nameRo, locale)}
              </button>
            ))}
          </div>
        ) : null}

        {!storeId ? (
          <p className="text-sm text-muted">{t.selectStoreFirst}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => {
              const stock = stockFor(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={stock <= 0}
                  onClick={() => addToCart(p)}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-card border border-border bg-surface text-left transition-colors",
                    stock > 0 ? "hover:border-primary/60" : "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="relative aspect-square w-full bg-surface-muted">
                    <Image src={p.image || "/images/placeholder.svg"} alt="" fill sizes="200px" className="object-cover" />
                  </div>
                  <div className="flex flex-col gap-1 p-2.5">
                    <span className="line-clamp-2 text-xs font-medium text-foreground">{pick(p.name, p.nameRo, locale)}</span>
                    <span className="text-sm font-bold text-foreground">{formatPrice(p.price)}</span>
                    <span className={cn("text-xs", stock > 0 ? "text-success" : "text-danger")}>
                      {stock > 0 ? t.inStock(stock) : t.outOfStock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex h-fit flex-col gap-4 rounded-card border border-border bg-surface p-4 lg:sticky lg:top-4">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <ShoppingCart size={17} className="text-primary" /> {t.cart}
        </h2>

        {cartLines.length === 0 ? (
          <p className="text-sm text-muted">{t.emptyCart}</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {cartLines.map((l) => (
              <div key={l.productId} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{pick(l.product.name, l.product.nameRo, locale)}</p>
                  <p className="text-xs text-muted">{formatPrice(l.product.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => changeQty(l.productId, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:border-primary hover:text-primary"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-5 text-center text-sm text-foreground">{l.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(l.productId, 1)}
                    disabled={l.quantity >= stockFor(l.product)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(l.productId)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold text-foreground">{t.total}</span>
          <span className="text-xl font-bold text-foreground">{formatPrice(total)}</span>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">{t.paymentMethod}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPayment("cash")}
              className={cn(
                "flex-1 rounded-lg border py-2 text-sm font-medium transition-colors",
                payment === "cash" ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground"
              )}
            >
              {t.cash}
            </button>
            <button
              type="button"
              onClick={() => setPayment("card")}
              className={cn(
                "flex-1 rounded-lg border py-2 text-sm font-medium transition-colors",
                payment === "card" ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground"
              )}
            >
              {t.card}
            </button>
          </div>
        </div>

        {terminalChoices ? (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border p-2.5">
            <p className="text-xs font-medium text-muted">{t.chooseTerminal}</p>
            {terminalChoices.map((term) => (
              <button
                key={term.id}
                type="button"
                onClick={() => chargeAndComplete(term.id)}
                className="rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground hover:border-primary"
              >
                {term.driver}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start justify-between gap-2 rounded-lg bg-danger/10 p-2.5 text-sm text-danger">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)}>
              <X size={14} />
            </button>
          </div>
        ) : null}
        {success ? <div className="rounded-lg bg-success/10 p-2.5 text-sm text-success">{success}</div> : null}

        <button
          type="button"
          disabled={cart.length === 0 || busy || !storeId}
          onClick={handleCheckout}
          className="rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {step === "charging" ? t.chargingCard : step === "saving" ? t.processing : t.checkout}
        </button>
      </div>
    </div>
  );
}
