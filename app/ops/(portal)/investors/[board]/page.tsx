import BoardPage from "@/components/ops/BoardPage";

export const dynamic = "force-dynamic";

export default async function InvestorsBoard({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const { board } = await params;
  return <BoardPage boardId={board} expectedModule="investor_outreach" />;
}
