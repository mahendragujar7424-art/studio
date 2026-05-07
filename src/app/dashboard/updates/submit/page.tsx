
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc } from 'firebase/firestore';
import { ROLES, TASK_STATUS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, ShieldAlert } from 'lucide-react';

export default function SubmitUpdatePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // Fetch projects assigned to the developer
  const myTasksQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profile?.role !== ROLES.DEVELOPER) return null;
    return query(
      collection(firestore, 'tasks'),
      where('assignedDeveloperId', '==', user.uid),
      where('status', '!=', TASK_STATUS.ARCHIVED)
    );
  }, [firestore, user?.uid, profile?.role]);

  const { data: myTasks } = useCollection(myTasksQuery);

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
      router.push('/dashboard/updates');
    } catch (error: any) {
      toast({ title: "Submission Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProfileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (profile?.role !== ROLES.DEVELOPER) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive/50" />
          <h1 className="text-2xl font-bold font-headline">Developer Access Only</h1>
          <p className="text-muted-foreground">Only technical staff can post progress updates.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Submit Progress</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Log your latest technical milestones for stakeholder visibility.
          </p>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-[2.5rem] p-6 md:p-10">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-bold font-headline flex items-center gap-3 text-primary">
              <Send className="h-6 w-6" /> Daily Log
            </CardTitle>
            <CardDescription>Select a project and describe your contribution.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitUpdate} className="space-y-8 pt-4">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Active Project Assignment</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger className="h-14 rounded-2xl border-2 focus:ring-primary/20">
                  <SelectValue placeholder="Choose Task" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {myTasks?.map(task => (
                    <SelectItem key={task.id} value={task.id} className="py-3 focus:bg-primary/5">{task.title}</SelectItem>
                  ))}
                  {(!myTasks || myTasks.length === 0) && (
                    <div className="p-4 text-center text-xs text-muted-foreground">No active assignments.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Work Description</Label>
              <Textarea 
                placeholder="Briefly explain what was achieved (e.g., 'Implemented Auth state listeners' or 'Fixed hydration mismatches in Navbar')." 
                className="min-h-[200px] rounded-2xl border-2 bg-secondary/10 focus:bg-white transition-all text-base p-6 leading-relaxed"
                value={description}
                onChange={description => setDescription(description.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-auto min-h-16 py-4 px-4 rounded-2xl font-bold text-sm sm:text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform text-center" disabled={isSubmitting || !selectedTask}>
              {isSubmitting ? "Syncing Log..." : "Broadcast Update"}
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
