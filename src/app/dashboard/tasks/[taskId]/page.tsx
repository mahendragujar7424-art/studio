
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, orderBy, query } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { ROLES, TASK_STATUS } from '@/lib/constants';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Clock, 
  CircleCheck, 
  CircleAlert,
  History,
  Info,
  TrendingUp,
  User as UserIcon
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [message, setMessage] = React.useState('');
  const [localProgress, setLocalProgress] = React.useState<number>(0);

  const taskRef = useMemoFirebase(() => {
    if (!firestore || !taskId || !user) return null;
    return doc(firestore, 'tasks', taskId as string);
  }, [firestore, taskId, user]);

  const { data: task, isLoading } = useDoc(taskRef);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !taskId || !user) return null;
    return query(
      collection(firestore, 'tasks', taskId as string, 'comments'),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, taskId, user]);

  const { data: comments } = useCollection(commentsQuery);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  React.useEffect(() => {
    if (task?.progress !== undefined) {
      setLocalProgress(task.progress);
    }
  }, [task?.progress]);

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !taskId || !user?.uid || !firestore) return;

    const colRef = collection(firestore, 'tasks', taskId as string, 'comments');
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      userName: profile?.name || 'User',
      taskId: taskId,
      message: message,
      role: profile?.role,
      timestamp: new Date().toISOString()
    });

    setMessage('');
    toast({ 
      title: profile?.role === ROLES.CLIENT ? "Suggestion Sent" : "Update Posted", 
      description: "Your message has been added to the task log." 
    });
  };

  const updateStatus = (newStatus: string) => {
    if (!taskRef) return;
    updateDocumentNonBlocking(taskRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Status Updated", description: `Task is now ${newStatus}` });
  };

  const handleProgressChange = (value: number[]) => {
    setLocalProgress(value[0]);
  };

  const saveProgress = () => {
    if (!taskRef) return;
    updateDocumentNonBlocking(taskRef, {
      progress: localProgress,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Progress Saved", description: `Project completion: ${localProgress}%` });
  };

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-96 bg-white rounded-3xl" /></DashboardLayout>;
  if (!task) return <DashboardLayout>Task not found.</DashboardLayout>;

  // Only the assigned developer (or admin) can update progress
  const isAssignedDeveloper = profile?.role === ROLES.DEVELOPER && task.assignedDeveloperId === user?.uid;
  const canUpdateProgress = profile?.role === ROLES.ADMIN || isAssignedDeveloper;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full gap-2 hover:bg-white">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-2 font-bold uppercase text-[9px] px-3 py-1">
                      {task.priority} Priority
                    </Badge>
                    <Badge className={cn(
                      "border-none font-bold uppercase text-[9px] px-3 py-1",
                      task.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                    )}>
                      {task.status}
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold font-headline leading-tight">{task.title}</h1>
                </div>
              </div>
              
              <div className="mb-8 p-8 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-primary">
                  <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Live Completion</span>
                  <span>{task.progress || 0}%</span>
                </div>
                <Progress value={task.progress || 0} className="h-4 rounded-full" />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Project Brief</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{task.description}</p>
              </div>
              
              <div className="mt-10 pt-8 border-t flex flex-wrap gap-8 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Launched: {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : 'N/A'}</div>
                <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" /> Creator ID: {task.createdById?.substring(0, 8)}...</div>
              </div>
            </Card>

            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-16 bg-secondary/20 rounded-[1.5rem] p-1.5">
                <TabsTrigger value="suggestions" className="rounded-2xl font-bold gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" /> {profile?.role === ROLES.CLIENT ? 'Request Changes' : 'Client Suggestions'}
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-2xl font-bold gap-2 text-sm">
                  <History className="h-4 w-4" /> Audit Log
                </TabsTrigger>
              </TabsList>
              <TabsContent value="suggestions" className="pt-8 space-y-8">
                <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
                  <form onSubmit={handlePostMessage} className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">
                      {profile?.role === ROLES.CLIENT ? 'Submit Suggestion to Developer' : 'Reply to Client'}
                    </Label>
                    <Textarea 
                      placeholder={profile?.role === ROLES.CLIENT ? "Describe the changes you'd like to see..." : "Post a project update or reply to feedback..."} 
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="min-h-[140px] rounded-2xl border-2 focus:border-primary/50 transition-all text-base"
                    />
                    <div className="flex justify-end">
                      <Button type="submit" className="h-12 rounded-xl px-8 font-bold gap-3 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                        <Send className="h-4 w-4" /> {profile?.role === ROLES.CLIENT ? 'Send Suggestion' : 'Post Update'}
                      </Button>
                    </div>
                  </form>
                </Card>

                <div className="space-y-6">
                  {comments?.map((c) => (
                    <div key={c.id} className={cn(
                      "flex gap-5 p-8 rounded-[2rem] border-2 transition-all",
                      c.role === ROLES.CLIENT ? "bg-white border-primary/10" : "bg-secondary/10 border-transparent"
                    )}>
                      <Avatar className="h-12 w-12 shrink-0 border-2 border-white shadow-sm">
                        <AvatarFallback className={cn(
                          "font-bold text-white",
                          c.role === ROLES.CLIENT ? "bg-primary" : "bg-green-500"
                        )}>
                          {c.userName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm tracking-tight">{c.userName}</span>
                            <Badge variant="outline" className="text-[8px] uppercase font-bold tracking-widest px-2 py-0 border-muted-foreground/30">
                              {c.role}
                            </Badge>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            {c.timestamp ? format(new Date(c.timestamp), 'MMM dd, HH:mm') : ''}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{c.message}</p>
                      </div>
                    </div>
                  ))}
                  {(!comments || comments.length === 0) && (
                    <div className="text-center py-12 text-muted-foreground italic bg-white rounded-[2rem] border-2 border-dashed">
                      No feedback or updates shared yet.
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="history">
                <Card className="border-none shadow-sm bg-white rounded-[2rem] p-12 text-center text-muted-foreground italic">
                  Complete project timeline and status history is generated automatically as updates are saved.
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-8">
            {canUpdateProgress && (
              <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-3 text-primary">
                  <TrendingUp className="h-5 w-5" /> Developer Controls
                </h3>
                <div className="space-y-10">
                  <div className="space-y-5">
                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Work Progress</span>
                      <span className="text-primary">{localProgress}%</span>
                    </div>
                    <Slider 
                      value={[localProgress]} 
                      onValueChange={handleProgressChange}
                      max={100} 
                      step={1}
                      className="py-4"
                    />
                  </div>
                  <Button 
                    onClick={saveProgress} 
                    className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Save Progress Status
                  </Button>
                </div>
              </Card>
            )}

            <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-muted-foreground">Workflow Execution</h3>
              <div className="space-y-3">
                {canUpdateProgress ? (
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      variant={task.status === 'Pending' ? "default" : "outline"}
                      className={cn(
                        "rounded-xl h-14 justify-start gap-4 font-bold transition-all border-2",
                        task.status === 'Pending' ? "bg-orange-500 hover:bg-orange-600 border-transparent text-white" : "hover:bg-orange-50 border-orange-100 text-orange-600"
                      )}
                      onClick={() => updateStatus('Pending')}
                    >
                      <CircleAlert className="h-5 w-5" /> Pending Assignment
                    </Button>
                    <Button 
                      variant={task.status === 'In Progress' ? "default" : "outline"}
                      className={cn(
                        "rounded-xl h-14 justify-start gap-4 font-bold transition-all border-2",
                        task.status === 'In Progress' ? "bg-blue-500 hover:bg-blue-600 border-transparent text-white" : "hover:bg-blue-50 border-blue-100 text-blue-600"
                      )}
                      onClick={() => updateStatus('In Progress')}
                    >
                      <Clock className="h-5 w-5" /> Working In Progress
                    </Button>
                    <Button 
                      variant={task.status === 'Completed' ? "default" : "outline"}
                      className={cn(
                        "rounded-xl h-14 justify-start gap-4 font-bold transition-all border-2",
                        task.status === 'Completed' ? "bg-green-500 hover:bg-green-600 border-transparent text-white" : "hover:bg-green-50 border-green-100 text-green-600"
                      )}
                      onClick={() => updateStatus('Completed')}
                    >
                      <CircleCheck className="h-5 w-5" /> Mark as Completed
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-secondary/10 flex flex-col items-center gap-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Task State</p>
                      <Badge className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm uppercase">
                        {task.status}
                      </Badge>
                    </div>
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                      <p className="text-xs font-bold text-primary flex items-center gap-2">
                        <Info className="h-4 w-4" /> Client Portal Note
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        "As a client, your feedback directly alerts the developer. Use the message tool to provide details for modifications."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
