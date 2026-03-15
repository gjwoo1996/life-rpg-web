"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

let isFirstLoad = true;

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [opacity, setOpacity] = useState(isFirstLoad ? 1 : 0);

  useEffect(() => {
    if (isFirstLoad) {
      isFirstLoad = false;
      return;
    }
    setOpacity(1);
  }, [pathname]);

  return (
    <div
      key={pathname}
      style={{
        opacity,
        transition: "opacity 0.2s ease-out",
      }}
    >
      {children}
    </div>
  );
}
