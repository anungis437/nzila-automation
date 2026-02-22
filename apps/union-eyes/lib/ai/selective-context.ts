/**
 * Selective Context Mechanism
 * 
 * Implements a Mamba-inspired selective state mechanism for intelligent context selection
 * This provides content-aware filtering similar to Mamba's SSM selection
 * 
 * Key features:
 * - Content-based token selection
 * - Relevance scoring
 * - Dynamic context window management
 * - Priority-based attention
 */

import { logger } from '@/lib/logger';

// Selection configuration
export interface SelectiveConfig {
  maxContextTokens: number;
  selectionThreshold: number;
  enableDynamicPruning: boolean;
  retentionStrategy: 'importance' | 'recency' | 'hybrid';
}

const DEFAULT_CONFIG: SelectiveConfig = {
  maxContextTokens: 4096,
  selectionThreshold: 0.3,
  enableDynamicPruning: true,
  retentionStrategy: 'hybrid',
};

/**
 * Context item with selection metadata
 */
export interface ContextItem {
  id: string;
  content: string;
  type: 'system' | 'user' | 'assistant' | 'document' | 'claim' | 'member';
  timestamp: number;
  importance: number;
  relevance: number;
  metadata?: Record<string, unknown>;
}

/**
 * Selective context manager
 * Mimics Mamba's selective state mechanism
 */
export class SelectiveContextManager {
  private config: SelectiveConfig;
  private contextBuffer: ContextItem[] = [];

