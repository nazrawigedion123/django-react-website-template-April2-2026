import { BlogDetailPage } from "@/routes/BlogDetailPage";

export default function Page({ params }: { params: { blogId: string } }) {
  return <BlogDetailPage blogId={params.blogId} />;
}
