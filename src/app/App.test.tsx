import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (command: string) => {
    if (command === "check_for_update") {
      return { currentVersion: "0.1.0", available: null };
    }
    if (command === "load_settings") {
      return {
        appearance: { theme: "system" },
        browsing: { showHiddenFiles: false, confirmBeforeTrash: false },
      };
    }
    if (command === "list_places") {
      return [{ label: "Home", path: "/home/user", kind: "home" }];
    }
    return {
      path: "/home/user",
      parentPath: "/home",
      entries: [
        {
          name: "notes.txt",
          path: "/home/user/notes.txt",
          kind: "file",
          isSymlink: false,
          isHidden: false,
          sizeInBytes: 2048,
          modifiedAtMillis: null,
        },
      ],
    };
  }),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async () => () => {}),
}));

vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({ onDragDropEvent: vi.fn(async () => () => {}) }),
}));

import { App } from "./App";

describe("App", () => {
  it("shows the places and the path of the starting folder", async () => {
    render(<App />);

    expect(await screen.findByRole("button", { name: "Home" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "user" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Name" })).toBeTruthy();
  });
});
