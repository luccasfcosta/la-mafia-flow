import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-foreground">
              LA MAFIA
            </span>
            <span className="font-serif text-lg text-gold">13</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/agendar"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Agendar
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-2 bg-gold hover:bg-gold/90 text-gold-foreground rounded-md transition-colors"
            >
              Entrar
            </Link>
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
              <span className="font-serif text-gold">13</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestao para Barbearias
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

