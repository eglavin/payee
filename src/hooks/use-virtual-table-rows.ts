"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface UseVirtualTableRowsOptions {
  /** Row count of the current sorted/filtered data set. */
  count: number;
  /** Best-guess row height in px before measurement kicks in. */
  estimateRowHeight: number;
  overscan?: number;
}

/**
 * Virtualizes a table body while keeping real <table>/<tr>/<td> markup and
 * native column auto-sizing: only rows near the viewport are mounted, with
 * a single padding <tr> before and after to preserve correct scroll height.
 */
export function useVirtualTableRows({
  count,
  estimateRowHeight,
  overscan = 8,
}: UseVirtualTableRowsOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  // A scroll container that starts out hidden/animating (e.g. inside a
  // Sheet's open transition) can be unmeasurable on the virtualizer's first
  // layout effect, leaving it stuck reporting zero virtual items with
  // nothing else to trigger it to look again. Retry (bounded) until it
  // un-sticks, then stop.
  const stuck = count > 0 && virtualItems.length === 0;
  const stuckRef = useRef(stuck);
  stuckRef.current = stuck;
  const [, bumpRetry] = useState(0);
  useEffect(() => {
    if (!stuck) return;
    let cancelled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    function tick() {
      if (cancelled || !stuckRef.current) return;
      attempts += 1;
      bumpRetry((n) => n + 1);
      if (attempts < 10) timeoutId = setTimeout(tick, 32);
    }
    timeoutId = setTimeout(tick, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [stuck]);

  return {
    containerRef,
    virtualItems,
    paddingTop,
    paddingBottom,
    measureElement: virtualizer.measureElement,
  };
}
