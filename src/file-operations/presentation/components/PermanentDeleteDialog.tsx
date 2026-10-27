import { ConfirmDialog } from "../../../shared/components/ConfirmDialog";
import { fileNameOf } from "../../domain/services/validate-entry-name";
import { useFileOperations } from "../context/FileOperationsContext";

export function PermanentDeleteDialog() {
  const paths = useFileOperations((state) => state.pendingPermanentDeletePaths);
  const confirm = useFileOperations((state) => state.confirmPermanentDelete);
  const cancel = useFileOperations((state) => state.cancelPermanentDelete);

  if (!paths) return null;

  const subject = paths.length === 1 ? `"${fileNameOf(paths[0])}"` : `${paths.length} items`;

  return (
    <ConfirmDialog
      title="Delete permanently?"
      message={`${subject} will be deleted for good. This cannot be undone.`}
      confirmLabel="Delete"
      isDanger
      onConfirm={() => void confirm()}
      onCancel={cancel}
    />
  );
}
