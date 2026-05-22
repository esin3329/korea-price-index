import Link from "next/link";
import styles from "./layout.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Korea Price Index</h1>
        <p className={styles.subtitle}>한국 기준 글로벌 가격수준 비교 대시보드</p>
      </header>
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li>
            <Link href="/dashboard" className={styles.navItem}>
              대시보드
            </Link>
          </li>
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
