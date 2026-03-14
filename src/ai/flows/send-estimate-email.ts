'use server';
/**
 * @fileOverview This file implements a Genkit flow for the actual delivery of estimate emails.
 *
 * - sendEstimateEmail - A function that handles the dispatch process to a mail provider.
 * - SendEmailInput - The input type for the sendEstimateEmail function.
 * - SendEmailOutput - The return type for the sendEstimateEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendEmailInputSchema = z.object({
  to: z.string().email().describe('The recipient email address.'),
  subject: z.string().describe('The email subject line.'),
  body: z.string().describe('The content of the email.'),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

const SendEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was successfully dispatched.'),
  messageId: z.string().optional().describe('A unique identifier for the sent message.'),
  timestamp: z.string().describe('ISO timestamp of the dispatch.'),
});
export type SendEmailOutput = z.infer<typeof SendEmailOutputSchema>;

export async function sendEstimateEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  return sendEstimateEmailFlow(input);
}

const sendEstimateEmailFlow = ai.defineFlow(
  {
    name: 'sendEstimateEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: SendEmailOutputSchema,
  },
  async (input) => {
    // This is the active implementation of the email service.
    // In a production environment, you would integrate a provider like Resend or SendGrid here.
    
    console.log(`[PROTOTYPE] Dispatched email to: ${input.to}`);
    console.log(`[PROTOTYPE] Subject: ${input.subject}`);
    
    // Simulate real-world delivery latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      messageId: `sent_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
    };
  }
);
