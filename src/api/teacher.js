import request from "../utils/request";

export function getTeachingClasses(teacherId) {
  return request({
    url: `/teachers/${teacherId}/teaching-classes`,
    method: "get",
  });
}
