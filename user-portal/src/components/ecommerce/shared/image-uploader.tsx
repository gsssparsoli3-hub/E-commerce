"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/client-api";

/** Reusable image uploader used across admin forms (multi-image capable). */
export function ImageUploader({
  images,
  onChange,
  max = 6,
  single = false,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  single?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, single ? 1 : max - images.length)) {
        const url = await uploadImage(file);
        urls.push(url);
      }
      onChange(single ? urls.slice(0, 1) : [...images, ...urls]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
            <img src={img} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[11px] font-medium">Upload</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!single}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => setShowUrl(!showUrl)}
        >
          {showUrl ? "Hide URL input" : "Or paste image URL"}
        </Button>
      </div>
      {showUrl && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="h-9 text-sm"
          />
          <Button
            type="button"
            size="sm"
            className="h-9"
            onClick={() => {
              if (!urlInput.trim()) return;
              onChange(single ? [urlInput.trim()] : [...images, urlInput.trim()]);
              setUrlInput("");
            }}
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
