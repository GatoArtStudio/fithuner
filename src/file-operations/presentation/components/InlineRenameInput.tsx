import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useFileOperations } from "../context/FileOperationsContext";
import styles from "./InlineRenameInput.module.css";

interface InlineRenameInputProps {
  initialName: string;
  isDirectory: boolean;
}

export function InlineRenameInput({ initialName, isDirectory }: InlineRenameInputProps) {
  const renameError = useFileOperations((state) => state.renameError);
  const commitRename = useFileOperations((state) => state.commitRename);
  const cancelRename = useFileOperations((state) => state.cancelRename);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFinished = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const extensionStart = initialName.lastIndexOf(".");
    const selectionEnd = !isDirectory && extensionStart > 0 ? extensionStart : initialName.length;
    input.setSelectionRange(0, selectionEnd);
  }, [initialName, isDirectory]);

  function handleKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      void commitRename(name);
    } else if (event.key === "Escape") {
      isFinished.current = true;
      cancelRename();
    }
  }

  function handleBlur() {
    if (isFinished.current) return;
    if (renameError) cancelRename();
    else void commitRename(name);
  }

  return (
    <span className={styles.wrapper} onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
      <input
        ref={inputRef}
        className={`${styles.input} ${renameError ? styles.invalid : ""}`}
        value={name}
        aria-label="New name"
        aria-invalid={renameError !== null}
        spellCheck={false}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      {renameError && (
        <span className={styles.error} role="alert">
          {renameError}
        </span>
      )}
    </span>
  );
}
