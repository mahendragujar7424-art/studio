
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, doc } from 'firebase/firestore';
import { ROLES, TASK_STATUS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { History, Send, Sparkles, User as UserIcon, Clock, Briefcase, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WorkUpdatesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // Fetch projects assigned to the developer for the dropdown
  const myTasksQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profile?.role !== ROLES.DEVELOPER) return null;
    return query(
      collection(firestore, 'tasks'),
      where('assignedDeveloperId', '==', user.uid),
      where('status', '!=', TASK_STATUS.ARCHIVED)
    );
  }, [firestore, user?.uid, profile?.role]);

  const { data: myTasks } = useCollection(myTasksQuery);

  // Fetch updates based on role
  // We gate this query heavily to ensure it only fires when role is strictly determined
  const updatesQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.role || !user?.uid) return null;
    
    const updatesRef = collection(firestore, 'work_updates');
    
    // For administrators, we fetch the global log
    if (profile.role === ROLES.ADMIN) {
      return query(updatesRef, orderBy('timestamp', 'desc'));
    }
    
    // For clients, filter by their ownership - MUST match security rule filters
    if (profile.role === ROLES.CLIENT) {
      return query(updatesRef, where('clientId', '==', user.uid), orderBy('timestamp', 'desc'));
    }

    // For developers, filter by their contributions - MUST match security rule filters
    if (profile.role === ROLES.DEVELOPER) {
      return query(updatesRef, where('developerId', '==', user.uid), orderBy('timestamp', 'desc'));
    }

    return null;
  }, [firestore, profile?.role, user?.uid]);

  const { data: updates, isLoading: isUpdatesLoading } = useCollection(updatesQuery);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !description.trim() || !firestore || !user?.uid || !profile) return;

    setIsSubmitting(true);
    const task = myTasks?.find(t => t.id === selectedTask);

    try {
      await addDoc(collection(firestore, 'work_updates'), {
        projectId: selectedTask,
        projectTitle: task?.title || 'Unknown Project',
        developerId: user.uid,
        developerName: profile.name,
        clientId: task?.assignedClientId || '',
        description: description,
        timestamp: new Date().toISOString()
      });

      setDescription('');
      setSelectedTask('');
      toast({ title: "Work Update Posted", description: "Your progress has been logged." });
    } catch (error: any) {
      toast({ title: "Submission Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeveloper = profile?.role === ROLES.DEVELOPER;

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
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">Work Progress</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {isDeveloper ? "Log your daily technical achievements." : "Real-time visibility into developer milestones."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {isDeveloper && (
            <Card className="lg:col-span-1 border-none shadow-sm bg-white rounded-[2.5rem] p-8 h-fit lg:sticky lg:top-24">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-bold font-headline flex items-center gap-2 text-primary">
                  <Send className="h-5 w-5" /> Post Progress
                </CardTitle>
                <CardDescription>Select a project and describe your work.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitUpdate} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Project</Label>
                  <Select value={selectedTask} onValueChange={setSelectedTask}>
                    <SelectTrigger className="h-12 rounded-xl border-2">
                      <SelectValue placeholder="Choose Task" />
                    </SelectTrigger>
                    <SelectContent>
                      {myTasks?.map(task => (
                        <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Work Description</Label>
                  <Textarea 
                    placeholder="Completed the API integration..." 
                    className="min-h-[120px] rounded-xl border-2 bg-secondary/10"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isSubmitting || !selectedTask}>
                  {isSubmitting ? "Posting..." : "Log Update"}
                </Button>
              </form>
            </Card>
          )}

          <div className={cn("space-y-6", isDeveloper ? "lg:col-span-2" : "lg:col-span-3")}>
            <div className="flex items-center gap-3 mb-4">
              <History className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold font-headline">Project Timeline</h2>
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
      </div>
    </DashboardLayout>
  );
}
