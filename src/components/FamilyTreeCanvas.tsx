import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import type { FamilyMember, TreeNode } from '../types';
import { TreeNodeComponent } from './TreeNodeComponent';

interface FamilyTreeCanvasProps {
  rootNodes: TreeNode[];
  expandedIds: Set<string>;
  highlightedId: string | null;
  isReadOnly?: boolean;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentMember: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onAddRoot: () => void;
}

export const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = ({
  rootNodes,
  expandedIds,
  highlightedId,
  isReadOnly = false,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  onAddRoot,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMovedRef = useRef(false);
  const pinchRef = useRef<{
    initialDist: number;
    initialScale: number;
    initialMidX: number;
    initialMidY: number;
    initialPosX: number;
    initialPosY: number;
  } | null>(null);

  // Zoom helpers
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.35));
  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 40 });
  }, []);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore right clicks or clicks on interactive inputs/buttons
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }

    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan & pinch-to-zoom handlers (two-finger zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }

    if (e.touches.length === 2) {
      // Two-finger pinch gesture start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      pinchRef.current = {
        initialDist: dist,
        initialScale: scale,
        initialMidX: midX,
        initialMidY: midY,
        initialPosX: position.x,
        initialPosY: position.y,
      };
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      // Single-finger drag
      pinchRef.current = null;
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current && containerRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (pinchRef.current.initialDist <= 0) return;

      const scaleRatio = dist / pinchRef.current.initialDist;
      const nextScale = Math.min(Math.max(pinchRef.current.initialScale * scaleRatio, 0.35), 2.5);

      const currentMidX = (t1.clientX + t2.clientX) / 2;
      const currentMidY = (t1.clientY + t2.clientY) / 2;

      const containerRect = containerRef.current.getBoundingClientRect();
      const focalX = pinchRef.current.initialMidX - containerRect.left;
      const focalY = pinchRef.current.initialMidY - containerRect.top;

      const contentX = (focalX - pinchRef.current.initialPosX) / pinchRef.current.initialScale;
      const contentY = (focalY - pinchRef.current.initialPosY) / pinchRef.current.initialScale;

      const midDeltaX = currentMidX - pinchRef.current.initialMidX;
      const midDeltaY = currentMidY - pinchRef.current.initialMidY;

      const nextPosX = (focalX + midDeltaX) - contentX * nextScale;
      const nextPosY = (focalY + midDeltaY) - contentY * nextScale;

      setScale(nextScale);
      setPosition({ x: nextPosX, y: nextPosY });
    } else if (e.touches.length === 1 && isDragging && !pinchRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;

      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Transition from two fingers to single finger seamlessly without jumping
      pinchRef.current = null;
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        posX: position.x,
        posY: position.y,
      };
    } else if (e.touches.length === 0) {
      pinchRef.current = null;
      setIsDragging(false);
    }
  };

  // Wheel zoom with Ctrl or trackpad pinch
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.005;
      setScale((s) => Math.min(Math.max(s + zoomDelta, 0.4), 2.0));
    }
  };

  // Auto-center on highlighted node
  useEffect(() => {
    if (!highlightedId || !containerRef.current) return;

    const el = document.getElementById(`member-card-${highlightedId}`);
    if (el && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // Calculate shift needed to center this element
      const targetCenterX = containerRect.width / 2;
      const targetCenterY = containerRect.height / 3;

      const currentElCenterX = elRect.left + elRect.width / 2;
      const currentElCenterY = elRect.top + elRect.height / 2;

      const diffX = targetCenterX - currentElCenterX;
      const diffY = targetCenterY - currentElCenterY;

      setPosition((prev) => ({
        x: prev.x + diffX,
        y: prev.y + diffY,
      }));
    }
  }, [highlightedId]);

  return (
    <div
      ref={containerRef}
      id="family-tree-canvas-container"
      className={`relative w-full h-[calc(100vh-73px)] overflow-hidden bg-stone-50 select-none touch-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 no-print"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #78716c 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Floating Canvas Controls */}
      <div className="no-print absolute bottom-6 left-6 z-20 flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-md border border-stone-200 text-stone-700">
        <button
          type="button"
          onClick={handleZoomIn}
          title="تكبير"
          className="p-2 hover:bg-stone-100 hover:text-emerald-700 rounded-xl transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold px-2 min-w-[42px] text-center text-stone-600">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomOut}
          title="تصغير"
          className="p-2 hover:bg-stone-100 hover:text-emerald-700 rounded-xl transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-stone-200 mx-0.5" />
        <button
          type="button"
          onClick={handleResetZoom}
          title="إعادة ضبط الموضع (100%)"
          className="p-2 hover:bg-stone-100 hover:text-emerald-700 rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile / Quick navigation helper hint */}
      <div className="no-print absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-xl border border-stone-200/80 text-stone-500 text-xs shadow-xs pointer-events-none">
        <Move className="w-3.5 h-3.5 text-stone-400" />
        <span>اسحب للتحريك | التكبير والتصغير بأصبعين أو العجلة</span>
      </div>

      {/* Print-only Header (Appears only on printed A4 paper) */}
      <div className="hidden print:block text-center py-4 border-b-2 border-stone-800 mb-6 w-full">
        <h1 className="text-2xl font-black text-stone-900 tracking-wider">
          شجرة عائلات الحسنين
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          مخطط النسب العائلي المتفرع
        </p>
      </div>

      {/* Transformable Canvas Content */}
      <div
        ref={contentRef}
        id="family-tree-content"
        className="w-full h-full flex justify-center items-start pt-12 transition-transform duration-75 origin-top print:pt-4"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        }}
      >
        {rootNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto mt-16 bg-white rounded-3xl border border-stone-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold">🌳</span>
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-1">
              شجرة العائلة فارغة حالياً
            </h3>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              ابدأ بإضافة رأس الشجرة (الجد الأول أو المؤسس) لتنطلق في بناء شجرة عائلتك.
            </p>
            <button
              type="button"
              onClick={onAddRoot}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
            >
              + إضافة الجد الأول (رأس الشجرة)
            </button>
          </div>
        ) : (
          <div className="flex flex-row flex-wrap justify-center items-start gap-16 pb-32">
            {rootNodes.map((rootNode) => (
              <TreeNodeComponent
                key={rootNode.member.id}
                node={rootNode}
                expandedIds={expandedIds}
                highlightedId={highlightedId}
                isReadOnly={isReadOnly}
                onToggleExpand={onToggleExpand}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
