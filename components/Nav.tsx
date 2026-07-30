import type { NavItem } from "@/lib/content";

type NavProps = {
  logoText: string;
  items: NavItem[];
};

export function Nav({ logoText, items }: NavProps) {
  return (
    <header className="nav">
      <div className="container nav__inner">
        <a className="nav__logo" href="#top">
          {logoText}
        </a>
        <nav className="nav__links" aria-label="Primary">
          {items.map((item) => (
            <a key={item.href} className="nav__link" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
