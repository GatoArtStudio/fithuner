const DRAGGING_ATTRIBUTE = "data-pointer-dragging";

function preventSelection(event: Event) {
  event.preventDefault();
}

/** Stops the browser from selecting text or starting a native drag while a pointer-driven drag is in progress. */
export function blockSelection(): () => void {
  document.documentElement.setAttribute(DRAGGING_ATTRIBUTE, "true");
  window.getSelection()?.removeAllRanges();
  document.addEventListener("selectstart", preventSelection, true);
  document.addEventListener("dragstart", preventSelection, true);

  return () => {
    document.documentElement.removeAttribute(DRAGGING_ATTRIBUTE);
    document.removeEventListener("selectstart", preventSelection, true);
    document.removeEventListener("dragstart", preventSelection, true);
  };
}
