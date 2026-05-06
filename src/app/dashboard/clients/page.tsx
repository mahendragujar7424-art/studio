
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
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
  Edit,
  UserCheck,
  Eye,
  EyeOff
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
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ClientsPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [search, setSearch] = React.useState('');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<{ id: string, name: string } | null>(null);
  const [editingClient, setEditingClient] = React.useState<any>(null);

  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('123456');
  const [showPassword, setShowPassword] = React.useState(false);

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);

  const { data: profile } = useDoc(currentUserRef);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return null;
    return query(collection(firestore, 'users'), where('role', '==', ROLES.CLIENT));
  }, [firestore, profile?.role]);

  const { data: clients, isLoading: isClientsLoading } = useCollection(clientsQuery);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || profile?.role !== ROLES.ADMIN) return;

    setIsSubmitting(true);
    let secondaryApp;

    try {
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryAppClient_' + Date.now());
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUser = userCredential.user;

      const userData = {
        id: newUser.uid,
        name: newName,
        email: newEmail,
        role: ROLES.CLIENT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const userDocRef = doc(firestore, 'users', newUser.uid);
      setDocumentNonBlocking(userDocRef, userData, { merge: false });

      toast({ title: "Client Account Created", description: `${newName} has been granted portal access.` });
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Provisioning Error", description: error.message, variant: "destructive" });
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = () => {
    if (!firestore || !editingClient) return;
    const userDocRef = doc(firestore, 'users', editingClient.id);

    updateDocumentNonBlocking(userDocRef, {
      name: newName,
      email: newEmail,
      updatedAt: new Date().toISOString()
    });

    toast({ title: "Profile Updated", description: "Client details have been refreshed." });
    setIsEditOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('123456');
    setEditingClient(null);
  };

  const confirmDelete = () => {
    if (!firestore || !userToDelete) return;
    const userDocRef = doc(firestore, 'users', userToDelete.id);
    deleteDocumentNonBlocking(userDocRef);
    toast({ title: "Access Revoked", description: `Client account for "${userToDelete.name}" was removed.` });
    setUserToDelete(null);
  };

  const filteredClients = clients?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (profile?.role !== ROLES.ADMIN && !isClientsLoading) {
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
            <h1 className="text-4xl font-bold font-headline tracking-tight">Client Hub</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage stakeholder relationships and credentials.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20">
                <UserPlus className="h-5 w-5" /> Provision Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline">New Client Identity</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Client Entity / Contact</Label>
                  <Input placeholder="Acme Corp / John Smith" value={newName} onChange={e => setNewName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Official Email</Label>
                  <Input type="email" placeholder="john@client.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Secure Password</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                      className="h-12 rounded-xl pr-12" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={isSubmitting}>
                    {isSubmitting ? "Provisioning..." : "Activate Client Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by company or name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm"
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-none">
                <TableHead className="px-8 font-bold uppercase text-[10px] py-6">Client Stakeholder</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Email Contact</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Onboarded</TableHead>
                <TableHead className="px-8 text-right font-bold uppercase text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients?.map((u) => (
                <TableRow key={u.id} className="group hover:bg-secondary/5 border-muted/20">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {u.name?.charAt(0) || 'C'}
                      </div>
                      <span className="font-bold text-sm">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground text-[10px] font-medium">
                      <Clock className="h-3 w-3" />
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="rounded-full hover:text-primary" onClick={() => { setEditingClient(u); setNewName(u.name); setNewEmail(u.email); setIsEditOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        onClick={() => setUserToDelete({ id: u.id, name: u.name || 'Client' })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-headline text-primary flex items-center gap-2"><UserCheck className="h-6 w-6" /> Modify Client Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Updated Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Updated Email</Label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <p className="text-[10px] text-muted-foreground bg-secondary/10 p-4 rounded-lg">Note: Modifying the email in the profile does not update the authentication email. To change login credentials, please contact support.</p>
          </div>
          <DialogFooter className="pt-4">
            <Button onClick={handleUpdateClient} className="w-full h-14 rounded-2xl font-bold">Update Client Information</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-bold text-foreground">{userToDelete?.name}</span> from the portal. This action is final.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl h-12">
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
