import { defineStore } from "pinia";

import { createKnowledgeBaseCourseData } from "../config/knowledgeCategories";
import {
  createKnowledgeBaseNote,
  deleteKnowledgeBaseItem,
  getKnowledgeBaseDetail,
  getKnowledgeBaseList,
  updateKnowledgeBaseFile,
  updateKnowledgeBaseNote,
  uploadKnowledgeBaseFile,
} from "../api/knowledgeBase";

function formatBackendDateTime(value) {
  if (!value) {
    return "";
  }

  const text = String(value);

  // 后端 date-time 常见格式：
  // 2026-09-27T13:20:30
  // 2026-09-27 13:20:30
  // 页面统一显示到分钟。
  const normalized = text.replace("T", " ");

  return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
}

function formatFileSize(bytes) {
  const value = Number(bytes);

  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const decimals = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;

  return `${size.toFixed(decimals)} ${units[unitIndex]}`;
}

function getFileExtension(fileName) {
  const text = String(fileName || "");
  const lastDot = text.lastIndexOf(".");

  if (lastDot <= 0 || lastDot === text.length - 1) {
    return "";
  }

  return text.slice(lastDot + 1).toLowerCase();
}

function normalizeFileType(item) {
  const rawType = String(item.fileType || "").trim();
  const lowerType = rawType.toLowerCase();
  const extension = getFileExtension(item.fileName);

  const mimeMap = {
    "application/pdf": "PDF",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PPTX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "image/webp": "WEBP",
    "text/plain": "TXT",
  };

  if (mimeMap[lowerType]) {
    return mimeMap[lowerType];
  }

  if (rawType && !rawType.includes("/")) {
    return rawType.toUpperCase();
  }

  return extension.toUpperCase() || "FILE";
}

function getBackendFileMaterialKind(item) {
  const rawType = String(item.fileType || "").toLowerCase();
  const fileType = normalizeFileType(item).toLowerCase();
  const extension = getFileExtension(item.fileName);

  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

  if (
    rawType.startsWith("image/") ||
    imageExtensions.includes(extension) ||
    imageExtensions.includes(fileType)
  ) {
    return "image";
  }

  const documentExtensions = ["pdf", "doc", "docx", "txt"];

  if (
    rawType.includes("pdf") ||
    rawType.includes("word") ||
    documentExtensions.includes(extension) ||
    documentExtensions.includes(fileType)
  ) {
    return "document";
  }

  return "file";
}

function normalizeBackendNote(item, includeDetail = false) {
  return {
    id: item.id,
    teachingClassId: item.teachingClassId,

    title: item.title || "未命名笔记",

    fileName: item.fileName || "",
    fileType: item.fileType || "NOTE",
    fileSize: item.fileSize ?? null,

    materialKind: "note",
    size: formatFileSize(item.fileSize),

    updatedAt: formatBackendDateTime(item.updatedAt),

    visibleToStudents: item.visibleToStudents !== false,

    description: item.description || "教师在线编写的课程笔记。",

    // list 接口没有 content。
    content: includeDetail ? item.content || "" : "",
    contentLoaded: includeDetail,

    backendType: item.type || "NOTE",
    fileUrl: item.fileUrl || "",
  };
}

function normalizeBackendFile(item, includeDetail = false) {
  return {
    id: item.id,
    teachingClassId: item.teachingClassId,

    title: item.title || item.fileName || "未命名资料",

    fileName: item.fileName || "",
    fileType: normalizeFileType(item),
    fileSize: item.fileSize ?? null,

    materialKind: getBackendFileMaterialKind(item),
    size: formatFileSize(item.fileSize),

    updatedAt: formatBackendDateTime(item.updatedAt),

    visibleToStudents: item.visibleToStudents !== false,

    // list 接口没有 description，详情接口才有。
    description: includeDetail
      ? item.description || "暂无资料说明。"
      : "点击查看资料详情。",

    content: "",
    contentLoaded: false,

    backendType: item.type || "FILE",

    // fileUrl 由详情接口返回，使用后端文件代理相对路径。
    fileUrl: includeDetail ? item.fileUrl || "" : "",
  };
}

function normalizeBackendMaterial(item, includeDetail = false) {
  const type = String(item?.type || "").toUpperCase();

  if (type === "NOTE") {
    return normalizeBackendNote(item, includeDetail);
  }

  if (type === "FILE") {
    return normalizeBackendFile(item, includeDetail);
  }

  return null;
}

