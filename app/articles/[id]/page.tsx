import { ArticleEditClient } from "./ArticleEditClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArticleEditPage({ params }: PageProps) {
  const { id } = await params;
  return <ArticleEditClient articleId={id} />;
}
