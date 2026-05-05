
"use client";

import * as React from "react";
import { Sparkles, Loader2, Copy, Check, Wand2 } from "lucide-react";
import { generateProjectDescription } from "@/ai/flows/generate-project-description";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function AIDescriptionTool() {
  const [keywords, setKeywords] = React.useState("");
  const [outline, setOutline] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords && !outline) {
      toast({
        title: "Input Required",
        description: "Please provide keywords or an outline.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { description } = await generateProjectDescription({ keywords, outline });
      setResult(description);
    } catch (error) {
      toast({
        title: "Generation Error",
        description: "Failed to generate description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Description copied to clipboard.",
    });
  };

  return (
    <Card className="max-w-2xl mx-auto border-2 border-primary/20 bg-background/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10 py-8">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl font-headline font-bold">
          <Wand2 className="h-7 w-7 text-primary animate-pulse" />
          AI Portfolio Assistant
        </CardTitle>
        <CardDescription className="text-center text-lg max-w-md mx-auto">
          Need a professional blurb for your project? Let AI craft a compelling description for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Key Features / Keywords</label>
            <Input
              placeholder="e.g. Modern, SaaS Dashboard, Minimalist, Next.js"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="h-14 rounded-2xl border-2 bg-secondary/10 focus:bg-background transition-all"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">Brief Project Outline</label>
            <Textarea
              placeholder="Tell the AI what the project does in a few words..."
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              className="min-h-[120px] rounded-2xl border-2 bg-secondary/10 focus:bg-background transition-all"
            />
          </div>
          <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/10 hover:shadow-primary/30 transition-all" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Crafting magic...
              </>
            ) : (
              <span className="flex items-center gap-2">Generate Professional Blurb <Sparkles className="h-5 w-5" /></span>
            )}
          </Button>
        </form>

        {result && (
          <div className="mt-10 p-8 rounded-2xl bg-primary/5 border-2 border-primary/20 relative group animate-in fade-in slide-in-from-bottom-5 duration-500 shadow-inner">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Generated Result:</span>
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-4 rounded-full border-2 bg-background hover:bg-primary hover:text-white transition-all shadow-sm"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-lg leading-relaxed font-medium italic text-foreground/80">"{result}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
