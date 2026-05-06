
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, addDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { ROLES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Briefcase, 
  MoreVertical,
  UserPlus,
  ShieldAlert
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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function TeamsPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [newTeamDesc, setNewTeamDesc] = React.useState('');

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);

  const { data: profile } = useDoc(currentUserRef);

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'teams');
  }, [firestore]);

  const { data: teams } = useCollection(teamsQuery);

  const devsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', ROLES.DEVELOPER));
  }, [firestore]);

  const { data: developers } = useCollection(devsQuery);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || profile?.role !== ROLES.ADMIN) return;

    try {
      await addDoc(collection(firestore, 'teams'), {
        name: newTeamName,
        description: newTeamDesc,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Team Created", description: `"${newTeamName}" is now active.` });
      setIsCreateOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const assignDevToTeam = (devId: string, teamId: string | null) => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return;
    const devRef = doc(firestore, 'users', devId);
    updateDocumentNonBlocking(devRef, { teamId });
    toast({ title: "Assignment Updated", description: "Team membership has been updated." });
  };

  if (profile?.role !== ROLES.ADMIN) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive/50" />
          <h1 className="text-2xl font-bold font-headline">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can manage organizational teams.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">Organization Teams</h1>
            <p className="text-muted-foreground mt-2 text-lg">Structure your workforce and assign developers.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20">
                <Plus className="h-5 w-5" /> Create New Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline">New Team</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Team Name</Label>
                  <Input placeholder="Engineering, Design, etc." value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Description</Label>
                  <Input placeholder="Team focus..." value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold">Launch Team</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams?.map((team) => {
            const teamDevs = developers?.filter(d => d.teamId === team.id) || [];
            return (
              <Card key={team.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-bold font-headline">{team.name}</CardTitle>
                      <CardDescription>{team.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-primary/5 text-primary border-none px-4 py-1">
                      {teamDevs.length} Members
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assigned Developers</p>
                    <div className="flex flex-wrap gap-2">
                      {teamDevs.map(dev => (
                        <Badge key={dev.id} variant="outline" className="rounded-xl px-3 py-1.5 flex items-center gap-2 border-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          {dev.name}
                          <button 
                            onClick={() => assignDevToTeam(dev.id, null)}
                            className="ml-1 hover:text-destructive transition-colors"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      {teamDevs.length === 0 && (
                        <p className="text-xs italic text-muted-foreground">No developers assigned yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Active since {format(new Date(team.createdAt), 'MMM yyyy')}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 px-4 font-bold gap-2 rounded-xl">
                          <UserPlus className="h-4 w-4" /> Add Member
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-xl p-2 w-56">
                        {developers?.filter(d => !d.teamId).map(dev => (
                          <DropdownMenuItem key={dev.id} onClick={() => assignDevToTeam(dev.id, team.id)} className="rounded-lg">
                            {dev.name}
                          </DropdownMenuItem>
                        ))}
                        {developers?.filter(d => !d.teamId).length === 0 && (
                          <div className="p-2 text-xs italic text-muted-foreground text-center">
                            No unassigned developers found.
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
