import type { MouseEvent } from "react";
import { useNavigation } from "../context/NavigationContext";

const BACK_BUTTON = 3;
const FORWARD_BUTTON = 4;

/** Handlers that make the mouse's back and forward buttons walk the history of the element they are attached to. */
export function useHistoryMouseButtons(isBlocked = false) {
  const goBack = useNavigation((state) => state.goBack);
  const goForward = useNavigation((state) => state.goForward);

  function isHistoryButton(event: MouseEvent) {
    return event.button === BACK_BUTTON || event.button === FORWARD_BUTTON;
  }

  const swallow = (event: MouseEvent) => {
    if (isHistoryButton(event)) event.preventDefault();
  };

  return {
    onMouseDown: swallow,
    onAuxClick: swallow,
    onMouseUp: (event: MouseEvent) => {
      if (!isHistoryButton(event)) return;
      event.preventDefault();
      if (isBlocked) return;
      if (event.button === BACK_BUTTON) void goBack();
      else void goForward();
    },
  };
}
