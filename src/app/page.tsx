
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Users, 
  LayoutDashboard,
  CheckCircle,
  Lock
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-primary/30 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/20 rounded-full px-8 py-3 shadow-lg shadow-black/5">
          <Link href="/" className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white text-lg">C</div>
            CloudCRM<span className="text-foreground">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">Features</Link>
            <Link href="#security" className="text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">Security</Link>
            <div className="h-4 w-px bg-muted" />
            {user ? (
              <Button asChild className="rounded-full px-8 shadow-xl shadow-primary/20 font-bold">
                <Link href="/dashboard">Go to Workspace</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="font-bold uppercase tracking-widest text-sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="rounded-full px-8 shadow-xl shadow-primary/20 font-bold">
                  <Link href="/register">Start Free</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 relative">
        {/* Hero Section */}
        <section className="pt-52 pb-32 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
            <Badge variant="secondary" className="px-6 py-2 text-primary font-bold tracking-widest border-primary/20 bg-primary/5 rounded-full animate-in fade-in slide-in-from-bottom duration-700">
              <Sparkles className="h-4 w-4 mr-2" /> V2.0 IS NOW LIVE
            </Badge>
            
            <h1 className="text-6xl md:text-8xl font-bold font-headline tracking-tight leading-[0.9] animate-in fade-in slide-in-from-bottom duration-1000">
              Manage Tasks with <span className="text-primary italic">Precision.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
              The unified CRM for developers, admins, and clients. Scale your projects without losing oversight.
            </p>

            <div className="flex flex-wrap justify-center gap-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
              <Button size="lg" className="h-16 rounded-[2rem] px-12 text-xl font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-all" asChild>
                <Link href={user ? "/dashboard" : "/register"}>
                  {user ? "Enter Dashboard" : "Create Account"} <ArrowRight className="h-6 w-6 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 rounded-[2rem] px-12 text-xl font-bold border-2 hover:bg-primary/5 transition-all">
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: ShieldCheck, 
                title: "RBAC System", 
                desc: "Granular Role-Based Access Control ensures data is seen only by those who need it.",
                color: "bg-blue-50 text-blue-600"
              },
              { 
                icon: Zap, 
                title: "Real-time Sync", 
                desc: "Instant updates across all panels when task statuses change or comments are added.",
                color: "bg-orange-50 text-orange-600"
              },
              { 
                icon: LayoutDashboard, 
                title: "Premium UI", 
                desc: "A clean, modern interface designed for focus and productivity across any device.",
                color: "bg-purple-50 text-purple-600"
              }
            ].map((f, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-transparent hover:border-primary/20 transition-all group shadow-sm">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform", f.color)}>
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold font-headline mb-4">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles Section */}
        <section className="py-32 px-6 bg-white border-y">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
              <h2 className="text-sm font-bold tracking-[0.3em] text-primary uppercase">Unified Workflow</h2>
              <h3 className="text-4xl md:text-5xl font-bold font-headline">Three Roles. One Platform.</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-6 text-center">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="h-10 w-10 text-primary" />
                </div>
                <h4 className="text-xl font-bold font-headline uppercase tracking-wider">The Admin</h4>
                <p className="text-muted-foreground">Master control over users, assignments, and global project health analytics.</p>
              </div>
              <div className="space-y-6 text-center">
                <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-xl font-bold font-headline uppercase tracking-wider">The Developer</h4>
                <p className="text-muted-foreground">Execution focused view. Manage statuses, track progress, and communicate updates.</p>
              </div>
              <div className="space-y-6 text-center">
                <div className="h-20 w-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                  <Users className="h-10 w-10 text-orange-600" />
                </div>
                <h4 className="text-xl font-bold font-headline uppercase tracking-wider">The Client</h4>
                <p className="text-muted-foreground">Transparency without complexity. Real-time monitoring of project delivery.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <Link href="/" className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
            CloudCRM<span className="text-foreground">.</span>
          </Link>
          <p className="text-muted-foreground text-sm font-medium">© 2024 CloudCRM Systems. Built for high-performance teams.</p>
          <div className="flex gap-8">
            <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">API</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
