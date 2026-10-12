import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Terminal } from "@xterm/xterm";

/**
 * 虚拟列宽模式的横向滚动控制。
 *
 * 不依赖 xterm viewport 的 scrollWidth（不同环境对超宽行的溢出传播
 * 行为不一致），改为主动测量行元素布局宽度，并用 CSS transform 平移
 * 整个 `.xterm-screen`（行、选中层、装饰、光标全部随之平移）。
 *
 * 提供：
 * - shift+滚轮 横向滚动
 * - 光标超出可视区时自动跟随
 * - scrollLeft / scrollMax / clientWidth 状态供横向滚动条组件使用
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
  const screenRef = useRef<HTMLElement | null>(null);
  const measureFrameRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const contentWidthRef = useRef(0);

  const getElements = useCallback((): {
    viewport: HTMLElement | null;
    screen: HTMLElement | null;
  } => {
    if (!containerRef.current) {
      return { viewport: null, screen: null };
    }
    if (!viewportRef.current?.isConnected) {
      viewportRef.current = containerRef.current.querySelector<HTMLElement>(
        ".xterm-viewport",
      );
    }
    if (!screenRef.current?.isConnected) {
      screenRef.current = containerRef.current.querySelector<HTMLElement>(
        ".xterm-screen",
      );
    }
    return { viewport: viewportRef.current, screen: screenRef.current };
  }, [containerRef]);

  const applyOffset = useCallback(
    (offset: number) => {
      const { viewport, screen } = getElements();
      if (!viewport || !screen) return;
      const clamped = Math.max(
        0,
        Math.min(offset, Math.max(0, contentWidthRef.current - viewport.clientWidth)),
      );
      offsetRef.current = clamped;
      screen.style.transform = clamped > 0 ? `translateX(${-clamped}px)` : "";
      setScrollLeft(clamped);
    },
    [getElements],
  );

  const measure = useCallback(() => {
    const { viewport, screen } = getElements();
    if (!viewport || !screen) return;
    setClientWidth(viewport.clientWidth);

    // 行元素 scrollWidth 反映自身内容边界（行 div 为块级元素，布局宽
    // 等于可视宽，但 scrollWidth 包含溢出的全部 span）。取前 5 行最大。
    const rowElements = screen.querySelectorAll<HTMLElement>(
      ".xterm-rows > div",
    );
    let contentWidth = 0;
    const rowCount = Math.min(rowElements.length, 5);
    for (let index = 0; index < rowCount; index++) {
      const row = rowElements[index];
      if (!row) continue;
      contentWidth = Math.max(contentWidth, row.scrollWidth);
    }
    contentWidthRef.current = contentWidth;
    setScrollMax(Math.max(0, contentWidth - viewport.clientWidth));
    applyOffset(offsetRef.current);
  }, [getElements, applyOffset]);

  const scheduleMeasure = useCallback(() => {
    if (measureFrameRef.current !== null) return;
    measureFrameRef.current = requestAnimationFrame(() => {
      measureFrameRef.current = null;
      measure();
    });
  }, [measure]);

  // 激活时：初始测量 + 监听尺寸/输出变化重测
  useEffect(() => {
    if (!enabled) return;
    const { viewport, screen } = getElements();
    if (!viewport || !screen) return;

    measure();

    const resizeObserver = new ResizeObserver(() => scheduleMeasure());
    resizeObserver.observe(viewport);
    if (screen) resizeObserver.observe(screen);

    const writeDisposable = terminal?.onWriteParsed(() => scheduleMeasure());
    const renderDisposable = terminal?.onRender(() => scheduleMeasure());

    return () => {
      resizeObserver.disconnect();
      writeDisposable?.dispose();
      renderDisposable?.dispose();
      if (measureFrameRef.current !== null) {
        cancelAnimationFrame(measureFrameRef.current);
        measureFrameRef.current = null;
      }
      // 停用时清除平移
      screen.style.transform = "";
      offsetRef.current = 0;
      setScrollLeft(0);
      setScrollMax(0);
    };
  }, [enabled, getElements, measure, scheduleMeasure, terminal]);

  // shift+滚轮 → 横向滚动（纵向仍由 xterm 处理）
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.shiftKey) return;
      event.preventDefault();
      applyOffset(offsetRef.current + event.deltaY);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [enabled, containerRef, applyOffset]);

  // 光标跟随：光标列超出可视区时自动平移
  useEffect(() => {
    if (!terminal || !enabled) return;
    const disposable = terminal.onCursorMove(() => {
      const { viewport } = getElements();
      if (!viewport) return;
      const buffer = terminal.buffer.active;
      if (!buffer) return;
      const cols = terminal.cols;
      if (cols <= 0) return;

      const contentWidth = contentWidthRef.current;
      const visible = viewport.clientWidth;
      if (contentWidth <= visible) return;

      // 比例映射，无需精确单元格宽度
      const cursorRatio = Math.min(1, buffer.cursorX / cols);
      const cursorPx = cursorRatio * contentWidth;
      const current = offsetRef.current;
      const rightEdge = current + visible;
      if (cursorPx < current) {
        applyOffset(Math.max(0, cursorPx - visible * 0.1));
      } else if (cursorPx > rightEdge) {
        applyOffset(cursorPx - visible * 0.9);
      }
    });
    return () => disposable.dispose();
  }, [terminal, enabled, getElements, applyOffset]);

  const setScroll = useCallback(
    (value: number) => {
      applyOffset(value);
    },
    [applyOffset],
  );

  return { scrollLeft, scrollMax, clientWidth, setScroll };
}
