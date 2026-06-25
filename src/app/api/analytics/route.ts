import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAnalytics } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pocketId = searchParams.get("pocketId");
  if (!pocketId) {
    return NextResponse.json({
      currentMonth: { income: 0, expense: 0, net: 0 },
      monthlyTrend: [],
      topCategories: [],
      budget: { total: 0, spent: 0, remaining: 0 },
      allTime: { income: 0, expense: 0, net: 0 },
    });
  }
  const pid = parseInt(pocketId);

  const data = await unstable_cache(
    async (pid: number | null) => getAnalytics(pid),
    ["analytics", `p${pid ?? "all"}`],
    { revalidate: 15 }
  )(pid);

  const response = NextResponse.json(data);
  response.headers.set("Cache-Control", "public, max-age=10, stale-while-revalidate=30");
  return response;
}
