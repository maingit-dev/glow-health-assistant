import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Calendar, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

const SYMPTOMS_LIBRARY = [
  // Menstrual Symptoms
  { category: "Menstrual", symptoms: [
    "Heavy flow", "Light flow", "Irregular cycle", "Painful cramps", "Spotting", 
    "Blood clots", "Breast tenderness", "Mood swings"
  ]},
  
  // Physical Symptoms
  { category: "Physical", symptoms: [
    "Headache", "Fatigue", "Nausea", "Bloating", "Back pain", "Joint pain",
    "Muscle aches", "Dizziness", "Hot flashes", "Cold symptoms", "Fever"
  ]},
  
  // Digestive
  { category: "Digestive", symptoms: [
    "Constipation", "Diarrhea", "Stomach cramps", "Acid reflux", "Loss of appetite",
    "Food cravings", "Indigestion"
  ]},
  
  // Emotional/Mental
  { category: "Emotional", symptoms: [
    "Anxiety", "Depression", "Irritability", "Mood swings", "Brain fog",
    "Difficulty concentrating", "Insomnia", "Restlessness"
  ]},
  
  // Skin & Hair
  { category: "Skin & Hair", symptoms: [
    "Acne", "Dry skin", "Oily skin", "Hair loss", "Brittle nails", "Rash", "Itching"
  ]}
];

interface DailyLogData {
  log_date: string;
  symptoms: string[];
}

export const SymptomsTracker = () => {
  const [todaySymptoms, setTodaySymptoms] = useState<string[]>([]);
  const [recentLogs, setRecentLogs] = useState<DailyLogData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodaySymptoms();
    fetchRecentLogs();
  }, []);

  const fetchTodaySymptoms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from("daily_logs" as any)
        .select("symptoms")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      setTodaySymptoms((data as any)?.symptoms || []);
    } catch (error) {
      console.error("Error fetching today's symptoms:", error);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("daily_logs" as any)
        .select("log_date, symptoms")
        .eq("user_id", user.id)
        .not("symptoms", "is", null)
        .order("log_date", { ascending: false })
        .limit(7);

      if (error) throw error;
      
      setRecentLogs((data as unknown as DailyLogData[]) || []);
    } catch (error) {
      console.error("Error fetching recent logs:", error);
    }
  };

  const updateSymptoms = async (selectedSymptoms: string[]) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), 'yyyy-MM-dd');

      const { error } = await supabase
        .from("daily_logs" as any)
        .upsert({
          user_id: user.id,
          log_date: today,
          symptoms: selectedSymptoms,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,log_date"
        });

      if (error) throw error;

      setTodaySymptoms(selectedSymptoms);
      setIsModalOpen(false);
      await fetchRecentLogs();

      toast({
        title: "Symptoms Updated",
        description: `Logged ${selectedSymptoms.length} symptoms for today.`,
      });
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

  const filteredSymptoms = SYMPTOMS_LIBRARY.map(category => ({
    ...category,
    symptoms: category.symptoms.filter(symptom =>
      symptom.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.symptoms.length > 0);

  return (
    <div className="space-y-6">
      {/* Today's Symptoms Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Today's Symptoms</span>
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Track Symptoms
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Track Your Symptoms</DialogTitle>
                </DialogHeader>
                <SymptomsModal 
                  currentSymptoms={todaySymptoms}
                  onSave={updateSymptoms}
                  loading={loading}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {todaySymptoms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {todaySymptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary">
                  {symptom}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No symptoms tracked today</p>
              <p className="text-sm">Tap "Track Symptoms" to log how you're feeling</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Symptoms History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Recent History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            <div className="space-y-4">
              {recentLogs.map((log, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-medium">
                        {format(new Date(log.log_date), 'MMM dd, yyyy')}
                      </p>
                      <Badge variant="outline">
                        {log.symptoms?.length || 0} symptoms
                      </Badge>
                    </div>
                    {log.symptoms && log.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {log.symptoms.map((symptom, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No symptom history yet</p>
              <p className="text-sm">Start tracking to see patterns over time</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface SymptomsModalProps {
  currentSymptoms: string[];
  onSave: (symptoms: string[]) => void;
  loading: boolean;
}

const SymptomsModal = ({ currentSymptoms, onSave, loading }: SymptomsModalProps) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(currentSymptoms);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const filteredSymptoms = SYMPTOMS_LIBRARY.map(category => ({
    ...category,
    symptoms: category.symptoms.filter(symptom =>
      symptom.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.symptoms.length > 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-6">
          {filteredSymptoms.map((category) => (
            <div key={category.category}>
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                {category.category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {category.symptoms.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={selectedSymptoms.includes(symptom)}
                      onCheckedChange={() => toggleSymptom(symptom)}
                    />
                    <label
                      htmlFor={symptom}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {symptom}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {selectedSymptoms.length} symptoms selected
        </p>
        <Button onClick={() => onSave(selectedSymptoms)} disabled={loading}>
          {loading ? "Saving..." : "Save Symptoms"}
        </Button>
      </div>
    </div>
  );
};