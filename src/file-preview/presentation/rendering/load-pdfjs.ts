import type * as PdfJs from "pdfjs-dist";

let loadedModule: Promise<typeof PdfJs> | null = null;

export function loadPdfjs(): Promise<typeof PdfJs> {
  loadedModule ??= Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  return loadedModule;
}
