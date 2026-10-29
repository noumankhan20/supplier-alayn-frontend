"use client";

import React from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function AuthLoader({ message = "Loading Supplier Portal..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F4F7F9]">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-12 w-32">
          <Image
            src="/image1.png"
            alt="Alayn Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="flex items-center space-x-2 text-sm font-semibold text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin text-[#D3232A]" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}

