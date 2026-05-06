
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
import { LogIn, ShieldCheck, Database } from 'lucide-react';
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
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Verify Role in Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("User profile not found. If this is a new setup, click 'Initialize Demo Admin' below.");
      }

      const userData = userDoc.data();
      
      // 3. Check if the selected role matches the database
      if (userData.role !== role) {
        await signOut(auth);
        throw new Error(`Access denied. Your account is not registered as a ${role}.`);
      }

      toast({
        title: "Success",
        description: `Logged in as ${role} successfully.`,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedAdmin = async () => {
    setLoading(true);
    const auth = getAuth();
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, "admin@crm.com", "Password123!");
      const user = userCredential.user;

      // 2. Create User Profile
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        name: "Default Admin",
        email: "admin@crm.com",
        role: ROLES.ADMIN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Create Admin Marker
      await setDoc(doc(firestore, 'roles_admin', user.uid), {
        id: user.uid,
        createdAt: new Date().toISOString(),
      });

      toast({ 
        title: "Admin Created", 
        description: "Credentials: admin@crm.com / Password123!. You can now log in." 
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ title: "Account Exists", description: "The admin account (admin@crm.com) is already registered." });
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
          <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center text-primary-foreground font-bold text-3xl mx-auto shadow-2xl shadow-primary/20 animate-bounce">
            C
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">CloudCRM Workspace</h1>
          <p className="text-muted-foreground">Log in with your assigned role</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4">
          <CardHeader className="space-y-4 pb-8">
            <CardTitle className="text-2xl font-bold font-headline flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" /> Security Check
            </CardTitle>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest ml-1">Accessing as:</Label>
              <Tabs defaultValue={role} onValueChange={setRole} className="w-full">
                <TabsList className="grid grid-cols-3 h-12 rounded-xl bg-secondary/20 p-1">
                  <TabsTrigger value={ROLES.CLIENT} className="rounded-lg font-bold text-[10px] uppercase">Client</TabsTrigger>
                  <TabsTrigger value={ROLES.DEVELOPER} className="rounded-lg font-bold text-[10px] uppercase">Dev</TabsTrigger>
                  <TabsTrigger value={ROLES.ADMIN} className="rounded-lg font-bold text-[10px] uppercase">Admin</TabsTrigger>
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
                  placeholder="name@company.com" 
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
              <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02]" disabled={loading}>
                {loading ? "Verifying Role..." : "Authorize Access"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-6 border-t flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Admin-managed registration only
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-[10px] font-bold uppercase tracking-widest text-primary/50 hover:text-primary transition-all"
              onClick={handleSeedAdmin}
              disabled={loading}
            >
              <Database className="h-3 w-3 mr-2" /> Initialize Demo Admin
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
