
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
  error: z.string().optional().describe('Error message if dispatch failed.'),
  messageId: z.string().optional().describe('A unique identifier for the sent message.'),
  timestamp: z.string().describe('ISO timestamp of the dispatch.'),
});
export type SendEmailOutput = z.infer<typeof SendEmailOutputSchema>;

// Initialize Resend with the provided environment variable
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
      return {
        success: false,
        error: 'RESEND_API_KEY is not configured in the environment.',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // NOTE: Using onboarding@resend.dev for initial compatibility. 
      // To use a custom domain, you must verify it in your Resend dashboard.
      const { data, error } = await resend.emails.send({
        from: 'Estimates <onboarding@resend.dev>',
        to: [input.to],
        subject: input.subject,
        text: input.body,
      });

      if (error) {
        console.error('Resend delivery error:', error);
        return {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        messageId: data?.id,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Email flow exception:', err);
      return {
        success: false,
        error: err.message || 'An unexpected error occurred during dispatch.',
        timestamp: new Date().toISOString(),
      };
    }
  }
);
