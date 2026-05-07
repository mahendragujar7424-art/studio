
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
  Search,
  Check,
  UserCheck,
  LayoutGrid
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function TeamsPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Modal & Form State
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState('');
  const [newTeamDesc, setNewTeamDesc] = React.useState('');
  
  // Selection State
  const [selectedDeveloperIds, setSelectedDeveloperIds] = React.useState<string[]>([]);
  const [devSearchQuery, setDevSearchQuery] = React.useState('');

  // 1. Fetch Admin Profile
  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);
  const { data: profile } = useDoc(currentUserRef);

  // 2. Fetch All Teams
  const teamsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'teams');
  }, [firestore]);
  const { data: teams, isLoading: isTeamsLoading } = useCollection(teamsQuery);

  // 3. Fetch All Developers (for the selection list)
  const devsQuery = useMemoFirebase(() => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return null;
    return query(collection(firestore, 'users'), where('role', '==', ROLES.DEVELOPER));
  }, [firestore, profile?.role]);
  const { data: developers, isLoading: isDevsLoading } = useCollection(devsQuery);

  // Toggle Logic - Robust ID management
  const toggleDeveloperSelection = (id: string) => {
    setSelectedDeveloperIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Submit Handler
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || profile?.role !== ROLES.ADMIN) return;

    if (!newTeamName.trim()) {
      toast({ title: "Identification Required", description: "Please provide a name for this engineering unit.", variant: "destructive" });
      return;
    }

    if (selectedDeveloperIds.length === 0) {
      toast({ title: "Roster Empty", description: "Select at least one developer to assemble a team.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // A. Create the Team Document
      const teamPayload = {
        name: newTeamName,
        description: newTeamDesc,
        developerIds: selectedDeveloperIds,
        createdAt: new Date().toISOString(),
      };
      
      const teamRef = await addDoc(collection(firestore, 'teams'), teamPayload);

      // B. Bi-directional Sync: Update each developer's profile with the new Team ID
      selectedDeveloperIds.forEach((devId) => {
        const devRef = doc(firestore, 'users', devId);
        updateDocumentNonBlocking(devRef, { teamId: teamRef.id });
      });

      toast({ 
        title: "Team Operational", 
        description: `"${newTeamName}" is now active with ${selectedDeveloperIds.length} members.` 
      });
      
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Launch Failure", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewTeamName('');
    setNewTeamDesc('');
    setSelectedDeveloperIds([]);
    setDevSearchQuery('');
  };

  const removeDevFromTeam = (devId: string, teamId: string, currentTeamDevs: string[]) => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return;
    
    const teamRef = doc(firestore, 'teams', teamId);
    const updatedDevList = currentTeamDevs.filter(id => id !== devId);
    
    updateDocumentNonBlocking(teamRef, { developerIds: updatedDevList });
    updateDocumentNonBlocking(doc(firestore, 'users', devId), { teamId: null });
    
    toast({ title: "Roster Updated", description: "Member has been unassigned from the technical unit." });
  };

  const filteredDevelopers = developers?.filter(dev => 
    dev.name?.toLowerCase().includes(devSearchQuery.toLowerCase()) || 
    dev.email?.toLowerCase().includes(devSearchQuery.toLowerCase()) ||
    dev.designation?.toLowerCase().includes(devSearchQuery.toLowerCase())
  );

  if (profile && profile.role !== ROLES.ADMIN) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive/50" />
          <h1 className="text-2xl font-bold font-headline">Unauthorized</h1>
          <p className="text-muted-foreground">Team management is restricted to administrative accounts.</p>
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
            <p className="text-muted-foreground mt-2 text-lg">Assemble engineering units and monitor technical roster distribution.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20 w-full sm:w-auto">
                <Plus className="h-5 w-5" /> Assemble New Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-8 border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline">Team Formation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTeam} className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Team Identity</Label>
                    <Input placeholder="e.g., Core Engineering / Frontend Ops" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} required className="h-12 rounded-xl border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Project Focus</Label>
                    <Input placeholder="Short description of technical focus" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} className="h-12 rounded-xl border-2" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Technical Members</Label>
                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{selectedDeveloperIds.length} Selected</span>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search technical staff by name or specialty..." 
                      value={devSearchQuery}
                      onChange={e => setDevSearchQuery(e.target.value)}
                      className="h-12 pl-10 rounded-xl border-2 bg-secondary/10"
                    />
                  </div>

                  <Card className="border-2 rounded-2xl overflow-hidden bg-white shadow-inner">
                    <ScrollArea className="h-[200px]">
                      <div className="p-2 space-y-1">
                        {isDevsLoading ? (
                          <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Accessing Directory...</span>
                          </div>
                        ) : filteredDevelopers?.map((dev) => {
                          const isSelected = selectedDeveloperIds.includes(dev.id);
                          return (
                            <div 
                              key={dev.id} 
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group",
                                isSelected ? "bg-primary/5" : "hover:bg-secondary/20"
                              )} 
                              onClick={() => toggleDeveloperSelection(dev.id)}
                            >
                              <div className="flex items-center gap-4">
                                <Checkbox 
                                  checked={isSelected} 
                                  onCheckedChange={() => toggleDeveloperSelection(dev.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-5 w-5 rounded-md"
                                />
                                <div className="flex flex-col">
                                  <span className={cn("text-sm font-bold", isSelected ? "text-primary" : "text-foreground")}>{dev.name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{dev.designation || 'Specialist'}</span>
                                </div>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                          );
                        })}
                        {(!filteredDevelopers || filteredDevelopers.length === 0) && !isDevsLoading && (
                          <div className="text-center py-10 space-y-2">
                            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                            <p className="text-xs text-muted-foreground italic">No technical staff found.</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Briefcase className="h-5 w-5 mr-2" />}
                    {isSubmitting ? "Syncing Roster..." : "Launch Engineering Unit"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams?.map((team) => {
            // Resolve names and designations from the global developers list for "Populate" behavior
            const teamDevs = developers?.filter(d => team.developerIds?.includes(d.id)) || [];
            
            return (
              <Card key={team.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all border-l-4 border-l-primary/10">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-bold font-headline">{team.name}</CardTitle>
                      <CardDescription className="text-base">{team.description}</CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-2 px-4 py-1.5 font-bold uppercase text-[9px]">
                      {teamDevs.length} Engineers Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <UserCheck className="h-3 w-3" /> Technical Roster
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {teamDevs.map(dev => (
                        <Badge key={dev.id} variant="outline" className="rounded-xl px-4 py-2 flex items-center gap-3 border-2 group/badge hover:bg-secondary/20 transition-all">
                          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold">{dev.name}</span>
                            <span className="text-[8px] uppercase text-muted-foreground font-bold tracking-widest">{dev.designation || 'Developer'}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeDevFromTeam(dev.id, team.id, team.developerIds);
                            }}
                            className="ml-1 text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Unassign Developer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </Badge>
                      ))}
                      {teamDevs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 w-full bg-secondary/5 rounded-2xl border-2 border-dashed">
                          <p className="text-xs italic text-muted-foreground">No staff currently assigned.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-dashed flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Created {team.createdAt ? format(new Date(team.createdAt), 'MMM yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                       <Check className="h-3 w-3" /> Production Verified
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {(isTeamsLoading || isDevsLoading) && [1, 2].map(i => (
             <div key={i} className="h-64 rounded-[2.5rem] bg-white animate-pulse" />
          ))}

          {(!teams || teams.length === 0) && !isTeamsLoading && (
            <div className="lg:col-span-2 py-32 text-center space-y-6 bg-white rounded-[2.5rem] border-2 border-dashed">
              <div className="h-20 w-20 bg-secondary/20 rounded-[2rem] flex items-center justify-center mx-auto text-muted-foreground/30">
                <LayoutGrid className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold font-headline">No Technical Units Found</p>
                <p className="text-muted-foreground max-w-sm mx-auto">Start by assembling your first engineering team and assigning technical staff to it.</p>
              </div>
              <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold h-12 px-8">Assemble Team</Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
