import request from "../utils/request";

export function getStudents(teachingClassId) {
  return request({
    url: `/teaching-classes/${teachingClassId}/students`,
    method: "get",
  });
}

export function getPerformance(teachingClassId) {
  return request({
    url: `/teaching-classes/${teachingClassId}/performance`,
    method: "get",
  });
}

export function getRanking(classId) {
  return request({
    url: "/ranking",
    method: "get",
    params: {
      classId,
    },
  });
}
