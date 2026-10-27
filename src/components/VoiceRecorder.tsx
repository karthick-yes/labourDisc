"use client";

import { LoaderCircle, Mic, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useOnline } from "./OfflineBanner";

const MAX_SECONDS = 60;
const LANGS = [
  { id: "", label: "Auto" },
  { id: "ml", label: "മലയാളം" },
  { id: "hi", label: "हिन्दी" },
  { id: "bn", label: "বাংলা" },
  { id: "as", label: "অসমীয়া" },
] as const;

export type AiStatus = { available: true; remainingToday: number } | { available: false; reason: string };
export type VoiceResult<T> = { transcript: string; result: T; voiceUrl: string };

type Phase = "idle" | "recording" | "sending" | "done" | "error";

/**
 * Record up to 60 s, send to /api/intake, hand back the structured result.
 * Manual entry always stays possible; this only fills the form.
 */
export function VoiceRecorder<T>({
  kind,
  status,
  onResult,
}: {
  kind: "worker" | "need";
  status: AiStatus;
  onResult: (r: VoiceResult<T>) => void;
}) {
  const t = useTranslations("voice");
  const online = useOnline();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [lang, setLang] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(0);

  useEffect(() => () => stopTracks(), []);

  function stopTracks() {
    if (timer.current) clearInterval(timer.current);
    recorder.current?.stream.getTracks().forEach((tr) => tr.stop());
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, noiseSuppression: true } });
      // Chrome/Android: WebM Opus. iPhone Safari: MP4 (AAC).
      const supported = (m: string) => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(m);
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(supported);
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stopTracks();
        const secs = Math.min(MAX_SECONDS, (Date.now() - started.current) / 1000);
        // Safari can leave mimeType empty; its recordings are MP4.
        const type = rec.mimeType || mime || (chunks[0]?.type ?? "") || "audio/mp4";
        send(new Blob(chunks, { type }), secs);
      };
      recorder.current = rec;
      started.current = Date.now();
      setSeconds(0);
      rec.start(1000);
      setPhase("recording");
      timer.current = setInterval(() => {
        const s = Math.floor((Date.now() - started.current) / 1000);
        setSeconds(s);
        if (s >= MAX_SECONDS && rec.state === "recording") rec.stop();
      }, 250);
    } catch {
      setError("mic");
      setPhase("error");
    }
  }

  async function send(blob: Blob, secs: number) {
    if (secs < 1.5) {
      setError("too_short");
      setPhase("error");
      return;
    }
    setPhase("sending");
    const form = new FormData();
    const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("webm") ? "webm" : "m4a";
    form.append("audio", blob, `voice.${ext}`);
    form.append("kind", kind);
    form.append("lang", lang);
    form.append("seconds", String(Math.round(secs)));
    try {
      const res = await fetch("/api/intake", { method: "POST", body: form });
      const json = await res.json();
      if (json.transcript) setTranscript(json.transcript);
      if (!json.ok) {
        setError(json.reason ?? "ai_error");
        setPhase("error");
        return;
      }
      onResult(json as VoiceResult<T>);
      setPhase("done");
    } catch {
      setError("network");
      setPhase("error");
    }
  }

  if (!status.available) {
    return (
      <div className="flex items-start gap-3 rounded-board border-2 border-dashed border-ink-2/40 bg-surface p-3.5 text-[15px] text-ink-2">
        <Mic className="mt-0.5 size-5 shrink-0" aria-hidden />
        <span>{t(`blocked.${status.reason}`)}</span>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="strip text-base">
        <span>{t(kind === "worker" ? "titleWorker" : "titleNeed")}</span>
        <span className="tabular text-sm font-semibold">{t("remaining", { count: status.remainingToday })}</span>
      </div>
      <div className="space-y-3 p-3">
        {phase !== "recording" && phase !== "sending" && (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("language")}>
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={lang === l.id}
                data-active={lang === l.id}
                onClick={() => setLang(l.id)}
                className="chip min-h-10 px-3 text-sm"
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        {phase === "recording" ? (
          <button type="button" onClick={() => recorder.current?.stop()} className="btn btn-primary min-h-16 w-full text-lg">
            <Square className="size-5 fill-current" aria-hidden />
            {t("stop")}
            <span className="tabular ml-auto rounded-md bg-white/20 px-2 py-0.5">
              0:{String(seconds).padStart(2, "0")} / 1:00
            </span>
          </button>
        ) : phase === "sending" ? (
          <div className="btn btn-outline min-h-16 w-full text-lg" role="status">
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            {t("sending")}
          </div>
        ) : (
          <button type="button" onClick={start} disabled={!online} className="btn btn-ink min-h-16 w-full text-lg">
            <Mic className="size-6" aria-hidden />
            {phase === "done" ? t("again") : t("start")}
          </button>
        )}

        {phase === "recording" && (
          <div className="h-1.5 overflow-hidden rounded-full bg-ground" aria-hidden>
            <div className="h-full bg-bus transition-[width] duration-300 ease-out" style={{ width: `${(seconds / MAX_SECONDS) * 100}%` }} />
          </div>
        )}
        {phase === "done" && <p className="text-[15px] font-semibold text-ok">{t("filled")}</p>}
        {error && (
          <p role="alert" className="text-[15px] font-semibold text-danger">
            {t(`errors.${error}`)}
          </p>
        )}
        {transcript && (
          <details className="text-[15px]">
            <summary className="cursor-pointer font-semibold text-ink-2">{t("heard")}</summary>
            <p className="mt-1 rounded-md bg-ground p-2">{transcript}</p>
          </details>
        )}
        {!online && <p className="text-sm text-muted">{t("offline")}</p>}
      </div>
    </div>
  );
}
