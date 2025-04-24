// src/ai/flows/suggest-tags.ts
'use server';

/**
 * @fileOverview Suggests relevant tags for a task based on its description.
 *
 * - suggestTags - A function that suggests tags for a given task description.
 * - SuggestTagsInput - The input type for the suggestTags function.
 * - SuggestTagsOutput - The return type for the suggestTags function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestTagsInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the task for which to suggest tags.'),
});
export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;

const SuggestTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of suggested tags for the task.'),
});
export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
  return suggestTagsFlow(input);
}

const suggestTagsPrompt = ai.definePrompt({
  name: 'suggestTagsPrompt',
  input: {
    schema: z.object({
      description: z
        .string()
        .describe('The description of the task for which to suggest tags.'),
    }),
  },
  output: {
    schema: z.object({
      tags: z
        .array(z.string())
        .describe('An array of suggested tags for the task.'),
    }),
  },
  prompt: `Suggest relevant tags for the following task description.  Return a simple JSON array of strings.

Description: {{{description}}}

Tags:`, // Prompt to suggest tags based on the task description
});

const suggestTagsFlow = ai.defineFlow<
  typeof SuggestTagsInputSchema,
  typeof SuggestTagsOutputSchema
>({
  name: 'suggestTagsFlow',
  inputSchema: SuggestTagsInputSchema,
  outputSchema: SuggestTagsOutputSchema,
},
async input => {
  const {output} = await suggestTagsPrompt(input);
  return output!;
});
