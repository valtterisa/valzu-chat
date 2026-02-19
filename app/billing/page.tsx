import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BillingClient } from "@/components/billing-client";

export default async function BillingPage() {
  const headerList = await headers();

  const session = await auth.api.getSession({
    headers: headerList,
  });

  if (!session) {
    redirect("/signin");
  }

  return <BillingClient />;
}
