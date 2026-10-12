import { useCallback, useRef } from "react";

interface TerminalHorizontalScrollbarProps {
  scrollLeft: number;
  scrollMax: number;
  clientWidth: number;
  /** 被控制的终端视口元素 id（无障碍 aria-controls） */
  controlsId: string;
  onChange: (value: number) => void;
}

/**
 * 虚拟列宽模式下的横向滚动条（xterm 只有纵向滚动条）。
 * 仅当内容超宽（scrollMax > 0）时显示，支持拖动。
 */
export default function TerminalHorizontalScrollbar({
  scrollLeft,
  scrollMax,
  clientWidth,
  controlsId,
  onChange,
}: TerminalHorizontalScrollbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const scrollFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(ratio * scrollMax);
    },
    [onChange, scrollMax],
  );

  if (scrollMax <= 0) return null;

  // 可视宽度占内容宽度的比例决定 thumb 长度
  const contentWidth = scrollMax + clientWidth;
  const thumbPercent =
    contentWidth > 0
      ? Math.max(8, Math.min(100, (clientWidth / contentWidth) * 100))
      : 100;
  const leftPercent =
    scrollMax > 0 ? (scrollLeft / scrollMax) * (100 - thumbPercent) : 0;

  return (
    <div
      ref={trackRef}
      role="scrollbar"
      tabIndex={0}
      aria-orientation="horizontal"
      aria-controls={controlsId}
      aria-valuemin={0}
      aria-valuemax={Math.round(scrollMax)}
      aria-valuenow={Math.round(scrollLeft)}
      className="absolute bottom-0 left-0 right-0 z-10 flex h-2.5 cursor-pointer items-center bg-black/20 px-px transition-opacity"
      onPointerDown={(event) => {
        draggingRef.current = true;
        (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
        scrollFromPointer(event.clientX);
      }}
      onPointerMove={(event) => {
        if (draggingRef.current) scrollFromPointer(event.clientX);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <div
        className="h-1.5 rounded-full bg-foreground/40 hover:bg-foreground/60"
        style={{
          width: `${thumbPercent}%`,
          marginLeft: `${leftPercent}%`,
        }}
      />
    </div>
  );
}
