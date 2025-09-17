import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Activity, Moon, Droplets, Brain, TrendingUp, User, LogOut, Sparkles, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      // Fetch health data
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Glow Health</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {profile?.full_name?.split(" ")[0] || "User"}!
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Health Dashboard</h2>
          <p className="text-muted-foreground">
            Track your wellness journey and stay on top of your health goals.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BMI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bmi}</div>
              <p className={`text-xs ${bmiStatus.color}`}>
                {bmiStatus.status}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleep</CardTitle>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthData?.sleep_hours}h</div>
              <p className="text-xs text-muted-foreground">
                Per night
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {healthData?.activity_level?.replace("-", " ")}
              </div>
              <p className="text-xs text-muted-foreground">
                Lifestyle
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthData?.stress_level}/10</div>
              <p className="text-xs text-muted-foreground">
                Current level
              </p>
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
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
          
          <Button variant="outline" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Log Activity</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Moon className="w-4 h-4" />
            <span>Update Sleep</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Mood Check-in</span>
          </Button>
        </div>
      </main>
    </div>
  );
};