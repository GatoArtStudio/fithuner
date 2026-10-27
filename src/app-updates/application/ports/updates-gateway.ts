import type { DownloadEvent, UpdateCheckResult } from "../../domain/entities/update";

export type Unsubscribe = () => void;

export interface UpdatesGateway {
  checkForUpdate(): Promise<UpdateCheckResult>;
  startDownload(): Promise<void>;
  installAndRestart(): Promise<void>;
  openReleasePage(): Promise<void>;
  subscribeToDownload(listener: (event: DownloadEvent) => void): Promise<Unsubscribe>;
}
