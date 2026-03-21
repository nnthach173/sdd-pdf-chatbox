'use client';

interface PanelDividerProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
}

export default function PanelDivider({
  onMouseDown,
  onTouchStart,
}: PanelDividerProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className="group relative hidden md:flex w-3 h-full flex-shrink-0 cursor-col-resize items-center justify-center bg-border hover:bg-primary/30 active:bg-primary/50 transition-colors"
    >
      {/* Visual handle dots */}
      <div className="flex flex-col gap-1">
        <div className="size-1 rounded-full bg-muted-foreground/60 group-hover:bg-primary/80 transition-colors" />
        <div className="size-1 rounded-full bg-muted-foreground/60 group-hover:bg-primary/80 transition-colors" />
        <div className="size-1 rounded-full bg-muted-foreground/60 group-hover:bg-primary/80 transition-colors" />
      </div>
    </div>
  );
}
