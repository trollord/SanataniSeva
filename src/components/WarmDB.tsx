"use client";

import { useEffect } from "react";

export default function WarmDB() {
  useEffect(() => {
    fetch("/api/ping").catch(() => {});
  }, []);

  return null;
}
