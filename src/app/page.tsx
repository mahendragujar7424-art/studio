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
  Lock,
  ChevronRight
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-primary/30 flex flex-col font-body">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/20 rounded-full px-8 py-3 shadow-lg shadow-black/5">
          <Link href="/" className="text-2xl font-headline font-bold text-primary flex items-center gap-2 group">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">C</div>
            CloudCRM<span className="text-foreground">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-xs font-bold uppercase tracking-[0.2em] hover:text-primary transition-colors">Features</Link>
            <Link href="#workflow" className="text-xs font-bold uppercase tracking-[0.2em] hover:text-primary transition-colors">Workflow</Link>
            <div className="h-4 w-px bg-muted" />
            {user ? (
              <Button asChild className="rounded-full px-8 shadow-xl shadow-primary/20 font-bold h-11">
                <Link href="/dashboard">Enter Workspace <ChevronRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button variant="default" className="rounded-full px-8 shadow-xl shadow-primary/20 font-bold h-11" asChild>
                <Link href="/login">Portal Login</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 relative">
        {/* Hero Section */}
        <section className="pt-52 pb-32 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-[120px] pointer-events-none opacity-50" />
          
          <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
            <div className="inline-flex items-center gap-3">
              <Badge variant="secondary" className="px-6 py-2 text-primary font-bold tracking-widest border-primary/20 bg-primary/5 rounded-full animate-in fade-in slide-in-from-bottom duration-700">
                <Sparkles className="h-4 w-4 mr-2" /> V2.5 ENTERPRISE
              </Badge>
              <div className="flex -space-x-3 items-center">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-secondary/50" />
                ))}
                <span className="ml-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Trusted by 50+ Teams</span>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-bold font-headline tracking-tighter leading-[0.85] animate-in fade-in slide-in-from-bottom duration-1000">
              Deliver Projects <br />
              <span className="text-primary italic">Without Limits.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
              The professional bridge between development and client delivery. Real-time progress, granular oversight, and precision feedback.
            </p>

            <div className="flex flex-wrap justify-center gap-6 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
              {user ? (
                <Button size="lg" className="h-18 rounded-[2rem] px-14 text-2xl font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-all" asChild>
                  <Link href="/dashboard">
                    Enter Workspace <ArrowRight className="h-6 w-6 ml-3" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="h-18 rounded-[2rem] px-14 text-2xl font-bold shadow-2xl shadow-primary/30 hover:scale-105 transition-all" asChild>
                  <Link href="/login">
                    Login to Portal <ArrowRight className="h-6 w-6 ml-3" />
                  </Link>
                </Button>
              )}
              <Button size="lg" variant="outline" className="h-18 rounded-[2rem] px-14 text-2xl font-bold border-2 hover:bg-primary/5 transition-all">
                The CRM Tour
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
                title: "Assigned Control", 
                desc: "Roles defined by function. Admins manage, Developers execute, and Clients monitor.",
                color: "bg-blue-50 text-blue-600"
              },
              { 
                icon: Zap, 
                title: "Live Progression", 
                desc: "Status sliders and real-time progress bars ensure total transparency on project delivery.",
                color: "bg-orange-50 text-orange-600"
              },
              { 
                icon: LayoutDashboard, 
                title: "Feedback Loop", 
                desc: "Dedicated suggestion channels for clients to request changes directly on specific tasks.",
                color: "bg-purple-50 text-purple-600"
              }
            ].map((f, i) => (
              <div key={i} className="p-10 rounded-[3rem] bg-white border border-transparent hover:border-primary/20 transition-all group shadow-sm hover:shadow-2xl hover:shadow-primary/10">
                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform", f.color)}>
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold font-headline mb-4 uppercase tracking-tight">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles Section */}
        <section id="workflow" className="py-32 px-6 bg-white border-y border-dashed">
          <div className="max-w-7xl mx-auto space-y-24">
            <div className="text-center space-y-6">
              <h2 className="text-xs font-bold tracking-[0.4em] text-primary uppercase">Workspace Ecosystem</h2>
              <h3 className="text-5xl md:text-7xl font-bold font-headline tracking-tight">Three Roles. <br />One Unified Vision.</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-16">
              <div className="space-y-8 text-center group">
                <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                  <Lock className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold font-headline uppercase tracking-widest">The Admin</h4>
                  <p className="text-muted-foreground text-lg">Orchestrate the entire workspace. Assign developers to clients and track global health.</p>
                </div>
              </div>
              <div className="space-y-8 text-center group">
                <div className="h-24 w-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto transition-all group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white">
                  <Zap className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold font-headline uppercase tracking-widest">The Developer</h4>
                  <p className="text-muted-foreground text-lg">Focused execution environment. Update progress, manage status, and respond to feedback.</p>
                </div>
              </div>
              <div className="space-y-8 text-center group">
                <div className="h-24 w-24 bg-orange-50 text-orange-600 rounded-[2.5rem] flex items-center justify-center mx-auto transition-all group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white">
                  <Users className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-xl font-bold font-headline uppercase tracking-widest">The Client</h4>
                  <p className="text-muted-foreground text-lg">Total project visibility. View live completion rates and provide structured suggestions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-24 px-6 border-t bg-white relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
          <div className="space-y-4">
            <Link href="/" className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
              CloudCRM<span className="text-foreground">.</span>
            </Link>
            <p className="text-muted-foreground text-sm font-medium tracking-wide max-w-sm">
              Advanced task orchestration for distributed teams. Precision built for performance.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-6">
            <div className="flex gap-10">
              <Link href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Privacy Policy</Link>
              <Link href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Terms of Service</Link>
              <Link href="/login" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest border-b-2 border-primary/20 pb-1">Portal Login</Link>
            </div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em]">© 2024 CloudCRM Systems Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
