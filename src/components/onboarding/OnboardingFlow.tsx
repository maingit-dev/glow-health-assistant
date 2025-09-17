import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Weight, Ruler, MapPin, Moon, Heart, Droplets, Brain, Smile } from "lucide-react";

interface OnboardingData {
  full_name: string;
  age: number;
  gender: string;
  weight_kg: number;
  height_cm: number;
  location: string;
  sleep_hours: number;
  activity_level: string;
  stress_level: number;
  allergies: string[];
  medical_conditions: string[];
  health_goals: string[];
}

export const OnboardingFlow = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<OnboardingData>({
    full_name: "",
    age: 25,
    gender: "",
    weight_kg: 70,
    height_cm: 170,
    location: "",
    sleep_hours: 7,
    activity_level: "",
    stress_level: 5,
    allergies: [],
    medical_conditions: [],
    health_goals: [],
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: data.full_name,
          age: data.age,
          gender: data.gender,
          location: data.location,
        });

      if (profileError) throw profileError;

      // Create health data
      const { error: healthError } = await supabase
        .from("health_data")
        .upsert({
          user_id: user.id,
          weight_kg: data.weight_kg,
          height_cm: data.height_cm,
          sleep_hours: data.sleep_hours,
          activity_level: data.activity_level,
          stress_level: data.stress_level,
          allergies: data.allergies,
          medical_conditions: data.medical_conditions,
          health_goals: data.health_goals,
        });

      if (healthError) throw healthError;

      toast({
        title: "Welcome to Glow Health!",
        description: "Your health profile has been created successfully.",
      });

      navigate("/dashboard");
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

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={data.full_name}
                  onChange={(e) => setData({ ...data, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={data.age}
                    onChange={(e) => setData({ ...data, age: parseInt(e.target.value) })}
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={data.gender} onValueChange={(value) => setData({ ...data, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={data.location}
                    onChange={(e) => setData({ ...data, location: e.target.value })}
                    placeholder="City, Country"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Weight className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Physical Metrics</h2>
              <p className="text-muted-foreground">Help us understand your body</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label>Weight: {data.weight_kg} kg</Label>
                <Slider
                  value={[data.weight_kg]}
                  onValueChange={(value) => setData({ ...data, weight_kg: value[0] })}
                  max={200}
                  min={30}
                  step={1}
                  className="w-full mt-2"
                />
              </div>
              
              <div>
                <Label>Height: {data.height_cm} cm</Label>
                <Slider
                  value={[data.height_cm]}
                  onValueChange={(value) => setData({ ...data, height_cm: value[0] })}
                  max={220}
                  min={120}
                  step={1}
                  className="w-full mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="activity">Activity Level</Label>
                <Select value={data.activity_level} onValueChange={(value) => setData({ ...data, activity_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                    <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (2x/day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Brain className="w-12 h-12 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Wellness Metrics</h2>
              <p className="text-muted-foreground">Track your mental and physical well-being</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label>Sleep Hours: {data.sleep_hours} hours/night</Label>
                <Slider
                  value={[data.sleep_hours]}
                  onValueChange={(value) => setData({ ...data, sleep_hours: value[0] })}
                  max={12}
                  min={4}
                  step={0.5}
                  className="w-full mt-2"
                />
              </div>
              
              <div>
                <Label>Stress Level: {data.stress_level}/10</Label>
                <Slider
                  value={[data.stress_level]}
                  onValueChange={(value) => setData({ ...data, stress_level: value[0] })}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full mt-2"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-wellness flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-floating">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Health Profile Setup</CardTitle>
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 3 ? (
              <Button
                variant="wellness"
                onClick={nextStep}
                disabled={
                  (step === 1 && (!data.full_name || !data.gender)) ||
                  (step === 2 && !data.activity_level)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                variant="wellness"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating Profile..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};