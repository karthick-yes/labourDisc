import { randomBytes } from "node:crypto";

/** Unguessable token for public worker profile links (/w/<token>). */
export const newShareToken = () => randomBytes(16).toString("base64url");
