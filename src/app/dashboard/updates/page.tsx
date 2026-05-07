'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { ROLES } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { History, User as UserIcon, Clock, Briefcase, Loader2, Sparkles, Search, FilterX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function WorkUpdatesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [search, setSearch] = React.useState('');

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

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

  const filteredUpdates = updates?.filter(u => 
    u.projectTitle?.toLowerCase().includes(search.toLowerCase()) || 
    u.developerName?.toLowerCase().includes(search.toLowerCase()) ||
    u.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = profile?.role === ROLES.ADMIN;

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
            <h1 className="text-4xl font-bold font-headline tracking-tight text-gradient">
              {isAdmin ? 'Developer Reports' : 'Activity Log'}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {isAdmin 
                ? 'Comprehensive technical audit of all organizational updates.' 
                : 'Synchronized chronological timeline of project milestones.'}
            </p>
          </div>
        </div>

        <Alert className="bg-primary/5 border-primary/20 rounded-[2rem] p-6 shadow-sm">
          <Sparkles className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary font-bold mb-1 uppercase tracking-widest text-[10px]">
            {isAdmin ? 'Administrative Insight' : 'Real-time Visibility'}
          </AlertTitle>
          <AlertDescription className="text-muted-foreground text-sm">
            {isAdmin 
              ? "Monitoring submissions from all technical staff across the workspace." 
              : profile?.role === ROLES.CLIENT 
              ? "Viewing updates from developers currently assigned to your projects."
              : "Reviewing your history of technical milestones sent to stakeholders."}
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={isAdmin ? "Search by developer or project title..." : "Search project updates..."} 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm"
              />
            </div>
            {search && (
              <Button variant="ghost" onClick={() => setSearch('')} className="rounded-xl h-14 px-6 font-bold gap-2">
                <FilterX className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
          
          <div className="space-y-8 relative before:absolute before:left-8 before:top-2 before:bottom-2 before:w-1 before:bg-primary/10 before:rounded-full">
            {filteredUpdates?.map((update) => (
              <div key={update.id} className="relative pl-16 group">
                <div className="absolute left-[26px] top-6 h-5 w-5 rounded-full bg-white border-4 border-primary group-hover:scale-125 transition-all shadow-sm z-10" />
                <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
                          {update.developerName?.charAt(0) || <UserIcon className="h-6 w-6" />}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-lg tracking-tight">{update.developerName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
                              <Briefcase className="h-3 w-3 mr-1.5" /> {update.projectTitle}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-4 py-2 rounded-full">
                        <Clock className="h-3.5 w-3.5" />
                        {update.timestamp ? format(new Date(update.timestamp), 'MMM dd, HH:mm') : 'N/A'}
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-secondary/10 border-l-4 border-primary/40 text-foreground/80 leading-relaxed text-base shadow-inner italic">
                      "{update.description}"
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            
            {isUpdatesLoading && [1, 2].map(i => (
              <div key={i} className="pl-16 h-48 rounded-[2rem] bg-white/50 animate-pulse border-none mb-6" />
            ))}

            {(!filteredUpdates || filteredUpdates.length === 0) && !isUpdatesLoading && (
              <div className="pl-16 py-32 text-center text-muted-foreground italic bg-white/50 rounded-[2.5rem] border-2 border-dashed">
                <History className="h-12 w-12 mx-auto mb-6 opacity-10" />
                <p className="text-lg">No technical milestones match your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
