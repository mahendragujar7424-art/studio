
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Receipt, Download, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">Billing & Invoices</h1>
            <p className="text-muted-foreground mt-2 text-lg">Manage your project investments and payment records.</p>
          </div>
          <Button variant="outline" className="h-12 rounded-xl border-2 font-bold gap-2">
            <Download className="h-4 w-4" /> Export All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground rounded-3xl p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <div className="relative z-10 space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Outstanding Balance</p>
              <h2 className="text-5xl font-bold font-headline">$4,250.00</h2>
              <div className="flex gap-4 pt-4">
                <Button className="bg-white text-primary hover:bg-white/90 rounded-xl h-12 px-8 font-bold">Pay Now</Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl h-12 font-bold">View Details</Button>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl p-8 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Last Payment</p>
                <p className="font-bold text-lg">$2,500.00 • Feb 12, 2024</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Next Scheduled</p>
                <p className="font-bold text-lg">$1,750.00 • Mar 01, 2024</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-none">
                <TableHead className="px-8 font-bold uppercase text-[10px] py-6">Invoice ID</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Project Item</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Amount</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                <TableHead className="px-8 text-right font-bold uppercase text-[10px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { id: 'INV-2024-001', project: 'Frontend Redesign', amount: '$2,500', status: 'PAID', date: 'Feb 12' },
                { id: 'INV-2024-002', project: 'API Integration', amount: '$1,750', status: 'PENDING', date: 'Feb 15' },
              ].map((inv) => (
                <TableRow key={inv.id} className="border-muted/20">
                  <TableCell className="px-8 font-bold text-sm">{inv.id}</TableCell>
                  <TableCell className="text-sm">{inv.project}</TableCell>
                  <TableCell className="font-bold text-sm">{inv.amount}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'PAID' ? 'secondary' : 'outline'} className={cn(
                      "rounded-full font-bold text-[9px]",
                      inv.status === 'PAID' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                    )}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <Button variant="ghost" size="sm" className="font-bold text-xs">Download PDF</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
