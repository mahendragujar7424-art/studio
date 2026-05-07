
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROLES, TASK_STATUS } from '@/lib/constants';
import { 
  CheckCircle, 
  Clock, 
  CircleAlert,
  TrendingUp,
  Activity,
  ArrowUpRight,
  MessageSquare,
  User as UserIcon,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  // Fetch all developers to resolve names on dashboard - gated by profile presence
  const devsQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return query(collection(firestore, 'users'), where('role', '==', ROLES.DEVELOPER));
  }, [firestore, profile]);
  const { data: developers } = useCollection(devsQuery);

  // Fetch all teams to resolve team assignments - gated by profile presence
  const teamsQuery = useMemoFirebase(() => {
    if (!firestore || !profile) return null;
    return collection(firestore, 'teams');
  }, [firestore, profile]);
  const { data: teams } = useCollection(teamsQuery);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !profile || !user?.uid) return null;
    const tasksRef = collection(firestore, 'tasks');
    
    if (profile.role === ROLES.ADMIN) return query(tasksRef, where('status', '!=', TASK_STATUS.ARCHIVED));
    if (profile.role === ROLES.DEVELOPER) return query(tasksRef, where('assignedDeveloperId', '==', user.uid), where('status', '!=', TASK_STATUS.ARCHIVED));
    if (profile.role === ROLES.CLIENT) return query(tasksRef, where('assignedClientId', '==', user.uid), where('status', '!=', TASK_STATUS.ARCHIVED));
    return null;
  }, [firestore, profile, user?.uid]);

  const { data: myTasks } = useCollection(tasksQuery);

  const completedCount = myTasks?.filter(t => t.status === TASK_STATUS.COMPLETED).length || 0;
  const inProgressCount = myTasks?.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length || 0;
  const reviewCount = myTasks?.filter(t => t.status === TASK_STATUS.UNDER_REVIEW).length || 0;
  const totalCount = myTasks?.length || 0;
  
  const activeTasks = myTasks?.filter(t => t.status !== TASK_STATUS.COMPLETED && t.status !== TASK_STATUS.ARCHIVED) || [];
  const avgProgress = activeTasks.length > 0 
    ? Math.round(activeTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / activeTasks.length) 
    : 0;

  const overallCompletionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">
              {profile?.role === ROLES.CLIENT ? 'Project Delivery Hub' : 'Workspace Overview'}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {profile?.role === ROLES.CLIENT 
                ? `Real-time visibility into your active projects, ${profile?.name}.`
                : `Welcome back, ${profile?.name || 'User'}. Here's the live project health.`}
            </p>
          </div>
          {profile?.role === ROLES.CLIENT && (
            <Badge variant="outline" className="h-10 px-6 rounded-full border-2 font-bold gap-2 text-primary bg-primary/5 uppercase tracking-wider text-[10px]">
              <Sparkles className="h-4 w-4" /> Live Tracking Enabled
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-none font-bold text-[9px]">FINALIZED</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
                <p className="text-3xl font-bold font-headline">{completedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Activity className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold text-[9px]">ACTIVE</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">In Progress</p>
                <p className="text-3xl font-bold font-headline">{inProgressCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                  <Clock className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-none font-bold text-[9px]">REVIEW</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pending Review</p>
                <p className="text-3xl font-bold font-headline">{reviewCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-purple-600/50 uppercase">Momentum</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Live Completion</p>
                <p className="text-3xl font-bold font-headline">{avgProgress}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold font-headline">Live Project Feed</CardTitle>
                  <CardDescription>
                    {profile?.role === ROLES.CLIENT 
                      ? 'Status of technical features currently in development.'
                      : 'Real-time status of your active deliveries.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-6">
                {myTasks?.slice(0, 5).map((task) => {
                  const dev = developers?.find(d => d.id === task.assignedDeveloperId);
                  const team = teams?.find(t => t.id === task.assignedTeamId);
                  
                  return (
                    <Link href={`/dashboard/tasks/${task.id}`} key={task.id} className="block group">
                      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-secondary/30 border border-transparent hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm",
                              task.status === TASK_STATUS.COMPLETED ? "bg-green-500" : task.status === TASK_STATUS.UNDER_REVIEW ? "bg-orange-500" : "bg-blue-500"
                            )}>
                              {task.title.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{task.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {task.assignedTeamId ? (
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" /> {team?.name || 'Production Team'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <UserIcon className="h-3 w-3" /> {dev?.name || 'Lead Developer'} 
                                    {dev?.designation && ` • ${dev.designation}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase border-2 hidden sm:inline-flex bg-white">
                            {task.status}
                          </Badge>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Progress</span>
                             <span className="text-[10px] font-bold text-primary">{task.progress || 0}%</span>
                          </div>
                          <Progress value={task.progress || 0} className="h-1.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {(!myTasks || myTasks.length === 0) && (
                  <div className="text-center py-10 text-muted-foreground italic bg-secondary/10 rounded-2xl border-2 border-dashed">
                    No active projects at this time.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold font-headline">Collaboration Hub</CardTitle>
              <CardDescription>Instant access to task logs.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3 text-primary mb-3">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-bold text-sm">Direct Feedback</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profile?.role === ROLES.CLIENT 
                    ? "As a stakeholder, you can leave suggestions on any task. Your developer will be notified instantly via the Project Workspace."
                    : "Clients see your updates in real-time. Use the task log to clarify requirements and post milestones."}
                </p>
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Total Delivery Progress</span>
                  <span className="text-primary">{overallCompletionRate}%</span>
                </div>
                <Progress value={overallCompletionRate} className="h-2" />
              </div>
              <Button asChild className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 text-lg transition-all hover:scale-[1.02]">
                <Link href="/dashboard/tasks">Enter Project Workspace</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
