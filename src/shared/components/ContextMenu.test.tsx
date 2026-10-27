import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContextMenu } from "./ContextMenu";

function renderMenu() {
  const onClose = vi.fn();
  const onRename = vi.fn();
  const onDelete = vi.fn();
  render(
    <ContextMenu
      x={10}
      y={10}
      onClose={onClose}
      items={[
        { label: "Rename", onSelect: onRename },
        "separator",
        { label: "Delete", isDanger: true, onSelect: onDelete },
      ]}
    />,
  );
  return { onClose, onRename, onDelete, menu: screen.getByRole("menu") };
}

describe("ContextMenu", () => {
  it("runs the clicked action and closes", () => {
    const { onClose, onRename } = renderMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));

    expect(onRename).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("moves with the arrow keys, skips separators and activates with Enter", () => {
    const { menu, onDelete } = renderMenu();

    fireEvent.keyDown(menu, { key: "ArrowDown" });
    fireEvent.keyDown(menu, { key: "Enter" });

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("wraps around to the last action with ArrowUp", () => {
    const { menu, onDelete } = renderMenu();

    fireEvent.keyDown(menu, { key: "ArrowUp" });
    fireEvent.keyDown(menu, { key: "Enter" });

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("closes with Escape", () => {
    const { menu, onClose } = renderMenu();

    fireEvent.keyDown(menu, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
  });
});
