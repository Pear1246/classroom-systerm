import * as XLSX from "xlsx";
import { QUESTION_SOURCES, normalizeQuestion } from "./questionModel";

const HEADER_MAP = Object.freeze({
  type: "题型*",
  stem: "题干*",
  optionA: "选项A",
  optionB: "选项B",
  optionC: "选项C",
  optionD: "选项D",
  optionE: "选项E",
  optionF: "选项F",
  answer: "正确答案",
  referenceAnswer: "参考答案",
  scoringPoints: "评分要点（用|分隔）",
  explanation: "解析",
  difficulty: "难度*",
  chapter: "所属章节",
  knowledgePoint: "知识点",
  score: "本题分值*",
});

const TYPE_MAP = Object.freeze({
  单选题: "single",
  单选: "single",
  多选题: "multiple",
  多选: "multiple",
  判断题: "judgment",
  判断: "judgment",
  简答题: "short-answer",
  简答: "short-answer",
});

const DIFFICULTY_MAP = Object.freeze({
  简单: "easy",
  易: "easy",
  easy: "easy",
  中等: "medium",
  中: "medium",
  medium: "medium",
  困难: "hard",
  难: "hard",
  hard: "hard",
});

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];

function text(value) {
  return String(value ?? "").trim();
}

function normalizeLetterAnswer(value) {
  return text(value)
    .toUpperCase()
    .replace(/，/g, ",")
    .split(/[\s,、;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeJudgmentAnswer(value) {
  const normalized = text(value).toLowerCase();

  if (["正确", "对", "true", "1", "是", "yes"].includes(normalized)) {
    return "true";
  }

  if (["错误", "错", "false", "0", "否", "no"].includes(normalized)) {
    return "false";
  }

  return "";
}

function normalizeScoringPoints(value) {
  return text(value)
    .split(/\||\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseScore(value) {
  if (value === "" || value === null || value === undefined) {
    return NaN;
  }

  const score = Number(value);
  return Number.isFinite(score) ? score : NaN;
}

function isCompletelyBlankRow(row) {
  return Object.values(HEADER_MAP).every((header) => !text(row?.[header]));
}

function rowToQuestion(row, excelRowNumber) {
  const errors = [];
  const rawType = text(row[HEADER_MAP.type]);
  const type = TYPE_MAP[rawType] || "";
  const stem = text(row[HEADER_MAP.stem]);
  const rawDifficulty = text(row[HEADER_MAP.difficulty]).toLowerCase();
  const difficulty = DIFFICULTY_MAP[rawDifficulty] || "";
  const score = parseScore(row[HEADER_MAP.score]);

  if (!type) {
    errors.push("题型需填写单选题、多选题、判断题或简答题。 ");
  }

  if (!stem) {
    errors.push("题干不能为空。 ");
  }

  if (!difficulty) {
    errors.push("难度需填写简单、中等或困难。 ");
  }

  if (!Number.isFinite(score) || score < 1 || score > 100) {
    errors.push("本题分值需为 1–100 分。 ");
  }

  const options = OPTION_KEYS.map((key) => ({
    key,
    text: text(row[HEADER_MAP[`option${key}`]]),
  })).filter((option) => option.text);

  let answer = [];
  let referenceAnswer = "";
  let scoringPoints = [];

  if (type === "single" || type === "multiple") {
    if (options.length < 2) {
      errors.push("选择题至少需要填写两个选项。 ");
    }

    answer = normalizeLetterAnswer(row[HEADER_MAP.answer]);
    const availableKeys = new Set(options.map((option) => option.key));

    if (type === "single" && answer.length !== 1) {
      errors.push("单选题需填写且只能填写一个正确答案，例如 B。 ");
    }

    if (type === "multiple" && answer.length < 2) {
      errors.push("多选题至少填写两个正确答案，例如 A,B。 ");
    }

    if (answer.some((key) => !availableKeys.has(key))) {
      errors.push("正确答案包含未填写的选项。 ");
    }

    answer = [...new Set(answer)];
  } else if (type === "judgment") {
    const judgment = normalizeJudgmentAnswer(row[HEADER_MAP.answer]);
    if (!judgment) {
      errors.push("判断题正确答案需填写“正确”或“错误”。 ");
    } else {
      answer = [judgment];
    }
  } else if (type === "short-answer") {
    referenceAnswer = text(row[HEADER_MAP.referenceAnswer]);
    scoringPoints = normalizeScoringPoints(row[HEADER_MAP.scoringPoints]);

    if (!referenceAnswer) {
      errors.push("简答题需填写参考答案。 ");
    }
  }

  const question = normalizeQuestion({
    type: type || "single",
    stem,
    options,
    answer,
    referenceAnswer,
    scoringPoints,
    explanation: text(row[HEADER_MAP.explanation]),
    difficulty: difficulty || "medium",
    chapter: text(row[HEADER_MAP.chapter]),
    knowledgePoint: text(row[HEADER_MAP.knowledgePoint]),
    source: QUESTION_SOURCES.IMPORT,
    aiMeta: null,
  });

  return {
    excelRowNumber,
    question: {
      ...question,
      score: Number.isFinite(score) ? score : 0,
    },
    errors: errors.map((item) => item.trim()),
  };
}

export async function parseQuestionWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel 文件中没有可读取的工作表。");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rows.length) {
    return {
      items: [],
      validItems: [],
      errorItems: [],
      totalScore: 0,
    };
  }

  const actualHeaders = new Set(
    Object.keys(rows[0] || {}).map((header) => text(header))
  );
  const missingHeaders = [
    HEADER_MAP.type,
    HEADER_MAP.stem,
    HEADER_MAP.difficulty,
    HEADER_MAP.score,
  ].filter((header) => !actualHeaders.has(header));

  if (missingHeaders.length) {
    throw new Error(
      `模板缺少必要列：${missingHeaders.join("、")}。请使用系统提供的模板填写。`
    );
  }

  const items = rows
    .map((row, index) => ({ row, excelRowNumber: index + 2 }))
    .filter(({ row }) => !isCompletelyBlankRow(row))
    .map(({ row, excelRowNumber }) => rowToQuestion(row, excelRowNumber));

  const validItems = items.filter((item) => !item.errors.length);
  const errorItems = items.filter((item) => item.errors.length);
  const totalScore = validItems.reduce(
    (sum, item) => sum + Number(item.question.score || 0),
    0
  );

  return {
    items,
    validItems,
    errorItems,
    totalScore,
  };
}

export function importedQuestionTypeLabel(type) {
  return (
    {
      single: "单选题",
      multiple: "多选题",
      judgment: "判断题",
      "short-answer": "简答题",
    }[type] || "题目"
  );
}
