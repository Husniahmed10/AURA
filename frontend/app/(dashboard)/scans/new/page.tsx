'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';
import { AttackCategory } from '@/types/api';

const formSchema = z.object({
  target_url: z.string().url({ message: 'Please enter a valid URL' }),
  max_attacks: z.number().min(10).max(500),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewScanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target_url: 'http://localhost:8001',
      max_attacks: 50,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const allCategories: AttackCategory[] = [
        "prompt_injection", "jailbreak", "data_extraction", 
        "guardrail_bypass", "agent_specific"
      ];
      
      const response = await api.startScan({
        target_url: values.target_url,
        scope: allCategories,
        max_attacks: values.max_attacks,
        timeout_seconds: 600,
      });
      
      router.push(`/scans/${response.scan_id}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto mt-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Assessment</h1>
        <p className="text-muted-foreground">Configure and launch a new red team scan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Configuration</CardTitle>
          <CardDescription>Enter the target URL and attack parameters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="target_url">Target URL (LLM Application / Chatbot)</Label>
              <Input
                id="target_url"
                placeholder="http://localhost:8001"
                {...form.register('target_url')}
              />
              {form.formState.errors.target_url && (
                <p className="text-sm text-destructive">{form.formState.errors.target_url.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_attacks">Maximum Attacks Fired</Label>
              <Input
                id="max_attacks"
                type="number"
                {...form.register('max_attacks', { valueAsNumber: true })}
              />
              <p className="text-sm text-muted-foreground">The agent will stop exploring if it reaches this limit.</p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Scan...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Launch Red Team Agent
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
