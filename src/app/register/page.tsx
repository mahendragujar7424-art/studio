
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/constants';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<string>(ROLES.CLIENT);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    setLoading(true);
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Special case: Add to admin list if selected
      if (role === ROLES.ADMIN) {
        await setDoc(doc(firestore, 'roles_admin', user.uid), {
          id: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      router.push('/dashboard');
      toast({
        title: "Account Created",
        description: "Welcome to CloudCRM!",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_-20%,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-headline tracking-tight">Join the Network</h1>
          <p className="text-muted-foreground">Set up your professional identity</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-4">
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-bold font-headline flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Register
            </CardTitle>
            <CardDescription>Choose your role and fill your details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest ml-1">Choose Workspace Role</Label>
                <RadioGroup 
                  defaultValue={ROLES.CLIENT} 
                  onValueChange={setRole}
                  className="grid grid-cols-3 gap-4"
                >
                  {[ROLES.CLIENT, ROLES.DEVELOPER, ROLES.ADMIN].map((r) => (
                    <div key={r}>
                      <RadioGroupItem value={r} id={r} className="peer sr-only" />
                      <Label
                        htmlFor={r}
                        className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{r}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest ml-1">Full Name</Label>
                  <Input 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 rounded-2xl border-2 bg-secondary/10 focus:bg-white transition-all border-transparent focus:border-primary/50"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest ml-1">Email Address</Label>
                  <Input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-2xl border-2 bg-secondary/10 focus:bg-white transition-all border-transparent focus:border-primary/50"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest ml-1">Secure Password</Label>
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
                {loading ? "Onboarding..." : "Initialize Profile"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-6 border-t mt-6">
            <p className="text-sm text-muted-foreground">
              Already a member? <Link href="/login" className="text-primary font-bold hover:underline">Login here</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
