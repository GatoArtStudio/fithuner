export type Unsubscribe = () => void;

export interface FolderWatchGateway {
  watch(paths: string[]): Promise<void>;
  subscribe(listener: (changedFolder: string) => void): Promise<Unsubscribe>;
}
