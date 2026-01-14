import type { MatchaEntry } from "../types";

export interface ReverseImageResult {
  title: string;
  description: string;
  url: string;
  source: string;
  confidence: number;
}

export interface ProductMatch {
  name: string;
  brand: string;
  prefecture?: string;
  description: string;
  price?: string;
  source: string;
  confidence: number;
  url: string;
}

export interface ParsedProductData {
  name?: string;
  brand?: string;
  prefecture?: string;
  notes?: string;
  flavorProfile?: {
    grassy?: boolean;
    nutty?: boolean;
    floral?: boolean;
  };
  source?: string;
  confidence?: number;
}

class ReverseImageSearchService {
  private apiKey: string = 'YOUR_GOOGLE_VISION_API_KEY'; // Replace with actual API key
  
  // Mock database of known matcha products for demonstration
  private mockMatchaDatabase: ProductMatch[] = [
    {
      name: 'Ceremonial Grade Matcha',
      brand: 'Marukyu Koyamaen',
      prefecture: 'Uji, Kyoto',
      description: 'Premium ceremonial grade matcha powder made from first harvest tea leaves. This vibrant green powder offers a rich umami flavor with subtle sweetness and minimal bitterness. Perfect for traditional tea ceremony.',
      price: '$45.00',
      source: 'marukyu-koyamaen.co.jp',
      confidence: 0.92,
      url: 'https://www.marukyu-koyamaen.co.jp/english/product/matcha/'
    },
    {
      name: 'Organic Premium Matcha',
      brand: 'Jade Leaf Matcha',
      prefecture: 'Kagoshima',
      description: 'USDA Organic certified matcha with smooth, creamy texture and bright green color. Stone-ground from shade-grown tea leaves with rich umami and grassy notes.',
      price: '$28.99',
      source: 'jadeleafmatcha.com',
      confidence: 0.88,
      url: 'https://jadeleafmatcha.com/products/organic-ceremonial-grade-matcha'
    },
    {
      name: 'Wakataké Premium Matcha',
      brand: 'Marukyu Koyamaen',
      prefecture: 'Uji, Kyoto',
      description: 'Young Bamboo premium ceremonial grade matcha with delicate floral notes and rich umami. Traditional stone-ground powder from carefully selected tea leaves.',
      price: '$65.00',
      source: 'marukyu-koyamaen.co.jp',
      confidence: 0.95,
      url: 'https://www.marukyu-koyamaen.co.jp/english/product/wakatake/'
    },
    {
      name: 'Daily Grade Matcha',
      brand: 'Encha',
      prefecture: 'Shizuoka',
      description: 'High-quality daily grade matcha perfect for lattes and smoothies. Smooth, slightly sweet flavor with mild astringency. Stone-ground organic matcha powder.',
      price: '$22.00',
      source: 'encha.com',
      confidence: 0.85,
      url: 'https://www.encha.com/products/daily-matcha'
    },
    {
      name: 'Artisan Select Matcha',
      brand: 'DoMatcha',
      prefecture: 'Nishio, Aichi',
      description: 'Hand-picked artisan matcha with complex flavor profile. Notes of fresh grass and subtle nuttiness with a smooth, creamy finish. Premium ceremonial grade.',
      price: '$38.50',
      source: 'domatcha.com',
      confidence: 0.90,
      url: 'https://www.domatcha.com/artisan-select-ceremonial-matcha'
    }
  ];

