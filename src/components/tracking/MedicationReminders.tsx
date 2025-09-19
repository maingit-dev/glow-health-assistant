import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Clock, Calendar, CheckCircle, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { format, isToday, isTomorrow, addHours, parseISO } from "date-fns";

interface Reminder {
  id: string;
  title: string;
  message: string;
  reminder_type: string;
  reminder_date: string;
  frequency: string;
  is_active: boolean;
  is_sent: boolean;
  created_at: string;
}

interface MedicationForm {
  title: string;
  dosage: string;
  frequency: string;
  time: string;
  notes: string;
}

export const MedicationReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("reminders" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("reminder_type", "medication")
        .order("reminder_date", { ascending: true });

      if (error) throw error;
      setReminders((data as unknown as Reminder[]) || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (form: MedicationForm) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Parse time and create reminder date
      const [hours, minutes] = form.time.split(':').map(Number);
      const reminderDate = new Date();
      reminderDate.setHours(hours, minutes, 0, 0);
      
      // If the time has passed today, schedule for tomorrow
      if (reminderDate < new Date()) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }

      const { error } = await supabase
        .from("reminders" as any)
        .insert({
          user_id: user.id,
          title: form.title,
          message: `Take ${form.dosage}${form.notes ? ` - ${form.notes}` : ''}`,
          reminder_type: "medication",
          reminder_date: reminderDate.toISOString(),
          frequency: form.frequency,
          is_active: true
        });

      if (error) throw error;

      await fetchReminders();
      setIsModalOpen(false);

      toast({
        title: "Reminder Created",
        description: `${form.title} reminder has been set up successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleReminderActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("reminders" as any)
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;

      setReminders(prev =>
        prev.map(reminder =>
          reminder.id === id ? { ...reminder, is_active: isActive } : reminder
        )
      );

      toast({
        title: isActive ? "Reminder Enabled" : "Reminder Disabled",
        description: `Medication reminder has been ${isActive ? 'enabled' : 'disabled'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reminders" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      setReminders(prev => prev.filter(reminder => reminder.id !== id));

      toast({
        title: "Reminder Deleted",
        description: "Medication reminder has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTimeUntilReminder = (reminderDate: string) => {
    const now = new Date();
    const reminder = parseISO(reminderDate);
    const diffInHours = Math.round((reminder.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 0) return "Overdue";
    if (diffInHours === 0) return "Now";
    if (diffInHours < 24) return `In ${diffInHours}h`;
    return `In ${Math.round(diffInHours / 24)}d`;
  };

  const getStatusColor = (reminder: Reminder): "destructive" | "secondary" | "outline" => {
    const now = new Date();
    const reminderTime = parseISO(reminder.reminder_date);
    
    if (reminderTime < now) return "destructive";
    if (reminderTime.getTime() - now.getTime() < 60 * 60 * 1000) return "outline"; // Within 1 hour
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Pill className="w-5 h-5" />
              <span>Medication Reminders</span>
            </CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Medication Reminder</DialogTitle>
                </DialogHeader>
                <MedicationForm onSubmit={createReminder} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reminders.length > 0 ? (
            <div className="space-y-4">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      getStatusColor(reminder) === 'destructive' ? 'bg-destructive' :
                      getStatusColor(reminder) === 'outline' ? 'bg-accent' :
                      'bg-secondary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold">{reminder.title}</h4>
                        <Badge variant={getStatusColor(reminder)}>
                          {getTimeUntilReminder(reminder.reminder_date)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{reminder.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{format(parseISO(reminder.reminder_date), 'h:mm a')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span className="capitalize">{reminder.frequency}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={reminder.is_active}
                      onCheckedChange={(checked) => toggleReminderActive(reminder.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Pill className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Medication Reminders</h3>
              <p className="text-muted-foreground mb-4">
                Set up reminders to never miss your medications
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Reminder
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface MedicationFormProps {
  onSubmit: (form: MedicationForm) => void;
}

const MedicationForm = ({ onSubmit }: MedicationFormProps) => {
  const [form, setForm] = useState<MedicationForm>({
    title: "",
    dosage: "",
    frequency: "daily",
    time: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dosage || !form.time) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Medication Name *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Vitamin D"
          required
        />
      </div>

      <div>
        <Label htmlFor="dosage">Dosage *</Label>
        <Input
          id="dosage"
          value={form.dosage}
          onChange={(e) => setForm(prev => ({ ...prev, dosage: e.target.value }))}
          placeholder="e.g., 1000 IU, 2 tablets"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frequency">Frequency</Label>
          <Select value={form.frequency} onValueChange={(value) => setForm(prev => ({ ...prev, frequency: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="as-needed">As Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={form.time}
            onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={form.notes}
          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="e.g., Take with food"
        />
      </div>

      <Button type="submit" className="w-full">
        Create Reminder
      </Button>
    </form>
  );
};