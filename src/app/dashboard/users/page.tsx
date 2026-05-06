
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  AlertTriangle,
  UserCog,
  ShieldCheck
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
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [userToDelete, setUserToDelete] = React.useState<{ id: string, name: string } | null>(null);
  const [editingUser, setEditingUser] = React.useState<any>(null);

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
        setDocumentNonBlocking(adminRoleRef, { id: newUser.uid, createdAt: new Date().toISOString() }, { merge: false });
      }

      toast({ title: "User Created", description: `${newName} has been added.` });
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsSubmitting(false);
    }
  };

  const handleUpdateUserRole = () => {
    if (!firestore || !editingUser) return;
    const userDocRef = doc(firestore, 'users', editingUser.id);
    const adminRoleRef = doc(firestore, 'roles_admin', editingUser.id);

    updateDocumentNonBlocking(userDocRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    if (newRole === ROLES.ADMIN) {
      setDocumentNonBlocking(adminRoleRef, { id: editingUser.id, createdAt: new Date().toISOString() }, { merge: true });
    } else {
      deleteDocumentNonBlocking(adminRoleRef);
    }

    toast({ title: "Role Updated", description: `User role changed to ${newRole}.` });
    setIsEditOpen(false);
    setEditingUser(null);
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
    deleteDocumentNonBlocking(userDocRef);
    deleteDocumentNonBlocking(adminRoleRef);
    toast({ title: "Profile Removed", description: `User "${userToDelete.name}" was removed.` });
    setUserToDelete(null);
  };

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (profile?.role !== ROLES.ADMIN && !isUsersLoading) {
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
            <h1 className="text-4xl font-bold font-headline tracking-tight text-gradient">User Management</h1>
            <p className="text-muted-foreground mt-2 text-lg">Control access and roles across the organization.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20">
                <UserPlus className="h-5 w-5" /> Add New Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold font-headline">Register User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Role</Label>
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
                  <Label className="text-xs font-bold uppercase">Name</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Email</Label>
                  <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Password</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={isSubmitting}>
                    {isSubmitting ? "Provisioning..." : "Create Profile"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm"
          />
        </div>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-none">
                <TableHead className="px-8 font-bold uppercase text-[10px] py-6">Member</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Role</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Joined</TableHead>
                <TableHead className="px-8 text-right font-bold uppercase text-[10px]">Actions</TableHead>
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
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold text-[9px] uppercase tracking-wider bg-white border">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground text-[10px] font-medium">
                      <Clock className="h-3 w-3" />
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <div className="flex justify-end gap-2">
                      {u.id !== currentUser?.uid && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => {
                              setEditingUser(u);
                              setNewRole(u.role);
                              setIsEditOpen(true);
                            }}
                          >
                            <UserCog className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => setUserToDelete({ id: u.id, name: u.name || 'Unknown User' })}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Modify Permissions
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Workspace Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.CLIENT}>Client</SelectItem>
                  <SelectItem value={ROLES.DEVELOPER}>Developer</SelectItem>
                  <SelectItem value={ROLES.ADMIN}>Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Changing a role to Administrator will grant this user full management access to all projects and user records.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateUserRole} className="w-full h-12 rounded-xl font-bold">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-bold text-foreground">{userToDelete?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl h-12">
              Delete Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
