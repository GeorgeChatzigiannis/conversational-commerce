import { describe, it, expect } from 'vitest'
import { preprocessMarkdownContent } from '../markdownProcessor'

describe('markdownProcessor', () => {
  describe('preprocessMarkdownContent', () => {
    it('should convert ||SKU|| pattern to markdown emphasis', () => {
      const input = 'Cloudflow 4||3MD3010||'
      const expected = 'Cloudflow 4 _(3MD3010)_'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle multiple SKU patterns in one string', () => {
      const input = 'Product A||SKU1|| and Product B||SKU2||'
      const expected = 'Product A _(SKU1)_ and Product B _(SKU2)_'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle SKU patterns with bold markdown', () => {
      const input = '**Cloudmonster**||61||'
      const expected = '**Cloudmonster** _(61)_'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle SKU patterns in bullet lists', () => {
      const input = `* **Cloudmonster**||61||: Max cushioning
* **Cloudflyer 5**||3WE3004||: Stable and supportive`
      const expected = `* **Cloudmonster** _(61)_: Max cushioning
* **Cloudflyer 5** _(3WE3004)_: Stable and supportive`
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should leave content without SKU patterns unchanged', () => {
      const input = 'This is regular text with no SKU patterns'
      expect(preprocessMarkdownContent(input)).toBe(input)
    })

    it('should handle empty strings', () => {
      expect(preprocessMarkdownContent('')).toBe('')
    })

    it('should not match incomplete SKU patterns', () => {
      const input = 'Product ||incomplete or |also|incomplete||'
      const expected = 'Product ||incomplete or |also|incomplete||'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle SKU patterns with special characters', () => {
      const input = 'Product||SKU-123_v2.0||'
      const expected = 'Product _(SKU-123_v2.0)_'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle SKU patterns at the beginning of a line', () => {
      const input = '||SKU123|| Product Name'
      const expected = ' _(SKU123)_ Product Name'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle SKU patterns at the end of a line', () => {
      const input = 'Product Name||SKU123||'
      const expected = 'Product Name _(SKU123)_'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle multiline content with SKU patterns', () => {
      const input = `First line with Product||SKU1||
Second line normal text
Third line with Item||SKU2||`
      const expected = `First line with Product _(SKU1)_
Second line normal text
Third line with Item _(SKU2)_`
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle content with existing markdown links', () => {
      const input = 'Check [here](https://example.com) for Product||SKU123||'
      const expected = 'Check [here](https://example.com) for Product _(SKU123)_'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle double newline followed by asterisk', () => {
      const input = 'First item\n\n* Second item'
      const expected = 'First item\n* Second item'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle multiple occurrences of newline-newline-asterisk pattern', () => {
      const input = 'Item 1\n\n* Item 2\n\n* Item 3'
      const expected = 'Item 1\n* Item 2\n* Item 3'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should preserve single newlines', () => {
      const input = 'Line 1\nLine 2\nLine 3'
      const expected = 'Line 1\nLine 2\nLine 3'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should handle SKU patterns and newline-asterisk pattern together', () => {
      const input = 'Product||SKU1||\n\n* Another Product||SKU2||'
      const expected = 'Product _(SKU1)_\n* Another Product _(SKU2)_'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should preserve double newlines without asterisk', () => {
      const input = 'Line 1\n\nLine 2\n\nLine 3'
      const expected = 'Line 1\n\nLine 2\n\nLine 3'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })

    it('should only replace pattern when asterisk follows double newline', () => {
      const input = 'Line 1\n\n* Item 1\n\nNot a list item\n\n* Item 2'
      const expected = 'Line 1\n* Item 1\n\nNot a list item\n* Item 2'
      expect(preprocessMarkdownContent(input)).toBe(expected)
    })
  })
})
