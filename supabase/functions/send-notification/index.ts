import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  subject: string;
  message: string;
  type: 'period' | 'ovulation' | 'medication' | 'wellness' | 'test';
  userId?: string;
}

const getEmailTemplate = (type: string, message: string) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'period': return '🩸';
      case 'ovulation': return '💕';
      case 'medication': return '💊';
      case 'wellness': return '🌿';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'period': return '#ef4444';
      case 'ovulation': return '#ec4899';
      case 'medication': return '#3b82f6';
      case 'wellness': return '#10b981';
      default: return '#6366f1';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wellness Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${getTypeColor(type)}, ${getTypeColor(type)}dd); padding: 30px 20px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">${getTypeIcon(type)}</div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Wellness Reminder</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 20px;">
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${getTypeColor(type)};">
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0;">
              ${message}
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="#" style="display: inline-block; background-color: ${getTypeColor(type)}; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Open App
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            This notification was sent from your Wellness App. 
            <a href="#" style="color: ${getTypeColor(type)};">Manage notifications</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { to, subject, message, type, userId }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${to}`);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Wellness App <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: getEmailTemplate(type, message),
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the notification in the database if userId is provided
    if (userId) {
      const { error: logError } = await supabase
        .from('reminders')
        .update({ is_sent: true })
        .eq('user_id', userId)
        .eq('reminder_type', type);

      if (logError) {
        console.error("Error updating reminder status:", logError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);