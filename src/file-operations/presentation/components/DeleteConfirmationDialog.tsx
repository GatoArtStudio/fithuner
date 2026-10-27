import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { fileNameOf } from "../../domain/services/validate-entry-name";
import { useFileOperations } from "../context/FileOperationsContext";

export function DeleteConfirmationDialog() {
  const pendingDeletion = useFileOperations((state) => state.pendingDeletion);
  const confirm = useFileOperations((state) => state.confirmDeletion);
  const cancel = useFileOperations((state) => state.cancelDeletion);

  if (!pendingDeletion) return null;

  const { paths, mode } = pendingDeletion;
  const subject = paths.length === 1 ? `"${fileNameOf(paths[0])}"` : `${paths.length} items`;

  return mode === "permanent" ? (
    <ConfirmDialog
      title="Delete permanently?"
      message={`${subject} will be deleted for good. This cannot be undone.`}
      confirmLabel="Delete"
      isDanger
      onConfirm={() => void confirm()}
      onCancel={cancel}
    />
  ) : (
    <ConfirmDialog
      title="Move to trash?"
      message={`${subject} will be moved to the trash.`}
      confirmLabel="Move to trash"
      onConfirm={() => void confirm()}
      onCancel={cancel}
    />
  );
}
