import request from "../utils/request";

// 获取某个教学班的课程知识库列表
export function getKnowledgeBaseList(teachingClassId) {
  return request({
    url: "/teacher/knowledge-base",
    method: "get",
    params: {
      teachingClassId,
      // 避免浏览器或代理缓存列表结果
      _t: Date.now(),
    },
  });
}

// 获取知识库某一项的完整详情
export function getKnowledgeBaseDetail(id) {
  return request({
    url: `/teacher/knowledge-base/${id}`,
    method: "get",
    params: {
      _t: Date.now(),
    },
  });
}

// 创建在线笔记
export function createKnowledgeBaseNote(data) {
  return request({
    url: "/teacher/knowledge-base/note",
    method: "post",
    data,
  });
}

// 修改已有在线笔记
export function updateKnowledgeBaseNote(id, data) {
  return request({
    url: `/teacher/knowledge-base/${id}/note`,
    method: "put",
    data,
  });
}

// 删除知识库内容（当前阶段用于删除在线笔记）
export function deleteKnowledgeBaseItem(id) {
  return request({
    url: `/teacher/knowledge-base/${id}`,
    method: "delete",
  });
}

// 上传课程知识库文件
// data 必须是 FormData，让浏览器自动生成 multipart boundary。
export function uploadKnowledgeBaseFile(data) {
  return request({
    url: "/teacher/knowledge-base/file",
    method: "post",
    data,
  });
}

// 修改文件资料信息
export function updateKnowledgeBaseFile(id, data) {
  return request({
    url: `/teacher/knowledge-base/${id}/file`,
    method: "put",
    data,
  });
}
