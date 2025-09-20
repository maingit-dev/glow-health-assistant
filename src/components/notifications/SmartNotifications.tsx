import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Heart, Pill, Droplets } from "lucide-react";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

interface NotificationSettings {
  period_reminders: boolean;
  ovulation_reminders: boolean;
  medication_reminders: boolean;
  wellness_tips: boolean;
  email_notifications: boolean;
}

interface Reminder {
  id: string;
  title: string;
  message: string;
  reminder_type: string;
  reminder_date: string;
  frequency: string;
  is_active: boolean;
  is_sent: boolean;
}

export const SmartNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    period_reminders: true,
    ovulation_reminders: true,
    medication_reminders: true,
    wellness_tips: true,
    email_notifications: true,
  });
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
    fetchReminders();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      toast.error("Failed to load reminders");
    }
  };

  const updateSettings = async (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'period_reminders' && value && profile?.last_period_start && profile?.cycle_length) {
      await createPeriodReminders();
    }
  };

  const createPeriodReminders = async () => {
    if (!user || !profile?.last_period_start || !profile?.cycle_length) return;

    try {
      const lastPeriodDate = new Date(profile.last_period_start);
      const nextPeriodDate = addDays(lastPeriodDate, profile.cycle_length);
      const ovulationDate = addDays(lastPeriodDate, Math.floor(profile.cycle_length / 2));
      
      const remindersToCreate = [
        {
          title: "Period Expected Soon",
          message: "Your period is expected to start in 2 days. You might want to prepare!",
          reminder_type: "period",
          reminder_date: addDays(nextPeriodDate, -2).toISOString(),
          frequency: "monthly",
          user_id: user.id,
          is_active: true
        },
        {
          title: "Ovulation Window",
          message: "You're approaching your ovulation window. This is your most fertile time.",
          reminder_type: "ovulation",
          reminder_date: addDays(ovulationDate, -1).toISOString(),
          frequency: "monthly",
          user_id: user.id,
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('reminders')
        .upsert(remindersToCreate);

      if (error) throw error;
      
      fetchReminders();
      toast.success("Period reminders set up successfully!");
    } catch (error) {
      toast.error("Failed to create period reminders");
    }
  };

  const sendTestNotification = async () => {
    if (!user) return;

    try {
      const response = await supabase.functions.invoke('send-notification', {
        body: {
          to: user.email,
          subject: "Test Notification",
          message: "This is a test notification from your wellness app!",
          type: "test"
        }
      });

      if (response.error) throw response.error;
      toast.success("Test notification sent!");
    } catch (error) {
      toast.error("Failed to send test notification");
    }
  };

  const toggleReminder = async (reminderId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active: !isActive })
        .eq('id', reminderId);

      if (error) throw error;
      fetchReminders();
      toast.success(`Reminder ${!isActive ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error("Failed to update reminder");
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'period':
        return <Droplets className="h-4 w-4 text-red-500" />;
      case 'ovulation':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'medication':
        return <Pill className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getReminderBadgeVariant = (type: string) => {
    switch (type) {
      case 'period':
        return 'destructive';
      case 'ovulation':
        return 'secondary';
      case 'medication':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Smart Notifications</h1>
        <Button onClick={sendTestNotification} variant="outline" size="sm">
          Send Test Email
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="period-reminders" className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-red-500" />
                Period Reminders
              </Label>
              <Switch
                id="period-reminders"
                checked={settings.period_reminders}
                onCheckedChange={(checked) => updateSettings('period_reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ovulation-reminders" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                Ovulation Alerts
              </Label>
              <Switch
                id="ovulation-reminders"
                checked={settings.ovulation_reminders}
                onCheckedChange={(checked) => updateSettings('ovulation_reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="medication-reminders" className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-500" />
                Medication Reminders
              </Label>
              <Switch
                id="medication-reminders"
                checked={settings.medication_reminders}
                onCheckedChange={(checked) => updateSettings('medication_reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="wellness-tips" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                Wellness Tips
              </Label>
              <Switch
                id="wellness-tips"
                checked={settings.wellness_tips}
                onCheckedChange={(checked) => updateSettings('wellness_tips', checked)}
              />
            </div>

            <div className="flex items-center justify-between md:col-span-2">
              <Label htmlFor="email-notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Email Notifications
              </Label>
              <Switch
                id="email-notifications"
                checked={settings.email_notifications}
                onCheckedChange={(checked) => updateSettings('email_notifications', checked)}
              />
            </div>
          </div>

          {profile?.last_period_start && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Cycle Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Last Period:</span>
                  <p className="font-medium">{format(new Date(profile.last_period_start), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cycle Length:</span>
                  <p className="font-medium">{profile.cycle_length} days</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {reminders.length > 0 ? (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getReminderIcon(reminder.reminder_type)}
                    <div>
                      <p className="font-medium">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">{reminder.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getReminderBadgeVariant(reminder.reminder_type)} className="text-xs">
                          {reminder.reminder_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(reminder.reminder_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={reminder.is_active}
                    onCheckedChange={() => toggleReminder(reminder.id, reminder.is_active)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Active Reminders</h3>
              <p className="text-muted-foreground mb-4">
                Enable period reminders above to get personalized alerts based on your cycle.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};