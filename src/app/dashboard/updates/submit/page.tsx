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
import { Send, Loader2, ShieldAlert, Sparkles } from 'lucide-react';

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

  // Fetch only projects assigned to this specific developer
  const myTasksQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profile?.role !== ROLES.DEVELOPER) return null;
    return query(
      collection(firestore, 'tasks'),
      where('assignedDeveloperId', '==', user.uid),
      where('status', '!=', TASK_STATUS.ARCHIVED)
    );
  }, [firestore, user?.uid, profile?.role]);

  const { data: myTasks, isLoading: isTasksLoading } = useCollection(myTasksQuery);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !description.trim() || !firestore || !user?.uid || !profile) return;

    setIsSubmitting(true);
    const task = myTasks?.find(t => t.id === selectedTask);

    try {
      // Validate that the developer is actually assigned (Extra UI safety)
      if (!task || task.assignedDeveloperId !== user.uid) {
        throw new Error("You are not authorized to submit reports for this project.");
      }

      // Create the work update document with full context for role-based visibility
      await addDoc(collection(firestore, 'work_updates'), {
        projectId: selectedTask,
        projectTitle: task?.title || 'Unknown Project',
        developerId: user.uid,
        developerName: profile.name,
        clientId: task?.assignedClientId || '', // CRITICAL: Allows clients to see this update
        description: description,
        timestamp: new Date().toISOString()
      });

      setDescription('');
      setSelectedTask('');
      toast({ 
        title: "Report Sent to Admin", 
        description: "Your technical progress has been synchronized with the project timeline." 
      });
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
          <h1 className="text-2xl font-bold font-headline">Access Restricted</h1>
          <p className="text-muted-foreground">Only technical staff can broadcast project reports.</p>
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
            Log technical milestones for stakeholder visibility and project health tracking.
          </p>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-[2.5rem] p-6 md:p-10">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl font-bold font-headline flex items-center gap-3 text-primary">
              <Sparkles className="h-6 w-6" /> Milestone Log
            </CardTitle>
            <CardDescription>Select your assigned project and describe the technical achievement.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitUpdate} className="space-y-8 pt-4">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Your Active Assignments</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger className="h-14 rounded-2xl border-2 focus:ring-primary/20 bg-secondary/10">
                  <SelectValue placeholder={isTasksLoading ? "Loading tasks..." : "Choose Assigned Project"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {myTasks?.map(task => (
                    <SelectItem key={task.id} value={task.id} className="py-3 focus:bg-primary/5">{task.title}</SelectItem>
                  ))}
                  {(!myTasks || myTasks.length === 0) && !isTasksLoading && (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">No projects currently assigned to you.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Report Description</Label>
              <Textarea 
                placeholder="Detail the technical achievement (e.g., 'Implemented JWT refresh logic' or 'Refactored navigation state')." 
                className="min-h-[200px] rounded-2xl border-2 bg-secondary/10 focus:bg-white transition-all text-base p-6 leading-relaxed"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-auto min-h-16 py-4 px-4 rounded-2xl font-bold text-sm sm:text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform text-center" disabled={isSubmitting || !selectedTask}>
              {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Syncing Report...</> : <><Send className="h-5 w-5 mr-2" /> Broadcast Milestone Report</>}
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
