
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  getAuth, 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut
} from 'firebase/auth';

export default function ProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [currentPassword, setCurrentPassword] = React.useState('');
  
  const [isReauthOpen, setIsReauthOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<'email' | 'password' | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  React.useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.email) setNewEmail(profile.email);
  }, [profile]);

  const handleUpdateName = () => {
    if (!userRef) return;
    updateDocumentNonBlocking(userRef, {
      name: name,
      updatedAt: new Date().toISOString()
    });
    toast({ title: "Profile Updated", description: "Identity markers have been refreshed." });
  };

  const initiateSecurityUpdate = (type: 'email' | 'password') => {
    if (type === 'password') {
      if (newPassword !== confirmPassword) {
        toast({ title: "Validation Error", description: "Passwords do not match.", variant: "destructive" });
        return;
      }
      if (newPassword.length < 6) {
        toast({ title: "Security Requirement", description: "Password must be at least 6 characters.", variant: "destructive" });
        return;
      }
    }
    setPendingAction(type);
    setIsReauthOpen(true);
  };

  const handleSecurityAction = async () => {
    const auth = getAuth();
    if (!auth.currentUser || !currentPassword) return;

    setIsSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      if (pendingAction === 'email') {
        await updateEmail(auth.currentUser, newEmail);
        if (userRef) {
          updateDocumentNonBlocking(userRef, { email: newEmail });
        }
        toast({ title: "Email Changed", description: "Primary credential updated." });
      } else if (pendingAction === 'password') {
        await updatePassword(auth.currentUser, newPassword);
        toast({ title: "Security Key Updated", description: "Access credentials refreshed." });
      }

      await signOut(auth);
      router.push('/login');
      toast({ 
        title: "Security Refresh", 
        description: "Credentials updated successfully. Please sign in again.",
        variant: "default"
      });

    } catch (error: any) {
      toast({ title: "Security Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsReauthOpen(false);
      setCurrentPassword('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Profile & Security</h1>
          <p className="text-muted-foreground mt-2">Manage your workspace identity and core security settings.</p>
        </div>
        <Badge variant="outline" className="h-10 px-6 rounded-full border-2 font-bold gap-2 text-primary bg-primary/5 uppercase tracking-wider text-[10px]">
          <ShieldCheck className="h-4 w-4" /> Secure Account
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden text-center p-8">
            <div className="relative inline-block mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary px-3 py-1 font-bold text-[10px] uppercase border-2 border-white">
                {profile?.role}
              </Badge>
            </div>
            <h2 className="text-xl font-bold font-headline">{profile?.name}</h2>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
          </Card>

          <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Access Protocol</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You are currently logged in as an <strong>{profile?.role}</strong>. For your protection, updating your email or password requires verifying your current credentials.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Workspace Identity
              </CardTitle>
              <CardDescription>Update your public name used across project tasks.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="pl-12 h-12 rounded-xl border-2" 
                  />
                </div>
              </div>
              <Button onClick={handleUpdateName} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/10">
                Save Display Name
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Security Credentials
              </CardTitle>
              <CardDescription>Sensitive updates require password verification.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Account Email</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={newEmail} 
                        onChange={e => setNewEmail(e.target.value)} 
                        className="pl-12 h-12 rounded-xl border-2" 
                      />
                    </div>
                    <Button variant="outline" onClick={() => initiateSecurityUpdate('email')} className="h-12 rounded-xl px-6 border-2 font-bold whitespace-nowrap">
                      Update Email
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)} 
                          className="pl-12 h-12 rounded-xl border-2" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)} 
                          className="pl-12 h-12 rounded-xl border-2" 
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => initiateSecurityUpdate('password')} className="w-full h-12 rounded-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary shadow-lg shadow-secondary/10">
                    Update Security Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isReauthOpen} onOpenChange={setIsReauthOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-md border-none shadow-2xl">
          <DialogHeader className="text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary mx-auto mb-4">
              <Key className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-bold font-headline">Verify Identity</DialogTitle>
            <DialogDescription className="text-base pt-2">
              For your security, please confirm your current password to authorize this update.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Current Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  className="h-12 rounded-xl pr-12 bg-secondary/10 border-none" 
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-8 flex-col gap-3">
            <Button onClick={handleSecurityAction} className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? "Authenticating..." : "Authorize Update"}
            </Button>
            <Button variant="ghost" onClick={() => setIsReauthOpen(false)} className="w-full h-12 rounded-2xl font-medium">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
