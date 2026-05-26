import DashboardClient from "@/app/components/DashboardClient";

export const metadata = {
  title: "Korea Price Index",
  description: "G20 economies compared through Korea-based price-level indicators.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <DashboardClient />;
}
