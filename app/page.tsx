"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat page
    router.push("/chat");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 ">
      <LoadingSpinner size="lg" text="Loading Knowledge Hub..." />
    </div>
  );
}



