import request from "../utils/request";

// 获取教师列表
export function getAdminTeachers() {
  return request({
    url: "/admin/teachers",
    method: "get",
    params: {
      _t: Date.now(),
    },
  });
}

// 获取学生账号列表
export function getAdminStudents() {
  return request({
    url: "/admin/students",
    method: "get",
    params: {
      _t: Date.now(),
    },
  });
}

// 新增学生账号
export function createAdminStudent(data) {
  return request({
    url: "/admin/students",
    method: "post",
    data,
  });
}

// 删除学生账号
export function deleteAdminStudent(studentId) {
  return request({
    url: `/admin/students/${studentId}`,
    method: "delete",
  });
}

// 重置学生密码
export function resetAdminStudentPassword(userId) {
  return request({
    url: `/admin/students/${userId}/reset-password`,
    method: "put",
  });
}

// 获取课程空间列表
export function getAdminClasses() {
  return request({
    url: "/admin/classes",
    method: "get",
    params: {
      _t: Date.now(),
    },
  });
}

// 管理员新建课程空间
export function createAdminClass(data) {
  return request({
    url: "/admin/classes",
    method: "post",
    data,
  });
}

// 管理员修改课程空间
export function updateAdminClass(classId, data) {
  return request({
    url: `/admin/classes/${classId}`,
    method: "put",
    data,
  });
}

// 管理员删除课程空间
export function deleteAdminClass(classId) {
  return request({
    url: `/admin/classes/${classId}`,
    method: "delete",
  });
}

// Excel 批量导入学生
export function importAdminStudentsByExcel(file) {
  const formData = new FormData();

  formData.append("file", file);

  return request({
    url: "/admin/students/import",
    method: "post",
    data: formData,
  });
}

// 文本批量导入学生
export function importAdminStudentsByText(text) {
  return request({
    url: "/admin/students/import-text",
    method: "post",
    data: {
      text,
    },
  });
}
