import { calculateSubmissionResult } from "./exerciseGrading";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function formatPercent(value, digits = 1) {
  const number = toNumber(value, 0);
  const fixed = number.toFixed(digits);
  return Number(fixed) % 1 === 0 ? String(Number(fixed)) : fixed;
}

export function formatDateTime(value) {
  if (!value) return "--";

  const text = String(value).replace("T", " ");
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+)(\d{2}):(\d{2})/);

  if (!match) return text;

  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function formatGeneratedAt(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function calculateAttendanceSummary(records = []) {
  const validRecords = Array.isArray(records) ? records : [];
  const totalSigned = validRecords.reduce(
    (sum, item) => sum + toNumber(item?.signedCount),
    0
  );
  const totalExpected = validRecords.reduce(
    (sum, item) => sum + toNumber(item?.totalStudents),
    0
  );
  const averageRate =
    totalExpected > 0 ? (totalSigned / totalExpected) * 100 : 0;

  return {
    activityCount: validRecords.length,
    totalSigned,
    totalExpected,
    averageRate,
  };
}

export function calculatePerformanceSummary(students = []) {
  const list = Array.isArray(students) ? students : [];
  const interactionCount = list.reduce(
    (sum, item) => sum + toNumber(item?.totalCalled ?? item?.count),
    0
  );
  const totalScore = list.reduce(
    (sum, item) => sum + toNumber(item?.totalScore ?? item?.score),
    0
  );
  const participantCount = list.filter(
    (item) => toNumber(item?.totalCalled ?? item?.count) > 0
  ).length;
  const averageScore = interactionCount > 0 ? totalScore / interactionCount : 0;

  return {
    interactionCount,
    participantCount,
    averageScore,
  };
}

export function calculateKnowledgeSummary(courseData) {
  const categories = Array.isArray(courseData?.categories)
    ? courseData.categories
    : [];
  const categoryRows = categories.map((category) => {
    const materials = Array.isArray(category?.materials)
      ? category.materials
      : [];
    return {
      id: String(category?.id || category?.name || ""),
      name: category?.name || "未分类",
      count: materials.length,
      materials,
    };
  });
  const materials = categoryRows.flatMap((item) => item.materials);
  const noteCount = materials.filter(
    (item) => item?.materialKind === "note"
  ).length;
  const fileCount = materials.length - noteCount;

  return {
    totalCount: materials.length,
    noteCount,
    fileCount,
    categories: categoryRows,
    materials,
  };
}

export function calculateExerciseSummary(
  exercises = [],
  getSubmissions = () => []
) {
  const publishedExercises = (Array.isArray(exercises) ? exercises : []).filter(
    (exercise) => exercise?.status !== "DRAFT"
  );

  let submittedTotal = 0;
  let expectedTotal = 0;
  let fullyGradedSubmissionCount = 0;
  let gradedScoreTotal = 0;
  let gradedScoreCount = 0;
  let questionCount = 0;
  const scoreRows = [];

  const exerciseRows = publishedExercises.map((exercise) => {
    const expectedCount = toNumber(exercise?.expectedCount);
    const submissionValue = getSubmissions(exercise);
    const submissions = Array.isArray(submissionValue) ? submissionValue : [];
    const submittedRows = submissions.filter((item) => item?.submitted);
    const submittedCount =
      submittedRows.length || toNumber(exercise?.submittedCount);
    const completionRate =
      expectedCount > 0 ? (submittedCount / expectedCount) * 100 : 0;
    const questions = Array.isArray(exercise?.questions)
      ? exercise.questions
      : [];
    questionCount += questions.length;

    let exerciseScoreTotal = 0;
    let exerciseScoreCount = 0;
    let gradedCount = 0;

    submittedRows.forEach((submission) => {
      const result = calculateSubmissionResult(exercise, submission);
      const finalScore = result?.finalScore;

      scoreRows.push({
        exerciseId: String(exercise?.id || ""),
        exerciseName: exercise?.name || "未命名练习",
        studentId: String(submission?.studentId || ""),
        studentName: submission?.studentName || "",
        submitted: true,
        submittedAt: submission?.submittedAt || "",
        fullyGraded: result?.fullyGraded === true,
        finalScore: result?.fullyGraded ? toNumber(finalScore) : null,
        maxScore: toNumber(result?.maxScore),
      });

      if (result?.fullyGraded) {
        const score = toNumber(finalScore);
        exerciseScoreTotal += score;
        exerciseScoreCount += 1;
        gradedScoreTotal += score;
        gradedScoreCount += 1;
        gradedCount += 1;
      }
    });

    submissions
      .filter((item) => !item?.submitted)
      .forEach((submission) => {
        scoreRows.push({
          exerciseId: String(exercise?.id || ""),
          exerciseName: exercise?.name || "未命名练习",
          studentId: String(submission?.studentId || ""),
          studentName: submission?.studentName || "",
          submitted: false,
          submittedAt: "",
          fullyGraded: false,
          finalScore: null,
          maxScore: questions.reduce(
            (sum, question) => sum + toNumber(question?.score, 10),
            0
          ),
        });
      });

    submittedTotal += submittedCount;
    expectedTotal += expectedCount;
    fullyGradedSubmissionCount += gradedCount;

    return {
      id: String(exercise?.id || ""),
      name: exercise?.name || "未命名练习",
      type: exercise?.type || "CLASSROOM",
      status: exercise?.status || "ENDED",
      questionCount: questions.length,
      submittedCount,
      expectedCount,
      completionRate,
      gradedCount,
      averageScore:
        exerciseScoreCount > 0 ? exerciseScoreTotal / exerciseScoreCount : null,
    };
  });

  return {
    publishedCount: publishedExercises.length,
    endedCount: publishedExercises.filter((item) => item?.status === "ENDED")
      .length,
    questionCount,
    submittedTotal,
    expectedTotal,
    averageCompletionRate:
      expectedTotal > 0 ? (submittedTotal / expectedTotal) * 100 : 0,
    fullyGradedSubmissionCount,
    averageScore:
      gradedScoreCount > 0 ? gradedScoreTotal / gradedScoreCount : null,
    exercises: exerciseRows,
    scoreRows,
  };
}

export function collectCoveredChapters(exercises = []) {
  const chapters = new Set();

  (Array.isArray(exercises) ? exercises : [])
    .filter((exercise) => exercise?.status !== "DRAFT")
    .forEach((exercise) => {
      (Array.isArray(exercise?.questions) ? exercise.questions : []).forEach(
        (question) => {
          const chapter = String(question?.chapter || "").trim();
          if (chapter) chapters.add(chapter);
        }
      );
    });

  return [...chapters].sort((a, b) =>
    String(a).localeCompare(String(b), "zh-CN", { numeric: true })
  );
}

export function buildCourseSummary({
  teachingClass,
  lifecycle,
  students,
  performanceStudents,
  signRecords,
  knowledgeData,
  exercises,
  getSubmissions,
  questions = [],
  generatedAt = new Date(),
}) {
  const attendance = calculateAttendanceSummary(signRecords);
  const performance = calculatePerformanceSummary(performanceStudents);
  const knowledge = calculateKnowledgeSummary(knowledgeData);
  const exercise = calculateExerciseSummary(exercises, getSubmissions);

  if (lifecycle?.status === "ENDED") {
    exercise.endedCount = exercise.publishedCount;
    exercise.exercises = exercise.exercises.map((item) => ({
      ...item,
      status: "ENDED",
    }));
  }

  const chapters = collectCoveredChapters(exercises);

  return {
    course: {
      teachingClassId: String(teachingClass?.id || ""),
      courseId: String(teachingClass?.courseId || teachingClass?.id || ""),
      courseName: teachingClass?.courseName || "未设置课程",
      className: teachingClass?.className || "未命名班级",
      semester: teachingClass?.semester || "未设置学期",
      teacherName: teachingClass?.teacherName || "教师",
      endedAt: lifecycle?.endedAt || null,
    },
    generatedAt: formatGeneratedAt(generatedAt),
    studentCount: Array.isArray(students) ? students.length : 0,
    students: Array.isArray(students) ? students : [],
    attendance,
    signRecords: Array.isArray(signRecords) ? signRecords : [],
    performance,
    performanceStudents: Array.isArray(performanceStudents)
      ? performanceStudents
      : [],
    knowledge,
    exercise,
    questionBank: {
      questionCount: Array.isArray(questions) ? questions.length : 0,
    },
    chapters,
    aiSummary: null,
  };
}
