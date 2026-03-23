import { Suspense } from "react";
import { ArticlesClient } from "./ArticlesClient";

export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticlesClient />
    </Suspense>
  );
}
