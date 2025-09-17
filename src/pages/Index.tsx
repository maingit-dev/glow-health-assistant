import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Activity, Brain, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Hero Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-floating">
            <Heart className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        {/* Hero Text */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Glow Health
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your personalized health companion powered by AI. Track wellness, get insights, and transform your health journey.
        </p>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-lg shadow-card border border-border/50">
            <Activity className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Smart Tracking</h3>
            <p className="text-sm text-muted-foreground">Monitor vitals, sleep, and activity with intelligent insights</p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-lg shadow-card border border-border/50">
            <Brain className="w-8 h-8 text-secondary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">AI Insights</h3>
            <p className="text-sm text-muted-foreground">Get personalized recommendations and health analysis</p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-lg shadow-card border border-border/50">
            <TrendingUp className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Progress Tracking</h3>
            <p className="text-sm text-muted-foreground">Visualize trends and celebrate your wellness milestones</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="wellness" 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6"
          >
            Start Your Health Journey
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6"
          >
            Sign In
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Join thousands of users transforming their health with AI-powered insights
        </p>
      </div>
    </div>
  );
};

export default Index;
