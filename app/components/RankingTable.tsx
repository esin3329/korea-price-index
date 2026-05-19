"use client";

import { ChartDataItem } from "../types/oecd";
import styles from "./RankingTable.module.css";

interface RankingTableProps {
  data: ChartDataItem[];
}

export default function RankingTable({ data }: RankingTableProps) {
  const sortedData = [...data].sort((a, b) => a.rank - b.rank);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">순위</th>
            <th scope="col">국가</th>
            <th scope="col" className={styles.numeric}>
              지수
            </th>
            <th scope="col" className={styles.numeric}>
              한국 대비
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => {
            const difference = item.value - 100;
            const differenceLabel =
              difference === 0
                ? "기준"
                : `${difference > 0 ? "+" : ""}${difference.toFixed(1)}`;

            return (
              <tr
                key={item.countryCode}
                className={item.countryCode === "KOR" ? styles.koreaRow : ""}
              >
                <td>{item.rank}</td>
                <td>
                  <span className={styles.country}>{item.name}</span>
                  {item.countryCode === "KOR" && (
                    <span className={styles.badge}>기준</span>
                  )}
                </td>
                <td className={styles.numeric}>{item.value.toFixed(1)}</td>
                <td
                  className={`${styles.numeric} ${
                    difference > 0
                      ? styles.above
                      : difference < 0
                        ? styles.below
                        : styles.base
                  }`}
                >
                  {differenceLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
