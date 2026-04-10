"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentsPage() {
  const router = useRouter();

  useEffect(() => {
    // For now, the main dashboard IS the agents list. 
    // Redirect to avoid 404 if someone visits /dashboard/agents
    router.replace("/dashboard");
  }, [router]);

  return null;
}
