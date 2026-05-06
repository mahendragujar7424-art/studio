
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<{ id: string, name: string } | null>(null);

  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');

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
    const FIXED_PASSWORD = "123456";

    try {
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryAppClient');
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, FIXED_PASSWORD);
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

      toast({ title: "Client Provisioned", description: `${newName} has been added.` });
      setIsCreateOpen(false);
      setNewName('');
      setNewEmail('');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!firestore || !userToDelete) return;
    const userDocRef = doc(firestore, 'users', userToDelete.id);
    deleteDocumentNonBlocking(userDocRef);
    toast({ title: "Client Removed", description: `Client "${userToDelete.name}" was removed.` });
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
            <h1 className="text-4xl font-bold font-headline tracking-tight">Client Directory</h1>
            <p className="text-muted-foreground mt-2 text-lg">Oversee client relationships and project status.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20">
                <UserPlus className="h-5 w-5" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline">Onboard Client</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Client Name</Label>
                  <Input placeholder="Acme Corp / John Smith" value={newName} onChange={e => setNewName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Email Address</Label>
                  <Input type="email" placeholder="john@client.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="p-4 rounded-xl bg-secondary/10 flex items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Default Password: 123456</p>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={isSubmitting}>
                    {isSubmitting ? "Onboarding..." : "Create Client Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search clients..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm"
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-none">
                <TableHead className="px-8 font-bold uppercase text-[10px] py-6">Client</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Email</TableHead>
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                      onClick={() => setUserToDelete({ id: u.id, name: u.name || 'Client' })}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Terminate Client Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-bold text-foreground">{userToDelete?.name}</span>? This will revoke all project access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl h-12">
              Remove Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
