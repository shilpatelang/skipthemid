import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore dishes on the world map",
  description:
    "An interactive map of hyper-regional dishes from every continent. Click any pin to learn how locals make it.",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
