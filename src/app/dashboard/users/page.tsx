
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { ROLES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Shield, 
  Mail, 
  Clock,
  Loader2,
  AlertTriangle
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

export default function UsersPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [search, setSearch] = React.useState('');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Delete confirmation state
  const [userToDelete, setUserToDelete] = React.useState<{ id: string, name: string } | null>(null);

  // New user form state
  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newRole, setNewRole] = React.useState<string>(ROLES.CLIENT);

  const currentUserRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);

  const { data: profile } = useDoc(currentUserRef);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || profile?.role !== ROLES.ADMIN) return null;
    return collection(firestore, 'users');
  }, [firestore, profile?.role]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || profile?.role !== ROLES.ADMIN) return;

    setIsSubmitting(true);
    
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUser = userCredential.user;

      const userData = {
        id: newUser.uid,
        name: newName,
        email: newEmail,
        role: newRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const userDocRef = doc(firestore, 'users', newUser.uid);
      setDocumentNonBlocking(userDocRef, userData, { merge: false });

      if (newRole === ROLES.ADMIN) {
        const adminRoleRef = doc(firestore, 'roles_admin', newUser.uid);
        setDocumentNonBlocking(adminRoleRef, {
          id: newUser.uid,
          createdAt: new Date().toISOString(),
        }, { merge: false });
      }

      toast({ title: "User Created", description: `${newName} has been added to the system.` });
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        title: "Creation Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole(ROLES.CLIENT);
  };

  const confirmDelete = () => {
    if (!firestore || !userToDelete) return;

    const userDocRef = doc(firestore, 'users', userToDelete.id);
    const adminRoleRef = doc(firestore, 'roles_admin', userToDelete.id);

    // Trigger non-blocking deletion
    deleteDocumentNonBlocking(userDocRef);
    deleteDocumentNonBlocking(adminRoleRef);

    toast({ 
      title: "Deletion Initiated", 
      description: `User "${userToDelete.name}" is being removed from the system.` 
    });
    
    setUserToDelete(null);
  };

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (!profile && isUsersLoading) return <DashboardLayout><div className="animate-pulse h-96 bg-white rounded-3xl" /></DashboardLayout>;

  if (profile?.role !== ROLES.ADMIN) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Shield className="h-16 w-16 text-destructive/50" />
          <h1 className="text-2xl font-bold font-headline">Access Denied</h1>
          <p className="text-muted-foreground">Only system administrators can manage users.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-gradient">User Management</h1>
            <p className="text-muted-foreground mt-2 text-lg">Control access and roles across the organization.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                <UserPlus className="h-5 w-5" /> Add New Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline text-center">Register New User</DialogTitle>
                <CardDescription className="text-center">Admin-only secure registration utility.</CardDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Workspace Role</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ROLES.CLIENT}>Client</SelectItem>
                      <SelectItem value={ROLES.DEVELOPER}>Developer</SelectItem>
                      <SelectItem value={ROLES.ADMIN}>Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Full Name</Label>
                  <Input 
                    placeholder="John Doe" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    required 
                    className="h-12 rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Email Address</Label>
                  <Input type="email" placeholder="user@company.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest">Initial Password</Label>
                  <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="h-12 rounded-xl" />
                  <p className="text-[10px] text-muted-foreground italic">Users can change this password after their first login.</p>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Provisioning...</> : "Create Profile"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search users by name or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-8 font-bold uppercase text-[10px] tracking-widest py-6">Member</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Role</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Joined</TableHead>
                <TableHead className="px-8 text-right font-bold uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((u) => (
                <TableRow key={u.id} className="group hover:bg-secondary/5 border-muted/20">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{u.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {u.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-wider bg-white border">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    {u.id !== currentUser?.uid ? (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                        onClick={() => setUserToDelete({ id: u.id, name: u.name || 'Unknown User' })}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-[8px] opacity-50 uppercase tracking-tighter">You</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {isUsersLoading && (
                [1, 2, 3].map(i => (
                  <TableRow key={i}><TableCell colSpan={4} className="h-20 animate-pulse bg-secondary/5" /></TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {(!filteredUsers || filteredUsers.length === 0) && !isUsersLoading && (
            <div className="py-20 text-center space-y-4">
              <p className="text-muted-foreground italic">No users found matching your search.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold font-headline">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Are you absolutely sure you want to remove <span className="font-bold text-foreground">{userToDelete?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-xl h-12 font-bold px-8"
            >
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
