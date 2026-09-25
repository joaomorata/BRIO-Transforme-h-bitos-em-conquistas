import { useApp } from "@/context/AppContext";
import HeroBanner from "@/components/layout/HeroBanner";
import MotivationalBanner from "@/components/dashboard/MotivationalBanner";
import DailyXPCard from "@/components/dashboard/DailyXPCard";
import MetasCard from "@/components/dashboard/MetasCard";
import TarefasDoDia from "@/components/dashboard/TarefasDoDia";
import XPChart from "@/components/dashboard/XPChart";
import EnergyXPChart from "@/components/dashboard/EnergyXPChart";
import SmartRoutineCard from "@/components/dashboard/SmartRoutineCard";
import WeeklyChallengeCard from "@/components/dashboard/WeeklyChallengeCard";
import StatsGrid from "@/components/dashboard/StatsGrid";

export default function Dashboard() {
  const { stats, tasks, moodEntries } = useApp();

  return (
    <div>
      <HeroBanner stats={stats} />
      <MotivationalBanner />

      <div className="mb-6">
        <StatsGrid stats={stats} />
      </div>

      <div className="mb-6">
        <WeeklyChallengeCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-start">
        <DailyXPCard stats={stats} tasks={tasks} />
        <MetasCard stats={stats} tasks={tasks} />
        <TarefasDoDia tasks={tasks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 items-start">
        <XPChart weeklyLog={stats.weekly_xp_log} />
        <EnergyXPChart weeklyLog={stats.weekly_xp_log} moodEntries={moodEntries} />
      </div>

      <SmartRoutineCard />
    </div>
  );
}
