import { useEffect, useRef, type KeyboardEvent } from "react";
import { Icon } from "../../../shared/icons/Icon";
import type { SettingsSection } from "../../domain/entities/app-settings";
import { useSettings } from "../context/SettingsContext";
import { AppearanceSection } from "./sections/AppearanceSection";
import { GeneralSection } from "./sections/GeneralSection";
import styles from "./SettingsView.module.css";

const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
];

export function SettingsView() {
  const activeSection = useSettings((state) => state.activeSection);
  const selectSection = useSettings((state) => state.selectSection);
  const closeSettings = useSettings((state) => state.closeSettings);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeSettings();
    }
  }

  const activeLabel = SECTIONS.find((section) => section.id === activeSection)?.label;

  return (
    <div className={styles.view} onKeyDown={handleKeyDown}>
      <nav className={styles.nav} aria-label="Settings sections">
        <button type="button" className={styles.back} onClick={closeSettings}>
          <Icon name="back" />
          <span>Back</span>
        </button>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={styles.sectionButton}
            aria-current={section.id === activeSection ? "page" : undefined}
            onClick={() => selectSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>
      <main className={styles.content}>
        <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
          {activeLabel}
        </h1>
        {activeSection === "general" && <GeneralSection />}
        {activeSection === "appearance" && <AppearanceSection />}
      </main>
    </div>
  );
}
