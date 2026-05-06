
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/constants';
import { LogIn, ShieldCheck, Database, UserPlus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<string>(ROLES.CLIENT);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const auth = getAuth();
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("User profile not found. If this is a new setup, use the demo initialization buttons below.");
      }

      const userData = userDoc.data();
      
      if (userData.role !== role) {
        await signOut(auth);
        throw new Error(`Access denied. This email is registered as a ${userData.role}, not a ${role}. Please select the correct role above.`);
      }

      toast({
        title: "Success",
        description: `Authorized as ${role}.`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Access Error",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemoUser = async (type: 'Admin' | 'Developer' | 'Client') => {
    setLoading(true);
    const auth = getAuth();
    const demoEmail = `${type.toLowerCase()}@crm.com`;
    const demoPass = "Password123!";
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
      const user = userCredential.user;

      const userData = {
        id: user.uid,
        name: `Demo ${type}`,
        email: demoEmail,
        role: type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(firestore, 'users', user.uid), userData);

      if (type === 'Admin') {
        await setDoc(doc(firestore, 'roles_admin', user.uid), {
          id: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      toast({ 
        title: `${type} Profile Ready`, 
        description: `Login with: ${demoEmail} / ${demoPass}` 
      });
      
      setEmail(demoEmail);
      setPassword(demoPass);
      setRole(type);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ title: "Notice", description: `The ${type} account is already initialized.` });
        setEmail(demoEmail);
        setPassword(demoPass);
        setRole(type);
      } else {
        toast({ title: "Setup Failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center text-primary-foreground font-bold text-3xl mx-auto shadow-2xl shadow-primary/20">
            C
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">CloudCRM Workspace</h1>
          <p className="text-muted-foreground">Select your role to access your workspace</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4">
          <CardHeader className="space-y-4 pb-8">
            <CardTitle className="text-2xl font-bold font-headline flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" /> Authorization
            </CardTitle>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1">Current Role:</Label>
              <Tabs value={role} onValueChange={setRole} className="w-full">
                <TabsList className="grid grid-cols-3 h-12 rounded-xl bg-secondary/20 p-1">
                  <TabsTrigger value={ROLES.CLIENT} className="rounded-lg font-bold text-[10px] uppercase tracking-tighter">Client</TabsTrigger>
                  <TabsTrigger value={ROLES.DEVELOPER} className="rounded-lg font-bold text-[10px] uppercase tracking-tighter">Developer</TabsTrigger>
                  <TabsTrigger value={ROLES.ADMIN} className="rounded-lg font-bold text-[10px] uppercase tracking-tighter">Admin</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest ml-1">Email Address</Label>
                <Input 
                  type="email" 
                  placeholder="user@company.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-2xl border-2 bg-secondary/10 focus:bg-white transition-all border-transparent focus:border-primary/50"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl border-2 bg-secondary/10 focus:bg-white transition-all border-transparent focus:border-primary/50"
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]" disabled={loading}>
                {loading ? "Verifying Access..." : "Log In to Workspace"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-6 border-t flex flex-col gap-4">
            <p className="text-[10px] font-bold text-center uppercase tracking-widest text-muted-foreground">Demo Accounts Setup</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="h-10 text-[9px] font-bold rounded-xl" onClick={() => handleSeedDemoUser('Admin')} disabled={loading}>
                <ShieldCheck className="h-3 w-3 mr-1" /> Admin
              </Button>
              <Button variant="outline" size="sm" className="h-10 text-[9px] font-bold rounded-xl" onClick={() => handleSeedDemoUser('Developer')} disabled={loading}>
                <Database className="h-3 w-3 mr-1" /> Dev
              </Button>
              <Button variant="outline" size="sm" className="h-10 text-[9px] font-bold rounded-xl" onClick={() => handleSeedDemoUser('Client')} disabled={loading}>
                <UserPlus className="h-3 w-3 mr-1" /> Client
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
