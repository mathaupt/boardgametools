import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AchievementService } from "@/lib/services/achievement.service";
import { AchievementDashboard } from "./achievement-dashboard";

export default async function AchievementsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const overview = await AchievementService.getOverview(userId);
  return <AchievementDashboard overview={overview} />;
}
