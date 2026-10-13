import { QUESTION_SOURCES, normalizeQuestion } from "../utils/questionModel";

const questionTemplates = [
  {
    type: "single",
    stem: "栈这种数据结构最典型的特点是？",
    options: [
      { key: "A", text: "先进先出" },
      { key: "B", text: "先进后出" },
      { key: "C", text: "随机访问" },
      { key: "D", text: "只能顺序访问" },
    ],
    answer: ["B"],
    explanation: "栈遵循后进先出（LIFO）原则，最后进入栈中的元素最先被取出。",
    difficulty: "easy",
    chapter: "第三章 栈和队列",
    knowledgePoint: "栈的基本概念",
  },
  {
    type: "multiple",
    stem: "下列哪些属于线性表常见的存储结构？",
    options: [
      { key: "A", text: "顺序存储结构" },
      { key: "B", text: "链式存储结构" },
      { key: "C", text: "散列存储结构" },
      { key: "D", text: "索引存储结构" },
    ],
    answer: ["A", "B"],
    explanation: "线性表最典型的两种存储方式是顺序存储和链式存储。",
    difficulty: "easy",
    chapter: "第二章 线性表",
    knowledgePoint: "线性表的存储结构",
  },
  {
    type: "judgment",
    stem: "顺序表中的元素在内存中通常占用连续的存储空间。",
    options: [],
    answer: ["true"],
    explanation: "顺序表使用一组地址连续的存储单元依次存放线性表中的数据元素。",
    difficulty: "easy",
    chapter: "第二章 线性表",
    knowledgePoint: "顺序表",
  },
  {
    type: "single",
    stem: "队列的插入操作通常发生在哪一端？",
    options: [
      { key: "A", text: "队头" },
      { key: "B", text: "队尾" },
      { key: "C", text: "任意位置" },
      { key: "D", text: "中间位置" },
    ],
    answer: ["B"],
    explanation: "一般队列在队尾插入元素，在队头删除元素。",
    difficulty: "easy",
    chapter: "第三章 栈和队列",
    knowledgePoint: "队列的基本操作",
  },
  {
    type: "judgment",
    stem: "单链表中的结点在物理存储空间中必须连续存放。",
    options: [],
    answer: ["false"],
    explanation: "链式存储通过指针关联结点，因此结点在物理空间中不要求连续。",
    difficulty: "medium",
    chapter: "第二章 线性表",
    knowledgePoint: "单链表",
  },
  {
    type: "multiple",
    stem: "下列哪些场景适合使用栈来解决？",
    options: [
      { key: "A", text: "括号匹配" },
      { key: "B", text: "表达式求值" },
      { key: "C", text: "浏览器前进后退" },
      { key: "D", text: "打印任务排队" },
    ],
    answer: ["A", "B", "C"],
    explanation:
      "括号匹配、表达式求值以及历史记录回退都具有明显的后进先出特征。",
    difficulty: "medium",
    chapter: "第三章 栈和队列",
    knowledgePoint: "栈的应用",
  },
  {
    type: "single",
    stem: "在长度为 n 的顺序表中按位置查找一个元素，若可以直接根据下标访问，其时间复杂度通常是？",
    options: [
      { key: "A", text: "O(1)" },
      { key: "B", text: "O(log n)" },
      { key: "C", text: "O(n)" },
      { key: "D", text: "O(n²)" },
    ],
    answer: ["A"],
    explanation:
      "顺序表支持随机访问，通过下标可以直接定位元素，时间复杂度为 O(1)。",
    difficulty: "medium",
    chapter: "第二章 线性表",
    knowledgePoint: "顺序表的访问",
  },
  {
    type: "judgment",
    stem: "循环队列可以利用取模运算让队头和队尾在数组空间中循环移动。",
    options: [],
    answer: ["true"],
    explanation:
      "循环队列通过取模运算复用数组前端空间，避免普通顺序队列的假溢出问题。",
    difficulty: "medium",
    chapter: "第三章 栈和队列",
    knowledgePoint: "循环队列",
  },
  {
    type: "single",
    stem: "分析算法时间复杂度时，通常更关注哪一种规模变化趋势？",
    options: [
      { key: "A", text: "运行机器的品牌" },
      { key: "B", text: "输入规模增长时基本操作次数的增长趋势" },
      { key: "C", text: "程序文件的大小" },
      { key: "D", text: "变量名称的长短" },
    ],
    answer: ["B"],
    explanation:
      "时间复杂度用于描述输入规模增长时算法基本操作次数的数量级变化。",
    difficulty: "easy",
    chapter: "第一章 绪论",
    knowledgePoint: "算法复杂度",
  },
  {
    type: "multiple",
    stem: "关于单链表插入操作，下列说法正确的是？",
    options: [
      { key: "A", text: "已知插入位置前驱结点时，修改指针即可完成插入" },
      { key: "B", text: "不需要整体移动后续元素" },
      { key: "C", text: "所有情况下都比顺序表查找更快" },
      { key: "D", text: "需要正确维护结点之间的链接关系" },
    ],
    answer: ["A", "B", "D"],
    explanation:
      "链表插入的核心是修改指针关系，不需要像顺序表一样整体移动元素，但查找位置仍可能需要遍历。",
    difficulty: "hard",
    chapter: "第二章 线性表",
    knowledgePoint: "链表插入",
  },
  {
    type: "judgment",
    stem: "栈只能采用顺序存储结构实现。",
    options: [],
    answer: ["false"],
    explanation: "栈既可以使用顺序存储实现，也可以使用链式存储实现。",
    difficulty: "medium",
    chapter: "第三章 栈和队列",
    knowledgePoint: "栈的存储结构",
  },
  {
    type: "single",
    stem: "线性表中除了第一个元素外，每个元素通常有几个直接前驱？",
    options: [
      { key: "A", text: "0 个" },
      { key: "B", text: "1 个" },
      { key: "C", text: "2 个" },
      { key: "D", text: "不确定" },
    ],
    answer: ["B"],
    explanation: "在线性结构中，除首元素外，每个元素有且仅有一个直接前驱。",
    difficulty: "easy",
    chapter: "第二章 线性表",
    knowledgePoint: "线性表的逻辑特征",
  },
  {
    type: "short-answer",
    stem: "请简要说明栈与队列在数据进出顺序上的主要区别。",
    referenceAnswer: "栈遵循后进先出（LIFO），队列遵循先进先出（FIFO）。",
    scoringPoints: ["指出栈是后进先出", "指出队列是先进先出"],
    explanation: "可从元素进入和离开数据结构的先后关系进行比较。",
    difficulty: "easy",
    chapter: "第三章 栈和队列",
    knowledgePoint: "栈与队列比较",
  },
  {
    type: "short-answer",
    stem: "为什么循环队列能够缓解普通顺序队列中的“假溢出”问题？",
    referenceAnswer:
      "循环队列通过取模运算让队头和队尾在数组中循环移动，从而重新利用数组前端已经释放的空间。",
    scoringPoints: ["说明通过取模实现循环移动", "说明能够复用数组前端空闲空间"],
    explanation: "关键在于将线性数组逻辑上首尾相接，提升存储空间利用率。",
    difficulty: "medium",
    chapter: "第三章 栈和队列",
    knowledgePoint: "循环队列",
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatTime(offsetMinutes = 0) {
  const now = new Date(Date.now() - offsetMinutes * 60 * 1000);
  const pad = (value) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function createQuestionMockData(courseId) {
  const scopeId = String(courseId || "");

  return clone(questionTemplates).map((item, index) =>
    normalizeQuestion({
      ...item,
      id: String(index + 1),
      courseId: scopeId,
      source: QUESTION_SOURCES.MANUAL,
      aiMeta: null,
      createdAt: formatTime(180 + index * 17),
      updatedAt: formatTime(index * 9),
    })
  );
}
