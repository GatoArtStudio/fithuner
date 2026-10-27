import { useEffect, useRef, useState, type PointerEvent } from "react";
import { blockSelection } from "../../../shared/drag-and-drop/block-selection";
import {
  FIT_VIEWPORT,
  panBy,
  wheelZoomFactor,
  zoomAt,
  type ViewportLayout,
} from "../../domain/services/image-viewport";

/** Wheel zoom around the pointer and drag-to-pan for an image shown inside a frame. */
export function useImageViewport() {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const releaseSelection = useRef<(() => void) | null>(null);
  const [viewport, setViewport] = useState(FIT_VIEWPORT);
  const [isPanning, setIsPanning] = useState(false);

  function measureLayout(): ViewportLayout | null {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return null;
    return {
      image: { width: image.offsetWidth, height: image.offsetHeight },
      frame: { width: frame.clientWidth, height: frame.clientHeight },
    };
  }

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const layout = measureLayout();
      if (!layout || !frame) return;
      const bounds = frame.getBoundingClientRect();
      const pointer = {
        x: event.clientX - (bounds.left + bounds.width / 2),
        y: event.clientY - (bounds.top + bounds.height / 2),
      };
      const factor = wheelZoomFactor(event.deltaY, event.deltaMode);
      setViewport((current) => zoomAt(current, factor, pointer, layout));
    }

    frame.addEventListener("wheel", handleWheel, { passive: false });
    return () => frame.removeEventListener("wheel", handleWheel);
  }, []);

  function stopPanning() {
    lastPointer.current = null;
    releaseSelection.current?.();
    releaseSelection.current = null;
    setIsPanning(false);
  }

  const frameProps = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      releaseSelection.current = blockSelection();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setIsPanning(true);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const previous = lastPointer.current;
      const layout = measureLayout();
      if (!previous || !layout) return;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      const deltaX = event.clientX - previous.x;
      const deltaY = event.clientY - previous.y;
      setViewport((current) => panBy(current, deltaX, deltaY, layout));
    },
    onPointerUp: stopPanning,
    onPointerCancel: stopPanning,
    onDoubleClick: () => setViewport(FIT_VIEWPORT),
  };

  return {
    frameRef,
    imageRef,
    frameProps,
    viewport,
    isPanning,
    reset: () => setViewport(FIT_VIEWPORT),
  };
}
