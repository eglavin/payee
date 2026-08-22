"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Upload, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bankFormats, parseTransactions } from "@/lib/formats";
import type { LoadedFile } from "@/lib/loaded-files";
import { SAMPLE_TRANSACTIONS_CSV, SAMPLE_TRANSACTIONS_FILE_NAME } from "@/lib/sample-data";

export interface LoadedFileResult {
  name: string;
  formatLabel: string;
  skippedRows: number;
  transactions: LoadedFile["transactions"];
}

interface FileUploadProps {
  files: LoadedFile[];
  onFilesLoaded: (results: LoadedFileResult[]) => void;
  onRemoveFile: (fileId: string) => void;
  onClearAll: () => void;
}

export function FileUpload({
  files,
  onFilesLoaded,
  onRemoveFile,
  onClearAll,
}: FileUploadProps) {
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const processFiles = useCallback(
    async (fileList: File[]) => {
      if (fileList.length === 0) return;

      const results: LoadedFileResult[] = [];
      const newErrors: { name: string; message: string }[] = [];

      for (const file of fileList) {
        try {
          const text = await file.text();
          const { transactions, skippedRows, formatLabel } = parseTransactions(text);

          if (transactions.length === 0) {
            newErrors.push({ name: file.name, message: "No transactions found in that file." });
            continue;
          }

          results.push({ name: file.name, formatLabel, skippedRows, transactions });
        } catch (err) {
          newErrors.push({
            name: file.name,
            message: err instanceof Error ? err.message : "Could not read that file as CSV.",
          });
        }
      }

      setErrors(newErrors);
      if (results.length > 0) onFilesLoaded(results);
    },
    [onFilesLoaded],
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = Array.from(e.target.files ?? []);
    await processFiles(fileList);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleTryExample() {
    const file = new File([SAMPLE_TRANSACTIONS_CSV], SAMPLE_TRANSACTIONS_FILE_NAME, {
      type: "text/csv",
    });
    void processFiles([file]);
  }

  function handleClearAll() {
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
    onClearAll();
  }

  // Without this, dropping a file anywhere on the page makes the browser
  // navigate to/download it instead of handing it to us. Listening on
  // `window` (rather than just the drop zone) lets a file be dropped
  // anywhere on screen, with a counter to track nested enter/leave pairs
  // as the drag crosses child elements so the overlay doesn't flicker.
  useEffect(() => {
    function hasFilesPayload(e: DragEvent) {
      return Array.from(e.dataTransfer?.types ?? []).includes("Files");
    }

    function handleDragEnter(e: DragEvent) {
      if (!hasFilesPayload(e)) return;
      e.preventDefault();
      dragCounter.current += 1;
      setIsDraggingFiles(true);
    }

    function handleDragOver(e: DragEvent) {
      if (!hasFilesPayload(e)) return;
      e.preventDefault();
    }

    function handleDragLeave(e: DragEvent) {
      if (!hasFilesPayload(e)) return;
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setIsDraggingFiles(false);
    }

    function handleDrop(e: DragEvent) {
      if (!hasFilesPayload(e)) return;
      e.preventDefault();
      dragCounter.current = 0;
      setIsDraggingFiles(false);
      void processFiles(Array.from(e.dataTransfer?.files ?? []));
    }

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [processFiles]);

  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col gap-2">
      {isDraggingFiles && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-primary px-12 py-10 text-center">
            <UploadCloud className="size-10 text-primary" />
            <p className="text-lg font-medium">Drop to upload</p>
            <p className="text-sm text-muted-foreground">
              CSV exports from {bankFormats.map((f) => f.label).join(" or ")}
            </p>
          </div>
        </div>
      )}

      {hasFiles && (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 px-1">
              <Upload className="size-4 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  &middot; {file.formatLabel} &middot;{" "}
                  <span className="font-mono tabular-nums">{file.transactions.length}</span>{" "}
                  transactions
                  {file.skippedRows > 0 && (
                    <>
                      {" · "}
                      <span className="font-mono tabular-nums">{file.skippedRows}</span> row
                      {file.skippedRows === 1 ? "" : "s"} skipped
                    </>
                  )}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRemoveFile(file.id)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 border-t px-1 pt-2">
            <Label htmlFor="csv-upload" className="cursor-pointer text-sm font-normal">
              <span className="inline-flex items-center gap-1 text-primary">
                <Plus className="size-3.5" />
                Add more files
              </span>
            </Label>
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <X className="size-4" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      {!hasFiles && (
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="csv-upload">Upload bank transaction exports (CSV)</Label>
          <span className="text-sm text-muted-foreground">or</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-sm"
            onClick={handleTryExample}
          >
            try example data
          </Button>
        </div>
      )}
      <Input
        ref={inputRef}
        id="csv-upload"
        type="file"
        accept=".csv,text/csv"
        multiple
        onChange={handleFileChange}
        className={hasFiles ? "hidden" : undefined}
      />

      {errors.map((err) => (
        <p key={err.name} className="text-sm text-destructive">
          {err.name}: {err.message}
        </p>
      ))}
    </div>
  );
}
