import { useMemo } from "react";
import { detectDelimiter, parseCsv } from "../../../domain/services/parse-csv";
import { PreviewMessage } from "../PreviewStates";
import type { ProviderProps } from "./ProviderProps";
import { TextContentState } from "./TextContentState";
import styles from "./CsvPreview.module.css";

const MAX_VISIBLE_ROWS = 500;

function CsvTable({ source }: { source: string }) {
  const rows = useMemo(() => parseCsv(source, detectDelimiter(source)), [source]);

  if (rows.length === 0) return <PreviewMessage title="This file is empty" />;

  const [header, ...body] = rows;
  const visibleRows = body.slice(0, MAX_VISIBLE_ROWS);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th key={index}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {body.length > MAX_VISIBLE_ROWS && (
        <p className={styles.notice}>
          Showing the first {MAX_VISIBLE_ROWS} of {body.length} rows.
        </p>
      )}
    </div>
  );
}

export function CsvPreview({ target, onOpenExternally }: ProviderProps) {
  return (
    <TextContentState target={target} kind="csv" onOpenExternally={onOpenExternally}>
      {(content) => <CsvTable source={content.content} />}
    </TextContentState>
  );
}
