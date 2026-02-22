"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StylesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/styles/fences");
  }, [router]);

  return null;
}
