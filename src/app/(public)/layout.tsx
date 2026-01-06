import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user has staff role
  let isStaff = false;
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("role")
      .eq("id", user.id)
      .single();
    
    isStaff = profile?.role && ["admin", "barber", "staff"].includes(profile.role);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-foreground">
              LA MAFIA
            </span>
            <span className="font-serif text-lg text-primary">13</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/agendar"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Agendar
            </Link>
            
            {user ? (
              <div className="flex items-center gap-3">
                {isStaff && (
                  <Link
                    href="/dashboard"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <Link href="/minha-conta">
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Minha Conta
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Entrar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold text-foreground">
                LA MAFIA
              </span>
              <span className="font-serif text-primary">13</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LA MAFIA 13. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
