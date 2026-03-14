import { config } from 'dotenv';
config();

import '@/ai/flows/ai-pricing-recommendation.ts';
import '@/ai/flows/ai-material-cost-optimization.ts';
import '@/ai/flows/generate-estimate-email.ts';
import '@/ai/flows/send-estimate-email.ts';
