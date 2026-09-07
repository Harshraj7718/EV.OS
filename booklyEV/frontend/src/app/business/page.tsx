"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BusinessRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/business/dashboard");
  }, [router]);

  return null;
}