export const useCourseKnowledgeStore = defineStore("courseKnowledge", {
  state: () => ({
    courseDataMap: {},

    noteListLoadingMap: {},
    noteListLoadedMap: {},
    noteListErrorMap: {},

    noteDetailLoadingMap: {},
  }),

  actions: {
    ensureCourse(teachingClassId) {
      const key = String(teachingClassId || "");

      if (!key) {
        return null;
      }

      if (!this.courseDataMap[key]) {
        this.courseDataMap[key] = createKnowledgeBaseCourseData();
      }

      return this.courseDataMap[key];
    },

    getCourseData(teachingClassId) {
      return this.ensureCourse(teachingClassId);
    },

    findMaterial(teachingClassId, materialId) {
      const data = this.ensureCourse(teachingClassId);

      if (!data) {
        return null;
      }

      for (const category of data.categories) {
        const material = category.materials.find(
          (item) => String(item.id) === String(materialId)
        );

        if (material) {
          return {
            category,
            material,
          };
        }
      }

      return null;
    },

    findCategoryByBackendName(data, categoryName) {
      return (
        data.categories.find((category) => category.name === categoryName) ||
        data.categories.find((category) => category.name === "其他资料") ||
        data.categories[0] ||
        null
      );
    },

    clearBackendMaterials(data) {
      data.categories.forEach((category) => {
        category.materials = [];
      });
    },

    async fetchKnowledgeBaseList(teachingClassId, { force = false } = {}) {
      const key = String(teachingClassId || "");
      const data = this.ensureCourse(teachingClassId);

      if (!key || !data) {
        return [];
      }

      if (!force && this.noteListLoadedMap[key]) {
        return data.categories.flatMap((category) => category.materials);
      }

      this.noteListLoadingMap[key] = true;
      this.noteListErrorMap[key] = "";

      try {
        const response = await getKnowledgeBaseList(teachingClassId);

        const list = Array.isArray(response) ? response : [];

        this.clearBackendMaterials(data);

        const backendMaterials = [];

        list.forEach((item) => {
          const material = normalizeBackendMaterial(item, false);

          if (!material) {
            return;
          }

          const category = this.findCategoryByBackendName(data, item.category);

          if (!category) {
            return;
          }

          category.materials.push(material);
          backendMaterials.push(material);
        });

        // 每个分类内部按更新时间倒序显示。
        data.categories.forEach((category) => {
          category.materials.sort((a, b) =>
            String(b.updatedAt).localeCompare(String(a.updatedAt))
          );
        });

        this.noteListLoadedMap[key] = true;

        return backendMaterials;
      } catch (error) {
        console.error("获取课程知识库列表失败：", error);

        this.noteListErrorMap[key] = error?.message || "课程知识库加载失败";

        throw error;
      } finally {
        this.noteListLoadingMap[key] = false;
      }
    },

    async fetchKnowledgeBaseDetail(teachingClassId, materialId) {
      const detailKey = `${teachingClassId}-${materialId}`;
      const data = this.ensureCourse(teachingClassId);

      if (!data) {
        return null;
      }

      this.noteDetailLoadingMap[detailKey] = true;

      try {
        const response = await getKnowledgeBaseDetail(materialId);

        if (!response) {
          return null;
        }

        const nextMaterial = normalizeBackendMaterial(response, true);

        if (!nextMaterial) {
          return null;
        }

        let oldLocation = null;

        for (const category of data.categories) {
          const index = category.materials.findIndex(
            (item) => String(item.id) === String(materialId)
          );

          if (index >= 0) {
            oldLocation = {
              category,
              index,
            };
            break;
          }
        }

        const targetCategory = this.findCategoryByBackendName(
          data,
          response.category
        );

        if (!targetCategory) {
          return null;
        }

        if (oldLocation) {
          oldLocation.category.materials.splice(oldLocation.index, 1);
        }

        targetCategory.materials.unshift(nextMaterial);

        return {
          category: targetCategory,
          material: nextMaterial,
        };
      } catch (error) {
        console.error("获取课程知识库详情失败：", error);

        throw error;
      } finally {
        this.noteDetailLoadingMap[detailKey] = false;
      }
    },

    upsertBackendNote(teachingClassId, backendNote) {
      const data = this.ensureCourse(teachingClassId);

      if (!data || !backendNote) {
        return null;
      }

      const nextNote = normalizeBackendNote(backendNote, true);

      let oldLocation = null;

      for (const category of data.categories) {
        const index = category.materials.findIndex(
          (item) => String(item.id) === String(backendNote.id)
        );

        if (index >= 0) {
          oldLocation = {
            category,
            index,
          };
          break;
        }
      }

      const targetCategory = this.findCategoryByBackendName(
        data,
        backendNote.category
      );

      if (!targetCategory) {
        return null;
      }

      if (oldLocation) {
        oldLocation.category.materials.splice(oldLocation.index, 1);
      }

      targetCategory.materials.unshift(nextNote);

      return {
        category: targetCategory,
        material: nextNote,
      };
    },

    async deleteBackendNote(teachingClassId, materialId) {
      const data = this.ensureCourse(teachingClassId);

      if (!data) {
        return null;
      }

      try {
        await deleteKnowledgeBaseItem(materialId);

        for (const category of data.categories) {
          const index = category.materials.findIndex(
            (item) =>
              String(item.id) === String(materialId) &&
              item.materialKind === "note"
          );

          if (index < 0) {
            continue;
          }

          const [removed] = category.materials.splice(index, 1);

          return {
            category,
            material: removed,
          };
        }

        return {
          category: null,
          material: {
            id: materialId,
            materialKind: "note",
          },
        };
      } catch (error) {
        console.error("删除在线笔记失败：", error);

        throw error;
      }
    },

    async uploadFileMaterial(teachingClassId, payload) {
      const data = this.ensureCourse(teachingClassId);

      if (!data) {
        return null;
      }

      const { title, categoryId, description, visibleToStudents, file } =
        payload;

      const category = data.categories.find((item) => item.id === categoryId);

      if (!category || !file) {
        return null;
      }

      const formData = new FormData();

      formData.append("teachingClassId", String(teachingClassId));
      formData.append("title", title.trim());
      formData.append("category", category.name);
      formData.append("file", file);

      if (description?.trim()) {
        formData.append("description", description.trim());
      }

      formData.append("visibleToStudents", String(Boolean(visibleToStudents)));

      try {
        const response = await uploadKnowledgeBaseFile(formData);

        if (!response) {
          return null;
        }

        const nextMaterial = normalizeBackendFile(response, true);

        const targetCategory = this.findCategoryByBackendName(
          data,
          response.category
        );

        if (!targetCategory) {
          return null;
        }

        targetCategory.materials.unshift(nextMaterial);

        this.noteListLoadedMap[String(teachingClassId)] = true;

        return {
          category: targetCategory,
          material: nextMaterial,
        };
      } catch (error) {
        console.error("上传课程知识库文件失败：", error);

        throw error;
      }
    },

    async updateFileMaterial(teachingClassId, payload) {
      const data = this.ensureCourse(teachingClassId);

      if (!data) {
        return null;
      }

      const { id, title, categoryId, description, visibleToStudents } = payload;

      const category = data.categories.find((item) => item.id === categoryId);

      if (!category) {
        return null;
      }

      try {
        const response = await updateKnowledgeBaseFile(id, {
          title: title.trim(),
          category: category.name,
          description: description.trim(),
          visibleToStudents: Boolean(visibleToStudents),
        });

        if (!response) {
          return null;
        }

        const nextMaterial = normalizeBackendFile(response, true);

        let oldLocation = null;

        for (const item of data.categories) {
          const index = item.materials.findIndex(
            (material) => String(material.id) === String(id)
          );

          if (index >= 0) {
            oldLocation = {
              category: item,
              index,
            };
            break;
          }
        }

        const targetCategory = this.findCategoryByBackendName(
          data,
          response.category
        );

        if (!targetCategory) {
          return null;
        }

        if (oldLocation) {
          oldLocation.category.materials.splice(oldLocation.index, 1);
        }

        targetCategory.materials.unshift(nextMaterial);

        this.noteListLoadedMap[String(teachingClassId)] = true;

        return {
          category: targetCategory,
          material: nextMaterial,
        };
      } catch (error) {
        console.error("修改文件资料信息失败：", error);

        throw error;
      }
    },

    async deleteFileMaterial(teachingClassId, materialId) {
      const data = this.ensureCourse(teachingClassId);

      if (!data) {
        return null;
      }

      try {
        await deleteKnowledgeBaseItem(materialId);

        for (const category of data.categories) {
          const index = category.materials.findIndex(
            (item) =>
              String(item.id) === String(materialId) &&
              item.materialKind !== "note"
          );

          if (index < 0) {
            continue;
          }

          const [removed] = category.materials.splice(index, 1);

          return {
            category,
            material: removed,
          };
        }

        return {
          category: null,
          material: {
            id: materialId,
            materialKind: "file",
          },
        };
      } catch (error) {
        console.error("删除文件资料失败：", error);

        throw error;
      }
    },

    async saveNote(teachingClassId, payload) {
      const data = this.ensureCourse(teachingClassId);

      if (!data) {
        return null;
      }

      const { id, title, categoryId, visibleToStudents, content } = payload;

      const category = data.categories.find((item) => item.id === categoryId);

      if (!category) {
        return null;
      }

      try {
        let response = null;

        if (id) {
          response = await updateKnowledgeBaseNote(id, {
            title: title.trim(),
            category: category.name,
            visibleToStudents: Boolean(visibleToStudents),
            content,
          });
        } else {
          response = await createKnowledgeBaseNote({
            teachingClassId,
            title: title.trim(),
            category: category.name,
            visibleToStudents: Boolean(visibleToStudents),
            content,
          });
        }

        if (!response) {
          return null;
        }

        const saved = this.upsertBackendNote(teachingClassId, response);

        this.noteListLoadedMap[String(teachingClassId)] = true;

        return saved;
      } catch (error) {
        console.error(id ? "修改在线笔记失败：" : "创建在线笔记失败：", error);

        throw error;
      }
    },
  },
});
