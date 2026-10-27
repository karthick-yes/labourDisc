import { redirect } from "next/navigation";
import { getContractor } from "@/lib/auth/session";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  if (await getContractor()) redirect("/");
  return <SignupForm needsCode={Boolean(process.env.SIGNUP_CODE)} />;
}
