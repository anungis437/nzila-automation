// @ts-nocheck
/**
 * AI Chatbot Service
 * 
 * Union rights Q&A bot with RAG (Retrieval-Augmented Generation)
 * Multi-provider support: OpenAI, Anthropic, Google
 * Vector search with pgvector
 */

import { db } from "@/db";
import {
  chatSessions,
  chatMessages,
  knowledgeBase,
  chatbotSuggestions,
  chatbotAnalytics,
  aiSafetyFilters,
  type NewChatSession,
  type NewChatMessage,
  type NewKnowledgeBase,
  type ChatSession,
  type ChatMessage,
} from "@/db/schema";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import { createHash } from "crypto";
import { embeddingCache } from "@/lib/services/ai/embedding-cache";
import { logger } from "@/lib/logger";

// AI Provider interfaces
interface AIProvider {
  generateResponse(
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<{
    content: string;
    tokensUsed: number;
    model: string;
  }>;
  
  generateEmbedding(text: string): Promise<number[]>;
}

/**
 * OpenAI Provider
 */
class OpenAIProvider implements AIProvider {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    options: { model?: string; temperature?: number; maxTokens?: number } = {}
  ) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-4",
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
      model: data.model,
    };
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    const model = "text-embedding-ada-002";
    
    // Check cache first
    const cachedEmbedding = await embeddingCache.getCachedEmbedding(text, model);
    
    if (cachedEmbedding) {
      logger?.debug('Using cached embedding (chatbot)', { 
        model,
        textLength: text.length 
      });
      return cachedEmbedding;
    }

    // Cache miss - call OpenAI API
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI embeddings API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const embedding = data.data[0].embedding;
    
    // Store in cache for future use (non-blocking)
    embeddingCache.setCachedEmbedding(text, model, embedding).catch(err => {
      logger?.warn('Failed to cache embedding (chatbot)', { error: err.message });
    });
    
    return embedding;
  }
}

/**
 * Anthropic Provider
 */
class AnthropicProvider implements AIProvider {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    options: { model?: string; temperature?: number; maxTokens?: number } = {}
  ) {
    // Convert messages format for Anthropic
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model || "claude-3-opus-20240229",
        messages: conversationMessages,
        system: systemMessage?.content,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.content[0].text,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
      model: data.model,
    };
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    // Anthropic doesn&apos;t have embeddings API, fallback to OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error("OpenAI API key required for embeddings");
    }
    
    const openai = new OpenAIProvider(openaiKey);
    return openai.generateEmbedding(text);
  }
}

/**
 * Google AI Provider
 */
class GoogleAIProvider implements AIProvider {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    options: { model?: string; temperature?: number; maxTokens?: number } = {}
  ) {
    // Convert messages to Google format
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    
    const model = options.model || "gemini-pro";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 1000,
          },
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      model,
    };
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    // Google doesn&apos;t have embeddings API in Gemini, fallback to OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error("OpenAI API key required for embeddings");
    }
    
    const openai = new OpenAIProvider(openaiKey);
    return openai.generateEmbedding(text);
  }
}

/**
 * AI Provider Factory
 */
function getAIProvider(provider: string): AIProvider {
  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not configured");
      }
      return new OpenAIProvider(process.env.OPENAI_API_KEY);
    
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY not configured");
      }
      return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
    
    case "google":
      if (!process.env.GOOGLE_AI_API_KEY) {
        throw new Error("GOOGLE_AI_API_KEY not configured");
      }
      return new GoogleAIProvider(process.env.GOOGLE_AI_API_KEY);
    
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Chat Session Manager
 */
export class ChatSessionManager {
  /**
   * Create a new chat session
   */
  async createSession(data: {
    userId: string;
    organizationId: string;
    title?: string;
    aiProvider?: string;
    model?: string;
    contextTags?: string[];
    relatedEntityType?: string;
    relatedEntityId?: string;
  }): Promise<ChatSession> {
    const session = await db
      .insert(chatSessions)
      .values({
        userId: data.userId,
        tenantId: data.organizationId,
        title: data.title || "New conversation",
        aiProvider: (data.aiProvider as unknown) || "openai",
        model: data.model || "gpt-4",
        contextTags: data.contextTags,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
      })
      .returning();
    
    return session[0];
  }
  
  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);
    
    return sessions[0] || null;
  }
  
  /**
   * Get user's sessions
   */
  async getUserSessions(
    userId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ChatSession[]> {
    let query = db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId));
    
    if (options.status) {
      query = query.where(eq(chatSessions.status, options.status as unknown));
    }
    
    query = query.orderBy(desc(chatSessions.lastMessageAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }
  
  /**
   * Update session title (auto-generated from first message)
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ title, updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }
  
  /**
   * Archive session
   */
  async archiveSession(sessionId: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }
  
  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));
  }
}

/**
 * RAG Service (Retrieval-Augmented Generation)
 */
export class RAGService {
  /**
   * Add document to knowledge base
   */
  async addDocument(data: {
    organizationId: string;
    title: string;
    documentType: string;
    content: string;
    summary?: string;
    sourceType: string;
    sourceId?: string;
    sourceUrl?: string;
    tags?: string[];
    keywords?: string[];
    language?: string;
    isPublic?: boolean;
    createdBy: string;
  }): Promise<void> {
    // Generate embedding for the document
    const provider = getAIProvider("openai"); // Use OpenAI for embeddings
    const embedding = await provider.generateEmbedding(data.content);
    
    await db.insert(knowledgeBase).values({
      ...data,
      tenantId: data.organizationId,
      documentType: data.documentType as unknown,
      embedding: JSON.stringify(embedding),
      embeddingModel: "text-embedding-ada-002",
    });
  }
  
