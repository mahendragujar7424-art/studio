
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [name, setName] = React.useState('');

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  React.useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  const handleUpdate = () => {
    if (!userRef) return;
    updateDocumentNonBlocking(userRef, {
      name: name,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Profile Updated", description: "Your changes have been saved." });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your identity and workspace credentials.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-1 border-none shadow-sm bg-white rounded-3xl overflow-hidden text-center p-8">
            <div className="relative inline-block mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 font-bold text-[10px] uppercase">
                {profile?.role}
              </Badge>
            </div>
            <h2 className="text-xl font-bold font-headline">{profile?.name}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </Card>

          <Card className="md:col-span-2 border-none shadow-sm bg-white rounded-3xl p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-bold font-headline">Account Details</CardTitle>
              <CardDescription>Update your personal information below.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="pl-12 h-12 rounded-xl border-2" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={profile?.email || ''} disabled className="pl-12 h-12 rounded-xl border-2 bg-secondary/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-secondary/10 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Role</p>
                    <p className="text-sm font-bold">{profile?.role}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-secondary/10 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Joined</p>
                    <p className="text-sm font-bold">
                      {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleUpdate} className="w-full h-12 rounded-xl font-bold text-lg">
                Save Profile Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
