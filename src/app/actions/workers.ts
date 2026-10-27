"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { VIDEO_MAX_BYTES } from "@/config/limits";
import { requireContractor } from "@/lib/auth/session";
import { getSkills } from "@/lib/data/reference";
import {
  createWorker,
  deleteWorker,
  getWorker,
  setShareToken,
  setWorkerAvailability,
  setWorkerVideo,
  updateWorker,
  workerMediaUrls,
  type Availability,
} from "@/lib/data/workers";
import { keyFromUrl, mediaUrl, storage } from "@/lib/storage";
import { newShareToken } from "@/lib/tokens";
import { DAILY_WAGE, optionalNumber, optionalText } from "@/lib/validation";

// `error` is a translation key under workers.errors.
export type WorkerFormState = { error?: string };

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
// Android records MP4/WebM; iPhones record QuickTime (.mov).
const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-m4v": ".mp4",
  "video/3gpp": ".mp4",
};

const availabilitySchema = z.enum(["available", "placed", "inactive"]);

const workerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  homeState: optionalText(40),
  languages: z.array(z.string().trim().min(1).max(30)).max(8),
  expectedWage: optionalNumber(DAILY_WAGE.min, DAILY_WAGE.max),
  availability: availabilitySchema,
  notes: optionalText(1000),
  mediaConsent: z.boolean(),
  skills: z
    .array(z.object({ skillId: z.string(), years: z.number().min(0).max(60).nullable() }))
    .min(1)
    .max(8),
  transcript: optionalText(4000),
  voiceNoteUrl: optionalText(300),
});

function parseSkills(raw: FormDataEntryValue | null) {
  try {
    return JSON.parse(String(raw ?? "[]"));
  } catch {
    return [];
  }
}

const removeFile = async (url: string | null | undefined) => {
  const key = url ? keyFromUrl(url) : null;
  if (key) await storage.delete(key).catch(() => {});
};

export async function saveWorker(_prev: WorkerFormState, form: FormData): Promise<WorkerFormState> {
  const contractor = await requireContractor();
  const existingId = form.get("id") ? String(form.get("id")) : null;

  const parsed = workerSchema.safeParse({
    name: form.get("name"),
    homeState: form.get("homeState"),
    languages: form.getAll("languages").map(String),
    expectedWage: form.get("expectedWage"),
    availability: form.get("availability") ?? "available",
    notes: form.get("notes"),
    mediaConsent: form.get("mediaConsent") === "on",
    skills: parseSkills(form.get("skills")),
    transcript: form.get("transcript"),
    voiceNoteUrl: form.get("voiceNoteUrl"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return {
      error: field === "name" ? "nameRequired" : field === "skills" ? "skillRequired" : field === "expectedWage" ? "invalidWage" : "invalid",
    };
  }
  const known = new Set((await getSkills()).map((s) => s.id));
  if (parsed.data.skills.some((s) => !known.has(s.skillId))) return { error: "skillRequired" };
  // A voice note URL must be one of this contractor's own uploads.
  const { transcript, voiceNoteUrl, ...fields } = parsed.data;
  const voiceOk = voiceNoteUrl?.startsWith(mediaUrl(`${contractor.id}/voice/`)) ? voiceNoteUrl : null;

  const existing = existingId ? await getWorker(contractor.id, existingId) : null;
  if (existingId && !existing) return { error: "notFound" };
  const workerId = existing?.id ?? randomUUID();

  // Photo: new upload replaces the old one; "removePhoto" clears it.
  let photoUrl = existing?.photoUrl ?? null;
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = PHOTO_TYPES[photo.type.split(";")[0]];
    if (!ext) return { error: "badPhoto" };
    if (photo.size > MAX_PHOTO_BYTES) return { error: "photoTooBig" };
    const key = `${contractor.id}/workers/${workerId}/${randomBytes(8).toString("hex")}${ext}`;
    await storage.put(key, Buffer.from(await photo.arrayBuffer()), photo.type);
    photoUrl = mediaUrl(key);
  } else if (form.get("removePhoto") === "on") {
    photoUrl = null;
  }

  const video = form.get("video");
  let videoKey: string | null = null;
  if (video instanceof File && video.size > 0) {
    const ext = VIDEO_TYPES[video.type.split(";")[0]];
    if (!ext) return { error: "badVideo" };
    if (video.size > VIDEO_MAX_BYTES) return { error: "videoTooBig" };
    videoKey = `${contractor.id}/workers/${workerId}/${randomBytes(8).toString("hex")}${ext}`;
    await storage.put(videoKey, Buffer.from(await video.arrayBuffer()), video.type);
  }

  const extra = {
    photoUrl,
    ...(transcript ? { transcript } : {}),
    ...(voiceOk ? { voiceNoteUrl: voiceOk } : {}),
  };
  if (existing) {
    await updateWorker(contractor.id, workerId, { ...fields, ...extra });
  } else {
    await createWorker(contractor.id, { ...fields, ...extra, id: workerId });
  }
  if (videoKey) {
    const old = await setWorkerVideo(contractor.id, workerId, mediaUrl(videoKey));
    await Promise.all(old.map(removeFile));
  }
  if (existing?.photoUrl && existing.photoUrl !== photoUrl) await removeFile(existing.photoUrl);

  revalidatePath("/", "layout");
  redirect(existing ? `/workers/${workerId}` : `/workers/${workerId}?new=1`);
}

export async function changeAvailability(workerId: string, availability: Availability) {
  const contractor = await requireContractor();
  await setWorkerAvailability(contractor.id, workerId, availabilitySchema.parse(availability));
  revalidatePath("/", "layout");
}

export async function newShareLink(workerId: string) {
  const contractor = await requireContractor();
  await setShareToken(contractor.id, workerId, newShareToken());
  revalidatePath(`/workers/${workerId}`);
}

export async function revokeShareLink(workerId: string) {
  const contractor = await requireContractor();
  await setShareToken(contractor.id, workerId, null);
  revalidatePath(`/workers/${workerId}`);
}

export async function removeWorker(workerId: string) {
  const contractor = await requireContractor();
  const media = await workerMediaUrls(contractor.id, workerId);
  const deleted = await deleteWorker(contractor.id, workerId);
  if (deleted) await Promise.all([deleted.photoUrl, deleted.voiceNoteUrl, ...media].map(removeFile));
  revalidatePath("/", "layout");
  redirect("/workers");
}
