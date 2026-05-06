
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
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  History,
  Info
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [suggestion, setSuggestion] = React.useState('');

  const taskRef = useMemoFirebase(() => {
    if (!firestore || !taskId) return null;
    return doc(firestore, 'tasks', taskId as string);
  }, [firestore, taskId]);

  const { data: task, isLoading } = useDoc(taskRef);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !taskId) return null;
    return query(
      collection(firestore, 'tasks', taskId as string, 'comments'),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, taskId]);

  const { data: comments } = useCollection(commentsQuery);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const handlePostSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim() || !taskId || !user?.uid || !firestore) return;

    const colRef = collection(firestore, 'tasks', taskId as string, 'comments');
    addDocumentNonBlocking(colRef, {
      userId: user.uid,
      taskId: taskId,
      message: suggestion,
      timestamp: new Date().toISOString()
    });

    setSuggestion('');
    toast({ title: "Suggestion Posted", description: "The developer has been updated." });
  };

  const updateStatus = (newStatus: string) => {
    if (!taskRef) return;
    updateDocumentNonBlocking(taskRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Status Updated", description: `Task is now ${newStatus}` });
  };

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-96 bg-white rounded-3xl" /></DashboardLayout>;
  if (!task) return <DashboardLayout>Task not found.</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Workspace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Task Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[9px]">
                      {task.priority} Priority
                    </Badge>
                    <Badge variant="outline" className="border-2 font-bold uppercase text-[9px]">
                      {task.status}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold font-headline">{task.title}</h1>
                </div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {task.description}
              </p>
              
              <div className="mt-8 pt-8 border-t flex flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Created {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Info className="h-4 w-4" /> Last Updated {format(new Date(task.updatedAt), 'MMM dd, HH:mm')}
                </div>
              </div>
            </Card>

            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-secondary/20 rounded-2xl p-1">
                <TabsTrigger value="suggestions" className="rounded-xl font-bold gap-2">
                  <MessageSquare className="h-4 w-4" /> Suggestions & History
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl font-bold gap-2">
                  <History className="h-4 w-4" /> Full Log
                </TabsTrigger>
              </TabsList>
              <TabsContent value="suggestions" className="pt-6 space-y-6">
                {/* Suggestion Form */}
                <form onSubmit={handlePostSuggestion} className="space-y-4">
                  <Textarea 
                    placeholder="Add a suggestion or request a modification..." 
                    value={suggestion}
                    onChange={e => setSuggestion(e.target.value)}
                    className="min-h-[120px] rounded-2xl bg-white border-2 border-transparent focus:border-primary/50 transition-all p-4 shadow-sm"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" className="rounded-xl px-8 h-12 font-bold gap-2">
                      <Send className="h-4 w-4" /> Submit Update
                    </Button>
                  </div>
                </form>

                {/* Comment List */}
                <div className="space-y-6">
                  {comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-6 rounded-3xl bg-white shadow-sm group">
                      <Avatar className="h-10 w-10 border-2 border-primary/10 shrink-0">
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">
                          {comment.userId === user?.uid ? 'Me' : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {comment.userId === user?.uid ? 'Your Update' : 'Collaborator'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(comment.timestamp), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{comment.message}</p>
                      </div>
                    </div>
                  ))}
                  {(!comments || comments.length === 0) && (
                    <div className="text-center py-10 text-muted-foreground italic">
                      No suggestions or comments yet.
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="activity">
                <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
                  <p className="text-sm text-muted-foreground">Detailed activity logging is enabled for this project.</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <h3 className="text-lg font-bold font-headline mb-6">Task Control</h3>
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Change Status</p>
                {profile?.role !== ROLES.CLIENT ? (
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant={task.status === TASK_STATUS.PENDING ? "default" : "outline"}
                      className="rounded-xl h-12 justify-start gap-3 px-4 font-bold"
                      onClick={() => updateStatus(TASK_STATUS.PENDING)}
                    >
                      <AlertCircle className="h-4 w-4" /> Pending
                    </Button>
                    <Button 
                      variant={task.status === TASK_STATUS.IN_PROGRESS ? "default" : "outline"}
                      className="rounded-xl h-12 justify-start gap-3 px-4 font-bold"
                      onClick={() => updateStatus(TASK_STATUS.IN_PROGRESS)}
                    >
                      <Clock className="h-4 w-4" /> In Progress
                    </Button>
                    <Button 
                      variant={task.status === TASK_STATUS.COMPLETED ? "default" : "outline"}
                      className="rounded-xl h-12 justify-start gap-3 px-4 font-bold"
                      onClick={() => updateStatus(TASK_STATUS.COMPLETED)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Completed
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-secondary/10 text-sm font-bold text-center">
                    Current: <span className="text-primary">{task.status}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl p-8">
              <h3 className="text-lg font-bold font-headline mb-4">Assigned To</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">D</div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Developer</p>
                    <p className="text-sm font-bold">Workspace Member</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold">C</div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Client</p>
                    <p className="text-sm font-bold">Assigned Stakeholder</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
