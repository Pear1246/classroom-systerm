// src/utils/semester.js

export function getCurrentSemester(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 8) {
    return `${year}-${year + 1}第一学期`;
  }

  if (month === 1) {
    return `${year - 1}-${year}第一学期`;
  }

  return `${year - 1}-${year}第二学期`;
}

export function parseSemester(semester) {
  if (!semester) return null;

  const match = String(semester).match(/^(\d{4})-(\d{4})(第一学期|第二学期)$/);

  if (!match) return null;

  return {
    startYear: Number(match[1]),
    endYear: Number(match[2]),
    term: match[3] === "第一学期" ? 1 : 2,
  };
}

export function getSemesterSortValue(semester) {
  const parsed = parseSemester(semester);

  if (!parsed) return -1;

  return parsed.startYear * 10 + parsed.term;
}

export function sortSemesters(semesters = []) {
  return [...semesters].sort((a, b) => {
    const valueA = getSemesterSortValue(a);
    const valueB = getSemesterSortValue(b);

    if (valueA === -1 && valueB === -1) {
      return String(a).localeCompare(String(b), "zh-CN");
    }

    if (valueA === -1) return 1;
    if (valueB === -1) return -1;

    return valueB - valueA;
  });
}

export function getNextSemester(semester) {
  const parsed = parseSemester(semester);

  if (!parsed) {
    return getCurrentSemester();
  }

  if (parsed.term === 1) {
    return `${parsed.startYear}-${parsed.endYear}第二学期`;
  }

  return `${parsed.startYear + 1}-${parsed.endYear + 1}第一学期`;
}

export function getSemesterOptions(count = 5, date = new Date()) {
  const result = [];
  let semester = getCurrentSemester(date);

  for (let i = 0; i < count; i++) {
    result.push(semester);
    semester = getNextSemester(semester);
  }

  return result;
}

export function mergeSemesterOptions(
  semesterOptions = [],
  extraSemesters = []
) {
  const merged = [...semesterOptions, ...extraSemesters].filter(Boolean);

  return sortSemesters([...new Set(merged)]);
}

export function getEditSemesterOptions(
  currentCourseSemester,
  count = 5,
  date = new Date()
) {
  return mergeSemesterOptions(
    getSemesterOptions(count, date),
    currentCourseSemester ? [currentCourseSemester] : []
  );
}

export function getClosestSemester(semesters = [], date = new Date()) {
  if (!Array.isArray(semesters) || semesters.length === 0) {
    return "";
  }

  const currentSemester = getCurrentSemester(date);

  if (semesters.includes(currentSemester)) {
    return currentSemester;
  }

  const currentValue = getSemesterSortValue(currentSemester);

  const validSemesters = semesters
    .map((semester) => ({
      semester,
      value: getSemesterSortValue(semester),
    }))
    .filter((item) => item.value !== -1);

  if (validSemesters.length === 0) {
    return semesters[0] || "";
  }

  validSemesters.sort((a, b) => {
    const distanceA = Math.abs(a.value - currentValue);
    const distanceB = Math.abs(b.value - currentValue);

    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }

    return b.value - a.value;
  });

  return validSemesters[0].semester;
}

export function getDefaultExpandedSemester(semesters = [], date = new Date()) {
  return getClosestSemester(semesters, date);
}
