
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { ROLES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { History, User as UserIcon, Clock, Briefcase, Loader2, Info, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function WorkUpdatesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const updatesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.role || !user?.uid) return null;
    
    const updatesRef = collection(firestore, 'work_updates');
    
    // ROLE-BASED VISIBILITY LOGIC
    if (profile.role === ROLES.ADMIN) {
      // Admins see a global synchronized feed
      return query(updatesRef, orderBy('timestamp', 'desc'));
    }
    
    if (profile.role === ROLES.CLIENT) {
      // Clients see updates mapped specifically to their projects via clientId
      return query(updatesRef, where('clientId', '==', user.uid), orderBy('timestamp', 'desc'));
    }

    if (profile.role === ROLES.DEVELOPER) {
      // Developers see their personal contribution history
      return query(updatesRef, where('developerId', '==', user.uid), orderBy('timestamp', 'desc'));
    }

    return null;
  }, [firestore, profile?.role, user?.uid]);

  const { data: updates, isLoading: isUpdatesLoading } = useCollection(updatesQuery);

  if (isProfileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-gradient">Project Timeline</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Synchronized chronological audit of technical milestones and delivery achievements.
            </p>
          </div>
        </div>

        <Alert className="bg-primary/5 border-primary/20 rounded-[2rem] p-6 shadow-sm">
          <Sparkles className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-bold mb-1 uppercase tracking-widest text-[10px]">Ecosystem Awareness</AlertTitle>
          <AlertDescription className="text-muted-foreground text-sm">
            {profile?.role === ROLES.ADMIN 
              ? "Global Monitoring Active: You are viewing all technical logs across the entire organizational roster." 
              : profile?.role === ROLES.CLIENT 
              ? "Project Transparency Active: This feed displays real-time milestones posted by developers assigned to your features."
              : "Contribution Log: This timeline tracks your broadcasted updates to stakeholders and management."}
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <History className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold font-headline">Activity Stream</h2>
          </div>
          
          <div className="space-y-6 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-1 before:bg-primary/10 before:rounded-full">
            {updates?.map((update) => (
              <div key={update.id} className="relative pl-16 group">
                <div className="absolute left-[26px] top-6 h-5 w-5 rounded-full bg-white border-4 border-primary group-hover:scale-125 transition-all shadow-sm z-10" />
                <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {update.developerName?.charAt(0) || <UserIcon className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight">{update.developerName}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Briefcase className="h-3 w-3 text-primary/50" /> {update.projectTitle}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary/70 uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                        <Clock className="h-3 w-3" />
                        {update.timestamp ? format(new Date(update.timestamp), 'MMM dd, HH:mm') : 'N/A'}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-secondary/20 border-l-4 border-primary/40 italic text-foreground/80 leading-relaxed text-sm md:text-base shadow-inner">
                      {update.description}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {isUpdatesLoading && [1, 2, 3].map(i => (
              <div key={i} className="pl-16 h-40 rounded-3xl bg-white/50 animate-pulse border-none mb-6" />
            ))}

            {(!updates || updates.length === 0) && !isUpdatesLoading && (
              <div className="pl-16 py-20 text-center text-muted-foreground italic bg-white/50 rounded-3xl border-2 border-dashed">
                <History className="h-8 w-8 mx-auto mb-4 opacity-20" />
                <p>No technical milestones recorded in this stream yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
