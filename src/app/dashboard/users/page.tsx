
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { ROLES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Shield, 
  Clock,
  AlertTriangle,
  UserCog,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Mail,
  Key
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
  const [showPassword, setShowPassword] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  
  const [userToDelete, setUserToDelete] = React.useState<{ id: string, name: string, role: string } | null>(null);
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
    if (newPassword.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    let secondaryApp;

    try {
      secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp_' + Date.now());
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

      toast({ 
        title: "Account Provisioned", 
        description: `Credentials created for ${newName}. Account is now active.` 
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Provisioning Error", description: error.message, variant: "destructive" });
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setIsSubmitting(false);
    }
  };

  const handleSendResetEmail = async (email: string) => {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ 
        title: "Security Link Sent", 
        description: `Recovery instructions were sent to ${email}.` 
      });
    } catch (error: any) {
      toast({ 
        title: "Reset Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole(ROLES.CLIENT);
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

    toast({ title: "Permissions Updated", description: "Role-based access has been modified." });
    setIsEditOpen(false);
    setEditingUser(null);
  };

  const confirmDelete = () => {
    if (!firestore || !userToDelete || !users) return;

    if (userToDelete.role === ROLES.ADMIN) {
      const adminCount = users.filter(u => u.role === ROLES.ADMIN).length;
      if (adminCount <= 1) {
        toast({ 
          title: "Critical Restriction", 
          description: "Cannot remove the final Administrator account.", 
          variant: "destructive" 
        });
        setUserToDelete(null);
        return;
      }
    }

    const userDocRef = doc(firestore, 'users', userToDelete.id);
    const adminRoleRef = doc(firestore, 'roles_admin', userToDelete.id);
    deleteDocumentNonBlocking(userDocRef);
    deleteDocumentNonBlocking(adminRoleRef);
    toast({ title: "Access Revoked", description: `"${userToDelete.name}" removed from workspace.` });
    setUserToDelete(null);
  };

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (profile && profile.role !== ROLES.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <Shield className="h-16 w-16 text-destructive/50" />
        <h1 className="text-2xl font-bold font-headline">Access Restricted</h1>
        <p className="text-muted-foreground">Only administrators can manage workspace members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight text-gradient">Member Management</h1>
          <p className="text-muted-foreground mt-2 text-lg">Control organizational access and technical role distribution.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 rounded-2xl px-8 font-bold gap-3 shadow-xl shadow-primary/20">
              <UserPlus className="h-5 w-5" /> Provision Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold font-headline">New Member Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Role Assignment</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROLES.CLIENT}>Client Stakeholder</SelectItem>
                    <SelectItem value={ROLES.DEVELOPER}>Technical Developer</SelectItem>
                    <SelectItem value={ROLES.ADMIN}>Full Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Full Name</Label>
                <Input placeholder="John Doe" value={newName} onChange={e => setNewName(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Work Email</Label>
                <Input type="email" placeholder="john@company.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Manual Password Provisioning</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Set custom password"
                    required 
                    className="h-12 rounded-xl pr-24" 
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button type="button" onClick={copyPassword} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Important: Admins set the initial password. Copy and share it with the member. It is hashed upon saving.</p>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={isSubmitting}>
                  {isSubmitting ? "Provisioning Auth..." : "Activate Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name, email, or role..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-12 h-14 rounded-2xl border-none bg-white shadow-sm"
        />
      </div>

      <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-none">
              <TableHead className="px-8 font-bold uppercase text-[10px] py-6">Identity</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Permission Role</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Joined Workspace</TableHead>
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
                          onClick={() => handleSendResetEmail(u.email)}
                          title="Send Password Reset Email"
                        >
                          <Mail className="h-5 w-5" />
                        </Button>
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
                          onClick={() => setUserToDelete({ id: u.id, name: u.name || 'Member', role: u.role })}
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold font-headline">
              <ShieldCheck className="h-6 w-6 text-primary" /> Member Credentials
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Permission Profile</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.CLIENT}>Client Stakeholder</SelectItem>
                  <SelectItem value={ROLES.DEVELOPER}>Technical Developer</SelectItem>
                  <SelectItem value={ROLES.ADMIN}>Full Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-6 rounded-2xl bg-secondary/10 border border-secondary space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Key className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Access Recovery</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Admins cannot directly view current passwords. To force a password update, send a secure reset link to the member's work email.
              </p>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl border-2 font-bold gap-2 bg-white"
                onClick={() => handleSendResetEmail(editingUser?.email)}
              >
                <Mail className="h-4 w-4" /> Send Reset Instructions
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateUserRole} className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20">Apply Member Updates</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-8">
          <AlertDialogHeader>
            <div className="h-12 w-12 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-bold">Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you certain you want to revoke all workspace access for <span className="font-bold text-foreground">{userToDelete?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl h-12">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
