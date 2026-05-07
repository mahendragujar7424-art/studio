
'use client';

import * as React from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FinancialsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-bold font-headline tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground mt-2 text-lg">Monitor organizational revenue and project billing cycles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <Badge className="bg-green-100 text-green-700 border-none font-bold text-[9px]">HEALTHY</Badge>
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Gross Revenue</p>
            <h2 className="text-3xl font-bold font-headline mt-1">$124,500.00</h2>
          </Card>

          <Card className="border-none shadow-sm bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[9px]">+12.5%</Badge>
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Invoices</p>
            <h2 className="text-3xl font-bold font-headline mt-1">18 Projects</h2>
          </Card>

          <Card className="border-none shadow-sm bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
              <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[9px]">PENDING</Badge>
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Expected Collections</p>
            <h2 className="text-3xl font-bold font-headline mt-1">$32,800.00</h2>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white rounded-3xl p-10 text-center space-y-4">
          <div className="h-20 w-20 bg-secondary/20 rounded-[2.5rem] flex items-center justify-center mx-auto text-muted-foreground">
            <CreditCard className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold">Ledger Synchronization</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">The detailed financial ledger is currently being updated with the latest project milestones. Detailed reports will appear here.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
