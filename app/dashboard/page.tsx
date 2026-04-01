import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryApp } from "@/components/inventory-app";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <InventoryApp initialView="dashboard" />;
}
