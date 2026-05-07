'use server';
/**
 * @fileOverview A Genkit flow for generating detailed technical requirements for project tasks.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaskBriefInputSchema = z.object({
  title: z.string().describe('The short title of the task or project.'),
  context: z.string().optional().describe('Additional context or rough notes about the requirements.'),
});
export type GenerateTaskBriefInput = z.infer<typeof GenerateTaskBriefInputSchema>;

const GenerateTaskBriefOutputSchema = z.object({
  description: z.string().describe('A detailed technical brief including requirements and objectives.'),
});
export type GenerateTaskBriefOutput = z.infer<typeof GenerateTaskBriefOutputSchema>;

export async function generateTaskBrief(
  input: GenerateTaskBriefInput
): Promise<GenerateTaskBriefOutput> {
  return generateTaskBriefFlow(input);
}

const generateTaskBriefPrompt = ai.definePrompt({
  name: 'generateTaskBriefPrompt',
  input: {schema: GenerateTaskBriefInputSchema},
  output: {schema: GenerateTaskBriefOutputSchema},
  prompt: `You are an expert Technical Project Manager. 
Expand the following task title into a professional technical brief for a developer.
Include:
1. Core Objective
2. Technical Requirements
3. Definition of Done

Task Title: {{{title}}}
{{#if context}}Additional Context: {{{context}}}{{/if}}

Keep it concise but comprehensive (around 100-150 words).`,
});

const generateTaskBriefFlow = ai.defineFlow(
  {
    name: 'generateTaskBriefFlow',
    inputSchema: GenerateTaskBriefInputSchema,
    outputSchema: GenerateTaskBriefOutputSchema,
  },
  async input => {
    const {output} = await generateTaskBriefPrompt(input);
    return output!;
  }
);
