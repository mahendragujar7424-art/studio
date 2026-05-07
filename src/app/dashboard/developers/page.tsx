
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { ROLES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Shield, 
  Clock,
  AlertTriangle,
  Lock,
  Code2,
  Users,
  Edit,
  UserCheck
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DESIGNATIONS = [
  'Front-end',
  'Back-end',
  'Full-stack',
  'iOS',
  'Android',
  'UI/UX'
];

export default function DevelopersPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [search, setSearch] = React.useState('');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<{ id: string, name: string } | null>(null);
  const [editingDev, setEditingDev] = React.useState<any>(null);

  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newDesignation, setNewDesignation] = React.useState('Full-stack');
  const [newTeamId, setNewTeamId] = React.useState<string>('none');

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);

  const { data: profile } = useDoc(currentUserRef);

  const developersQuery = useMemoFirebase(() => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return null;
    return query(collection(firestore, 'users'), where('role', '==', ROLES.DEVELOPER));
  }, [firestore, profile?.role]);

  const { data: developers, isLoading: isDevsLoading } = useCollection(developersQuery);

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return null;
    return collection(firestore, 'teams');
  }, [firestore, profile?.role]);

  const { data: teams } = useCollection(teamsQuery);

  const handleCreateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || profile?.role !== ROLES.ADMIN) return;

    setIsSubmitting(true);
    let secondaryApp;
    const FIXED_PASSWORD = "123456";

    try {
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryAppDev_' + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, FIXED_PASSWORD);
      const newUser = userCredential.user;

      const userData = {
        id: newUser.uid,
        name: newName,
        email: newEmail,
        role: ROLES.DEVELOPER,
        designation: newDesignation,
        teamId: newTeamId === 'none' ? null : newTeamId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const userDocRef = doc(firestore, 'users', newUser.uid);
      setDocumentNonBlocking(userDocRef, userData, { merge: false });

      if (newTeamId !== 'none') {
        const teamRef = doc(firestore, 'teams', newTeamId);
        updateDocumentNonBlocking(teamRef, {
          developerIds: arrayUnion(newUser.uid)
        });
      }

      toast({ 
        title: "Developer Provisioned", 
        description: `${newName} added as ${newDesignation}${newTeamId !== 'none' ? ' to chosen team' : ''}.` 
      });
      
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsSubmitting(false);
    }
  };

  const handleUpdateDeveloper = () => {
    if (!firestore || !editingDev) return;
    const userDocRef = doc(firestore, 'users', editingDev.id);

    const oldTeamId = editingDev.teamId;
    const finalTeamId = newTeamId === 'none' ? null : newTeamId;

    // Handle team reassignment
    if (oldTeamId !== finalTeamId) {
      if (oldTeamId) {
        const oldTeamRef = doc(firestore, 'teams', oldTeamId);
        updateDocumentNonBlocking(oldTeamRef, {
          developerIds: arrayRemove(editingDev.id)
        });
      }
      if (finalTeamId) {
        const newTeamRef = doc(firestore, 'teams', finalTeamId);
        updateDocumentNonBlocking(newTeamRef, {
          developerIds: arrayUnion(editingDev.id)
        });
      }
    }

    updateDocumentNonBlocking(userDocRef, {
      name: newName,
      email: newEmail,
      designation: newDesignation,
      teamId: finalTeamId,
      updatedAt: new Date().toISOString()
    });

    toast({ title: "Profile Updated", description: "Developer details have been refreshed." });
    setIsEditOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewDesignation('Full-stack');
    setNewTeamId('none');
    setEditingDev(null);
  };

  const confirmDelete = () => {
    if (!firestore || !userToDelete) return;
    const userDocRef = doc(firestore, 'users', userToDelete.id);
    deleteDocumentNonBlocking(userDocRef);
    toast({ title: "Developer Removed", description: `Account for "${userToDelete.name}" was removed.` });
    setUserToDelete(null);
  };

  const filteredDevs = developers?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.designation?.toLowerCase().includes(search.toLowerCase())
  );

  if (profile?.role !== ROLES.ADMIN && !isDevsLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Shield className="h-16 w-16 text-destructive/50" />
          <h1 className="text-2xl font-bold font-headline">Access Denied</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-gradient">Developer Directory</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage technical staff and team deployments.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20">
                <UserPlus className="h-5 w-5" /> Add Developer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline">Provision Developer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDeveloper} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Full Name</Label>
                  <Input placeholder="Jane Doe" value={newName} onChange={e => setNewName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Email Address</Label>
                  <Input type="email" placeholder="jane@company.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Designation</Label>
                    <Select value={newDesignation} onValueChange={setNewDesignation}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DESIGNATIONS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Team Assignment</Label>
                    <Select value={newTeamId} onValueChange={setNewTeamId}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Team</SelectItem>
                        {teams?.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/10 flex items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Default Password: 123456</p>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={isSubmitting}>
                    {isSubmitting ? "Provisioning..." : "Create Developer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search developers by name or specialty..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm"
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-none">
                <TableHead className="px-8 font-bold uppercase text-[10px] py-6">Developer</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Technical Specialty</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Team Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Joined</TableHead>
                <TableHead className="px-8 text-right font-bold uppercase text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevs?.map((u) => {
                const teamName = teams?.find(t => t.id === u.teamId)?.name;
                return (
                  <TableRow key={u.id} className="group hover:bg-secondary/5 border-muted/20">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {u.name?.charAt(0) || 'D'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{u.name}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Code2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium">{u.designation || 'General'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge variant="outline" className={cn(
                          "rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-wider",
                          u.teamId ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
                          {teamName || 'Unassigned'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground text-[10px] font-medium">
                        <Clock className="h-3 w-3" />
                        {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full hover:text-primary" 
                          onClick={() => { 
                            setEditingDev(u); 
                            setNewName(u.name); 
                            setNewEmail(u.email); 
                            setNewDesignation(u.designation || 'Full-stack');
                            setNewTeamId(u.teamId || 'none');
                            setIsEditOpen(true); 
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                          onClick={() => setUserToDelete({ id: u.id, name: u.name || 'Developer' })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-headline flex items-center gap-2"><UserCheck className="h-6 w-6 text-primary" /> Edit Developer Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Email</Label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Designation</Label>
                <Select value={newDesignation} onValueChange={setNewDesignation}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNATIONS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Team</Label>
                <Select value={newTeamId} onValueChange={setNewTeamId}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Team</SelectItem>
                    {teams?.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground bg-secondary/10 p-4 rounded-lg">Note: Modifying the email in the profile does not update the authentication email. To change login credentials, please contact support.</p>
          </div>
          <DialogFooter className="pt-4">
            <Button onClick={handleUpdateDeveloper} className="w-full h-14 rounded-2xl font-bold">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <span className="font-bold text-foreground">{userToDelete?.name}</span> from the technical team? This will revoke all project access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl h-12">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
