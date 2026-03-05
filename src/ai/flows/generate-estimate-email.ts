'use server';
/**
 * @fileOverview This flow generates a professional email draft for sending estimates to clients.
 *
 * - generateEstimateEmail - A function that drafts a personalized email based on estimate details.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateEmailInputSchema = z.object({
  customerName: z.string(),
  estimateTotal: z.number(),
  portalUrl: z.string(),
  businessName: z.string(),
});

const GenerateEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

const emailPrompt = ai.definePrompt({
  name: 'generateEstimateEmail',
  input: { schema: GenerateEmailInputSchema },
  output: { schema: GenerateEmailOutputSchema },
  prompt: `You are a professional office manager for a high-end fence construction company named {{{businessName}}}.
  
Your task is to write a polite, professional, and clear email to a client, {{{customerName}}}, regarding their new project estimate.

The email should:
1. Mention the business name: {{{businessName}}}.
2. State the total amount of the estimate: \$ {{{estimateTotal}}}.
3. Provide them with a clear Call to Action to view the full details and pay their deposit via their private portal link: {{{portalUrl}}}.
4. Be concise and friendly.

Return the result as a JSON object with 'subject' and 'body' fields.`,
});

export async function generateEstimateEmail(input: z.infer<typeof GenerateEmailInputSchema>) {
  const { output } = await emailPrompt(input);
  return output!;
}
