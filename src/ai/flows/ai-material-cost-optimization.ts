'use server';
/**
 * @fileOverview This file implements a Genkit flow for AI-powered material cost optimization.
 * It suggests alternative, more cost-effective materials or optimized quantities for a Bill of Materials
 * based on historical project data and current material costs.
 *
 * - optimizeMaterialCosts - A function that handles the material cost optimization process.
 * - AIMaterialCostOptimizationInput - The input type for the optimizeMaterialCosts function.
 * - AIMaterialCostOptimizationOutput - The return type for the optimizeMaterialCosts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIMaterialCostOptimizationInputSchema = z.object({
  currentStyle: z.object({
    name: z.string().describe('The name of the current style or estimate being analyzed.'),
    description: z.string().describe('A description of the current style or estimate.'),
  }).describe('Details about the current fence style or estimate.'),
  billOfMaterials: z.array(z.object({
    materialId: z.string().describe('Unique identifier for the material.'),
    materialName: z.string().describe('Human-readable name of the material.'),
    quantityPerUnit: z.number().describe('Quantity of this material needed per unit of the style (e.g., per foot or per section).'),
    wastePct: z.number().optional().describe('Optional waste percentage for this material, as a decimal (e.g., 0.05 for 5%).'),
  })).describe('The current Bill of Materials for the style or estimate.'),
  currentMaterialCosts: z.record(z.string(), z.number()).describe('A map where keys are material IDs and values are their current unit costs.'),
  historicalProjectInsights: z.string().describe('Summarized insights from historical project data regarding material performance, common alternatives, and cost-effectiveness. E.g., "For wood fences, composite alternatives have shown 15% cost savings with similar durability. PVC gates often require less labor."'),
  optimizationGoals: z.string().optional().describe('Specific goals for optimization, e.g., "reduce overall material cost by 10%", "find alternatives for Material X".'),
});
export type AIMaterialCostOptimizationInput = z.infer<typeof AIMaterialCostOptimizationInputSchema>;

const AIMaterialCostOptimizationOutputSchema = z.object({
  suggestions: z.array(z.object({
    type: z.enum(['alternativeMaterial', 'optimizedQuantity', 'generalRecommendation']).describe('Type of suggestion: alternative material, optimized quantity, or a general recommendation.'),
    originalMaterialId: z.string().optional().describe('The ID of the original material if the suggestion is for an alternative or quantity optimization.'),
    originalMaterialName: z.string().optional().describe('The name of the original material.'),
    suggestedMaterialId: z.string().optional().describe('The ID of the suggested alternative material.'),
    suggestedMaterialName: z.string().optional().describe('The name of the suggested alternative material.'),
    suggestedQuantityPerUnit: z.number().optional().describe('The optimized quantity per unit, if applicable. This replaces the original quantity.'),
    costSavingsEstimate: z.number().optional().describe('Estimated cost savings for this specific suggestion in USD.'),
    rationale: z.string().describe('Explanation for the suggestion, including how it maintains quality and meets optimization goals.'),
  })).describe('A list of suggestions for material cost optimization.'),
  overallSummary: z.string().describe('An overall summary of the optimization potential, key considerations, and impact.'),
});
export type AIMaterialCostOptimizationOutput = z.infer<typeof AIMaterialCostOptimizationOutputSchema>;

export async function optimizeMaterialCosts(input: AIMaterialCostOptimizationInput): Promise<AIMaterialCostOptimizationOutput> {
  return aiMaterialCostOptimizationFlow(input);
}

const aiMaterialCostOptimizationPrompt = ai.definePrompt({
  name: 'aiMaterialCostOptimizationPrompt',
  input: {schema: AIMaterialCostOptimizationInputSchema},
  output: {schema: AIMaterialCostOptimizationOutputSchema},
  prompt: `You are an expert in fence construction materials and cost optimization. Your task is to analyze the provided Bill of Materials (BOM) for a fence style or estimate, current material costs, and historical project insights to suggest alternative, more cost-effective materials or optimized quantities. The goal is to reduce material expenses without compromising quality.\n\nCurrent Style/Estimate Details:\nName: {{{currentStyle.name}}}\nDescription: {{{currentStyle.description}}}\n\nCurrent Bill of Materials:\n{{#each billOfMaterials}}\n- Material Name: "{{{materialName}}}" (ID: {{{materialId}}})\n  Quantity per unit of style: {{{quantityPerUnit}}}\n  Waste percentage: {{#if wastePct}}{{{wastePct}}}{{else}}0{{/if}}%\n  Current Unit Cost: $\u007b\u007blookup ../currentMaterialCosts materialId\u007d\u007d\n{{/each}}\n\nCurrent Material Unit Costs (materialId: unitCost):\n{{#each currentMaterialCosts}}\n- {{{ @key }}}: $\u007b\u007b this }}\u007d\n{{/each}}\n\nHistorical Project Insights:\n{{{historicalProjectInsights}}}\n\nOptimization Goals:\n{{#if optimizationGoals}}\n{{{optimizationGoals}}}\n{{else}}\nThe primary goal is to find opportunities to reduce material costs while maintaining or improving quality and durability.\n{{/if}}\n\nBased on the information above, provide concrete suggestions in JSON format for material cost optimization. For each suggestion, clearly state its type, the original material (if applicable), the suggested alternative or optimized quantity, the estimated cost savings, and a detailed rationale emphasizing quality and durability. Also provide an overall summary.\n`,
});

const aiMaterialCostOptimizationFlow = ai.defineFlow(
  {
    name: 'aiMaterialCostOptimizationFlow',
    inputSchema: AIMaterialCostOptimizationInputSchema,
    outputSchema: AIMaterialCostOptimizationOutputSchema,
  },
  async (input) => {
    const {output} = await aiMaterialCostOptimizationPrompt(input);
    return output!;
  }
);
