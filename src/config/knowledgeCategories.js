export const KNOWLEDGE_BASE_COURSE_INTRODUCTION =
  "本课程资料区用于集中整理教学课件、实验指导、作业说明和补充学习资源。教师可以在这里统一管理课程资料，并决定哪些内容对学生开放。";

export const KNOWLEDGE_BASE_CATEGORIES = [
  {
    id: "courseware",
    name: "教学课件",
    description: "按章节整理课堂使用的课件与讲义",
  },
  {
    id: "experiment",
    name: "实验资料",
    description: "实验指导书、实验要求与示例文件",
  },
  {
    id: "assignment",
    name: "作业资料",
    description: "课堂作业、课后练习及提交说明",
  },
  {
    id: "other",
    name: "其他资料",
    description: "课程相关的扩展阅读与辅助内容",
  },
];

export function createKnowledgeBaseCourseData() {
  return {
    courseIntroduction: KNOWLEDGE_BASE_COURSE_INTRODUCTION,
    categories: KNOWLEDGE_BASE_CATEGORIES.map((category) => ({
      ...category,
      materials: [],
    })),
  };
}
