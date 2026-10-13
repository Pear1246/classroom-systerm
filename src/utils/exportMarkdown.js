function sanitizeFileName(name) {
  const cleaned = String(name || "在线笔记")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "在线笔记";
}

export function exportMarkdownFile(title, content) {
  const fileName = `${sanitizeFileName(title)}.md`;

  // 加 BOM，提升 Windows 自带文本工具打开中文 Markdown 时的兼容性。
  const markdownText = `\uFEFF${content || ""}`;

  const blob = new Blob([markdownText], {
    type: "text/markdown;charset=utf-8",
  });

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
}
