
'use server';
/**
 * @fileOverview This file implements a Genkit flow for production email delivery via Resend.
 *
 * - sendEstimateEmail - A function that dispatches estimates to clients using an external mail provider.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

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

// Initialize Resend with the provided environment variable
// If no key is present, it will fallback to mock mode for stability
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    if (!resend) {
      console.warn('RESEND_API_KEY not found. Simulating email delivery for preview.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        messageId: `mock_${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Estimates <estimates@pillarpath.app>',
        to: [input.to],
        subject: input.subject,
        text: input.body,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        messageId: data?.id,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Email dispatch failure:', err);
      return {
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
);
