import Link from "next/link";
import styles from "@/app/site.module.css";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/countries", label: "국가별 해설" },
  { href: "/about", label: "Korea Price Index 소개" },
  { href: "/methodology", label: "방법론" },
  { href: "/privacy", label: "개인정보 처리방침" },
  { href: "/contact", label: "문의" },
  { href: "/disclaimer", label: "면책 고지" },
];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.brandHeading}>
          <Link href="/dashboard" className={styles.brand}>
            Korea Price Index
          </Link>
        </h1>
        <p className={styles.subtitle}>한국 기준 글로벌 가격수준 비교 대시보드</p>
      </header>
      <nav className={styles.nav} aria-label="주요 메뉴">
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.navItem}>
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <a href="/data/k-collusion-index.json" className={styles.navItem}>
              원본 JSON
            </a>
          </li>
        </ul>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
