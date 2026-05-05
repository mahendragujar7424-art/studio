'use server';
/**
 * @fileOverview A Genkit flow for generating compelling and concise project descriptions for a portfolio.
 *
 * - generateProjectDescription - A function that handles the project description generation process.
 * - GenerateProjectDescriptionInput - The input type for the generateProjectDescription function.
 * - GenerateProjectDescriptionOutput - The return type for the generateProjectDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectDescriptionInputSchema = z.object({
  keywords: z.string().optional().describe('Comma-separated keywords describing the project.'),
  outline: z.string().optional().describe('A brief outline or summary of the project.'),
});
export type GenerateProjectDescriptionInput = z.infer<typeof GenerateProjectDescriptionInputSchema>;

const GenerateProjectDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated compelling and concise project description.'),
});
export type GenerateProjectDescriptionOutput = z.infer<typeof GenerateProjectDescriptionOutputSchema>;

export async function generateProjectDescription(
  input: GenerateProjectDescriptionInput
): Promise<GenerateProjectDescriptionOutput> {
  return generateProjectDescriptionFlow(input);
}

const generateProjectDescriptionPrompt = ai.definePrompt({
  name: 'generateProjectDescriptionPrompt',
  input: {schema: GenerateProjectDescriptionInputSchema},
  output: {schema: GenerateProjectDescriptionOutputSchema},
  prompt: `You are an expert copywriter specializing in creating compelling and concise project descriptions for professional web designers' portfolios.
Your goal is to craft a description for a project based on the provided keywords and/or outline.
The description should be professional, engaging, and highlight the key aspects and achievements of the project.
Keep the description concise, ideally between 50-100 words.

{{#if outline}}
Project Outline: {{{outline}}}
{{else if keywords}}
Project Keywords: {{{keywords}}}
{{else}}
Please provide keywords or an outline for the project.
{{/if}}`,
});

const generateProjectDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProjectDescriptionFlow',
    inputSchema: GenerateProjectDescriptionInputSchema,
    outputSchema: GenerateProjectDescriptionOutputSchema,
  },
  async input => {
    // Validate that at least one of keywords or outline is provided.
    if (!input.keywords && !input.outline) {
      throw new Error('Either keywords or an outline must be provided to generate a project description.');
    }

    const {output} = await generateProjectDescriptionPrompt(input);
    return output!;
  }
);
