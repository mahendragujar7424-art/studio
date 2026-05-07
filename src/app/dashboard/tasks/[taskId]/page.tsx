
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
import { Label } from '@/components/ui/label';
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
  TrendingUp,
  User as UserIcon,
  Sparkles,
  Archive,
  ShieldCheck,
  Eye
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

  const { data: task, isLoading: isTaskLoading } = useDoc(taskRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // AUTH GUARD: Only attempt to fetch comments if we've verified the user is authorized.
  // This prevents Firestore Security Rule "permission denied" errors for unauthorized users.
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !taskId || !user || !task || !profile) return null;

    const isIndivAssign = task.assignedDeveloperId === user.uid;
    const isTeamAssign = task.assignedTeamId === profile.teamId;
    const isClientAssign = task.assignedClientId === user.uid;
    const isAdmin = profile.role === ROLES.ADMIN;

    if (!isAdmin && !isIndivAssign && !isTeamAssign && !isClientAssign) {
      return null;
    }

    return query(
      collection(firestore, 'tasks', taskId as string, 'comments'),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, taskId, user, task, profile]);

  const { data: comments } = useCollection(commentsQuery);

  // Fetch developer info if task exists
  const devRef = useMemoFirebase(() => {
    if (!firestore || !task?.assignedDeveloperId) return null;
    return doc(firestore, 'users', task.assignedDeveloperId);
  }, [firestore, task?.assignedDeveloperId]);

  const { data: developer } = useDoc(devRef);

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

  const handleSignOff = () => {
    if (!taskRef) return;
    updateDocumentNonBlocking(taskRef, {
      status: TASK_STATUS.COMPLETED,
      isApproved: true,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Project Signed Off", description: "You have successfully approved this project." });
  };

  const handleArchive = () => {
    if (!taskRef) return;
    updateDocumentNonBlocking(taskRef, {
      status: TASK_STATUS.ARCHIVED,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Task Archived", description: "Project has been moved to archives." });
    router.push('/dashboard/tasks');
  };

  if (isTaskLoading || isProfileLoading) return <DashboardLayout><div className="animate-pulse h-96 bg-white rounded-3xl" /></DashboardLayout>;
  if (!task) return <DashboardLayout>Task not found.</DashboardLayout>;

  const isAssignedDeveloper = profile?.role === ROLES.DEVELOPER && (task.assignedDeveloperId === user?.uid || task.assignedTeamId === profile.teamId);
  const isClient = profile?.role === ROLES.CLIENT && task.assignedClientId === user?.uid;
  const isAdmin = profile?.role === ROLES.ADMIN;
  const canUpdateProgress = isAssignedDeveloper;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-full gap-2 hover:bg-white">
          <ArrowLeft className="h-4 w-4" /> Back to Workspace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-10">
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-2 font-bold uppercase text-[9px] px-3 py-1">
                      {task.priority} Priority
                    </Badge>
                    <Badge className={cn(
                      "border-none font-bold uppercase text-[9px] px-3 py-1",
                      task.status === TASK_STATUS.COMPLETED ? "bg-green-100 text-green-700" : 
                      task.status === TASK_STATUS.UNDER_REVIEW ? "bg-orange-100 text-orange-700" :
                      task.status === TASK_STATUS.ARCHIVED ? "bg-slate-100 text-slate-700" :
                      "bg-primary/10 text-primary"
                    )}>
                      {task.status}
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold font-headline leading-tight tracking-tight">{task.title}</h1>
                </div>
                {isAdmin && task.status !== TASK_STATUS.ARCHIVED && (
                   <Button variant="outline" onClick={handleArchive} className="rounded-xl border-2 font-bold gap-2">
                     <Archive className="h-4 w-4" /> Archive Task
                   </Button>
                )}
              </div>
              
              <div className="mb-10 p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-primary">
                  <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Live Execution Health</span>
                  <span>{task.progress || 0}% Completion</span>
                </div>
                <Progress value={task.progress || 0} className="h-4 rounded-full" />
              </div>

              {isClient && task.status === TASK_STATUS.COMPLETED && !task.isApproved && (
                <div className="p-8 rounded-[2rem] bg-green-50 border-2 border-green-200 mb-10 flex flex-col items-center text-center gap-4">
                  <ShieldCheck className="h-12 w-12 text-green-600" />
                  <div>
                    <h3 className="text-xl font-bold text-green-900">Project Ready for Sign-off</h3>
                    <p className="text-green-700 mt-1 max-w-md">Your developer has finalized all requirements. Please provide your formal approval to conclude this project.</p>
                  </div>
                  <Button onClick={handleSignOff} className="bg-green-600 hover:bg-green-700 h-14 rounded-2xl px-12 font-bold shadow-xl shadow-green-200 transition-all hover:scale-105">
                    Approve & Sign-off Project
                  </Button>
                </div>
              )}

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Detailed Brief</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{task.description}</p>
              </div>
              
              <div className="mt-12 pt-8 border-t grid grid-cols-2 sm:grid-cols-4 gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <div className="space-y-1">
                  <p className="text-primary/50 flex items-center gap-2"><Clock className="h-3 w-3" /> Initialized</p>
                  <p className="text-foreground">{task.createdAt ? format(new Date(task.createdAt), 'MMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-primary/50 flex items-center gap-2"><UserIcon className="h-3 w-3" /> Lead Developer</p>
                  <p className="text-foreground truncate">{developer?.name || 'Assigned'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-primary/50 flex items-center gap-2"><Sparkles className="h-3 w-3" /> Specialty</p>
                  <p className="text-foreground">{developer?.designation || 'Specialist'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-primary/50 flex items-center justify-end gap-2"><CircleAlert className="h-3 w-3" /> Priority</p>
                  <Badge variant="outline" className="text-[8px] font-bold h-5 px-2">{task.priority}</Badge>
                </div>
              </div>
            </Card>

            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-16 bg-secondary/20 rounded-[1.5rem] p-1.5">
                <TabsTrigger value="suggestions" className="rounded-2xl font-bold gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" /> 
                  Collaboration Hub
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-2xl font-bold gap-2 text-sm">
                  <History className="h-4 w-4" /> Audit Log
                </TabsTrigger>
              </TabsList>
              <TabsContent value="suggestions" className="pt-8 space-y-8">
                {task.status !== TASK_STATUS.ARCHIVED && (
                  <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
                    <form onSubmit={handlePostMessage} className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-muted-foreground flex items-center gap-2">
                        {profile?.role === ROLES.CLIENT ? <Sparkles className="h-3 w-3 text-primary" /> : <MessageSquare className="h-3 w-3 text-primary" />}
                        {profile?.role === ROLES.CLIENT ? 'Send Suggestion to Developer' : 'Respond to Stakeholder'}
                      </Label>
                      <Textarea 
                        placeholder={profile?.role === ROLES.CLIENT ? "Clarify a requirement or request a tweak..." : "Provide an update or answer client feedback..."} 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        className="min-h-[140px] rounded-2xl border-2 focus:border-primary/50 transition-all text-base bg-secondary/10"
                      />
                      <div className="flex justify-end">
                        <Button type="submit" className="h-12 rounded-xl px-8 font-bold gap-3 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                          <Send className="h-4 w-4" /> Send Update
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                <div className="space-y-6">
                  {comments?.map((c) => (
                    <div key={c.id} className={cn(
                      "flex gap-5 p-8 rounded-[2.5rem] border-2 transition-all relative overflow-hidden",
                      c.role === ROLES.CLIENT ? "bg-white border-primary/20 shadow-xl shadow-primary/5" : "bg-secondary/10 border-transparent"
                    )}>
                      {c.role === ROLES.CLIENT && (
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary text-white text-[8px] font-bold uppercase tracking-widest rounded-bl-xl flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" /> Client Suggestion
                        </div>
                      )}
                      <Avatar className="h-14 w-14 shrink-0 border-4 border-white shadow-sm">
                        <AvatarFallback className={cn(
                          "font-bold text-white text-lg",
                          c.role === ROLES.CLIENT ? "bg-primary" : "bg-blue-600"
                        )}>
                          {c.userName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-base tracking-tight">{c.userName}</span>
                            <Badge variant="outline" className="text-[8px] uppercase font-bold tracking-widest px-2 py-0 border-muted-foreground/30 h-5">
                              {c.role}
                            </Badge>
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                            {c.timestamp ? format(new Date(c.timestamp), 'MMM dd, HH:mm') : ''}
                          </span>
                        </div>
                        <p className={cn(
                          "text-muted-foreground leading-relaxed text-base",
                          c.role === ROLES.CLIENT ? "font-medium text-foreground/90" : ""
                        )}>{c.message}</p>
                      </div>
                    </div>
                  ))}
                  {(!comments || comments.length === 0) && (
                    <div className="text-center py-16 text-muted-foreground italic bg-white/50 rounded-[2.5rem] border-2 border-dashed border-primary/20">
                      No collaboration logs recorded for this task.
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="history">
                <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-16 text-center text-muted-foreground italic flex flex-col items-center gap-4">
                  <div className="h-16 w-16 bg-secondary/50 rounded-3xl flex items-center justify-center text-secondary-foreground">
                    <History className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-50">Complete project audit log is being synchronized...</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-8">
            {canUpdateProgress && task.status !== TASK_STATUS.ARCHIVED ? (
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <h3 className="text-base font-bold mb-8 flex items-center gap-3 text-primary uppercase tracking-widest">
                  <TrendingUp className="h-5 w-5" /> Milestone Control
                </h3>
                <div className="space-y-10">
                  <div className="space-y-5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                      <span className="text-muted-foreground">Execution Progress</span>
                      <span className="text-primary">{localProgress}% Complete</span>
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
                    className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all bg-primary"
                  >
                    Save Progress
                  </Button>
                </div>
              </Card>
            ) : (
               <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                 <h3 className="text-base font-bold mb-8 flex items-center gap-3 text-muted-foreground uppercase tracking-widest">
                   <Clock className="h-5 w-5" /> Project Pulse
                 </h3>
                 <div className="space-y-4">
                   <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary">
                     <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">Active Phase</p>
                     <p className="font-bold text-primary text-lg">{task.status}</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary">
                     <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-widest">Current Completion</p>
                     <p className="font-bold text-primary text-lg">{task.progress}%</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                     <p className="text-xs text-muted-foreground italic leading-relaxed">
                       {task.status === TASK_STATUS.ARCHIVED 
                         ? "This project is now locked in archives." 
                         : "Progress reflect instantly as technical milestones are achieved by your lead developer."}
                     </p>
                   </div>
                 </div>
               </Card>
            )}

            {canUpdateProgress && task.status !== TASK_STATUS.ARCHIVED && (
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-8">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-8 text-muted-foreground">Status Transitions</h3>
                <div className="space-y-3">
                  <Button 
                    variant={task.status === TASK_STATUS.PENDING ? "default" : "outline"}
                    className={cn(
                      "w-full rounded-2xl h-14 justify-start gap-4 font-bold transition-all border-2",
                      task.status === TASK_STATUS.PENDING ? "bg-orange-500 hover:bg-orange-600 border-transparent text-white" : "hover:bg-orange-50 border-orange-100 text-orange-600"
                    )}
                    onClick={() => updateStatus(TASK_STATUS.PENDING)}
                  >
                    <CircleAlert className="h-5 w-5" /> Pending
                  </Button>
                  <Button 
                    variant={task.status === TASK_STATUS.IN_PROGRESS ? "default" : "outline"}
                    className={cn(
                      "w-full rounded-2xl h-14 justify-start gap-4 font-bold transition-all border-2",
                      task.status === TASK_STATUS.IN_PROGRESS ? "bg-blue-500 hover:bg-blue-600 border-transparent text-white" : "hover:bg-blue-50 border-blue-100 text-blue-600"
                    )}
                    onClick={() => updateStatus(TASK_STATUS.IN_PROGRESS)}
                  >
                    <Clock className="h-5 w-5" /> In Progress
                  </Button>
                  <Button 
                    variant={task.status === TASK_STATUS.UNDER_REVIEW ? "default" : "outline"}
                    className={cn(
                      "w-full rounded-2xl h-14 justify-start gap-4 font-bold transition-all border-2",
                      task.status === TASK_STATUS.UNDER_REVIEW ? "bg-purple-500 hover:bg-purple-600 border-transparent text-white" : "hover:bg-purple-50 border-purple-100 text-purple-600"
                    )}
                    onClick={() => updateStatus(TASK_STATUS.UNDER_REVIEW)}
                  >
                    <Eye className="h-5 w-5" /> Under Review
                  </Button>
                  <Button 
                    variant={task.status === TASK_STATUS.COMPLETED ? "default" : "outline"}
                    className={cn(
                      "w-full rounded-2xl h-14 justify-start gap-4 font-bold transition-all border-2",
                      task.status === TASK_STATUS.COMPLETED ? "bg-green-500 hover:bg-green-600 border-transparent text-white" : "hover:bg-green-50 border-green-100 text-green-600"
                    )}
                    onClick={() => updateStatus(TASK_STATUS.COMPLETED)}
                  >
                    <CircleCheck className="h-5 w-5" /> Completed
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
