import type {
  ConflictDecision,
  ExternalDragEvent,
  TransferEvent,
  TransferRequest,
} from "../../domain/entities/transfer";

export type Unsubscribe = () => void;

export interface FileTransferGateway {
  startTransfer(request: TransferRequest): Promise<string>;
  cancelTransfer(transferId: string): Promise<void>;
  resolveConflict(transferId: string, decision: ConflictDecision): Promise<void>;
  subscribeToTransfers(listener: (event: TransferEvent) => void): Promise<Unsubscribe>;
  subscribeToExternalDrags(listener: (event: ExternalDragEvent) => void): Promise<Unsubscribe>;
}
