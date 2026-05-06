
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, LogIn, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center text-primary-foreground font-bold text-3xl mx-auto shadow-2xl shadow-primary/20 animate-bounce">
            C
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Welcome to CloudCRM</h1>
          <p className="text-muted-foreground">Access your professional workspace</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-bold font-headline flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" /> Login
            </CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
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
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-xs font-bold uppercase tracking-widest">Password</Label>
                  <Button variant="link" className="px-0 h-auto text-xs font-bold text-primary">Forgot?</Button>
                </div>
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
                {loading ? "Verifying..." : "Sign In to Workspace"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-muted-foreground font-bold">New Here?</span></div>
            </div>
            <Button variant="outline" className="w-full h-14 rounded-2xl border-2 hover:bg-primary/5 font-bold" asChild>
              <Link href="/register">Create Professional Account</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
