import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { TrendingUp, Activity, Moon, Brain, Calendar, Target } from "lucide-react";
import { format, parseISO, subDays, startOfDay } from "date-fns";

interface DailyLog {
  log_date: string;
  sleep_hours: number;
  stress_level: number;
  exercise_minutes: number;
  water_intake_ml: number;
  weight_kg: number;
  energy_level: string;
  mood: string;
  sleep_quality: string;
}

interface TrendData {
  date: string;
  sleep_hours: number;
  stress_level: number;
  exercise_minutes: number;
  water_intake_ml: number;
  weight_kg: number;
  energy_score: number;
  mood_score: number;
  sleep_quality_score: number;
}

const energyLevelToScore = (level: string): number => {
  const scores = { low: 1, moderate: 2, high: 3, very_high: 4 };
  return scores[level as keyof typeof scores] || 2;
};

const moodToScore = (mood: string): number => {
  const scores = { 
    terrible: 1, sad: 2, anxious: 2, stressed: 2,
    neutral: 3, content: 3,
    happy: 4, excited: 4, grateful: 4, confident: 4, energetic: 4
  };
  return scores[mood as keyof typeof scores] || 3;
};

const sleepQualityToScore = (quality: string): number => {
  const scores = { poor: 1, fair: 2, good: 3, excellent: 4 };
  return scores[quality as keyof typeof scores] || 2;
};

export const HealthTrendsChart = () => {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchDailyLogs();
  }, [timeRange]);

  const fetchDailyLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from("daily_logs" as any)
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", startDate)
        .order("log_date", { ascending: true });

      if (error) throw error;

      setDailyLogs((data as unknown as DailyLog[]) || []);
      processTrendData((data as unknown as DailyLog[]) || []);
    } catch (error) {
      console.error("Error fetching daily logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const processTrendData = (logs: DailyLog[]) => {
    const processed = logs.map(log => ({
      date: format(parseISO(log.log_date), 'MMM dd'),
      sleep_hours: log.sleep_hours || 0,
      stress_level: log.stress_level || 0,
      exercise_minutes: log.exercise_minutes || 0,
      water_intake_ml: log.water_intake_ml || 0,
      weight_kg: log.weight_kg || 0,
      energy_score: energyLevelToScore(log.energy_level),
      mood_score: moodToScore(log.mood),
      sleep_quality_score: sleepQualityToScore(log.sleep_quality)
    }));
    setTrendData(processed);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Health Trends</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{trendData.length} days tracked</Badge>
            <div className="flex space-x-1">
              {["7d", "30d", "90d"].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range as any)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wellness" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wellness">Wellness</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="weight">Weight</TabsTrigger>
          </TabsList>

          <TabsContent value="wellness" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="stress_level" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Stress Level"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood_score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Mood Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy_score" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Energy Level"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="exercise_minutes" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)"
                    name="Exercise (minutes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="sleep" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 12]} />
                  <Tooltip />
                  <Bar 
                    dataKey="sleep_hours" 
                    fill="hsl(var(--secondary))"
                    name="Sleep Hours"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="weight" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData.filter(d => d.weight_kg > 0)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="weight_kg" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    name="Weight (kg)"
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {trendData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground">
              Start logging your daily activities to see beautiful health trends here!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};