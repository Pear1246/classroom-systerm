import request from "../utils/request";

// 获取当前教师课程空间
export function getTeachingClasses(teacherId) {
  return request({
    url: `/teachers/${teacherId}/teaching-classes`,
    method: "get",
    params: {
      _t: Date.now(),
    },
  });
}

// 教师创建自己的课程空间
export function createTeacherClass(data) {
  return request({
    url: "/teacher/classes",
    method: "post",
    data,
  });
}

// 教师修改自己的课程空间
export function updateTeacherClass(classId, data) {
  return request({
    url: `/teacher/classes/${classId}`,
    method: "put",
    data,
  });
}

// 教师删除自己的课程空间
export function deleteTeacherClass(classId) {
  return request({
    url: `/teacher/classes/${classId}`,
    method: "delete",
  });
}

// 教师课堂签到

// 发起签到
export function startSignActivity(classId, activityName = "") {
  const params = {
    classId,
  };

  if (activityName) {
    params.activityName = activityName;
  }

  return request({
    url: "/teacher/sign-activity/start",
    method: "post",
    params,
  });
}

// 获取签到二维码
export function getSignActivityQr(activityId) {
  return request({
    url: "/teacher/sign-activity/qr",
    method: "get",
    params: {
      activityId,
    },
    responseType: "blob",
  });
}

// 结束签到
export function endSignActivity(activityId) {
  return request({
    url: "/teacher/sign-activity/end",
    method: "post",
    params: {
      activityId,
    },
  });
}

// 获取实时签到统计
export function getSignActivityStatistics(activityId) {
  return request({
    url: "/teacher/sign-activity/statistics",
    method: "get",
    params: {
      activityId,
    },
  });
}

// 获取某次签到活动详情
export function getSignActivityDetail(activityId) {
  return request({
    url: "/teacher/sign-activity/detail",
    method: "get",
    params: {
      activityId,
    },
  });
}

// 教师补签
export function makeupSignActivity({ activityId, studentId, remark = "" }) {
  return request({
    url: "/teacher/sign-activity/makeup",
    method: "post",
    data: {
      activityId,
      studentId,
      remark,
    },
  });
}

// 历史签到
// 获取某个课程空间的历史签到记录
export function getSignActivities({
  classId,
  startDate = "",
  endDate = "",
  page = 1,
  size = 20,
}) {
  const params = {
    classId,
    page,
    size,
  };

  if (startDate) {
    params.startDate = startDate;
  }

  if (endDate) {
    params.endDate = endDate;
  }

  return request({
    url: "/teacher/sign-activities",
    method: "get",
    params,
  });
}
