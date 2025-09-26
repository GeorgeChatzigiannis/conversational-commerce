/**
 * Preprocesses content to convert SKU notation ||SKU|| to markdown emphasis
 * @param content - The raw content to process
 * @returns The processed content with SKU patterns converted to markdown
 */
export function preprocessMarkdownContent(content: string): string {
  return content.replace(/\|\|([^|]+)\|\|/g, ' _($1)_').replace(/\n\n\* /g, '\n* ')
}
