
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_-20%,rgba(239,68,68,0.05),transparent)] pointer-events-none" />
      
      <div className="w-full max-w-lg relative z-10 space-y-8">
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8">
          <CardHeader className="text-center space-y-4">
            <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline tracking-tight">Restricted Access</CardTitle>
            <CardDescription className="text-lg">
              Public registration is disabled for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6 pt-4">
            <div className="p-6 rounded-2xl bg-secondary/30 border border-dashed border-muted-foreground/20">
              <p className="text-muted-foreground leading-relaxed">
                CloudCRM operates on an invitation-only basis. Only administrators can initialize new developer or client profiles from the management panel.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-14 rounded-2xl text-lg font-bold" asChild>
              <Link href="/login">
                <ArrowLeft className="h-5 w-5 mr-2" /> Back to Login
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Contact your system administrator if you believe this is an error.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
