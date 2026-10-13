export const ALL_CHAPTERS = "__all__";
export const UNCATEGORIZED_CHAPTER = "__uncategorized__";

const CHINESE_DIGITS = {
  零: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

function chineseNumberToArabic(text) {
  const value = String(text || "").trim();

  if (!value) return Number.POSITIVE_INFINITY;
  if (/^\d+$/.test(value)) return Number(value);

  if (value === "十") return 10;

  if (value.includes("十")) {
    const [tensPart, onesPart] = value.split("十");
    const tens = tensPart ? CHINESE_DIGITS[tensPart] ?? 0 : 1;
    const ones = onesPart ? CHINESE_DIGITS[onesPart] ?? 0 : 0;
    return tens * 10 + ones;
  }

  return CHINESE_DIGITS[value] ?? Number.POSITIVE_INFINITY;
}

function chapterOrderValue(chapter) {
  const label = String(chapter || "").trim();
  const matched = label.match(/^第\s*([零一二三四五六七八九十百\d]+)\s*章/);

  if (!matched) return Number.POSITIVE_INFINITY;

  const token = matched[1];
  if (/^\d+$/.test(token)) return Number(token);

  return chineseNumberToArabic(token);
}

export function normalizeChapterName(value) {
  return String(value || "").trim();
}

export function sortChapterNames(chapters = []) {
  const collator = new Intl.Collator("zh-CN", {
    numeric: true,
    sensitivity: "base",
  });

  return [...new Set(chapters.map(normalizeChapterName).filter(Boolean))].sort(
    (left, right) => {
      const leftOrder = chapterOrderValue(left);
      const rightOrder = chapterOrderValue(right);

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return collator.compare(left, right);
    }
  );
}

export function buildChapterItems(questions = []) {
  const counter = new Map();
  let uncategorizedCount = 0;

  questions.forEach((question) => {
    const chapter = normalizeChapterName(question?.chapter);

    if (!chapter) {
      uncategorizedCount += 1;
      return;
    }

    counter.set(chapter, (counter.get(chapter) || 0) + 1);
  });

  const namedItems = sortChapterNames([...counter.keys()]).map((chapter) => ({
    key: chapter,
    label: chapter,
    count: counter.get(chapter) || 0,
  }));

  return [
    {
      key: ALL_CHAPTERS,
      label: "全部题目",
      count: questions.length,
    },
    ...namedItems,
    {
      key: UNCATEGORIZED_CHAPTER,
      label: "未分类",
      count: uncategorizedCount,
    },
  ];
}

export function questionMatchesChapter(question, chapterKey) {
  if (!chapterKey || chapterKey === ALL_CHAPTERS) {
    return true;
  }

  const chapter = normalizeChapterName(question?.chapter);

  if (chapterKey === UNCATEGORIZED_CHAPTER) {
    return !chapter;
  }

  return chapter === chapterKey;
}
