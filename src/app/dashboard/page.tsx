
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ROLES, TASK_STATUS } from '@/lib/constants';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  // Stats Queries
  const allTasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'tasks');
  }, [firestore]);

  const { data: allTasks } = useCollection(allTasksQuery);

  const myTasksQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile) return null;
    const tasksRef = collection(firestore, 'tasks');
    if (profile.role === ROLES.ADMIN) return tasksRef;
    if (profile.role === ROLES.DEVELOPER) return query(tasksRef, where('assignedDeveloperId', '==', user.uid));
    if (profile.role === ROLES.CLIENT) return query(tasksRef, where('assignedClientId', '==', user.uid));
    return null;
  }, [firestore, user?.uid, profile]);

  const { data: myTasks } = useCollection(myTasksQuery);

  const completedCount = myTasks?.filter(t => t.status === TASK_STATUS.COMPLETED).length || 0;
  const inProgressCount = myTasks?.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length || 0;
  const pendingCount = myTasks?.filter(t => t.status === TASK_STATUS.PENDING).length || 0;
  const totalCount = myTasks?.length || 0;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2 text-lg">Welcome back, {profile?.name}. Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-none font-bold">+12%</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Completed Tasks</p>
                <p className="text-3xl font-bold font-headline">{completedCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Clock className="h-6 w-6" />
                </div>
                <Activity className="h-5 w-5 text-blue-200" />
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
                  <AlertCircle className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 text-orange-200" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Pending Tasks</p>
                <p className="text-3xl font-bold font-headline">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-purple-600/50 uppercase">Active Now</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Project Health</p>
                <p className="text-3xl font-bold font-headline">{completionRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tasks */}
          <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold font-headline">Ongoing Assignments</CardTitle>
                  <CardDescription>Track the latest updates on your projects.</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-none font-bold">LIVE</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-6">
                {myTasks?.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-transparent hover:border-primary/20 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white",
                        task.status === TASK_STATUS.COMPLETED ? "bg-green-500" : task.status === TASK_STATUS.IN_PROGRESS ? "bg-blue-500" : "bg-orange-500"
                      )}>
                        {task.title.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm group-hover:text-primary transition-colors">{task.title}</p>
                        <p className="text-xs text-muted-foreground">Due {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No due date'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider border-2">
                      {task.status}
                    </Badge>
                  </div>
                ))}
                {(!myTasks || myTasks.length === 0) && (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground italic">No tasks assigned yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Card */}
          <Card className="border-none shadow-sm bg-white rounded-3xl">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-bold font-headline">Task Distribution</CardTitle>
              <CardDescription>Visual breakdown of current workflow.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Completed</span>
                  <span className="text-green-600">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2 bg-secondary" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Velocity</span>
                  <span className="text-blue-600">Stable</span>
                </div>
                <div className="grid grid-cols-7 gap-1 h-12">
                  {[40, 60, 45, 80, 55, 70, 90].map((v, i) => (
                    <div key={i} className="bg-blue-100 rounded-sm self-end hover:bg-blue-500 transition-colors" style={{ height: `${v}%` }} />
                  ))}
                </div>
              </div>
              <div className="pt-4 space-y-4">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-sm font-bold text-primary">Pro Tip</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Focus on 'In Progress' tasks to maintain high project momentum this week.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
