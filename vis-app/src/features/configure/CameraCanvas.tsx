import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Text } from 'react-konva';
import { Camera, ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';
import { cn } from '@/utils';
import { useSettingsStore } from '@/stores/settingsStore';

interface CameraCanvasProps {
  mode?: 'configure' | 'run';
  className?: string;
  onCapture?: () => void;
}

/**
 * CameraCanvas — React Konva canvas for camera feed and drawing overlay.
 *
 * ELECTRON IPC / SDK INTEGRATION POINT:
 * 1. Replace the placeholder pattern with actual frame data:
 *    useEffect(() => {
 *      window.electronAPI.camera.onFrame((buffer: ArrayBuffer) => {
 *        const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
 *        const canvas = document.createElement('canvas');
 *        // draw imageData to canvas then set as Konva image source
 *        setFrameImage(canvas);
 *      });
 *    }, []);
 *
 * 2. For drawing tools (ROI, measurement lines), add Konva event handlers
 *    to the Stage for mousedown/mousemove/mouseup to draw shapes.
 *
 * 3. Coordinate display will report real mm values once calibration
 *    is available from window.electronAPI.camera.getCalibration()
 */
export const CameraCanvas: React.FC<CameraCanvasProps> = ({
  mode = 'configure',
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 480 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const { settings } = useSettingsStore();

  // Responsive resize
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width:  entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const gridSpacing = 40;
  const gridLines: React.ReactNode[] = [];

  if (settings.showGrid) {
    for (let x = 0; x < size.width; x += gridSpacing) {
      gridLines.push(
        <Line key={`vg-${x}`} points={[x, 0, x, size.height]}
          stroke="#94a3b8" strokeWidth={0.3} opacity={0.4} />,
      );
    }
    for (let y = 0; y < size.height; y += gridSpacing) {
      gridLines.push(
        <Line key={`hg-${y}`} points={[0, y, size.width, y]}
          stroke="#94a3b8" strokeWidth={0.3} opacity={0.4} />,
      );
    }
  }

  // Crosshair lines
  const crosshair = settings.showCrosshair && cursorPos ? [
    <Line key="ch-h" points={[0, cursorPos.y, size.width, cursorPos.y]}
      stroke="#2563eb" strokeWidth={0.8} opacity={0.6} dash={[4, 4]} />,
    <Line key="ch-v" points={[cursorPos.x, 0, cursorPos.x, size.height]}
      stroke="#2563eb" strokeWidth={0.8} opacity={0.6} dash={[4, 4]} />,
  ] : [];

  return (
    <div className={cn('flex flex-col bg-neutral-900 rounded-lg overflow-hidden', className)}>
      {/* Canvas toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-800 border-b border-neutral-700">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-medium">
            {mode === 'configure' ? 'Configure Preview' : 'Live Feed'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {cursorPos && (
            <span className="text-2xs font-mono text-neutral-400 mr-2">
              X: {(cursorPos.x * 0.1).toFixed(2)}mm  Y: {(cursorPos.y * 0.1).toFixed(2)}mm
            </span>
          )}
          <button onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)}
            className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-2xs font-mono text-neutral-500 ml-1">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Konva stage */}
      <div ref={containerRef} className="flex-1 relative cursor-crosshair">
        <Stage
          width={size.width}
          height={size.height}
          scaleX={zoom}
          scaleY={zoom}
          onMouseMove={(e) => {
            const stage = e.target.getStage();
            if (stage) {
              const pos = stage.getPointerPosition();
              if (pos) setCursorPos({ x: pos.x / zoom, y: pos.y / zoom });
            }
          }}
          onMouseLeave={() => setCursorPos(null)}
        >
          <Layer>
            {/* Background */}
            <Rect x={0} y={0} width={size.width} height={size.height} fill="#1e293b" />

            {/* Grid */}
            {gridLines}

            {/* Camera placeholder — replace with actual frame ImageBitmap */}
            <Rect
              x={size.width / 2 - 60}
              y={size.height / 2 - 60}
              width={120}
              height={120}
              fill="#334155"
              cornerRadius={8}
            />
            <Text
              x={size.width / 2 - 60}
              y={size.height / 2 - 12}
              width={120}
              align="center"
              text="📷"
              fontSize={28}
            />
            <Text
              x={0}
              y={size.height / 2 + 60}
              width={size.width}
              align="center"
              text={mode === 'run' ? 'Camera Offline — Waiting for Stream' : 'Camera Preview Placeholder'}
              fill="#64748b"
              fontSize={11}
            />

            {/* Crosshair */}
            {crosshair}

            {/* Border frame */}
            <Rect
              x={1} y={1}
              width={size.width - 2}
              height={size.height - 2}
              stroke="#2563eb"
              strokeWidth={1}
              fill="transparent"
              dash={[6, 4]}
              opacity={0.3}
            />
          </Layer>
        </Stage>

        {/* Crosshair icon overlay */}
        {settings.showCrosshair && (
          <div className="absolute bottom-2 right-2 pointer-events-none">
            <Crosshair className="w-4 h-4 text-primary-400 opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
};
