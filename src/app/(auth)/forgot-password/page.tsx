import { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar Senha | LA MAFIA 13",
  description: "Recupere sua senha",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B8860B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold text-foreground tracking-tight">
            LA MAFIA
          </h1>
          <p className="text-gold text-xl font-serif mt-1">13</p>
          <p className="mt-4 text-muted-foreground text-sm">
            Recuperar Senha
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-xl">
          <p className="text-sm text-muted-foreground text-center mb-6">
            Digite seu email para receber instruções de recuperação de senha.
          </p>
          <ForgotPasswordForm />
        </div>

        {/* Links */}
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}

