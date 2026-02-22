'use server';
/**
 * @fileOverview This flow provides an AI-powered pricing recommendation for new estimates.
 *
 * - aiPricingRecommendation - A function that recommends optimal pricing strategies based on historical data.
 * - AIPricingRecommendationInput - The input type for the aiPricingRecommendation function.
 * - AIPricingRecommendationOutput - The return type for the aiPricingRecommendation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIPricingRecommendationInputSchema = z.object({
  tenantId: z.string().describe('The ID of the tenant account.'),
  currentEstimateDetails: z.object({
    materialCosts: z.number().describe('Total estimated material cost for the current estimate.'),
    laborCosts: z.number().describe('Total estimated labor cost for the current estimate.'),
    estimatedTotalCost: z.number().describe('Sum of material and labor costs.'),
    styleIds: z.array(z.string()).describe('List of fence, post, or gate style IDs used in the estimate.'),
    customerSegment: z.string().optional().describe('Segment of the customer (e.g., residential, commercial).'),
    jobLocationArea: z.string().optional().describe('Geographic area or type of job location (e.g., urban, rural).'),
    currentPricingMethod: z.enum(['margin', 'markup']).optional().describe('The current pricing method the user is considering.'),
  }).describe('Details about the estimate currently being created.'),
  targetProfitability: z.number().min(0).max(1).optional().describe('Optional desired profitability as a decimal (e.g., 0.20 for 20%).'),
});
export type AIPricingRecommendationInput = z.infer<typeof AIPricingRecommendationInputSchema>;

const AIPricingRecommendationOutputSchema = z.object({
  recommendedPricingStrategy: z.object({
    method: z.enum(['margin', 'markup']).describe('The recommended pricing method.'),
    value: z.number().describe('The recommended percentage value (e.g., 0.25 for 25% margin/markup).'),
  }).describe('The recommended pricing strategy.'),
  confidenceScore: z.number().min(0).max(1).describe('A score indicating the AI\'s confidence in the recommendation (0-1).'),
  reasoning: z.string().describe('An explanation for the recommended pricing strategy.'),
  historicalContextSummary: z.string().describe('A brief summary of historical data patterns used for the recommendation.'),
});
export type AIPricingRecommendationOutput = z.infer<typeof AIPricingRecommendationOutputSchema>;

/**
 * Mocks fetching historical estimate data from a database.
 * In a real application, this would query Firestore based on tenantId and estimate details.
 * For this implementation, it returns static dummy data.
 */
const getHistoricalEstimateData = ai.defineTool(
  {
    name: 'getHistoricalEstimateData',
    description: 'Retrieves historical estimate data for a given tenant, filtering by similar estimate details.',
    inputSchema: z.object({
      tenantId: z.string(),
      styleIds: z.array(z.string()).optional(),
      customerSegment: z.string().optional(),
      jobLocationArea: z.string().optional(),
      estimatedTotalCost: z.number().optional(),
    }),
    outputSchema: z.array(z.object({
      estimateId: z.string(),
      pricingMethod: z.enum(['margin', 'markup']),
      pricingValue: z.number(), // As a decimal, e.g., 0.20 for 20%
      acceptanceStatus: z.enum(['accepted', 'rejected', 'pending']),
      actualProfitability: z.number().optional(), // Actual profit as a decimal relative to sale price
      estimateDetailsSnapshot: z.object({
        materialCosts: z.number(),
        laborCosts: z.number(),
        styleIds: z.array(z.string()),
        customerSegment: z.string().optional(),
        jobLocationArea: z.string().optional(),
      }),
    })),
  },
  async (input) => {
    // This is a mock implementation. In a real scenario, this would query Firestore.
    // Simulating a delay for a database call.
    await new Promise(resolve => setTimeout(resolve, 200));

    const dummyData = [
      {
        estimateId: 'est_001',
        pricingMethod: 'margin',
        pricingValue: 0.25,
        acceptanceStatus: 'accepted',
        actualProfitability: 0.22,
        estimateDetailsSnapshot: { materialCosts: 1000, laborCosts: 500, styleIds: ['style_A'], customerSegment: 'residential', jobLocationArea: 'suburban' },
      },
      {
        estimateId: 'est_002',
        pricingMethod: 'markup',
        pricingValue: 0.35,
        acceptanceStatus: 'rejected',
        actualProfitability: 0.10, // Lower profitability due to rejection and re-negotiation
        estimateDetailsSnapshot: { materialCosts: 1200, laborCosts: 600, styleIds: ['style_B'], customerSegment: 'residential', jobLocationArea: 'urban' },
      },
      {
        estimateId: 'est_003',
        pricingMethod: 'margin',
        pricingValue: 0.30,
        acceptanceStatus: 'accepted',
        actualProfitability: 0.28,
        estimateDetailsSnapshot: { materialCosts: 800, laborCosts: 400, styleIds: ['style_A', 'style_C'], customerSegment: 'commercial', jobLocationArea: 'urban' },
      },
      {
        estimateId: 'est_004',
        pricingMethod: 'margin',
        pricingValue: 0.20,
        acceptanceStatus: 'accepted',
        actualProfitability: 0.19,
        estimateDetailsSnapshot: { materialCosts: 1100, laborCosts: 550, styleIds: ['style_A'], customerSegment: 'residential', jobLocationArea: 'suburban' },
      },
      {
        estimateId: 'est_005',
        pricingMethod: 'markup',
        pricingValue: 0.40,
        acceptanceStatus: 'rejected',
        actualProfitability: undefined,
        estimateDetailsSnapshot: { materialCosts: 900, laborCosts: 450, styleIds: ['style_D'], customerSegment: 'residential', jobLocationArea: 'rural' },
      },
    ];

    // Filter dummy data based on some input parameters for simulation
    return dummyData.filter(estimate => {
      let match = true;
      if (input.styleIds && !input.styleIds.some(id => estimate.estimateDetailsSnapshot.styleIds.includes(id))) {
        match = false;
      }
      if (input.customerSegment && estimate.estimateDetailsSnapshot.customerSegment !== input.customerSegment) {
        match = false;
      }
      if (input.jobLocationArea && estimate.estimateDetailsSnapshot.jobLocationArea !== input.jobLocationArea) {
        match = false;
      }
      // Simple cost proximity check for demonstration
      if (input.estimatedTotalCost) {
        const historicalCost = estimate.estimateDetailsSnapshot.materialCosts + estimate.estimateDetailsSnapshot.laborCosts;
        if (Math.abs(historicalCost - input.estimatedTotalCost) / input.estimatedTotalCost > 0.3) { // within 30%
          match = false;
        }
      }
      return match;
    });
  }
);

