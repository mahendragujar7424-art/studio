
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
  TrendingUp
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
  const [suggestion, setSuggestion] = React.useState('');
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

  const handlePostSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim() || !taskId || !user?.uid || !firestore) return;

    const colRef = collection(firestore, 'tasks', taskId as string, 'comments');
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      userName: profile?.name || 'User',
      taskId: taskId,
      message: suggestion,
      timestamp: new Date().toISOString()
    });

    setSuggestion('');
    toast({ title: "Feedback Sent", description: "Your message has been logged." });
  };

  const updateStatus = (newStatus: string) => {
    if (!taskRef) return;
    updateDocumentNonBlocking(taskRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Status Updated", description: `Task marked as ${newStatus}` });
  };

  const handleProgressChange = (value: number[]) => {
    const newVal = value[0];
    setLocalProgress(newVal);
  };

  const saveProgress = () => {
    if (!taskRef) return;
    updateDocumentNonBlocking(taskRef, {
      progress: localProgress,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Progress Saved", description: `Task is now ${localProgress}% complete.` });
  };

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-96 bg-white rounded-3xl" /></DashboardLayout>;
  if (!task) return <DashboardLayout>Task not found.</DashboardLayout>;

  const canEdit = profile?.role === ROLES.ADMIN || profile?.role === ROLES.DEVELOPER;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-2 font-bold uppercase text-[9px]">
                      {task.priority} Priority
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[9px]">
                      {task.status}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold font-headline">{task.title}</h1>
                </div>
              </div>
              
              <div className="mb-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold uppercase tracking-wider text-primary">
                  <span>Project Progress</span>
                  <span>{task.progress || 0}%</span>
                </div>
                <Progress value={task.progress || 0} className="h-3" />
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">{task.description}</p>
              
              <div className="mt-8 pt-8 border-t flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Created {task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : 'N/A'}</div>
                <div className="flex items-center gap-2"><Info className="h-4 w-4" /> Status: {task.status}</div>
              </div>
            </Card>

            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-secondary/20 rounded-2xl p-1">
                <TabsTrigger value="suggestions" className="rounded-xl font-bold gap-2">
                  <MessageSquare className="h-4 w-4" /> Activity & Suggestions
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl font-bold gap-2">
                  <History className="h-4 w-4" /> Project Log
                </TabsTrigger>
              </TabsList>
              <TabsContent value="suggestions" className="pt-6 space-y-6">
                <form onSubmit={handlePostSuggestion} className="space-y-4">
                  <Textarea 
                    placeholder="Share feedback or request changes..." 
                    value={suggestion}
                    onChange={e => setSuggestion(e.target.value)}
                    className="min-h-[120px] rounded-2xl border-2"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" className="rounded-xl font-bold gap-2">
                      <Send className="h-4 w-4" /> {profile?.role === ROLES.CLIENT ? 'Send Suggestion' : 'Post Update'}
                    </Button>
                  </div>
                </form>

                <div className="space-y-6">
                  {comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-6 rounded-3xl bg-white shadow-sm">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">
                          {comment.userName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase text-muted-foreground">{comment.userName}</span>
                          <span className="text-[10px] text-muted-foreground">{comment.timestamp ? format(new Date(comment.timestamp), 'MMM dd, HH:mm') : ''}</span>
                        </div>
                        <p className="text-sm">{comment.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="history">
                <Card className="border-none shadow-sm bg-white rounded-3xl p-8 text-center text-muted-foreground italic">
                  Complete project history will appear here as updates occur.
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            {canEdit && (
              <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Progress Control
                </h3>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-bold">
                      <span>Completion Percentage</span>
                      <span className="text-primary">{localProgress}%</span>
                    </div>
                    <Slider 
                      value={[localProgress]} 
                      onValueChange={handleProgressChange}
                      max={100} 
                      step={5} 
                    />
                  </div>
                  <Button onClick={saveProgress} className="w-full rounded-xl font-bold">
                    Save Progress Status
                  </Button>
                </div>
              </Card>
            )}

            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-6">Workflow Status</h3>
              <div className="space-y-4">
                {canEdit ? (
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant={task.status === 'Pending' ? "default" : "outline"}
                      className="rounded-xl h-12 justify-start gap-3 font-bold"
                      onClick={() => updateStatus('Pending')}
                    >
                      <CircleAlert className="h-4 w-4" /> Pending
                    </Button>
                    <Button 
                      variant={task.status === 'In Progress' ? "default" : "outline"}
                      className="rounded-xl h-12 justify-start gap-3 font-bold"
                      onClick={() => updateStatus('In Progress')}
                    >
                      <Clock className="h-4 w-4" /> In Progress
                    </Button>
                    <Button 
                      variant={task.status === 'Completed' ? "default" : "outline"}
                      className="rounded-xl h-12 justify-start gap-3 font-bold"
                      onClick={() => updateStatus('Completed')}
                    >
                      <CircleCheck className="h-4 w-4" /> Completed
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-secondary/10 text-sm font-bold text-center">
                      Current Status: <span className="text-primary uppercase">{task.status}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs text-center text-muted-foreground">
                      Use the "Activity & Suggestions" tab to request changes or provide feedback to your assigned developer.
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
