export const COURSE_LIFECYCLE_STATUS = Object.freeze({
  UPCOMING: "UPCOMING",
  ACTIVE: "ACTIVE",
  ENDED: "ENDED",
});

export function normalizeCourseStatus(status) {
  const value = String(status || "").toUpperCase();

  if (Object.values(COURSE_LIFECYCLE_STATUS).includes(value)) {
    return value;
  }

  return COURSE_LIFECYCLE_STATUS.ACTIVE;
}

export function getCourseAccessPolicy(status) {
  const normalized = normalizeCourseStatus(status);
  const isUpcoming = normalized === COURSE_LIFECYCLE_STATUS.UPCOMING;
  const isActive = normalized === COURSE_LIFECYCLE_STATUS.ACTIVE;
  const isEnded = normalized === COURSE_LIFECYCLE_STATUS.ENDED;

  return {
    status: normalized,
    isUpcoming,
    isActive,
    isEnded,

    // 顶部课程空间导航。
    showSign: isActive,
    showRoll: isActive,
    showPerformance: isActive || isEnded,
    showMaterials: true,
    showQuestions: true,
    showStudents: true,
    showSignRecords: isActive || isEnded,
    showSummary: isEnded,

    // 课程知识库：未开始阶段允许提前备课，结课后冻结历史内容。
    canManageMaterials: !isEnded,

    // 练习：未开始阶段可以备课并保存草稿，但只有进行中的课程可以发布。
    canCreateExercise: !isEnded,
    canModifyExercise: !isEnded,
    canPublishExercise: isActive,
    canEndExercise: isActive,
    canViewExerciseResults: !isUpcoming,
    canGradeExercise: !isUpcoming,

    // 题目库属于 Course，可跨学期积累，因此不随某个教学班结课而冻结。
    canManageQuestionBank: true,

    defaultSection: isUpcoming ? "materials" : isEnded ? "summary" : "roll",
  };
}

export function isCourseSectionAllowed(status, section) {
  const policy = getCourseAccessPolicy(status);

  return (
    {
      sign: policy.showSign,
      roll: policy.showRoll,
      performance: policy.showPerformance,
      materials: policy.showMaterials,
      questions: policy.showQuestions,
      students: policy.showStudents,
      "sign-records": policy.showSignRecords,
      summary: policy.showSummary,
    }[section] !== false
  );
}

export function getCourseDefaultPath(teachingClassId, status) {
  const id = String(teachingClassId || "");
  const policy = getCourseAccessPolicy(status);

  return `/course/${id}/${policy.defaultSection}`;
}
