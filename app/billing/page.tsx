"use client";

import { use, useMemo } from "react";
import { useCustomer } from "autumn-js/react";
import Link from "next/link";

export default function BillingPage() {
  const { customer, openBillingPortal, cancel, attach, refetch } = useCustomer({
    expand: ["invoices"],
  });

  const currentProduct = useMemo(
    () => customer?.products?.find((p) => p.status === "active"),
    [customer],
  );

  const messagesFeature = customer?.features?.messages;

  const handleUpgradeToPro = async () => {
    await attach({
      productId: "pro",
    });
    await refetch();
  };

  const handleCancelPro = async () => {
    await cancel({ productId: "pro" });
    await refetch();
  };

  const handleOpenBillingPortal = async () => {
    await openBillingPortal({
      returnUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/billing`,
    });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground">
            View your plan, usage and manage your subscription.
          </p>
        </div>
        <Link
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
          href="/"
        >
          Back to chat
        </Link>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-2 text-sm font-semibold">Current plan</h2>
        <p className="text-sm">
          {currentProduct ? (
            <>
              <span className="font-medium">{currentProduct.name}</span>
              {currentProduct.id === "free" && " · 5 messages / month"}
              {currentProduct.id === "pro" && " · 100 messages / month"}
            </>
          ) : (
            "No active plan"
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            onClick={handleUpgradeToPro}
            type="button"
          >
            Upgrade to Pro
          </button>
          <button
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-60"
            disabled={currentProduct?.id !== "pro"}
            onClick={handleCancelPro}
            type="button"
          >
            Cancel Pro subscription
          </button>
          <button
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
            onClick={handleOpenBillingPortal}
            type="button"
          >
            Manage payment method
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-2 text-sm font-semibold">Messages usage</h2>
        {messagesFeature ? (
          <p className="text-sm">
            Balance:{" "}
            <span className="font-medium">{messagesFeature.balance}</span> /{" "}
            <span className="font-medium">
              {messagesFeature.included_usage}
            </span>{" "}
            messages this {messagesFeature.interval}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No messages feature found for this customer.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="mb-2 text-sm font-semibold">Invoices</h2>
        {customer?.invoices && customer.invoices.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {customer.invoices.map((invoice) => (
              <li
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                key={invoice.stripe_id}
              >
                <div>
                  <div className="font-medium">
                    {(invoice.total / 100).toFixed(2)}{" "}
                    {invoice.currency.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {invoice.status}
                  </div>
                </div>
                {invoice.hosted_invoice_url && (
                  <a
                    className="text-[11px] font-medium text-primary underline-offset-4 hover:underline"
                    href={invoice.hosted_invoice_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No invoices for this customer yet.
          </p>
        )}
      </section>
    </div>
  );
}
