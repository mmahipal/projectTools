/**
 * Unit Tests for Security Utilities
 * Tests XSS detection, SQL injection detection, HTML escaping, and sanitization
 */

const {
  containsSqlInjection,
  containsXss,
  escapeHtml,
  escapeHtmlAttribute,
  escapeSoql,
  sanitizeString
} = require('../../security');

describe('Security Utilities', () => {
  describe('containsSqlInjection()', () => {
    it('should detect SQL injection with OR condition', () => {
      expect(containsSqlInjection("' OR '1'='1")).toBe(true);
      expect(containsSqlInjection("' OR 1=1")).toBe(true);
      expect(containsSqlInjection("admin' OR '1'='1")).toBe(true);
    });

    it('should detect SQL injection with AND condition', () => {
      expect(containsSqlInjection("' AND '1'='1")).toBe(true);
      expect(containsSqlInjection("' AND 1=1")).toBe(true);
    });

    it('should detect SQL injection with UNION', () => {
      expect(containsSqlInjection("' UNION SELECT * FROM users")).toBe(true);
      expect(containsSqlInjection("' UNION SELECT password")).toBe(true);
    });

    it('should detect SQL injection with stacked queries', () => {
      expect(containsSqlInjection("'; DROP TABLE users--")).toBe(true);
      expect(containsSqlInjection("'; DELETE FROM users--")).toBe(true);
    });

    it('should detect SQL injection with comments', () => {
      expect(containsSqlInjection("admin'--")).toBe(true);
      expect(containsSqlInjection("admin'#")).toBe(true);
      expect(containsSqlInjection("admin'/*")).toBe(true);
    });

    it('should detect encoded SQL injection attempts', () => {
      expect(containsSqlInjection("%27 OR 1=1")).toBe(true);
      expect(containsSqlInjection("'%20OR%20'1'='1")).toBe(true);
    });

    it('should not flag legitimate SQL keywords in normal text', () => {
      expect(containsSqlInjection('SELECT project from list')).toBe(false);
      expect(containsSqlInjection('Project status: OPEN')).toBe(false);
      expect(containsSqlInjection('User name: John')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(containsSqlInjection(null)).toBe(false);
      expect(containsSqlInjection(undefined)).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(containsSqlInjection(123)).toBe(false);
      expect(containsSqlInjection({})).toBe(false);
      expect(containsSqlInjection([])).toBe(false);
    });
  });

  describe('containsXss()', () => {
    it('should detect script tags', () => {
      expect(containsXss('<script>alert("XSS")</script>')).toBe(true);
      expect(containsXss('<SCRIPT>alert("XSS")</SCRIPT>')).toBe(true);
      expect(containsXss('<script src="evil.js"></script>')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsXss('<img onerror="alert(1)">')).toBe(true);
      expect(containsXss('<div onclick="alert(1)">')).toBe(true);
      expect(containsXss('<body onload="evil()">')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsXss('javascript:alert(1)')).toBe(true);
      expect(containsXss('<a href="javascript:alert(1)">')).toBe(true);
    });

    it('should detect iframe tags', () => {
      expect(containsXss('<iframe src="evil.com"></iframe>')).toBe(true);
      expect(containsXss('<iframe src="evil.com">')).toBe(true);
    });

    it('should detect encoded XSS attempts', () => {
      expect(containsXss('&#x3C;script>')).toBe(true);
      expect(containsXss('&#60;script>')).toBe(true);
      expect(containsXss('%3Cscript>')).toBe(true);
    });

    it('should not flag legitimate HTML-like text', () => {
      expect(containsXss('User wrote: <script> in comments')).toBe(true); // Contains script tag
      expect(containsXss('Normal text without tags')).toBe(false);
      expect(containsXss('Email: user@example.com')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(containsXss(null)).toBe(false);
      expect(containsXss(undefined)).toBe(false);
    });

    it('should handle non-string input', () => {
      expect(containsXss(123)).toBe(false);
      expect(containsXss({})).toBe(false);
    });
  });

  describe('escapeHtml()', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('"')).toBe('&quot;');
      expect(escapeHtml("'")).toBe('&#x27;');
      expect(escapeHtml('/')).toBe('&#x2F;');
    });

    it('should escape all dangerous characters in combination', () => {
      const input = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(input);
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).not.toContain('"');
    });

    it('should handle null and undefined', () => {
      expect(escapeHtml(null)).toBe(null);
      expect(escapeHtml(undefined)).toBe(undefined);
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(123)).toBe(123);
      expect(escapeHtml({})).toEqual({});
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('escapeHtmlAttribute()', () => {
    it('should escape characters for HTML attributes', () => {
      expect(escapeHtmlAttribute('value"with"quotes')).toBe('value&quot;with&quot;quotes');
      expect(escapeHtmlAttribute("value'with'quotes")).toBe('value&#x27;with&#x27;quotes');
      expect(escapeHtmlAttribute('value<with>tags')).toBe('value&lt;with&gt;tags');
    });

    it('should handle null and undefined', () => {
      expect(escapeHtmlAttribute(null)).toBe(null);
      expect(escapeHtmlAttribute(undefined)).toBe(undefined);
    });
  });

  describe('escapeSoql()', () => {
    it('should escape single quotes for SOQL', () => {
      expect(escapeSoql("O'Brien")).toBe("O''Brien");
      expect(escapeSoql("It's a test")).toBe("It''s a test");
    });

    it('should handle multiple single quotes', () => {
      expect(escapeSoql("'test'")).toBe("''test''");
    });

    it('should handle null and undefined', () => {
      expect(escapeSoql(null)).toBe(null);
      expect(escapeSoql(undefined)).toBe(undefined);
    });

    it('should handle non-string input', () => {
      expect(escapeSoql(123)).toBe(123);
    });

    it('should handle string without quotes', () => {
      expect(escapeSoql('normal text')).toBe('normal text');
    });
  });

  describe('sanitizeString()', () => {
    it('should remove null bytes', () => {
      const input = 'test\0string';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('\0');
    });

    it('should remove script tags by default', () => {
      const input = 'Normal text <script>alert(1)</script> more text';
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should respect maxLength option', () => {
      const longString = 'a'.repeat(200);
      const sanitized = sanitizeString(longString, { maxLength: 100 });
      expect(sanitized.length).toBeLessThanOrEqual(100);
    });

    it('should throw error in strict mode for SQL injection', () => {
      expect(() => {
        sanitizeString("' OR 1=1", { strict: true });
      }).toThrow('SQL injection pattern detected');
    });

    it('should throw error in strict mode for XSS', () => {
      expect(() => {
        sanitizeString('<script>alert(1)</script>', { strict: true });
      }).toThrow('XSS pattern detected');
    });

    it('should not throw in non-strict mode', () => {
      expect(() => {
        sanitizeString("' OR 1=1", { strict: false });
      }).not.toThrow();
    });

    it('should handle null and undefined', () => {
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString({})).toEqual({});
    });
  });
});
