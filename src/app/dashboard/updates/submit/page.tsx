
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc } from 'firebase/firestore';
import { ROLES, TASK_STATUS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, ShieldAlert, ClipboardCheck } from 'lucide-react';

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

  const rawTasksQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profile?.role !== ROLES.DEVELOPER) return null;
    return query(
      collection(firestore, 'tasks'),
      where('status', '!=', TASK_STATUS.ARCHIVED)
    );
  }, [firestore, user?.uid, profile?.role]);

  const { data: rawTasks, isLoading: isTasksLoading } = useCollection(rawTasksQuery);

  const myTasks = React.useMemo(() => {
    if (!rawTasks || !profile || !user?.uid) return [];
    
    return rawTasks.filter(t => {
      const isIndivAssign = t.assignedDeveloperId === user.uid;
      const isTeamAssign = t.assignedTeamId && t.assignedTeamId === profile.teamId;
      return isIndivAssign || isTeamAssign;
    });
  }, [rawTasks, profile, user?.uid]);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !description.trim() || !firestore || !user?.uid || !profile) return;

    setIsSubmitting(true);
    const task = myTasks?.find(t => t.id === selectedTask);

    try {
      if (!task) throw new Error("Selected project not found.");

      await addDoc(collection(firestore, 'work_updates'), {
        projectId: selectedTask,
        projectTitle: task.title,
        developerId: user.uid,
        developerName: profile.name,
        clientId: task.assignedClientId,
        description: description,
        timestamp: new Date().toISOString()
      });

      setDescription('');
      setSelectedTask('');
      toast({ 
        title: "Report Submitted Successfully", 
        description: "Your technical progress has been broadcast to the workspace." 
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
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== ROLES.DEVELOPER) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive/50" />
        <h1 className="text-2xl font-bold font-headline">Access Restricted</h1>
        <p className="text-muted-foreground">Only technical staff can broadcast project reports.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Submit Project Report</h1>
        <p className="text-muted-foreground text-lg">
          Log technical milestones to keep stakeholders updated on project progress.
        </p>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] p-6 md:p-10">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold font-headline flex items-center gap-3 text-primary">
            <ClipboardCheck className="h-6 w-6" /> Progress Log
          </CardTitle>
          <CardDescription>Choose an active project and describe your achievements.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitUpdate} className="space-y-8 pt-4">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Active Assignment</Label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger className="h-14 rounded-2xl border-2 focus:ring-primary/20 bg-secondary/10">
                <SelectValue placeholder={isTasksLoading ? "Synchronizing assignments..." : "Choose Assigned Project"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                {myTasks?.map(task => (
                  <SelectItem key={task.id} value={task.id} className="py-3 focus:bg-primary/5">
                    {task.title}
                  </SelectItem>
                ))}
                {(!myTasks || myTasks.length === 0) && !isTasksLoading && (
                  <div className="p-4 text-center text-xs text-muted-foreground italic bg-secondary/5 rounded-lg m-2">
                    No active projects assigned to your roster.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Daily Progress / Report</Label>
            <Textarea 
              placeholder="What technical milestones did you achieve today?" 
              className="min-h-[200px] rounded-2xl border-2 bg-secondary/10 focus:bg-white transition-all text-base p-6 leading-relaxed"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform" 
            disabled={isSubmitting || !selectedTask}
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Submitting...</>
            ) : (
              <><Send className="h-5 w-5 mr-2" /> Broadcast Project Report</>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
