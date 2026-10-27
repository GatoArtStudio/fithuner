import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { usePreviewGateway } from "../../context/PreviewContext";
import { usePreviewResource } from "../../hooks/usePreviewResource";
import { loadPdfjs } from "../../rendering/load-pdfjs";
import { PreviewAction, PreviewLoading, PreviewMessage } from "../PreviewStates";
import type { ProviderProps } from "./ProviderProps";
import styles from "./PdfPreview.module.css";

interface PdfPageProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  width: number;
}

function PdfPage({ document: pdf, pageNumber, width }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [height, setHeight] = useState(Math.round(width * 1.3));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsNearViewport(true),
      { rootMargin: "400px" },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isNearViewport || !canvas || width <= 0) return;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;
    let isCancelled = false;

    pdf.getPage(pageNumber).then((page) => {
      if (isCancelled) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const cssScale = width / baseViewport.width;
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: cssScale * pixelRatio });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      setHeight(Math.round(baseViewport.height * cssScale));
      renderTask = page.render({ canvas, viewport });
      renderTask.promise.catch(() => undefined);
    });

    return () => {
      isCancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, width, isNearViewport]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.page}
      style={{ width, height }}
      aria-label={`Page ${pageNumber}`}
    />
  );
}

interface LoadedPdf {
  document: PDFDocumentProxy;
  loadingTask: PDFDocumentLoadingTask;
}

function PdfDocumentView({ document: pdf, loadingTask }: LoadedPdf) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => setWidth(Math.max(0, Math.floor(container.clientWidth - 24)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => void loadingTask.destroy(), [loadingTask]);

  return (
    <div ref={containerRef} className={styles.document}>
      {Array.from({ length: pdf.numPages }, (_, index) => (
        <PdfPage key={index + 1} document={pdf} pageNumber={index + 1} width={width} />
      ))}
    </div>
  );
}

export default function PdfPreview({ target, onOpenExternally }: ProviderProps) {
  const gateway = usePreviewGateway();
  const resource = usePreviewResource(`pdf:${target.path}`, async () => {
    const [pdfjs, response] = await Promise.all([loadPdfjs(), fetch(gateway.assetUrl(target.path))]);
    if (!response.ok) throw new Error("The PDF could not be read");
    const data = new Uint8Array(await response.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data });
    return { document: await loadingTask.promise, loadingTask } satisfies LoadedPdf;
  });

  if (resource.status === "error") {
    return (
      <PreviewMessage
        title="This PDF could not be displayed"
        detail={resource.message}
        actions={<PreviewAction label="Open with default app" onClick={() => onOpenExternally(target.path)} />}
      />
    );
  }
  if (resource.status !== "ready") return <PreviewLoading />;
  return <PdfDocumentView {...resource.data} />;
}
