"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ProfileData {
  role: string | null;
  active: boolean | null;
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check user role to redirect appropriately
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .single();

    const profile = profileData as ProfileData | null;

    if (!profile?.active) {
      await supabase.auth.signOut();
      return { error: "Conta desativada. Entre em contato com o administrador." };
    }

    revalidatePath("/", "layout");

    if (["admin", "barber", "staff"].includes(profile?.role || "")) {
      redirect("/dashboard");
    } else {
      redirect("/minha-conta");
    }
  }

  return { error: "Erro ao fazer login" };
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const phone = formData.get("phone") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role: "client", // Default role for self-registration
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/minha-conta");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Email de recuperação enviado" };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