  /**
   * Search knowledge base using semantic search
   */
  async searchDocuments(
    query: string,
    options: {
      organizationId?: string;
      documentTypes?: string[];
      limit?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<
    Array<{
      documentId: string;
      title: string;
      relevanceScore: number;
      excerpt: string;
    }>
  > {
    // Generate embedding for query
    const provider = getAIProvider("openai");
    const queryEmbedding = await provider.generateEmbedding(query);
    
    // Perform vector similarity search
    // Note: This is a simplified version. In production, use pgvector's <-> operator
    const results = await db
      .select({
        id: knowledgeBase.id,
        title: knowledgeBase.title,
        content: knowledgeBase.content,
        embedding: knowledgeBase.embedding,
      })
      .from(knowledgeBase)
      .where(
        and(
          eq(knowledgeBase.isActive, true),
          options.organizationId ? eq(knowledgeBase.organizationId /* was tenantId */, options.organizationId) : undefined
        )
      )
      .limit(options.limit || 5);
    
    // Calculate cosine similarity (simplified)
    const scored = results.map((doc) => {
      const docEmbedding = JSON.parse(doc.embedding as string);
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
      
      return {
        documentId: doc.id,
        title: doc.title,
        relevanceScore: similarity,
        excerpt: doc.content.substring(0, 200) + "...",
      };
    });
    
    // Filter by threshold and sort
    return scored
      .filter((r) => r.relevanceScore >= (options.similarityThreshold || 0.7))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  /**
   * Update document citation count
   */
  async incrementCitationCount(documentId: string): Promise<void> {
    await db
      .update(knowledgeBase)
      .set({
        citationCount: sql`${knowledgeBase.citationCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(knowledgeBase.id, documentId));
  }
}

/**
 * Chatbot Service
 */
export class ChatbotService {
  private sessionManager = new ChatSessionManager();
  private ragService = new RAGService();
  
  /**
   * Send message and get AI response
   */
  async sendMessage(data: {
    sessionId: string;
    userId: string;
    content: string;
    useRAG?: boolean;
  }): Promise<ChatMessage> {
    const startTime = Date.now();
    
    // Get session
    const session = await this.sessionManager.getSession(data.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    // Safety filter on input
    const safetyCheck = await this.checkContentSafety(data.content);
    if (safetyCheck.flagged) {
      throw new Error("Message flagged by content safety filter");
    }
    
    // Save user message
    await db.insert(chatMessages).values({
      sessionId: data.sessionId,
      role: "user",
      content: data.content,
    });
    
    // Get conversation history
    const history = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, data.sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(10);
    
    const conversationMessages = history.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));
    
    // Perform RAG if enabled
    let retrievedDocs: unknown[] = [];
    if (data.useRAG !== false) {
      retrievedDocs = await this.ragService.searchDocuments(data.content, {
        organizationId: session.organizationId /* was tenantId */,
        limit: 3,
      });
      
      // Add context to conversation
      if (retrievedDocs.length > 0) {
        const context = retrievedDocs
          .map((doc) => `[${doc.title}]: ${doc.excerpt}`)
          .join("\n\n");
        
        conversationMessages.unshift({
          role: "system",
          content: `You are a helpful union rights assistant. Use the following context to answer questions:\n\n${context}`,
        });
      }
    }
    
    // Get AI response
    const provider = getAIProvider(session.aiProvider);
    const response = await provider.generateResponse(conversationMessages, {
      temperature: parseFloat(session.temperature || "0.7"),
      model: session.model,
    });
    
    const responseTime = Date.now() - startTime;
    
    // Save assistant message
    const [assistantMessage] = await db
      .insert(chatMessages)
      .values({
        sessionId: data.sessionId,
        role: "assistant",
        content: response.content,
        modelUsed: response.model,
        tokensUsed: response.tokensUsed,
        responseTimeMs: responseTime,
        retrievedDocuments: retrievedDocs.length > 0 ? retrievedDocs : undefined,
      })
      .returning();
    
    // Update session
    await db
      .update(chatSessions)
      .set({
        messageCount: sql`${chatSessions.messageCount} + 2`,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, data.sessionId));
    
    // Update citation counts
    for (const doc of retrievedDocs) {
      await this.ragService.incrementCitationCount(doc.documentId);
    }
    
    return assistantMessage;
  }
  
  /**
   * Get conversation messages
   */
  async getMessages(
    sessionId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ChatMessage[]> {
    let query = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt));
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    const messages = await query;
    return messages.reverse(); // Return in chronological order
  }
  
  /**
   * Content safety check
   */
  private async checkContentSafety(content: string): Promise<{
    flagged: boolean;
    categories?: string[];
  }> {
    // Implement content moderation using OpenAI Moderation API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { flagged: false }; // Skip if not configured
    }
    
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: content }),
      });
      
      const data = await response.json();
      const result = data.results[0];
      
      if (result.flagged) {
        const flaggedCategories = Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category);
        
        await db.insert(aiSafetyFilters).values({
          input: content,
          flagged: true,
          flaggedCategories,
          confidenceScores: result.category_scores,
          action: "block",
          reason: "Content policy violation",
        });
        
        return { flagged: true, categories: flaggedCategories };
      }
      
      return { flagged: false };
    } catch (error) {
      // SECURITY FIX: Fail closed - content safety system errors should reject content
      // Log the error for monitoring but treat as unsafe content
return { flagged: true, reason: 'Safety system unavailable' }; // Fail closed
    }
  }
}

/**
 * Helper: Cosine similarity
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (magnitudeA * magnitudeB);
}