  async searchByImage(imageFile: File): Promise<ReverseImageResult[]> {
    // In production, this would call Google Vision API or similar service
    // For now, we'll simulate the search with mock results
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock reverse image search results
      // In reality, this would analyze the image and return similar products
      const mockResults: ReverseImageResult[] = [
        {
          title: 'Premium Ceremonial Matcha - Traditional Japanese Green Tea Powder',
          description: 'High-quality ceremonial grade matcha from Uji, Kyoto. Stone-ground from shade-grown tea leaves.',
          url: 'https://example-matcha-store.com/ceremonial-matcha',
          source: 'example-matcha-store.com',
          confidence: 0.92
        },
        {
          title: 'Organic Matcha Powder - First Harvest Grade A+',
          description: 'USDA Organic certified matcha with vibrant green color and rich umami flavor.',
          url: 'https://organic-tea-company.com/matcha',
          source: 'organic-tea-company.com',
          confidence: 0.87
        },
        {
          title: 'Traditional Uji Matcha - Premium Quality',
          description: 'Authentic Japanese matcha from the famous Uji region in Kyoto prefecture.',
          url: 'https://uji-tea-masters.jp/premium-matcha',
          source: 'uji-tea-masters.jp',
          confidence: 0.85
        }
      ];

      return mockResults;
    } catch (error) {
      console.error('Reverse image search failed:', error);
      throw new Error('Failed to perform reverse image search');
    }
  }

  async findProductMatches(imageFile: File): Promise<ProductMatch[]> {
    // This simulates finding specific product matches in our database
    // In reality, this would use the reverse image search results to identify products
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Simulate finding matches based on image characteristics
      // Return a random subset of our mock database for demonstration
      const numberOfMatches = Math.floor(Math.random() * 3) + 1; // 1-3 matches
      const shuffled = [...this.mockMatchaDatabase].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, numberOfMatches);
      
    } catch (error) {
      console.error('Product matching failed:', error);
      throw new Error('Failed to find product matches');
    }
  }

  parseProductData(matches: ProductMatch[]): ParsedProductData {
    if (matches.length === 0) {
      return {};
    }

    // Use the highest confidence match as primary source
    const bestMatch = matches.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    const parsed: ParsedProductData = {
      name: bestMatch.name,
      brand: bestMatch.brand,
      prefecture: bestMatch.prefecture,
      notes: this.extractNotes(bestMatch.description),
      flavorProfile: this.extractFlavorProfile(bestMatch.description),
      source: bestMatch.source,
      confidence: bestMatch.confidence
    };

    return parsed;
  }

  private extractNotes(description: string): string {
    // Extract meaningful notes from product description
    const sentences = description.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    // Look for descriptive sentences about flavor, quality, or characteristics
    const relevantSentences = sentences.filter(sentence => {
      const keywords = ['flavor', 'taste', 'umami', 'notes', 'texture', 'aroma', 'finish', 'quality', 'grade'];
      return keywords.some(keyword => sentence.toLowerCase().includes(keyword));
    });

    return relevantSentences.slice(0, 2).join('. ') + (relevantSentences.length > 0 ? '.' : '');
  }

  private extractFlavorProfile(description: string): { grassy?: boolean; nutty?: boolean; floral?: boolean } {
    const text = description.toLowerCase();
    
    const flavorKeywords = {
      grassy: ['grass', 'grassy', 'vegetal', 'green', 'fresh', 'leafy', 'herbaceous', 'plant'],
      nutty: ['nut', 'nutty', 'creamy', 'rich', 'smooth', 'buttery', 'almond', 'hazelnut'],
      floral: ['floral', 'flower', 'fragrant', 'aromatic', 'sweet', 'delicate', 'perfume', 'blossom']
    };

    const profile: { grassy?: boolean; nutty?: boolean; floral?: boolean } = {};

    for (const [flavor, keywords] of Object.entries(flavorKeywords)) {
      profile[flavor as keyof typeof flavorKeywords] = keywords.some(
        keyword => text.includes(keyword)
      );
    }

    return profile;
  }

  // Method for real Google Vision API integration (when API key is available)
  async performRealReverseImageSearch(imageFile: File): Promise<ReverseImageResult[]> {
    if (!this.apiKey || this.apiKey === 'YOUR_GOOGLE_VISION_API_KEY') {
      throw new Error('Google Vision API key not configured');
    }

    const base64Image = await this.fileToBase64(imageFile);
    
    const requestBody = {
      requests: [{
        image: {
          content: base64Image
        },
        features: [{
          type: 'WEB_DETECTION',
          maxResults: 10
        }]
      }]
    };

    try {
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const webDetection = data.responses[0]?.webDetection;

      if (!webDetection) {
        return [];
      }

      // Process web entities and pages with matching images
      const results: ReverseImageResult[] = [];

      // Add web entities (general descriptions)
      if (webDetection.webEntities) {
        webDetection.webEntities.forEach((entity: any) => {
          if (entity.description && entity.score > 0.5) {
            results.push({
              title: entity.description,
              description: `Related entity with confidence ${(entity.score * 100).toFixed(1)}%`,
              url: '',
              source: 'Google Vision',
              confidence: entity.score
            });
          }
        });
      }

      // Add pages with matching images
      if (webDetection.pagesWithMatchingImages) {
        webDetection.pagesWithMatchingImages.forEach((page: any) => {
          if (page.pageTitle && page.url) {
            results.push({
              title: page.pageTitle,
              description: page.fullMatchingImages?.length ? 
                `Found ${page.fullMatchingImages.length} matching images` : 
                'Contains similar images',
              url: page.url,
              source: new URL(page.url).hostname,
              confidence: 0.8 // Default confidence for page matches
            });
          }
        });
      }

      return results.slice(0, 5); // Return top 5 results
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

// Singleton instance
export const reverseImageSearchService = new ReverseImageSearchService();