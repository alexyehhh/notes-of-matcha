import type { MatchaEntry } from "../types";

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface ParsedTextData {
  name?: string;
  brand?: string;
  prefecture?: string;
  notes?: string;
  flavorProfile?: {
    grassy?: boolean;
    nutty?: boolean;
    floral?: boolean;
  };
}

class OCRService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Tesseract.js worker for OCR
      console.log('OCR Service initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR Service:', error);
      throw error;
    }
  }

  async extractText(imageFile: File): Promise<OCRResult> {
    try {
      // Try English OCR first
      const englishResult = await this.extractTextInLanguage(imageFile, 'eng');
      
      // If English yields good results, return it
      if (englishResult.confidence > 0.7 && this.hasGoodEnglishContent(englishResult.text)) {
        console.log('Using English OCR result:', englishResult);
        return englishResult;
      }
      
      // If English doesn't work well, try Japanese
      console.log('English OCR insufficient, trying Japanese...');
      const japaneseResult = await this.extractTextInLanguage(imageFile, 'jpn');
      
      // Return the better result
      const bestResult = japaneseResult.confidence > englishResult.confidence ? japaneseResult : englishResult;
      
      console.log('OCR extraction completed:', {
        language: japaneseResult.confidence > englishResult.confidence ? 'Japanese' : 'English',
        extractedText: bestResult.text,
        confidence: bestResult.confidence
      });

      return bestResult;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw error;
    }
  }

  private async extractTextInLanguage(imageFile: File, language: 'eng' | 'jpn'): Promise<OCRResult> {
    // Simulate OCR processing with realistic delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (language === 'eng') {
      // Mock English OCR results
      const englishTexts = [
        {
          text: `Premium Ceremonial Matcha
          Organic Grade A+
          Brand: Marukyu Koyamaen
          Origin: Uji, Kyoto Prefecture
          Hand-picked from first harvest tea leaves
          Rich umami flavor with delicate sweetness
          Stone-ground traditional method
          Net Weight: 30g
          Best Before: 2025-12-31`,
          confidence: 0.92
        },
        {
          text: `Daily Matcha Powder
          Jade Leaf Organics
          Kagoshima Prefecture, Japan
          USDA Organic Certified
          Bright green color
          Smooth creamy texture
          Grassy notes with subtle sweetness
          Perfect for lattes and smoothies
          100% Pure Matcha`,
          confidence: 0.87
        },
        {
          text: `Traditional Japanese Matcha
          DoMatcha Premium
          Nishio, Aichi Prefecture
          Ceremonial Grade
          Artisan selected tea leaves
          Complex flavor profile
          Nutty undertones with floral finish
          Stone mill ground
          30g (1.06 oz)`,
          confidence: 0.89
        }
      ];
      
      return englishTexts[Math.floor(Math.random() * englishTexts.length)];
    } else {
      // Mock Japanese OCR results
      const japaneseTexts = [
        {
          text: `抹茶道楽 特級品
          丸久小山園
          宇治産 京都府
          一番茶のみ使用
          石臼挽き
          甘み豊かで上品な味わい
          内容量：30g
          賞味期限：2025年12月31日
          保存方法：冷暗所保存`,
          confidence: 0.94
        },
        {
          text: `若竹
          京都宇治
          丸久小山園製
          薄茶用
          上級抹茶
          繊細な香りと深い味わい
          茶道用
          30g入り`,
          confidence: 0.91
        },
        {
          text: `有機抹茶
          鹿児島県産
          JAS有機認証
          無添加・無着色
          農薬不使用
          まろやかな甘み
          日常使い用
          100g`,
          confidence: 0.88
        },
        {
          text: `特選抹茶 翠風
          愛知県西尾市
          一保堂茶舗
          濃茶用
          手摘み茶葉
          濃厚な旨味
          石臼挽き製法
          40g缶入り`,
          confidence: 0.93
        }
      ];
      
      return japaneseTexts[Math.floor(Math.random() * japaneseTexts.length)];
    }
  }

  private hasGoodEnglishContent(text: string): boolean {
    // Check if the text contains meaningful English content
    const englishWords = ['matcha', 'tea', 'organic', 'ceremonial', 'grade', 'flavor', 'brand', 'prefecture', 'origin'];
    const lowercaseText = text.toLowerCase();
    const foundWords = englishWords.filter(word => lowercaseText.includes(word));
    
    return foundWords.length >= 2 && text.length > 30;
  }

  parseTextData(text: string): ParsedTextData {
    // Detect if text is primarily Japanese
    const isJapanese = this.detectJapaneseText(text);
    
    if (isJapanese) {
      return this.parseJapaneseText(text);
    } else {
      return this.parseEnglishText(text);
    }
  }

  private detectJapaneseText(text: string): boolean {
    // Check for Japanese characters (Hiragana, Katakana, Kanji)
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    // Consider it Japanese if more than 30% of characters are Japanese
    return japaneseChars / totalChars > 0.3;
  }

  private parseJapaneseText(text: string): ParsedTextData {
    const parsed: ParsedTextData = {};
    
    // Clean and split into lines
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Extract name (look for product names in Japanese)
    const namePatterns = [
      /^([^\n]{2,20})\s*(?:抹茶|茶)/gm,        // Product name followed by 抹茶 or 茶
      /([^\n]{3,25})\s*(?:特級|上級|高級)/gm,   // Product with grade indicators
      /^([^\n]{2,30})$/gm                        // First meaningful line as product name
    ];

    for (const pattern of namePatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        let name = matches[0].replace(/抹茶|茶|特級|上級|高級/g, '').trim();
        if (name.length > 1) {
          parsed.name = name;
          break;
        }
      }
    }

    // Extract brand (Japanese tea companies)
    const brandPatterns = [
      /(丸久小山園|一保堂|福寿園|辻利|中村藤吉|伊藤久右衛門)/g,    // Famous tea companies
      /([^\n]{2,15})(製|園|茶舗|本舗)/g,                         // Company suffixes
      /([^\n]{2,20})\s*(?:ブランド|会社)/g                       // Brand indicators
    ];

    for (const pattern of brandPatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        parsed.brand = matches[0].replace(/製|ブランド|会社/g, '').trim();
        break;
      }
    }

    // Extract prefecture (Japanese regions)
    const prefecturePatterns = [
      /(宇治|京都|鹿児島|静岡|三重|奈良|愛知|西尾)(?:産|府|県)?/g,
      /([^\n]{2,10})(?:産|府|県)/g
    ];

    for (const pattern of prefecturePatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        parsed.prefecture = matches[0];
        break;
      }
    }

    // Extract flavor profile from Japanese descriptors
    const japaneseFlavorKeywords = {
      grassy: ['青い', '草っぽい', '新緑', '青臭い', 'さっぱり', '爽やか'],
      nutty: ['クリーミー', 'まろやか', '濃厚', '豊か', 'コク', '深い'],
      floral: ['香り高い', '花の', '上品', '繊細', '甘い', '優雅', '芳醇']
    };

    parsed.flavorProfile = {};
    for (const [flavor, keywords] of Object.entries(japaneseFlavorKeywords)) {
      parsed.flavorProfile[flavor as keyof typeof japaneseFlavorKeywords] = keywords.some(
        keyword => text.includes(keyword)
      );
    }

    // Extract descriptive notes in Japanese
    const descriptiveLines = lines.filter(line => {
      return line.length > 3 && 
        !this.containsJapaneseProductCode(line) &&
        !line.includes('内容量') &&
        !line.includes('賞味期限') &&
        (line.includes('味わい') || line.includes('香り') || 
         line.includes('風味') || line.includes('特徴') || 
         line.includes('甘み') || line.includes('旨味') ||
         line.includes('上品') || line.includes('繊細'));
    });

    if (descriptiveLines.length > 0) {
      parsed.notes = descriptiveLines.slice(0, 2).join('。').substring(0, 150);
    }

    return parsed;
  }

  private parseEnglishText(text: string): ParsedTextData {
    const parsed: ParsedTextData = {};
    
    // Clean and split into lines
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const cleanedText = text.toLowerCase();

    // Extract name (look for product titles at the beginning)
    const namePatterns = [
      /^([^\n]{5,50})\s*matcha/gmi,
      /^(premium|ceremonial|daily|organic|traditional)\s+([^\n]{3,40})/gmi,
      /([a-z\s]{5,40})\s+(matcha|powder)/gi
    ];

    for (const pattern of namePatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        let name = this.cleanText(matches[0]);
        // Remove common words that shouldn't be in the name
        name = name.replace(/\b(powder|tea|green|japanese|japan)\b/gi, '').trim();
        if (name.length > 3) {
          parsed.name = this.capitalizeWords(name);
          break;
        }
      }
    }

    // Extract brand (look for brand indicators)
    const brandPatterns = [
      /brand:\s*([^\n]{2,30})/gi,
      /(?:by|from)\s+([A-Z][a-zA-Z\s&]{2,25})/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:organics?|tea|company|co\.?|ltd\.?)/gi
    ];

    for (const pattern of brandPatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        let brand = matches[0].replace(/brand:|by|from|organics?|tea|company|co\.?|ltd\.?/gi, '').trim();
        if (brand.length > 1) {
          parsed.brand = this.cleanText(brand);
          break;
        }
      }
    }

    // If no explicit brand found, look for capitalized company names
    if (!parsed.brand) {
      const companyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
      const matches = text.match(companyPattern);
      if (matches) {
        // Filter out common words and look for likely brand names
        const potentialBrands = matches.filter(match => {
          const word = match.toLowerCase();
          return !['premium', 'ceremonial', 'organic', 'traditional', 'grade', 'matcha', 'powder', 'japan', 'japanese'].includes(word) 
                 && match.length > 2 && match.length < 25;
        });
        if (potentialBrands.length > 0) {
          parsed.brand = potentialBrands[0];
        }
      }
    }

    // Extract prefecture/origin
    const prefecturePatterns = [
      /(?:origin|from):\s*([^\n]{3,30})/gi,
      /(uji|kyoto|kagoshima|shizuoka|mie|nara|aichi|nishio)\s*(?:prefecture)?/gi,
      /([a-z]+),?\s*(kyoto|kagoshima|shizuoka|mie|nara|aichi)\s*prefecture/gi
    ];

    for (const pattern of prefecturePatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        let prefecture = matches[0].replace(/origin:|from:/gi, '').trim();
        prefecture = this.capitalizeWords(prefecture);
        parsed.prefecture = prefecture;
        break;
      }
    }

    // Extract flavor profile from descriptive text
    const flavorKeywords = {
      grassy: ['grass', 'grassy', 'green', 'vegetal', 'fresh', 'leafy', 'herbaceous', 'plant-like'],
      nutty: ['nut', 'nutty', 'creamy', 'rich', 'smooth', 'buttery', 'almond', 'hazelnut', 'undertones'],
      floral: ['floral', 'flower', 'fragrant', 'aromatic', 'sweet', 'delicate', 'perfume', 'blossom', 'finish']
    };

    parsed.flavorProfile = {};
    for (const [flavor, keywords] of Object.entries(flavorKeywords)) {
      parsed.flavorProfile[flavor as keyof typeof flavorKeywords] = keywords.some(
        keyword => cleanedText.includes(keyword.toLowerCase())
      );
    }

    // Extract descriptive notes
    const descriptiveLines = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      return line.length > 15 && 
        !this.containsProductCode(line) &&
        !lowerLine.includes('net weight') &&
        !lowerLine.includes('best before') &&
        (lowerLine.includes('flavor') || lowerLine.includes('taste') || 
         lowerLine.includes('note') || lowerLine.includes('smooth') || 
         lowerLine.includes('rich') || lowerLine.includes('delicate') ||
         lowerLine.includes('aroma') || lowerLine.includes('finish') ||
         lowerLine.includes('umami') || lowerLine.includes('sweet'));
    });

    if (descriptiveLines.length > 0) {
      parsed.notes = descriptiveLines.slice(0, 3).join(' ').substring(0, 200);
    }

    return parsed;
  }

  private cleanText(text: string): string {
    return text
      .replace(/[^\w\s().-]/g, '') // Keep alphanumeric, spaces, parentheses, periods, hyphens
      .replace(/\s+/g, ' ')
      .trim();
  }

  private capitalizeWords(text: string): string {
    return text.split(' ')
      .map(word => {
        if (word.length <= 1) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  private containsProductCode(text: string): boolean {
    // Check if line contains product codes, barcodes, etc.
    return /\b\d{4,}\b/.test(text) || 
           /[A-Z]{2,}\d+/.test(text) || 
           /barcode|sku|item|upc|ean/i.test(text) ||
           /^\d+[\w\d-]+$/.test(text.trim());
  }

  private containsJapaneseProductCode(text: string): boolean {
    // Check if line contains Japanese product codes, dates, weights, etc.
    return /\d{4,}/.test(text) || 
           /\d+年\d+月\d+日/.test(text) ||  // Dates
           /\d+g/.test(text) ||             // Weight
           /\d+ml/.test(text) ||            // Volume
           text.includes('JAN') ||
           text.includes('賞味期限') ||
           text.includes('内容量') ||
           text.includes('保存方法');
  }

  // Method for real Tesseract.js integration (when needed)
  async performRealOCR(imageFile: File): Promise<OCRResult> {
    try {
      // This would be the actual Tesseract.js implementation
      // const { createWorker } = await import('tesseract.js');
      // const worker = await createWorker('eng');
      // const result = await worker.recognize(imageFile);
      // await worker.terminate();
      // return { text: result.data.text, confidence: result.data.confidence / 100 };
      
      throw new Error('Real OCR not implemented - using mock data');
    } catch (error) {
      console.error('Real OCR failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const ocrService = new OCRService();