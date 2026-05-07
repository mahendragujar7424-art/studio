
'use client';

import * as React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, addDoc } from 'firebase/firestore';
import { ROLES, TASK_STATUS, TASK_PRIORITY } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User as UserIcon,
  TriangleAlert,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Users
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

function TasksContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialStatusFilter = searchParams.get('status') || 'all';

  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>(initialStatusFilter);
  const [isTasksLoading, setIsTasksLoading] = React.useState(true);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const [newTitle, setNewTitle] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');
  const [newPriority, setNewPriority] = React.useState<string>(TASK_PRIORITY.MEDIUM);
  const [newAssignmentType, setNewAssignmentType] = React.useState<'individual' | 'team'>('individual');
  const [newDeveloper, setNewDeveloper] = React.useState('');
  const [newTeam, setNewTeam] = React.useState('');
  const [newClient, setNewClient] = React.useState('');
  const [newDueDate, setNewDueDate] = React.useState('');

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const developersQuery = useMemoFirebase(() => {
    // Only fetch developer list if user is an Admin
    if (!firestore || profile?.role !== ROLES.ADMIN) return null;
    return query(collection(firestore, 'users'), where('role', '==', ROLES.DEVELOPER));
  }, [firestore, profile?.role]);

  const clientsQuery = useMemoFirebase(() => {
    // Only fetch client list if user is an Admin
    if (!firestore || profile?.role !== ROLES.ADMIN) return null;
    return query(collection(firestore, 'users'), where('role', '==', ROLES.CLIENT));
  }, [firestore, profile?.role]);

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return null;
    return collection(firestore, 'teams');
  }, [firestore, profile?.role]);

  const { data: developers } = useCollection(developersQuery);
  const { data: clients } = useCollection(clientsQuery);
  const { data: teams } = useCollection(teamsQuery);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !profile || !user?.uid) return null;
    const tasksRef = collection(firestore, 'tasks');
    
    // Admins see everything, clients/devs are filtered by rules but we query for all non-archived for UX
    if (profile.role === ROLES.ADMIN) return tasksRef;
    return query(tasksRef, where('status', '!=', 'ARCHIVED'));
  }, [firestore, profile, user?.uid]);

  const { data: tasks, isLoading: isTasksFetching } = useCollection(tasksQuery);

  React.useEffect(() => {
    if (!isTasksFetching && !isProfileLoading) setIsTasksLoading(false);
  }, [isTasksFetching, isProfileLoading]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user?.uid) return;

    try {
      await addDoc(collection(firestore, 'tasks'), {
        title: newTitle,
        description: newDesc,
        status: TASK_STATUS.PENDING,
        progress: 0,
        priority: newPriority,
        assignedDeveloperId: newAssignmentType === 'individual' ? newDeveloper : null,
        assignedTeamId: newAssignmentType === 'team' ? newTeam : null,
        assignedClientId: newClient,
        createdById: user.uid,
        dueDate: newDueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setIsCreateOpen(false);
      resetTaskForm();
      toast({ title: "Task Initialized", description: "Project assignment successful." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetTaskForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewDeveloper('');
    setNewTeam('');
    setNewClient('');
    setNewDueDate('');
  };

  const filteredTasks = tasks?.filter(t => {
    if (!profile) return false;

    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? t.status !== TASK_STATUS.ARCHIVED : t.status === filterStatus;
    
    if (profile.role === ROLES.DEVELOPER) {
      const isIndivAssign = t.assignedDeveloperId && t.assignedDeveloperId === user?.uid;
      const isTeamAssign = t.assignedTeamId && t.assignedTeamId === profile.teamId;
      if (!isIndivAssign && !isTeamAssign) return false;
    }

    if (profile.role === ROLES.CLIENT) {
      if (t.assignedClientId !== user?.uid) return false;
    }

    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case TASK_PRIORITY.HIGH: return "text-red-600 bg-red-50 border-red-200";
      case TASK_PRIORITY.MEDIUM: return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Workspace Tasks</h1>
          <p className="text-muted-foreground mt-2 text-lg">Central hub for tracking delivery milestones and team assignments.</p>
        </div>
        {profile?.role === ROLES.ADMIN && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20">
                <Plus className="h-5 w-5" /> New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Initialize Project Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Project Title</Label>
                  <Input placeholder="Website Redesign / App Launch" value={newTitle} onChange={e => setNewTitle(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Requirements Brief</Label>
                  <textarea 
                    placeholder="Provide clear technical requirements..." 
                    className="w-full h-32 rounded-xl bg-secondary/20 p-4 border-2 border-transparent focus:border-primary/50 outline-none"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Priority Level</Label>
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TASK_PRIORITY.LOW}>Low</SelectItem>
                        <SelectItem value={TASK_PRIORITY.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={TASK_PRIORITY.HIGH}>High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Assignment Model</Label>
                    <Select value={newAssignmentType} onValueChange={(v: any) => setNewAssignmentType(v)}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual Developer</SelectItem>
                        <SelectItem value="team">Organizational Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">{newAssignmentType === 'individual' ? 'Developer' : 'Production Team'}</Label>
                    {newAssignmentType === 'individual' ? (
                      <Select value={newDeveloper} onValueChange={setNewDeveloper}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Dev" /></SelectTrigger>
                        <SelectContent>
                          {developers?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={newTeam} onValueChange={setNewTeam}>
                        <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Team" /></SelectTrigger>
                        <SelectContent>
                          {teams?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Stakeholder (Client)</Label>
                    <Select value={newClient} onValueChange={setNewClient}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Assign Client" /></SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Target Delivery Date</Label>
                  <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} required className="h-12 rounded-xl" />
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold">Confirm & Assign</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48 h-14 rounded-2xl border-none bg-white shadow-sm">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Active Deliveries</SelectItem>
            <SelectItem value={TASK_STATUS.PENDING}>Pending</SelectItem>
            <SelectItem value={TASK_STATUS.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TASK_STATUS.COMPLETED}>Completed</SelectItem>
            <SelectItem value={TASK_STATUS.ARCHIVED}>Archives</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredTasks?.map((task) => (
          <Card key={task.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-xl transition-all">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("rounded-full px-3 py-1 font-bold text-[9px] uppercase border", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold text-[9px] uppercase">
                      {task.status}
                    </Badge>
                    {task.assignedTeamId && (
                      <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[9px] uppercase bg-primary/5 text-primary border-primary/20">
                        Team Assignment
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{task.title}</CardTitle>
                </div>
                <Link href={`/dashboard/tasks/${task.id}`}>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">{task.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Live Progress</span>
                  <span>{task.progress || 0}%</span>
                </div>
                <Progress value={task.progress || 0} className="h-2" />
              </div>

              <div className="flex items-center justify-between py-4 border-y border-dashed">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
                  {task.assignedTeamId ? <Users className="h-3.5 w-3.5 text-primary" /> : <UserIcon className="h-3.5 w-3.5 text-primary" />}
                  {profile?.role === ROLES.ADMIN ? (
                    task.assignedTeamId ? 
                    (teams?.find(t => t.id === task.assignedTeamId)?.name || 'Team') : 
                    (developers?.find(d => d.id === task.assignedDeveloperId)?.name || 'N/A')
                  ) : 'Assigned'}
                </div>
              </div>
              <Button asChild variant="ghost" className="w-full rounded-xl font-bold hover:bg-primary/5">
                <Link href={`/dashboard/tasks/${task.id}`}>
                  {task.status === TASK_STATUS.ARCHIVED ? 'Review Records' : 'Open Workspace'} <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {isTasksLoading && [1, 2].map(i => <div key={i} className="h-64 rounded-3xl bg-white animate-pulse" />)}
        {(!filteredTasks || filteredTasks.length === 0) && !isTasksLoading && (
          <div className="lg:col-span-2 py-20 text-center space-y-4">
            <TriangleAlert className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-bold">Workspace is currently clear.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <DashboardLayout>
      <React.Suspense fallback={<div className="animate-pulse h-96 bg-white rounded-3xl" />}>
        <TasksContent />
      </React.Suspense>
    </DashboardLayout>
  );
}
