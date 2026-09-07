"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RiderRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/rider/dashboard");
  }, [router]);

  return null;
}
