export const newTabNoteId = "new-tab-note";

// Keyboard users can only scroll a code block that overflows if it can take focus.
export function makeCodeBlocksFocusable(html) {
  return html.replace(/<pre\b(?![^>]*\btabindex=)/g, '<pre tabindex="0"');
}

// Screen readers announce links that open a new tab through one shared, hidden note (the footer holds it).
export function describeNewTabLinks(html, file) {
  const described = html.replace(
    /<a\b(?=[^>]*\btarget="_blank")(?![^>]*\baria-describedby=)/g,
    `<a aria-describedby="${newTabNoteId}"`,
  );
  if (described !== html && !html.includes(`id="${newTabNoteId}"`)) {
    throw new Error(`${file}: links open a new tab but the page has no #${newTabNoteId} note`);
  }
  return described;
}
