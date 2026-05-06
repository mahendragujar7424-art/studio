
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Plus, 
  Briefcase, 
  ShieldAlert,
  Loader2,
  X,
  ChevronDown,
  Search
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TeamsPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [newTeamDesc, setNewTeamDesc] = React.useState('');
  const [selectedDeveloperIds, setSelectedDeveloperIds] = React.useState<string[]>([]);
  const [devSearch, setDevSearch] = React.useState('');

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

  const toggleDeveloperSelection = (id: string) => {
    setSelectedDeveloperIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || profile?.role !== ROLES.ADMIN) return;

    if (selectedDeveloperIds.length === 0) {
      toast({ title: "Assignment Required", description: "Please select at least one developer.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const teamRef = await addDoc(collection(firestore, 'teams'), {
        name: newTeamName,
        description: newTeamDesc,
        developerIds: selectedDeveloperIds,
        createdAt: new Date().toISOString(),
      });

      // Also update each user's teamId for security rule checks
      for (const devId of selectedDeveloperIds) {
        const devRef = doc(firestore, 'users', devId);
        updateDocumentNonBlocking(devRef, { teamId: teamRef.id });
      }

      toast({ title: "Team Launched", description: `"${newTeamName}" with ${selectedDeveloperIds.length} developers.` });
      setIsCreateOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
      setSelectedDeveloperIds([]);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeDevFromTeam = (devId: string, teamId: string, currentTeamDevs: string[]) => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return;
    
    const teamRef = doc(firestore, 'teams', teamId);
    const updatedDevList = currentTeamDevs.filter(id => id !== devId);
    
    updateDocumentNonBlocking(teamRef, { developerIds: updatedDevList });
    updateDocumentNonBlocking(doc(firestore, 'users', devId), { teamId: null });
    
    toast({ title: "Assignment Removed", description: "Developer unassigned from team." });
  };

  const filteredDevelopers = developers?.filter(dev => 
    dev.name?.toLowerCase().includes(devSearch.toLowerCase()) || 
    dev.email?.toLowerCase().includes(devSearch.toLowerCase())
  );

  if (profile && profile.role !== ROLES.ADMIN) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive/50" />
          <h1 className="text-2xl font-bold font-headline">Access Denied</h1>
          <p className="text-muted-foreground">Organizational control is restricted to administrators.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">Team Orchestration</h1>
            <p className="text-muted-foreground mt-2 text-lg">Build engineering units and assign technical staff.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20">
                <Plus className="h-5 w-5" /> Assemble Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline">New Team Formation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Team / Project Name</Label>
                  <Input placeholder="Engineering Alpha" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Focus / Description</Label>
                  <Input placeholder="Main product development" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} className="h-12 rounded-xl" />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase">Assign Developers</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 justify-between rounded-xl px-4 border-2 font-bold text-sm">
                        {selectedDeveloperIds.length > 0 
                          ? `${selectedDeveloperIds.length} Developers Selected` 
                          : "Select Team Members"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[430px] p-0 rounded-2xl overflow-hidden shadow-2xl border-none" align="start">
                      <div className="p-4 border-b bg-secondary/10 relative">
                        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search developers..." 
                          value={devSearch}
                          onChange={e => setDevSearch(e.target.value)}
                          className="h-10 pl-10 rounded-lg border-none bg-white"
                        />
                      </div>
                      <ScrollArea className="h-64 p-2 bg-white">
                        <div className="space-y-1">
                          {filteredDevelopers?.map((dev) => (
                            <div 
                              key={dev.id} 
                              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer group" 
                              onClick={() => toggleDeveloperSelection(dev.id)}
                            >
                              <Checkbox 
                                checked={selectedDeveloperIds.includes(dev.id)} 
                                onCheckedChange={() => {}} // Controlled by row click
                                className="pointer-events-none"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold group-hover:text-primary transition-colors">{dev.name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{dev.email}</span>
                              </div>
                            </div>
                          ))}
                          {(!filteredDevelopers || filteredDevelopers.length === 0) && (
                            <p className="text-center py-10 text-xs text-muted-foreground italic">No matching developers found.</p>
                          )}
                        </div>
                      </ScrollArea>
                      {selectedDeveloperIds.length > 0 && (
                        <div className="p-3 bg-primary/5 border-t flex justify-between items-center">
                          <span className="text-[10px] font-bold text-primary uppercase">{selectedDeveloperIds.length} Selected</span>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => setSelectedDeveloperIds([])}>Clear All</Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Launch Team"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams?.map((team) => {
            const teamDevs = developers?.filter(d => team.developerIds?.includes(d.id)) || [];
            return (
              <Card key={team.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-bold font-headline">{team.name}</CardTitle>
                      <CardDescription>{team.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-primary/5 text-primary border-none px-4 py-1">
                      {teamDevs.length} Staff
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team Roster</p>
                    <div className="flex flex-wrap gap-2">
                      {teamDevs.map(dev => (
                        <Badge key={dev.id} variant="outline" className="rounded-xl px-3 py-1.5 flex items-center gap-2 border-2 group/badge">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-xs font-bold">{dev.name}</span>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeDevFromTeam(dev.id, team.id, team.developerIds);
                            }}
                            className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {teamDevs.length === 0 && (
                        <p className="text-xs italic text-muted-foreground">Unassigned workspace.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Active since {team.createdAt ? format(new Date(team.createdAt), 'MMM yyyy') : 'N/A'}
                    </span>
                    <div className="flex items-center gap-2 text-primary">
                       <Briefcase className="h-4 w-4" />
                       <span className="text-[10px] font-bold uppercase">Production Ready</span>
                    </div>
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
