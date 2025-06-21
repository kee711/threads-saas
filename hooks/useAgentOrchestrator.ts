import { useState, useCallback } from 'react';
import { ContentRequest, ContentResponse } from '@/lib/agents/types';
import { Strategy, PerformancePrediction, ConversationMessage } from '@/components/agents/types';

interface UseAgentOrchestratorReturn {
  generateWithAgents: (request: ContentRequest) => Promise<ContentResponse | null>;
  analyzeStrategy: (content: string) => Promise<Strategy | null>;
  predictPerformance: (content: string) => Promise<PerformancePrediction | null>;
  processConversation: (message: string) => Promise<ConversationMessage[]>;
  isLoading: boolean;
  error: string | null;
}

export function useAgentOrchestrator(): UseAgentOrchestratorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWithAgents = useCallback(async (request: ContentRequest): Promise<ContentResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Content generation failed';
      setError(errorMessage);
      console.error('Agent content generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeStrategy = useCallback(async (content: string): Promise<Strategy | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/analyze-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.strategy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Strategy analysis failed';
      setError(errorMessage);
      console.error('Strategy analysis error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const predictPerformance = useCallback(async (content: string): Promise<PerformancePrediction | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/predict-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.prediction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Performance prediction failed';
      setError(errorMessage);
      console.error('Performance prediction error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processConversation = useCallback(async (message: string): Promise<ConversationMessage[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.messages || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Conversation processing failed';
      setError(errorMessage);
      console.error('Conversation processing error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateWithAgents,
    analyzeStrategy,
    predictPerformance,
    processConversation,
    isLoading,
    error,
  };
} 