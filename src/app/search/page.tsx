import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export const metadata = {
  title: "Search a Vehicle — AutoFair",
  description: "Search by VIN or make/model/year to get fair market pricing instantly.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchPageClient />
    </Suspense>
  );
}
