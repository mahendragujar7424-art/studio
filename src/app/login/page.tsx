
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Info, ShieldCheck, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
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
      
      // 2. Fetch Role from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      
      if (!userDoc.exists()) {
        toast({ 
          title: "Profile Missing", 
          description: "Authenticated successfully, but no database profile found.", 
          variant: "destructive" 
        });
        return;
      }

      const userData = userDoc.data();
      
      // 3. Success Feedback and Redirection
      toast({ 
        title: "Access Granted", 
        description: `Welcome back, ${userData.name}. Role: ${userData.role}` 
      });
      
      // The DashboardLayout handles individual role views at the /dashboard root
      router.push('/dashboard');
    } catch (error: any) {
      toast({ 
        title: "Authentication Failed", 
        description: error.message || "Invalid credentials provided.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center text-primary-foreground font-bold text-3xl mx-auto shadow-2xl">C</div>
          <h1 className="text-3xl font-bold font-headline text-primary">CRM Portal</h1>
        </div>

        <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertTitle className="text-xs font-bold uppercase tracking-wider text-primary">Secure Authentication</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Role-based credentials are encrypted and verified against organizational security protocols.
          </AlertDescription>
        </Alert>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4">
          <CardHeader className="space-y-2 pb-8 text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5 text-primary" /> Member Login
            </CardTitle>
            <CardDescription>Secure access to the CRM technical environment.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Official Email</Label>
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="h-14 rounded-2xl" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Private Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="h-14 rounded-2xl" 
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {loading ? "Verifying..." : "Enter Workspace"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-6 border-t flex flex-col gap-4">
            <p className="text-[10px] font-bold text-center uppercase text-muted-foreground tracking-[0.2em]">Forgot your key? Contact your Admin</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
