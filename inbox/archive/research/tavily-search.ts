import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import axios from 'axios';

const inputSchema = z.object({
  query: z.string().describe('Search query'),
  max_results: z.number().optional().default(5).describe('Maximum number of results to return'),
  topic: z.enum(['general', 'news', 'finance']).optional().default('general').describe('Search topic category'),
  include_answer: z.boolean().optional().default(false).describe('Include AI-generated answer to the query'),
  include_raw_content: z.boolean().optional().default(false).describe('Include full text of found web pages'),
  include_images: z.boolean().optional().default(false).describe('Include images in search results'),
  include_image_descriptions: z.boolean().optional().default(false).describe('Include descriptions of images'),
  search_depth: z.enum(['basic', 'advanced']).optional().default('basic').describe('Search depth level'),
  time_range: z.enum(['day', 'week', 'month', 'year']).optional().describe('Time filter for results'),
  days: z.number().optional().default(7).describe('Number of days to search (only for topic="news")'),
  include_domains: z.array(z.string()).optional().describe('Limit search to these domains'),
  exclude_domains: z.array(z.string()).optional().describe('Exclude these domains from search'),
});

const outputSchema = z.object({
  results: z.array(z.object({
    title: z.string(),
    url: z.string(),
    content: z.string().describe('Snippet or summary of the page'),
    score: z.number().optional().describe('Relevance score'),
    published_date: z.string().nullable().optional(),
    raw_content: z.string().nullable().optional().describe('Full text if include_raw_content is true'),
  })),
  answer: z.string().nullable().optional().describe('AI-generated answer if include_answer is true'),
  images: z.array(z.object({
    url: z.string(),
    description: z.string().nullable().optional(),
  })).optional(),
  query: z.string().describe('The processed query'),
  response_time: z.number().optional().describe('API response time in milliseconds'),
});

export const tavilySearchTool = createTool({
  id: 'tavily-search',
  description: 'Search the web using Tavily Search API. Provides high-quality search results with optional AI-generated answers and raw content. Requires TAVILY_API_KEY environment variable.',
  inputSchema,
  outputSchema,
  execute: async ({ context }) => {
    const {
      query,
      max_results,
      topic,
      include_answer,
      include_raw_content,
      include_images,
      include_image_descriptions,
      search_depth,
      time_range,
      days,
      include_domains,
      exclude_domains,
    } = context;
    
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY environment variable is not set');
    }

    try {
      const startTime = Date.now();
      
      const requestBody: any = {
        query,
        max_results,
        topic,
        include_answer,
        include_raw_content,
        include_images,
        include_image_descriptions,
        search_depth,
      };

      // Only add optional parameters if they're provided
      if (time_range) requestBody.time_range = time_range;
      if (topic === 'news' && days !== undefined) requestBody.days = days;
      if (include_domains && include_domains.length > 0) requestBody.include_domains = include_domains;
      if (exclude_domains && exclude_domains.length > 0) requestBody.exclude_domains = exclude_domains;

      const response = await axios.post('https://api.tavily.com/search', requestBody, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const results = response.data.results?.map((result: any) => ({
        title: result.title || '',
        url: result.url || '',
        content: result.content || '',
        score: result.score,
        published_date: result.published_date || undefined,
        raw_content: result.raw_content || undefined,
      })) || [];

      const images = response.data.images?.map((image: any) => ({
        url: image.url || '',
        description: image.description || undefined,
      })) || undefined;

      return {
        results,
        answer: response.data.answer || undefined,
        images: include_images ? images : undefined,
        query: response.data.query || query,
        response_time: responseTime,
      };
    } catch (error) {
      console.error('Tavily Search API error:', error);
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401) {
          throw new Error('Invalid Tavily API key');
        } else if (status === 429) {
          throw new Error('Tavily API rate limit exceeded');
        } else if (status === 400) {
          throw new Error(`Bad request: ${error.response.data?.detail || 'Invalid parameters'}`);
        }
      }
      throw new Error(`Failed to search with Tavily: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});