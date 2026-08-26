"use client";

import { useEffect, useState } from "react";
import { generateGreeting } from "@/lib/actions/greeting";

export function DashboardGreeting() {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    generateGreeting(new Date().getHours()).then(setGreeting);
  }, []);

  return (
    <h1 className="text-2xl font-semibold">
      {greeting ?? "Buenos días, Carlangax"}
    </h1>
  );
}
