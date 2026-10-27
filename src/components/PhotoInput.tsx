"use client";

import { Camera, Trash2, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const MAX_SIDE = 1024;

/** Decodes any image the browser can show (JPEG, PNG, WebP; HEIC on iOS Safari). */
async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img>, which also decodes HEIC on iPhone */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Downscales a camera photo to a ~150–300 KB JPEG before upload (patchy 4G).
 * Always JPEG, so an iPhone HEIC photo uploads fine. Null if undecodable.
 */
async function shrink(file: File): Promise<File | null> {
  try {
    const img = await decode(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  }
}

/**
 * Adds a value to the enclosing form's submissions via the `formdata` event
 * (Chrome and Safari 15+), instead of swapping files into an <input>, which
 * iOS Safari doesn't reliably allow.
 */
function useFormDataValue(anchor: React.RefObject<HTMLElement | null>, name: string, value: File | string | null) {
  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const onFormData = (e: FormDataEvent) => {
      if (value == null) e.formData.delete(name);
      else e.formData.set(name, value);
    };
    form.addEventListener("formdata", onFormData);
    return () => form.removeEventListener("formdata", onFormData);
  }, [anchor, name, value]);
}

export function PhotoInput({ initialUrl }: { initialUrl?: string | null }) {
  const t = useTranslations("workers");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState(false);

  useFormDataValue(inputRef, "photo", photo);
  useFormDataValue(inputRef, "removePhoto", removed ? "on" : null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // the resized copy is what gets submitted
    if (!file) return;
    const small = await shrink(file);
    if (!small) {
      setError(true);
      return;
    }
    setError(false);
    setPhoto(small);
    setPreview(URL.createObjectURL(small));
    setRemoved(false);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-board border-2 border-ink bg-board"
          aria-label={t("takePhoto")}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <Camera className="size-10 text-ink" strokeWidth={2} aria-hidden />
          )}
        </button>
        <div className="flex-1 space-y-2">
          <button type="button" className="btn btn-ink w-full" onClick={() => inputRef.current?.click()}>
            <Camera className="size-5" aria-hidden />
            {preview ? t("retakePhoto") : t("takePhoto")}
          </button>
          {preview && (
            <button
              type="button"
              className="btn btn-danger btn-sm w-full"
              onClick={() => {
                setPreview(null);
                setPhoto(null);
                setRemoved(true);
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              {t("removePhoto")}
            </button>
          )}
        </div>
        {/* No name: the resized JPEG is added to the form via `formdata`. */}
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {t("errors.badPhoto")}
        </p>
      )}
    </div>
  );
}

/** Reads a video's length; resolves 0 if the browser can't tell within 5 s. */
function videoSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = (s: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(s) ? s : 0);
    };
    const timer = setTimeout(() => done(0), 5000);
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.onloadedmetadata = () => {
      clearTimeout(timer);
      done(v.duration);
    };
    v.onerror = () => {
      clearTimeout(timer);
      done(0);
    };
    v.src = url;
  });
}

/**
 * Optional ≤20 s skill video (e.g. the worker welding). Checked on the phone
 * first. iPhones record .mov; record at the camera's lower quality to stay
 * under the size limit.
 */
export function VideoInput({ maxSeconds, maxBytes, hasExisting }: { maxSeconds: number; maxBytes: number; hasExisting: boolean }) {
  const t = useTranslations("workers");
  const inputRef = useRef<HTMLInputElement>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFormDataValue(inputRef, "video", video);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setError(null);
    setLabel(null);
    setVideo(null);
    if (!file) return;
    if (file.size > maxBytes) {
      setError(t("videoTooBig", { mb: Math.round(maxBytes / 1024 / 1024) }));
      return;
    }
    const seconds = await videoSeconds(file);
    if (seconds > maxSeconds + 0.5) {
      setError(t("videoTooLong", { seconds: maxSeconds }));
      return;
    }
    setVideo(file);
    setLabel(seconds ? `${Math.round(seconds)}s` : `${(file.size / 1024 / 1024).toFixed(1)} MB`);
  }

  return (
    <div className="space-y-1.5">
      <button type="button" className="btn btn-outline w-full" onClick={() => inputRef.current?.click()}>
        <Video className="size-5" aria-hidden />
        {label ? t("videoReady", { length: label }) : hasExisting ? t("replaceVideo") : t("addVideo", { seconds: maxSeconds })}
      </button>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <input ref={inputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={onChange} />
    </div>
  );
}
