
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { ROLES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { History, User as UserIcon, Clock, Briefcase, Loader2 } from 'lucide-react';

export default function WorkUpdatesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // Fetch updates based on role
  const updatesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.role || !user?.uid) return null;
    
    const updatesRef = collection(firestore, 'work_updates');
    
    if (profile.role === ROLES.ADMIN) {
      return query(updatesRef, orderBy('timestamp', 'desc'));
    }
    
    if (profile.role === ROLES.CLIENT) {
      return query(updatesRef, where('clientId', '==', user.uid), orderBy('timestamp', 'desc'));
    }

    if (profile.role === ROLES.DEVELOPER) {
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
            <h1 className="text-4xl font-bold font-headline tracking-tight">Project Timeline</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Chronological audit of technical achievements and milestones.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <History className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold font-headline">Activity Feed</h2>
          </div>
          
          <div className="space-y-6 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-1 before:bg-secondary/50 before:rounded-full">
            {updates?.map((update) => (
              <div key={update.id} className="relative pl-16 group">
                <div className="absolute left-6 top-6 h-5 w-5 rounded-full bg-white border-4 border-primary group-hover:scale-125 transition-all shadow-sm z-10" />
                <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight">{update.developerName}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <Briefcase className="h-3 w-3" /> {update.projectTitle}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-primary/50 uppercase tracking-widest">
                        <Clock className="h-3 w-3" />
                        {update.timestamp ? format(new Date(update.timestamp), 'MMM dd, HH:mm') : 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/20 border-l-4 border-primary/30 italic text-muted-foreground leading-relaxed">
                      {update.description}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {isUpdatesLoading && [1, 2].map(i => (
              <div key={i} className="pl-16 h-40 rounded-3xl bg-white/50 animate-pulse border-none mb-6" />
            ))}

            {(!updates || updates.length === 0) && !isUpdatesLoading && (
              <div className="pl-16 py-10 text-center text-muted-foreground italic">
                No activity logs recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
