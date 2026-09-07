"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InvestorRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/investor/dashboard");
  }, [router]);

  return null;
}
