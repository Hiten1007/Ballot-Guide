/**
 * @file tests/unit/utils/sanitizer.test.js
 * @description Unit tests for input sanitisation utilities.
 */

import { sanitizeText, sanitizeObject, sanitizeAddress } from '../../../src/utils/sanitizer.js';

describe('Sanitizer', () => {
  describe('sanitizeText', () => {
    it('strips HTML tags', () => {
      expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('Hello');
    });

    it('strips nested HTML', () => {
      expect(sanitizeText('<div><p>Hello <b>World</b></p></div>')).toBe('Hello World');
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
      expect(sanitizeText(123)).toBe('');
      expect(sanitizeText({})).toBe('');
    });

    it('trims whitespace', () => {
      expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('preserves clean text', () => {
      expect(sanitizeText('What is the Electoral College?')).toBe('What is the Electoral College?');
    });
  });

  describe('sanitizeObject', () => {
    it('sanitises string values in objects', () => {
      const result = sanitizeObject({ name: '<b>Test</b>', count: 5 });
      expect(result.name).toBe('Test');
      expect(result.count).toBe(5);
    });

    it('handles nested objects', () => {
      const result = sanitizeObject({ inner: { text: '<script>x</script>safe' } });
      expect(result.inner.text).toBe('safe');
    });

    it('handles arrays', () => {
      const result = sanitizeObject(['<b>a</b>', '<i>b</i>']);
      expect(result).toEqual(['a', 'b']);
    });

    it('returns null/primitive inputs unchanged', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(42)).toBe(42);
    });
  });

  describe('sanitizeAddress', () => {
    it('allows valid address characters', () => {
      expect(sanitizeAddress('123 Main St, Apt #4, Springfield, IL 62701')).toBe(
        '123 Main St, Apt #4, Springfield, IL 62701',
      );
    });

    it('strips dangerous characters', () => {
      expect(sanitizeAddress('123 Main St; DROP TABLE--')).toBe('123 Main St DROP TABLE--');
    });

    it('returns empty string for non-string', () => {
      expect(sanitizeAddress(null)).toBe('');
      expect(sanitizeAddress(undefined)).toBe('');
    });
  });
});
