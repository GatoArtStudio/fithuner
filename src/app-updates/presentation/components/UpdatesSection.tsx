import { useSettings } from "../../../settings";
import { SettingToggleControl } from "../../../settings";
import type { UpdateStatus } from "../../domain/entities/update";
import { describeUpdateError, downloadPercent, formatReleaseDate } from "../../domain/services/format-update";
import { useUpdates } from "../context/UpdatesContext";
import styles from "./UpdatesSection.module.css";

function formatCheckTime(millis: number | null): string | null {
  return millis === null ? null : new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(millis);
}

function Notes({ notes }: { notes: string | null }) {
  if (!notes) return null;
  return (
    <details className={styles.notes}>
      <summary>Release notes</summary>
      <pre className={styles.notesBody}>{notes}</pre>
    </details>
  );
}

function ProgressBar({ percent, label }: { percent: number | null; label: string }) {
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent ?? undefined}
    >
      <div
        className={`${styles.fill} ${percent === null ? styles.indeterminate : ""}`}
        style={percent === null ? undefined : { width: `${percent}%` }}
      />
    </div>
  );
}

export function UpdatesSection() {
  const status = useUpdates((state) => state.status);
  const currentVersion = useUpdates((state) => state.currentVersion);
  const lastChecked = useUpdates((state) => state.lastCheckedAtMillis);
  const checkNow = useUpdates((state) => state.checkNow);
  const download = useUpdates((state) => state.download);
  const installAndRestart = useUpdates((state) => state.installAndRestart);
  const openReleasePage = useUpdates((state) => state.openReleasePage);
  const updates = useSettings((state) => state.settings.updates);
  const updateSettings = useSettings((state) => state.update);

  const checkedAt = formatCheckTime(lastChecked);
  const isBusy = status.type === "checking" || status.type === "downloading" || status.type === "installing";

  function renderStatus(current: UpdateStatus) {
    switch (current.type) {
      case "idle":
        return <p className={styles.message}>Fithuner has not looked for updates yet.</p>;
      case "checking":
        return <p className={styles.message}>Looking for updates…</p>;
      case "up-to-date":
        return (
          <p className={styles.message}>
            You are up to date.{checkedAt && ` Last checked at ${checkedAt}.`}
          </p>
        );
      case "available":
        return (
          <>
            <p className={styles.headline}>Version {current.update.version} is available</p>
            {formatReleaseDate(current.update.publishedAtMillis) && (
              <p className={styles.message}>Published {formatReleaseDate(current.update.publishedAtMillis)}</p>
            )}
            <Notes notes={current.update.notes} />
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => void download()}>
                Download update
              </button>
              <button type="button" className={styles.secondary} onClick={() => void openReleasePage()}>
                Open release page
              </button>
            </div>
          </>
        );
      case "downloading": {
        const percent = downloadPercent(current.progress);
        return (
          <>
            <p className={styles.headline}>Downloading version {current.update.version}…</p>
            <ProgressBar percent={percent} label="Download progress" />
            <p className={styles.message}>{percent === null ? "Starting…" : `${percent}%`}</p>
          </>
        );
      }
      case "ready":
        return (
          <>
            <p className={styles.headline}>Version {current.update.version} is ready to install</p>
            <p className={styles.message}>Fithuner will restart to finish the update.</p>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => void installAndRestart()}>
                Install and restart
              </button>
            </div>
          </>
        );
      case "installing":
        return <p className={styles.message}>Installing version {current.update.version}…</p>;
      case "error":
        return (
          <>
            <p className={styles.error} role="alert">
              {describeUpdateError(current.error)}
            </p>
            <div className={styles.actions}>
              {current.error.kind !== "notSupported" && (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() =>
                    void (current.step === "check" ? checkNow() : current.step === "download" ? download() : installAndRestart())
                  }
                >
                  Try again
                </button>
              )}
              <button
                type="button"
                className={current.error.kind === "notSupported" ? styles.primary : styles.secondary}
                onClick={() => void openReleasePage()}
              >
                Open release page
              </button>
            </div>
          </>
        );
    }
  }

  return (
    <>
      <div className={styles.versionRow}>
        <span className={styles.label}>Current version</span>
        <span>{currentVersion ?? "—"}</span>
      </div>
      <section className={styles.status} aria-live="polite">
        {renderStatus(status)}
      </section>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} disabled={isBusy || status.type === "ready"} onClick={() => void checkNow()}>
          Check for updates
        </button>
      </div>
      <SettingToggleControl
        label="Check for updates on startup"
        description="Looks for a new version when Fithuner starts. Only a small file is requested; nothing is downloaded."
        checked={updates.checkOnStartup}
        onChange={(checkOnStartup) => void updateSettings({ updates: { checkOnStartup } })}
      />
      <SettingToggleControl
        label="Download updates automatically"
        description="Downloads a new version in the background as soon as it is found. You always choose when to restart."
        checked={updates.autoDownload}
        onChange={(autoDownload) => void updateSettings({ updates: { autoDownload } })}
      />
    </>
  );
}
