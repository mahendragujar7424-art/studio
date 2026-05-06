
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Moon, 
  Lock, 
  Globe, 
  Smartphone,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Configure your workspace preferences and security.</p>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Notifications
              </CardTitle>
              <CardDescription>Manage how you receive task updates and suggestions.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10">
                <div className="space-y-1">
                  <p className="font-bold text-sm">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when a status changes.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/10">
                <div className="space-y-1">
                  <p className="font-bold text-sm">Task Comments</p>
                  <p className="text-xs text-muted-foreground">Alert when a client leaves a suggestion.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Security
              </CardTitle>
              <CardDescription>Protect your access and control permissions.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {[
                { icon: ShieldCheck, label: "Two-Factor Authentication", desc: "Add extra security" },
                { icon: Smartphone, label: "Login Activity", desc: "View active sessions" },
                { icon: Globe, label: "API Keys", desc: "Manage integration tokens" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary/5 cursor-pointer group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
