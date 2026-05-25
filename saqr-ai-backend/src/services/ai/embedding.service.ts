import { ProcessingStatus } from '@prisma/client';

export class EmbeddingService {
  public static generateMockVector(_text: string): { embeddingStatus: ProcessingStatus; vectorDimension: number } {
    // Return mock 1536-dimension embedding preparation
    return {
      embeddingStatus: ProcessingStatus.COMPLETED,
      vectorDimension: 1536
    };
  }
}
