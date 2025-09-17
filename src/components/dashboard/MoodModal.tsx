import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain } from "lucide-react";

interface MoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const MoodModal = ({ open, onOpenChange, onUpdate }: MoodModalProps) => {
  const [stressLevel, setStressLevel] = useState([5]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getStressMood = (level: number) => {
    if (level <= 2) return { mood: "Very Relaxed", color: "text-success" };
    if (level <= 4) return { mood: "Calm", color: "text-success" };
    if (level <= 6) return { mood: "Neutral", color: "text-warning" };
    if (level <= 8) return { mood: "Stressed", color: "text-warning" };
    return { mood: "Very Stressed", color: "text-destructive" };
  };

  const currentMood = getStressMood(stressLevel[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("health_data")
        .update({ stress_level: stressLevel[0] })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Mood Updated",
        description: `Your stress level has been recorded as ${stressLevel[0]}/10.`,
      });

      onUpdate();
      onOpenChange(false);
      setStressLevel([5]);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Mood Check-in</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>How stressed do you feel right now?</Label>
            <div className="space-y-4">
              <Slider
                value={stressLevel}
                onValueChange={setStressLevel}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1 - Very Relaxed</span>
                <span>10 - Very Stressed</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold">{stressLevel[0]}/10</span>
                <p className={`text-sm ${currentMood.color}`}>{currentMood.mood}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="wellness" disabled={loading}>
              {loading ? "Updating..." : "Update Mood"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};