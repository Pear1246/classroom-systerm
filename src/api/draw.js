import request from "../utils/request";

export function drawStudent(classId) {
  return request({
    url: "/draw",
    method: "post",
    data: {
      classId,
    },
  });
}

export function submitDrawScore(drawRecordId, score) {
  return request({
    url: `/draw-records/${drawRecordId}/score`,
    method: "post",
    data: {
      score,
    },
  });
}
