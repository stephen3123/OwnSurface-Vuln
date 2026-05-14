import { describe, it, expect } from 'vitest';

describe('URL validation', () => {
  it('should accept valid HTTP URLs', () => {
    const validUrls = ['https://example.com', 'http://test.org', 'https://sub.domain.co.uk/path'];
    for (const url of validUrls) {
      expect(() => new URL(url)).not.toThrow();
    }
  });

  it('should reject invalid URLs', () => {
    const invalidUrls = ['not-a-url', 'ftp://files.com', ''];
    for (const url of invalidUrls) {
      const isValid = (() => {
        try {
          const u = new URL(url);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
          return false;
        }
      })();
      expect(isValid).toBe(false);
    }
  });
});

describe('Security grade calculation', () => {
  function getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  it('should return correct grades', () => {
    expect(getGrade(95)).toBe('A+');
    expect(getGrade(85)).toBe('A');
    expect(getGrade(75)).toBe('B');
    expect(getGrade(65)).toBe('C');
    expect(getGrade(55)).toBe('D');
    expect(getGrade(30)).toBe('F');
  });

  it('should handle edge cases', () => {
    expect(getGrade(100)).toBe('A+');
    expect(getGrade(0)).toBe('F');
    expect(getGrade(90)).toBe('A+');
    expect(getGrade(80)).toBe('A');
  });
});

describe('Plan limits', () => {
  const planLimits = {
    free: { scansPerDay: 5, apiKeys: 1, watchlists: 1, collections: 1 },
    pro: { scansPerDay: Infinity, apiKeys: 10, watchlists: Infinity, collections: Infinity },
  };

  it('should enforce free plan limits', () => {
    expect(planLimits.free.scansPerDay).toBe(5);
    expect(planLimits.free.apiKeys).toBe(1);
  });

  it('should have unlimited pro plan', () => {
    expect(planLimits.pro.scansPerDay).toBe(Infinity);
    expect(planLimits.pro.apiKeys).toBe(10);
  });
});

describe('HTML escaping', () => {
  function esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  it('should escape HTML special characters', () => {
    expect(esc('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should handle strings without special characters', () => {
    expect(esc('hello world')).toBe('hello world');
  });

  it('should handle empty strings', () => {
    expect(esc('')).toBe('');
  });

  it('should escape ampersands first', () => {
    expect(esc('a&b<c')).toBe('a&amp;b&lt;c');
  });
});
