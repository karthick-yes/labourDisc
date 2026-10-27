import { redirect } from "next/navigation";
import { getContractor } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getContractor()) redirect("/");
  return <LoginForm />;
}
