import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, KeyRound, ChevronDown } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile if logged in
  let userName: string | null = null;
  let userEmail: string | null = null;
  let isStaff = false;

  if (user) {
    userEmail = user.email || null;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      userName = profile.full_name;
      isStaff = profile.role && ["admin", "barber", "staff"].includes(profile.role);
    }

    // Try to get name from clients table if not in profile
    if (!userName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: client } = await (supabase.from("clients") as any)
        .select("name")
        .eq("user_id", user.id)
        .single();
      
      if (client) {
        userName = client.name;
      }
    }

    // Fallback to email
    if (!userName) {
      userName = userEmail?.split("@")[0] || "Usuário";
    }
  }

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="h-9 w-9 border-2 border-primary">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium leading-tight">{userName}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{userEmail}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/minha-conta" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Minha Conta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/minha-conta/perfil" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Editar Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/minha-conta/senha" className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Trocar Senha
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <form action={signOut} className="w-full">
                        <button type="submit" className="flex items-center gap-2 w-full text-red-500">
                          <LogOut className="h-4 w-4" />
                          Sair
                        </button>
                      </form>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4">
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} LA MAFIA 13. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
