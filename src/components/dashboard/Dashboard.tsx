import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Activity, Moon, Droplets, Brain, TrendingUp, User, LogOut, Sparkles, RefreshCw, BarChart3, AlertCircle, Pill, Wifi, WifiOff, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActivityModal } from "./ActivityModal";
import { SleepModal } from "./SleepModal";
import { MoodModal } from "./MoodModal";
import { HealthTrendsChart } from "@/components/analytics/HealthTrendsChart";
import { SymptomsTracker } from "@/components/tracking/SymptomsTracker";
import { MedicationReminders } from "@/components/tracking/MedicationReminders";
import { CommunityForum } from "@/components/forum/CommunityForum";
import { SmartNotifications } from "@/components/notifications/SmartNotifications";

interface UserProfile {
  full_name: string;
  age: number;
  gender: string;
  location: string;
}

interface HealthData {
  weight_kg: number;
  height_cm: number;
  sleep_hours: number;
  activity_level: string;
  stress_level: number;
  allergies: string[];
  medical_conditions: string[];
  health_goals: string[];
  ai_insights?: any; // Using any for now to handle JSON type from Supabase
}

export const Dashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [sleepModalOpen, setSleepModalOpen] = useState(false);
  const [moodModalOpen, setMoodModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "symptoms" | "reminders" | "forum" | "notifications">("overview");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    setupRealTimeUpdates();
    setupAutoRefresh();
    setupOnlineStatusMonitoring();
    
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }
  }, []);

  const setupOnlineStatusMonitoring = useCallback(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Dashboard is now syncing in real-time",
      });
      fetchUserData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "Dashboard will resume syncing when connection is restored",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const setupAutoRefresh = useCallback(() => {
    if (!autoRefresh) return;

    refreshIntervalRef.current = setInterval(() => {
      if (isOnline && document.visibilityState === 'visible') {
        fetchUserData(true); // Silent refresh
      }
    }, 30000); // Refresh every 30 seconds
  }, [autoRefresh, isOnline]);

  const setupRealTimeUpdates = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Listen for real-time updates to health_data and profiles
    realtimeChannelRef.current = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_data',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Health data updated:', payload);
          setRealTimeUpdates(prev => prev + 1);
          fetchUserData(true);
          toast({
            title: "Data Updated",
            description: "Your health data has been updated in real-time",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          setRealTimeUpdates(prev => prev + 1);
          fetchUserData(true);
        }
      )
      .subscribe();
  }, [toast]);

  const fetchUserData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch profile with optimistic updates
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      // Fetch health data with optimistic updates
      const { data: healthData, error: healthError } = await supabase
        .from("health_data")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (healthError && healthError.code !== "PGRST116") {
        throw healthError;
      }

      if (!profileData || !healthData) {
        navigate("/onboarding");
        return;
      }

      setProfile(profileData);
      setHealthData(healthData);
      setLastUpdated(new Date());
      
      if (!silent) {
        toast({
          title: "Dashboard Updated",
          description: "Latest data loaded successfully",
        });
      }
    } catch (error: any) {
      if (!silent) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const generateHealthInsights = async () => {
    setInsightsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('health-insights', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "AI Insights Generated!",
        description: "Your personalized health insights have been updated.",
      });

      // Refresh health data to get the new insights
      await fetchUserData();
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const calculateBMI = () => {
    if (!healthData) return "0.0";
    const heightInM = healthData.height_cm / 100;
    return (healthData.weight_kg / (heightInM * heightInM)).toFixed(1);
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: "Underweight", color: "text-warning" };
    if (bmi < 25) return { status: "Normal", color: "text-success" };
    if (bmi < 30) return { status: "Overweight", color: "text-warning" };
    return { status: "Obese", color: "text-destructive" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const bmi = parseFloat(calculateBMI());
  const bmiStatus = getBMIStatus(bmi);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center relative">
                <Heart className="w-5 h-5 text-primary-foreground" />
                {realTimeUpdates > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">Glow Health</h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Welcome back, {profile?.full_name?.split(" ")[0] || "User"}!</span>
                  <div className="flex items-center space-x-1">
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-green-500" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-500" />
                    )}
                    <span className={isOnline ? "text-green-600" : "text-red-600"}>
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "text-green-600" : "text-muted-foreground"}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Live Data Indicator */}
          {realTimeUpdates > 0 && (
            <div className="mt-2 flex items-center justify-center">
              <Badge variant="secondary" className="animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Live updates active ({realTimeUpdates} updates received)
              </Badge>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Health Dashboard</h2>
              <p className="text-muted-foreground">
                Track your wellness journey and stay on top of your health goals.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchUserData()}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
          
          {/* Connection Status */}
          {!isOnline && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
              <div className="flex items-center">
                <WifiOff className="w-5 h-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-700">
                  You're currently offline. Data will sync when connection is restored.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BMI</CardTitle>
              <div className="relative">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-fade-in">{bmi}</div>
              <p className={`text-xs ${bmiStatus.color}`}>
                {bmiStatus.status}
              </p>
              <div className="mt-2">
                <Progress 
                  value={Math.min((bmi / 35) * 100, 100)} 
                  className="h-1" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleep</CardTitle>
              <div className="relative">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-fade-in">{healthData?.sleep_hours}h</div>
              <p className="text-xs text-muted-foreground">
                Per night
              </p>
              <div className="mt-2">
                <Progress 
                  value={Math.min(((healthData?.sleep_hours || 0) / 8) * 100, 100)} 
                  className="h-1" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <div className="relative">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize animate-fade-in">
                {healthData?.activity_level?.replace("-", " ")}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifestyle
              </p>
              <div className="mt-2">
                <Progress 
                  value={
                    healthData?.activity_level === 'sedentary' ? 25 :
                    healthData?.activity_level === 'moderate' ? 50 :
                    healthData?.activity_level === 'active' ? 75 :
                    healthData?.activity_level === 'very-active' ? 100 : 0
                  } 
                  className="h-1" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
              <div className="relative">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-fade-in">{healthData?.stress_level}/10</div>
              <p className="text-xs text-muted-foreground">
                Current level
              </p>
              <div className="mt-2">
                <Progress 
                  value={((healthData?.stress_level || 0) / 10) * 100} 
                  className="h-1" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Section */}
        {healthData?.ai_insights && (
          <div className="mb-8">
            <Card className="shadow-card bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>AI Health Insights</span>
                  <Badge variant="secondary" className="ml-2">Powered by Gemini</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-card/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Health Summary</h4>
                  <p className="text-muted-foreground">{healthData.ai_insights.health_summary}</p>
                </div>
                
                {healthData.ai_insights.insights && (
                  <div>
                    <h4 className="font-semibold mb-3">Personalized Recommendations</h4>
                    <div className="grid gap-2">
                      {healthData.ai_insights.insights.map((insight: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {healthData.ai_insights.daily_reminder && (
                  <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                    <h4 className="font-semibold mb-2 text-accent-dark">Today's Focus</h4>
                    <p className="text-sm">{healthData.ai_insights.daily_reminder}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Health Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{profile?.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{profile?.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-medium">{healthData?.weight_kg} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-medium">{healthData?.height_cm} cm</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{profile?.location || "Not specified"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>Health Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthData?.health_goals && healthData.health_goals.length > 0 ? (
                <div className="space-y-2">
                  {healthData.health_goals.map((goal, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">{goal}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No health goals set yet. Consider adding some to track your progress!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="reminders">Reminders</TabsTrigger>
            <TabsTrigger value="forum">Forum</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Button 
                variant="wellness" 
                className="flex items-center space-x-2"
                onClick={generateHealthInsights}
                disabled={insightsLoading}
              >
                {insightsLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{insightsLoading ? "Generating..." : "Get AI Insights"}</span>
              </Button>
              
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => setActivityModalOpen(true)}>
                <Activity className="w-4 h-4" />
                <span>Log Activity</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => setSleepModalOpen(true)}>
                <Moon className="w-4 h-4" />
                <span>Update Sleep</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2" onClick={() => setMoodModalOpen(true)}>
                <Brain className="w-4 h-4" />
                <span>Mood Check-in</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <HealthTrendsChart />
          </TabsContent>

          <TabsContent value="symptoms">
            <SymptomsTracker />
          </TabsContent>

          <TabsContent value="reminders">
            <MedicationReminders />
          </TabsContent>

          <TabsContent value="forum">
            <CommunityForum />
          </TabsContent>

          <TabsContent value="notifications">
            <SmartNotifications />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <ActivityModal 
        open={activityModalOpen} 
        onOpenChange={setActivityModalOpen}
        onUpdate={fetchUserData}
      />
      <SleepModal 
        open={sleepModalOpen} 
        onOpenChange={setSleepModalOpen}
        onUpdate={fetchUserData}
      />
      <MoodModal 
        open={moodModalOpen} 
        onOpenChange={setMoodModalOpen}
        onUpdate={fetchUserData}
      />
    </div>
  );
};