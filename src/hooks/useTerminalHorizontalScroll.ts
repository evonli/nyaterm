import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Terminal } from "@xterm/xterm";

/**
 * 虚拟列宽模式的横向滚动控制。
 *
 * xterm 没有公开的横向滚动 API，这里直接控制 `.xterm-viewport` 的
 * scrollLeft（DOM renderer 下内容宽度 = cols * 单元格宽，超宽部分
 * 通过容器滚动查看）。提供：
 * - shift+滚轮 横向滚动
 * - 光标超出可视区时自动跟随
 * - scrollLeft / scrollMax 状态供横向滚动条组件使用
 */
export function useTerminalHorizontalScroll(
  terminal: Terminal | null,
  containerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollMax, setScrollMax] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const viewportRef = useRef<HTMLElement | null>(null);

  const getViewport = useCallback((): HTMLElement | null => {
    if (!containerRef.current) return null;
    if (viewportRef.current?.isConnected) return viewportRef.current;
    viewportRef.current = containerRef.current.querySelector<HTMLElement>(
      ".xterm-viewport",
    );
    return viewportRef.current;
  }, [containerRef]);

  const sync = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;
    setScrollLeft(viewport.scrollLeft);
    setScrollMax(Math.max(0, viewport.scrollWidth - viewport.clientWidth));
    setClientWidth(viewport.clientWidth);
  }, [getViewport]);

  // 监听 viewport 横向滚动与尺寸变化（cols/resize 时 scrollWidth 会变）
  useEffect(() => {
    if (!enabled) return;
    const viewport = getViewport();
    if (!viewport) return;
    sync();

    const onScroll = () => sync();
    viewport.addEventListener("scroll", onScroll);
    const resizeObserver = new ResizeObserver(() => sync());
    resizeObserver.observe(viewport);

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
    };
  }, [enabled, getViewport, sync]);

  // shift+滚轮 → 横向滚动（纵向仍由 xterm 处理）
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.shiftKey) return;
      const viewport = getViewport();
      if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [enabled, containerRef, getViewport]);

  // 光标跟随：光标列超出可视区时自动横向平移
  useEffect(() => {
    if (!terminal || !enabled) return;
    const disposable = terminal.onCursorMove(() => {
      const viewport = getViewport();
      const buffer = terminal.buffer.active;
      if (!viewport || !buffer) return;
      const cellWidth =
        terminal.cols > 0 ? viewport.scrollWidth / terminal.cols : 0;
      if (cellWidth <= 0) return;

      const cursorLeft = buffer.cursorX * cellWidth;
      const visibleRight = viewport.scrollLeft + viewport.clientWidth - cellWidth;
      if (cursorLeft < viewport.scrollLeft) {
        viewport.scrollLeft = Math.max(0, cursorLeft - cellWidth);
      } else if (cursorLeft > visibleRight) {
        viewport.scrollLeft = Math.max(
          0,
          cursorLeft - viewport.clientWidth + cellWidth * 2,
        );
      }
    });
    return () => disposable.dispose();
  }, [terminal, enabled, getViewport]);

  const setScroll = useCallback(
    (value: number) => {
      const viewport = getViewport();
      if (!viewport) return;
      const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      viewport.scrollLeft = Math.max(0, Math.min(value, max));
    },
    [getViewport],
  );

  return { scrollLeft, scrollMax, clientWidth, setScroll };
}
