
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
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
  Sparkles,
  History
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';

/**
 * Component to resolve and display developer name/info without listing the collection.
 */
function LeadDeveloperInfo({ developerId }: { developerId: string }) {
  const firestore = useFirestore();
  const devRef = useMemoFirebase(() => {
    if (!firestore || !developerId) return null;
    return doc(firestore, 'users', developerId);
  }, [firestore, developerId]);

  const { data: dev } = useDoc(devRef);

  if (!developerId) return (
    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
      <UserIcon className="h-3 w-3" /> Unassigned
    </span>
  );

  return (
    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
      <UserIcon className="h-3 w-3" /> {dev?.name || 'Loading...'} 
      {dev?.designation && ` • ${dev.designation}`}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  // DYNAMIC TASK STREAM
  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !profile || !user?.uid) return null;
    const tasksRef = collection(firestore, 'tasks');
    
    if (profile.role === ROLES.ADMIN) return tasksRef;
    if (profile.role === ROLES.DEVELOPER) return query(tasksRef, where('assignedDeveloperId', '==', user.uid));
    if (profile.role === ROLES.CLIENT) return query(tasksRef, where('assignedClientId', '==', user.uid));
    return null;
  }, [firestore, profile, user?.uid]);

  const { data: rawTasks, isLoading: isTasksLoading } = useCollection(tasksQuery);

  // DYNAMIC UPDATES FEED (Limited for Dashboard)
  const updatesQuery = useMemoFirebase(() => {
    if (!firestore || !profile || !user?.uid) return null;
    const updatesRef = collection(firestore, 'work_updates');
    
    if (profile.role === ROLES.ADMIN) {
      return query(updatesRef, orderBy('timestamp', 'desc'), limit(3));
    }
    if (profile.role === ROLES.CLIENT) {
      return query(updatesRef, where('clientId', '==', user.uid), orderBy('timestamp', 'desc'), limit(3));
    }
    if (profile.role === ROLES.DEVELOPER) {
      return query(updatesRef, where('developerId', '==', user.uid), orderBy('timestamp', 'desc'), limit(3));
    }
    return null;
  }, [firestore, profile, user?.uid]);

  const { data: recentUpdates } = useCollection(updatesQuery);
  const { data: teams } = useCollection(useMemoFirebase(() => firestore ? collection(firestore, 'teams') : null, [firestore]));

  // --- Dynamic Metric Calculations ---
  const activeTasks = React.useMemo(() => {
    return rawTasks?.filter(t => t.status !== TASK_STATUS.ARCHIVED) || [];
  }, [rawTasks]);

  const totalCount = activeTasks.length;
  const completedCount = activeTasks.filter(t => t.status === TASK_STATUS.COMPLETED || t.isApproved).length;
  const inProgressCount = activeTasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length;
  const reviewCount = activeTasks.filter(t => t.status === TASK_STATUS.UNDER_REVIEW).length;
  
  const avgProgress = totalCount > 0 
    ? Math.round(activeTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / totalCount) 
    : 0;

  const overallCompletionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">
              {profile?.role === ROLES.CLIENT ? 'Delivery Hub' : 'Workspace Overview'}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {profile?.role === ROLES.CLIENT 
                ? `Real-time visibility into project health, ${profile?.name}.`
                : `Welcome back, ${profile?.name || 'User'}. System synchronized.`}
            </p>
          </div>
          <Badge variant="outline" className="h-10 px-6 rounded-full border-2 font-bold gap-2 text-primary bg-primary/5 uppercase tracking-wider text-[10px]">
            <Sparkles className="h-4 w-4" /> Real-time Tracking
          </Badge>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-none font-bold text-[9px]">FINALIZED</Badge>
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
              <p className="text-3xl font-bold font-headline mt-1">{isTasksLoading ? '...' : completedCount}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Activity className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-bold text-[9px]">ACTIVE</Badge>
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">In Progress</p>
              <p className="text-3xl font-bold font-headline mt-1">{isTasksLoading ? '...' : inProgressCount}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <Clock className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-none font-bold text-[9px]">REVIEW</Badge>
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pending Review</p>
              <p className="text-3xl font-bold font-headline mt-1">{isTasksLoading ? '...' : reviewCount}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-purple-600/50 uppercase">Momentum</span>
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Live Completion</p>
              <p className="text-3xl font-bold font-headline mt-1">{isTasksLoading ? '...' : avgProgress}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold font-headline">Live Project Feed</CardTitle>
              <CardDescription>Status of technical features currently in active development.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-6">
                {activeTasks.slice(0, 5).map((task) => {
                  const team = teams?.find(t => t.id === task.assignedTeamId);
                  return (
                    <Link href={`/dashboard/tasks/${task.id}`} key={task.id} className="block group">
                      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-secondary/30 border border-transparent hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm",
                              task.isApproved || task.status === TASK_STATUS.COMPLETED ? "bg-green-500" : task.status === TASK_STATUS.UNDER_REVIEW ? "bg-orange-500" : "bg-blue-500"
                            )}>
                              {task.title.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{task.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {task.assignedTeamId ? (
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" /> {team?.name || 'Production Unit'}
                                  </span>
                                ) : (
                                  <LeadDeveloperInfo developerId={task.assignedDeveloperId} />
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase border-2 hidden sm:inline-flex bg-white shadow-sm">
                            {task.isApproved ? "Signed Off" : task.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <Progress value={task.progress || 0} className="h-1.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {activeTasks.length === 0 && !isTasksLoading && (
                  <div className="text-center py-10 text-muted-foreground italic bg-secondary/10 rounded-2xl border-2 border-dashed">
                    No active assignments in this workspace.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> Recent Milestones
                </CardTitle>
                <CardDescription>Latest technical broadcast updates.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {recentUpdates?.map((upd) => (
                  <div key={upd.id} className="p-4 rounded-xl bg-secondary/10 space-y-2 border-l-4 border-primary/20">
                    <p className="text-xs font-bold truncate">{upd.projectTitle}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 italic">"{upd.description}"</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] font-bold uppercase text-primary/60">{upd.developerName}</span>
                      <span className="text-[9px] font-bold text-muted-foreground">{format(new Date(upd.timestamp), 'HH:mm')}</span>
                    </div>
                  </div>
                ))}
                {(!recentUpdates || recentUpdates.length === 0) && (
                  <p className="text-center text-xs text-muted-foreground italic py-4">No recent milestones logged.</p>
                )}
                <Button asChild variant="ghost" className="w-full rounded-xl font-bold h-12 text-xs">
                  <Link href="/dashboard/updates">View Full Timeline <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-3 text-primary mb-3">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-bold text-sm">Collaboration Hub</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Stakeholders see technical achievements in real-time. Use the task log to provide precision feedback on delivery.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Total Progress</span>
                    <span className="text-primary">{overallCompletionRate}%</span>
                  </div>
                  <Progress value={overallCompletionRate} className="h-2" />
                </div>
                <Button asChild className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20">
                  <Link href="/dashboard/tasks">Project Workspace</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