  constructor(config: Partial<SelectiveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add item to context buffer
   */
  addItem(item: Omit<ContextItem, 'importance' | 'relevance'>): void {
    // Calculate importance based on content characteristics
    const importance = this.calculateImportance(item.content, item.type);
    
    // Create context item with computed importance
    const contextItem: ContextItem = {
      ...item,
      importance,
      relevance: 1.0, // Will be updated when query is known
    };

    this.contextBuffer.push(contextItem);
    
    // Prune if exceeds max
    if (this.contextBuffer.length > this.config.maxContextTokens / 4) {
      this.pruneContext();
    }
  }

  /**
   * Select relevant context for a query
   */
  selectForQuery(query: string): ContextItem[] {
    if (!query) {
      return this.getRecentContext();
    }

    // Calculate relevance scores
    const queryTerms = this.tokenize(query.toLowerCase());
    
    // Update relevance for all items
    this.contextBuffer.forEach(item => {
      const itemTerms = this.tokenize(item.content.toLowerCase());
      item.relevance = this.calculateRelevance(queryTerms, itemTerms);
    });

    // Score each item
    const scoredItems = this.contextBuffer.map(item => ({
      item,
      score: this.calculateScore(item),
    }));

    // Sort by score descending
    scoredItems.sort((a, b) => b.score - a.score);

    // Select top items within token limit
    let tokenCount = 0;
    const selected: ContextItem[] = [];

    for (const { item } of scoredItems) {
      const itemTokens = item.content.split(/\s+/).length;
      
      if (tokenCount + itemTokens <= this.config.maxContextTokens) {
        selected.push(item);
        tokenCount += itemTokens;
      }
    }

    logger.info('Selective context completed', {
      queryLength: query.length,
      totalItems: this.contextBuffer.length,
      selectedItems: selected.length,
      tokenCount,
    });

    return selected;
  }

  /**
   * Calculate importance score
   */
  private calculateImportance(content: string, type: ContextItem['type']): number {
    // Base importance by type
    const typeWeights: Record<ContextItem['type'], number> = {
      system: 1.0,
      document: 0.9,
      claim: 0.8,
      member: 0.7,
      assistant: 0.6,
      user: 0.5,
    };

    const baseImportance = typeWeights[type] || 0.5;

    // Boost for keywords
    const importantKeywords = [
      'urgent', 'deadline', 'critical', 'important', 'required',
      'grievance', 'contract', 'violation', 'rights', 'legal',
    ];

    const contentLower = content.toLowerCase();
    const keywordBoost = importantKeywords.some(kw => 
      contentLower.includes(kw)
    ) ? 0.2 : 0;

    // Content length factor (prefer substantial content)
    const lengthFactor = Math.min(content.length / 500, 0.1);

    return Math.min(baseImportance + keywordBoost + lengthFactor, 1.0);
  }

  /**
   * Calculate relevance to query
   */
  private calculateRelevance(queryTerms: string[], itemTerms: string[]): number {
    if (queryTerms.length === 0 || itemTerms.length === 0) {
      return 0;
    }

    // Count matching terms
    const matches = queryTerms.filter(term => 
      itemTerms.some(itemTerm => itemTerm.includes(term) || term.includes(itemTerm))
    ).length;

    return matches / queryTerms.length;
  }

  /**
   * Calculate final selection score
   */
  private calculateScore(item: ContextItem): number {
    const { importance, relevance } = item;

    switch (this.config.retentionStrategy) {
      case 'importance':
        return importance * 0.7 + relevance * 0.3;
      case 'recency':
        const recency = this.calculateRecency(item.timestamp);
        return recency * 0.5 + importance * 0.3 + relevance * 0.2;
      case 'hybrid':
      default:
        return importance * 0.4 + relevance * 0.4 + this.calculateRecency(item.timestamp) * 0.2;
    }
  }

  /**
   * Calculate recency score (0-1)
   */
  private calculateRecency(timestamp: number): number {
    const age = Date.now() - timestamp;
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    if (age < hour) return 1.0;
    if (age < day) return 0.8;
    if (age < 7 * day) return 0.6;
    if (age < 30 * day) return 0.4;
    return 0.2;
  }

  /**
   * Tokenize text into terms
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }

  /**
   * Get recent context (no query)
   */
  private getRecentContext(): ContextItem[] {
    // Sort by timestamp descending
    const sorted = [...this.contextBuffer].sort((a, b) => b.timestamp - a.timestamp);
    
    let tokenCount = 0;
    const selected: ContextItem[] = [];

    for (const item of sorted) {
      const itemTokens = item.content.split(/\s+/).length;
      
      if (tokenCount + itemTokens <= this.config.maxContextTokens) {
        selected.push(item);
        tokenCount += itemTokens;
      }
    }

    // Reverse to maintain chronological order
    return selected.reverse();
  }

  /**
   * Prune context buffer
   */
  private pruneContext(): void {
    if (this.contextBuffer.length <= this.config.maxContextTokens / 4) {
      return;
    }

    // Remove lowest scored items
    const scoredItems = this.contextBuffer.map(item => ({
      item,
      score: item.importance * 0.5 + this.calculateRecency(item.timestamp) * 0.5,
    }));

    scoredItems.sort((a, b) => a.score - b.score);

    // Keep top 75%
    const keepCount = Math.floor(this.contextBuffer.length * 0.75);
    this.contextBuffer = scoredItems
      .slice(-keepCount)
      .map(({ item }) => item);

    logger.info('Context pruned', {
      previousCount: scoredItems.length,
      newCount: this.contextBuffer.length,
    });
  }

  /**
   * Clear context
   */
  clear(): void {
    this.contextBuffer = [];
    logger.info('Context cleared');
  }

  /**
   * Get current context info
   */
  getInfo(): {
    itemCount: number;
    estimatedTokens: number;
    config: SelectiveConfig;
  } {
    return {
      itemCount: this.contextBuffer.length,
      estimatedTokens: this.contextBuffer.reduce(
        (sum, item) => sum + item.content.split(/\s+/).length,
        0
      ),
      config: this.config,
    };
  }
}

/**
 * Factory function
 */
export function createSelectiveContext(
  config?: Partial<SelectiveConfig>
): SelectiveContextManager {
  return new SelectiveContextManager(config);
}

// Export singleton
export const selectiveContext = new SelectiveContextManager();
