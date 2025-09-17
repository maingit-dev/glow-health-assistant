import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Moon } from "lucide-react";

interface SleepModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const SleepModal = ({ open, onOpenChange, onUpdate }: SleepModalProps) => {
  const [sleepHours, setSleepHours] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(sleepHours);
    if (!hours || hours < 1 || hours > 24) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of hours between 1 and 24.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("health_data")
        .update({ sleep_hours: Math.round(hours) })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Sleep Updated",
        description: `Your sleep hours have been updated to ${Math.round(hours)} hours.`,
      });

      onUpdate();
      onOpenChange(false);
      setSleepHours("");
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
            <Moon className="w-5 h-5" />
            <span>Update Sleep</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sleep">Hours of Sleep (last night)</Label>
            <Input
              id="sleep"
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="e.g., 8"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Enter the number of hours you slept last night
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="wellness" disabled={loading || !sleepHours}>
              {loading ? "Updating..." : "Update Sleep"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};