const aiPricingRecommendationPrompt = ai.definePrompt({
  name: 'aiPricingRecommendationPrompt',
  input: { schema: AIPricingRecommendationInputSchema },
  output: { schema: AIPricingRecommendationOutputSchema },
  tools: [getHistoricalEstimateData], // Make the tool available to the LLM
  prompt: `You are an expert pricing strategist for fence contractors. Your goal is to recommend an optimal pricing strategy for a new estimate based on historical data to maximize acceptance rates and profitability.

Use the provided historical estimate data and the details of the current estimate to formulate your recommendation.

### Current Estimate Details:
- Material Costs: {{{currentEstimateDetails.materialCosts}}}
- Labor Costs: {{{currentEstimateDetails.laborCosts}}}
- Estimated Total Cost (Material + Labor): {{{currentEstimateDetails.estimatedTotalCost}}}
- Style IDs: {{{currentEstimateDetails.styleIds.join(', ')}}}
{{#if currentEstimateDetails.customerSegment}}- Customer Segment: {{{currentEstimateDetails.customerSegment}}}{{/if}}
{{#if currentEstimateDetails.jobLocationArea}}- Job Location Area: {{{currentEstimateDetails.jobLocationArea}}}{{/if}}
{{#if currentEstimateDetails.currentPricingMethod}}- User is currently considering: {{{currentEstimateDetails.currentPricingMethod}}}{{/if}}
{{#if targetProfitability}}- Desired Profitability: {{{targetProfitability}}}{{/if}}

### Instructions for Recommendation:
1. Analyze the provided historical data, especially focusing on estimates similar to the current one in terms of styles, costs, customer segment, and job location.
2. Identify patterns in acceptance rates and actual profitability associated with different pricing methods (margin or markup) and their respective values.
3. Propose a specific pricing method (margin or markup) and a percentage value (as a decimal, e.g., 0.25 for 25%).
4. Provide a confidence score (0-1) for your recommendation.
5. Give a clear and concise reasoning for your recommendation, referencing the historical data patterns.
6. Summarize the key insights from the historical context that led to your decision.`,
});

const aiPricingRecommendationFlow = ai.defineFlow(
  {
    name: 'aiPricingRecommendationFlow',
    inputSchema: AIPricingRecommendationInputSchema,
    outputSchema: AIPricingRecommendationOutputSchema,
  },
  async (input) => {
    // Call the tool to get historical data
    const historicalData = await getHistoricalEstimateData({
      tenantId: input.tenantId,
      styleIds: input.currentEstimateDetails.styleIds,
      customerSegment: input.currentEstimateDetails.customerSegment,
      jobLocationArea: input.currentEstimateDetails.jobLocationArea,
      estimatedTotalCost: input.currentEstimateDetails.estimatedTotalCost,
    });

    // Append historical data to the prompt input. The LLM will receive this via the tool response.
    // For this specific flow, we are passing `input` directly to the prompt.
    // The prompt's system instructions and the `getHistoricalEstimateData` tool
    // are designed to guide the LLM to use the tool and interpret its results.
    const { output } = await aiPricingRecommendationPrompt(input);
    return output!;
  }
);

export async function aiPricingRecommendation(
  input: AIPricingRecommendationInput
): Promise<AIPricingRecommendationOutput> {
  return aiPricingRecommendationFlow(input);
}
