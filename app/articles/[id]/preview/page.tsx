import { ArticlePreviewClient } from "./ArticlePreviewClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArticlePreviewPage({ params }: PageProps) {
  const { id } = await params;
  return <ArticlePreviewClient articleId={id} />;
}

