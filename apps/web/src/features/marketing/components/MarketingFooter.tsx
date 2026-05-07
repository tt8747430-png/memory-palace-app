import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/40 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-muted-foreground md:flex-row md:justify-between md:px-6">
        <p>© {new Date().getFullYear()} Memory Palace. All rights reserved.</p>
        <nav className="flex gap-6">
          <Link href="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Log In
          </Link>
        </nav>
      </div>
    </footer>
  );
}
