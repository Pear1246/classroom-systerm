<template>
  <div v-if="detailLoading" class="file-state-page">
    <div class="file-state-card">
      <strong>正在加载文件资料...</strong>
      <span>正在从课程知识库获取最新文件信息</span>
    </div>
  </div>

  <div v-else-if="detailError" class="file-state-page">
    <div class="file-state-card error">
      <strong>文件资料加载失败</strong>
      <span>{{ detailError }}</span>

      <button @click="goBackToKnowledgeBase">返回课程知识库</button>
    </div>
  </div>

  <div v-else-if="materialResult" class="focus-page">
    <section class="focus-header">
      <div class="focus-nav">
        <button
          class="focus-back"
          title="返回课程知识库"
          @click="goBackToKnowledgeBase"
        >
          <AppIcon name="arrow-left" />
        </button>

        <div class="focus-location">
          <div class="breadcrumb">
            <span class="breadcrumb-course">{{ courseTitle }}</span>
            <span>/</span>
            <span>课程知识库</span>
            <span>/</span>
            <span>{{ category.name }}</span>
          </div>

          <span class="location-hint">文件资料</span>
        </div>
      </div>

      <div class="header-actions">
        <span v-if="isCourseEnded" class="readonly-badge"> 已结课 · 只读 </span>

        <button
          v-if="canManageMaterials"
          class="manage-action"
          title="编辑资料信息"
          @click="openEditDialog"
        >
          <AppIcon name="edit" />
          <span>编辑信息</span>
        </button>

        <button
          v-if="canManageMaterials"
          class="delete-action"
          title="删除资料"
          @click="openDeleteDialog"
        >
          <AppIcon name="delete" />
          <span>删除</span>
        </button>

        <button
          class="secondary-action"
          :disabled="!canPreview || !material.fileUrl"
          :title="
            canPreview ? '在当前页面查看文件' : '当前文件类型暂不支持在线预览'
          "
          @click="handlePreview"
        >
          <AppIcon name="file" />
          <span>在线查看</span>
        </button>

        <a
          v-if="material.fileUrl"
          class="primary-action download-link"
          :href="downloadUrl"
          title="下载原文件"
        >
          <AppIcon name="download" />
          <span>下载资料</span>
        </a>

        <button
          v-else
          class="primary-action"
          disabled
          title="当前文件暂不可下载"
        >
          <AppIcon name="download" />
          <span>下载资料</span>
        </button>
      </div>
    </section>

    <section class="file-title-card">
      <div class="file-title-main">
        <span class="file-icon">
          <AppIcon :name="materialIcon" />
        </span>

        <div>
          <div class="tag-row">
            <span class="type-tag">{{ material.fileType || "文件" }}</span>

            <span
              class="visibility-tag"
              :class="{ private: !material.visibleToStudents }"
            >
              <AppIcon
                :name="material.visibleToStudents ? 'eye-open' : 'eye-off'"
              />

              {{ material.visibleToStudents ? "学生可见" : "仅教师" }}
            </span>
          </div>

          <h1>{{ material.title }}</h1>
          <p>{{ material.fileName }}</p>
        </div>
      </div>

      <div class="course-context">
        <span>{{ className || "当前班级" }}</span>
      </div>
    </section>

    <section class="meta-grid">
      <div class="meta-item">
        <span>所属分类</span>
        <strong>{{ category.name }}</strong>
      </div>

      <div class="meta-item">
        <span>文件类型</span>
        <strong>{{ material.fileType || "文件" }}</strong>
      </div>

      <div class="meta-item">
        <span>文件大小</span>
        <strong>{{ material.size || "—" }}</strong>
      </div>

      <div class="meta-item">
        <span>更新时间</span>
        <strong>{{ material.updatedAt }}</strong>
      </div>
    </section>

    <section class="description-card">
      <h3>资料说明</h3>
      <p>{{ material.description || "暂无资料说明。" }}</p>
    </section>

    <section ref="previewSection" class="preview-card">
      <div class="preview-heading">
        <div>
          <h3>文件访问</h3>

          <p v-if="previewKind === 'image'">
            图片支持直接在线预览，也可以下载原文件。
          </p>

          <p v-else-if="previewKind === 'pdf'">
            PDF 支持直接在线阅读，也可以下载原文件。
          </p>

          <p v-else>当前文件类型暂不支持在线预览，请下载后查看。</p>
        </div>

        <span>{{ material.fileName }}</span>
      </div>

      <div v-if="!material.fileUrl" class="preview-placeholder">
        <span class="preview-icon">
          <AppIcon :name="materialIcon" />
        </span>

        <strong>暂时无法访问这个文件</strong>
        <small>当前文件暂时无法访问，请稍后重试。</small>
      </div>

      <div v-else-if="previewKind === 'image'" class="image-preview">
        <img
          :src="material.fileUrl"
          :alt="material.title || material.fileName"
        />
      </div>

      <iframe
        v-else-if="previewKind === 'pdf'"
        class="pdf-preview"
        :src="material.fileUrl"
        :title="material.title || material.fileName"
      ></iframe>

      <div v-else class="preview-placeholder">
        <span class="preview-icon">
          <AppIcon :name="materialIcon" />
        </span>

        <strong>{{ material.fileName || material.title }}</strong>

        <small>
          {{ material.fileType || "该文件" }}
          暂不支持网页内预览，请点击右上角“下载资料”。
        </small>
      </div>
    </section>

    <div
      v-if="showEditDialog"
      class="dialog-mask"
      @click.self="closeEditDialog"
    >
      <div class="edit-dialog">
        <div class="dialog-head">
          <div>
            <h3>编辑资料信息</h3>
            <p>修改名称、所属分类、资料说明和学生可见范围。</p>
          </div>

          <button
            class="dialog-close"
            aria-label="关闭"
            :disabled="isSavingEdit"
            @click="closeEditDialog"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div class="edit-form">
          <label>
            <span class="field-label">
              资料名称
              <span class="required-mark">*</span>
            </span>

            <input
              v-model="editForm.title"
              type="text"
              :disabled="isSavingEdit"
            />
          </label>

          <label>
            <span class="field-label">
              所属分类
              <span class="required-mark">*</span>
            </span>

            <AppSelect
              v-model="editForm.categoryId"
              :options="categories"
              :disabled="isSavingEdit"
            />
          </label>

          <label class="full-row">
            <span class="field-label">资料说明</span>

            <textarea
              v-model="editForm.description"
              rows="4"
              :disabled="isSavingEdit"
            ></textarea>
          </label>

          <div class="visibility-setting full-row">
            <span class="visibility-icon">
              <AppIcon
                :name="editForm.visibleToStudents ? 'eye-open' : 'eye-off'"
              />
            </span>

            <span class="visibility-copy">
              <strong>对学生可见</strong>
              <small>
                {{
                  editForm.visibleToStudents
                    ? "学生可在课程知识库中查看"
                    : "仅教师可查看"
                }}
              </small>
            </span>

            <button
              type="button"
              class="switch"
              :class="{ active: editForm.visibleToStudents }"
              :disabled="isSavingEdit"
              @click="editForm.visibleToStudents = !editForm.visibleToStudents"
            >
              <span></span>
            </button>
          </div>

          <p v-if="editError" class="form-error full-row">
            {{ editError }}
          </p>
        </div>

        <div class="dialog-actions">
          <button
            class="cancel-button"
            :disabled="isSavingEdit"
            @click="closeEditDialog"
          >
            取消
          </button>

          <button
            class="save-button"
            :disabled="isSavingEdit"
            @click="saveFileInfo"
          >
            <AppIcon name="save" />
            <span>
              {{ isSavingEdit ? "保存中..." : "保存修改" }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteDialog"
      class="dialog-mask"
      @click.self="closeDeleteDialog"
    >
      <div class="confirm-dialog">
        <div class="dialog-head">
          <div>
            <h3>删除这个文件？</h3>
            <p>删除后将无法恢复，请确认是否继续。</p>
          </div>

          <button
            class="dialog-close"
            aria-label="关闭"
            :disabled="isDeleting"
            @click="closeDeleteDialog"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <p v-if="deleteError" class="delete-error">
          {{ deleteError }}
        </p>

        <div class="dialog-actions">
          <button
            class="cancel-button"
            :disabled="isDeleting"
            @click="closeDeleteDialog"
          >
            取消
          </button>

          <button
            class="danger-button"
            :disabled="isDeleting"
            @click="deleteFile"
          >
            <AppIcon name="delete" />
            <span>
              {{ isDeleting ? "删除中..." : "确认删除" }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppIcon from "../components/AppIcon.vue";
import AppSelect from "../components/AppSelect.vue";

import { useCourseStore } from "../store/courseStore";
import { useCourseKnowledgeStore } from "../store/courseKnowledgeStore";
import { useCourseLifecycleStore } from "../store/courseLifecycleStore";
import { getCourseAccessPolicy } from "../utils/coursePermissions";

export default {
  name: "MaterialDetailView",

  components: {
    AppIcon,
    AppSelect,
  },

  data() {
    return {
      showEditDialog: false,
      showDeleteDialog: false,
      isSavingEdit: false,
      editError: "",

      isDeleting: false,
      deleteError: "",

      detailLoading: true,
      detailError: "",

      editForm: {
        title: "",
        categoryId: "",
        description: "",
        visibleToStudents: true,
      },
    };
  },

  computed: {
    courseStore() {
      return useCourseStore();
    },

    knowledgeStore() {
      return useCourseKnowledgeStore();
    },

    courseLifecycleStore() {
      return useCourseLifecycleStore();
    },

    teachingClassId() {
      return String(this.$route.params.teachingClassId || "");
    },

    materialId() {
      return String(this.$route.params.materialId || "");
    },

    materialResult() {
      const result = this.knowledgeStore.findMaterial(
        this.teachingClassId,
        this.materialId
      );

      if (!result || result.material.materialKind === "note") {
        return null;
      }

      return result;
    },

    material() {
      return this.materialResult?.material || {};
    },

    categories() {
      return (
        this.knowledgeStore.getCourseData(this.teachingClassId)?.categories ||
        []
      );
    },

    category() {
      return this.materialResult?.category || {};
    },

    currentTeachingClass() {
      const current = this.courseStore.currentTeachingClass;

      if (current && String(current.id) === this.teachingClassId) {
        return current;
      }

      return (
        this.courseStore.teachingClasses.find(
          (item) => String(item.id) === this.teachingClassId
        ) || null
      );
    },

    courseTitle() {
      return this.currentTeachingClass?.courseName || "当前课程";
    },

    className() {
      return this.currentTeachingClass?.className || "";
    },

    courseAccess() {
      const status = this.currentTeachingClass
        ? this.courseLifecycleStore.getStatus(this.currentTeachingClass)
        : "ACTIVE";

      return getCourseAccessPolicy(status);
    },

    canManageMaterials() {
      return this.courseAccess.canManageMaterials;
    },

    isCourseEnded() {
      return this.courseAccess.isEnded;
    },

    fileExtension() {
      const fileName = String(this.material.fileName || "");
      const lastDot = fileName.lastIndexOf(".");

      if (lastDot < 0 || lastDot === fileName.length - 1) {
        return "";
      }

      return fileName.slice(lastDot + 1).toLowerCase();
    },

    previewKind() {
      const type = String(this.material.fileType || "").toLowerCase();

      const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];

      if (
        imageTypes.includes(type) ||
        imageTypes.includes(this.fileExtension)
      ) {
        return "image";
      }

      if (type === "pdf" || this.fileExtension === "pdf") {
        return "pdf";
      }

      return "download";
    },

    canPreview() {
      return this.previewKind === "image" || this.previewKind === "pdf";
    },

    downloadUrl() {
      const fileUrl = String(this.material.fileUrl || "");

      if (!fileUrl) {
        return "";
      }

      return fileUrl.includes("?")
        ? `${fileUrl}&download=true`
        : `${fileUrl}?download=true`;
    },

    materialIcon() {
      if (this.previewKind === "image") {
        return "image";
      }

      return this.material.materialKind === "document" ? "document" : "file";
    },
  },

  async mounted() {
    this.detailLoading = true;
    this.detailError = "";

    try {
      const result = await this.knowledgeStore.fetchKnowledgeBaseDetail(
        this.teachingClassId,
        this.materialId
      );

      if (!result || result.material.materialKind === "note") {
        this.$router.replace(`/course/${this.teachingClassId}/materials`);
      }
    } catch (error) {
      this.detailError = error?.message || "文件资料加载失败";

      console.error("读取文件资料详情失败：", error);
    } finally {
      this.detailLoading = false;
    }
  },

  methods: {
    goBackToKnowledgeBase() {
      this.$router.push(`/course/${this.teachingClassId}/materials`);
    },

    openEditDialog() {
      if (!this.canManageMaterials) return;

      this.editError = "";

      this.editForm = {
        title: this.material.title || "",
        categoryId: this.category.id || "",
        description: this.material.description || "",
        visibleToStudents: this.material.visibleToStudents !== false,
      };

      this.showEditDialog = true;
    },

    closeEditDialog() {
      if (this.isSavingEdit) {
        return;
      }

      this.showEditDialog = false;
      this.editError = "";
    },

    async saveFileInfo() {
      if (!this.canManageMaterials || this.isSavingEdit) {
        return;
      }

      if (!this.editForm.title.trim()) {
        this.editError = "请输入资料名称。";
        return;
      }

      if (!this.editForm.categoryId) {
        this.editError = "请选择所属分类。";
        return;
      }

      this.editError = "";
      this.isSavingEdit = true;

      try {
        const updated = await this.knowledgeStore.updateFileMaterial(
          this.teachingClassId,
          {
            id: this.materialId,
            title: this.editForm.title,
            categoryId: this.editForm.categoryId,
            description: this.editForm.description,
            visibleToStudents: this.editForm.visibleToStudents,
          }
        );

        if (!updated) {
          this.editError = "保存失败，请检查资料信息后重试。";
          return;
        }

        this.showEditDialog = false;
        this.editError = "";
      } catch (error) {
        this.editError = error?.message || "保存失败，请稍后重试";

        console.error("修改文件资料信息失败：", error);
      } finally {
        this.isSavingEdit = false;
      }
    },

    openDeleteDialog() {
      if (!this.canManageMaterials) return;

      this.deleteError = "";
      this.showDeleteDialog = true;
    },

    closeDeleteDialog() {
      if (this.isDeleting) {
        return;
      }

      this.showDeleteDialog = false;
      this.deleteError = "";
    },

    async deleteFile() {
      if (!this.canManageMaterials || this.isDeleting) {
        return;
      }

      this.deleteError = "";
      this.isDeleting = true;

      try {
        const removed = await this.knowledgeStore.deleteFileMaterial(
          this.teachingClassId,
          this.materialId
        );

        if (!removed) {
          this.deleteError = "删除失败，请稍后重试。";
          return;
        }

        this.showDeleteDialog = false;

        await this.$router.replace(`/course/${this.teachingClassId}/materials`);
      } catch (error) {
        this.deleteError = error?.message || "删除失败，请稍后重试";

        console.error("删除文件资料失败：", error);
      } finally {
        this.isDeleting = false;
      }
    },

    handlePreview() {
      if (!this.canPreview || !this.material.fileUrl) {
        return;
      }

      this.$refs.previewSection?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
  },
};
</script>

<style scoped>
.file-state-page {
  min-height: 360px;
  display: grid;
  place-items: center;
}

.file-state-card {
  min-width: 320px;
  max-width: 520px;
  padding: 28px 32px;
  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 18px;
  text-align: center;
}

.file-state-card strong,
.file-state-card span {
  display: block;
}

.file-state-card strong {
  color: #111827;
  font-size: 16px;
}

.file-state-card span {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 12px;
}

.file-state-card button {
  margin-top: 18px;
  padding: 9px 14px;
  border: none;
  border-radius: 9px;
  background: #111827;
  color: #ffffff;
  cursor: pointer;
}

.file-state-card.error strong {
  color: #b91c1c;
}

.focus-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1320px;
  margin: 0 auto;
}

.focus-header,
.file-title-card,
.meta-grid,
.description-card,
.preview-card {
  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 20px;
}

.focus-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 18px;
}

.focus-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.focus-back {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  background: #f3f4f6;
  color: #374151;
  border-radius: 11px;
  cursor: pointer;
}

.focus-back:hover {
  background: #e5e7eb;
}

.focus-location {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: #9ca3af;
  font-size: 12px;
}

.breadcrumb-course {
  color: #374151;
  font-weight: 700;
}

.location-hint {
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.readonly-badge {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #d7e4f5;
  border-radius: 999px;
  background: #f6f9fd;
  color: #356aaf;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.manage-action,
.delete-action,
.secondary-action,
.primary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.manage-action {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.delete-action {
  background: #ffffff;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.secondary-action {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.primary-action {
  border: none;
  background: #111827;
  color: #ffffff;
}

.download-link {
  box-sizing: border-box;
  text-decoration: none;
}

.manage-action:disabled,
.delete-action:disabled,
.secondary-action:disabled,
.primary-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.file-title-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 28px;
}

.file-title-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.file-icon {
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f3f4f6;
  color: #374151;
  border-radius: 15px;
  font-size: 22px;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.type-tag,
.visibility-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.type-tag {
  background: #f3f4f6;
  color: #4b5563;
}

.visibility-tag {
  background: #ecfdf5;
  color: #047857;
}

.visibility-tag.private {
  background: #f3f4f6;
  color: #6b7280;
}

.file-title-card h1,
.file-title-card p {
  margin: 0;
}

.file-title-card h1 {
  margin-top: 10px;
  color: #111827;
  font-size: 29px;
}

.file-title-card p {
  margin-top: 7px;
  color: #9ca3af;
  font-size: 13px;
}

.course-context {
  padding: 8px 11px;
  background: #fafafa;
  color: #6b7280;
  border-radius: 999px;
  font-size: 12px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 18px 20px;
}

.meta-item {
  padding: 14px;
  background: #fafafa;
  border: 1px solid #eeeeee;
  border-radius: 14px;
}

.meta-item span,
.meta-item strong {
  display: block;
}

.meta-item span {
  color: #9ca3af;
  font-size: 11px;
}

.meta-item strong {
  margin-top: 7px;
  color: #374151;
  font-size: 13px;
}

.description-card {
  padding: 20px 22px;
}

.description-card h3,
.description-card p {
  margin: 0;
}

.description-card h3 {
  color: #111827;
  font-size: 15px;
}

.description-card p {
  margin-top: 9px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.8;
}

.preview-card {
  overflow: hidden;
}

.preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #eeeeee;
}

.preview-heading h3,
.preview-heading p {
  margin: 0;
}

.preview-heading h3 {
  color: #111827;
  font-size: 15px;
}

.preview-heading p {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 11px;
}

.preview-heading > span {
  max-width: 40%;
  overflow: hidden;
  color: #9ca3af;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-placeholder {
  min-height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  text-align: center;
}

.preview-icon {
  width: 62px;
  height: 62px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 16px;
  font-size: 25px;
}

.preview-placeholder strong {
  margin-top: 14px;
  color: #374151;
}

.preview-placeholder small {
  margin-top: 6px;
  color: #9ca3af;
}

.pdf-preview {
  width: 100%;
  height: 620px;
  border: 0;
  background: #ffffff;
}

.image-preview {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.image-preview img {
  max-width: 100%;
  max-height: 680px;
  object-fit: contain;
  border-radius: 10px;
}

@media (max-width: 900px) {
  .focus-header,
  .file-title-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }

  .breadcrumb {
    flex-wrap: wrap;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.42);
}

.edit-dialog,
.confirm-dialog {
  width: min(600px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 24px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.2);
}

.confirm-dialog {
  width: min(430px, 100%);
}

.dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.dialog-head h3,
.dialog-head p {
  margin: 0;
}

.dialog-head h3 {
  color: #111827;
  font-size: 19px;
}

.dialog-head p {
  margin-top: 7px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.7;
}

.dialog-close {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 9px;
  cursor: pointer;
}

.edit-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.edit-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: #374151;
  font-size: 13px;
  font-weight: 700;
}

.required-mark {
  margin-left: 2px;
  color: #dc2626;
}

.edit-form input,
.edit-form select,
.edit-form textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  font: inherit;
}

.edit-form select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 38px;
  cursor: pointer;
}

.select-wrap {
  position: relative;
}

.select-arrow {
  position: absolute;
  top: 50%;
  right: 13px;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 12px;
  pointer-events: none;
}

.full-row {
  grid-column: 1 / -1;
}

.visibility-setting {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f9fafb;
  border-radius: 11px;
}

.visibility-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #4b5563;
  border-radius: 10px;
}

.visibility-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.visibility-copy strong {
  color: #374151;
  font-size: 12px;
}

.visibility-copy small {
  color: #9ca3af;
  font-size: 10px;
}

.switch {
  width: 44px;
  height: 24px;
  position: relative;
  padding: 0;
  border: none;
  background: #d1d5db;
  border-radius: 999px;
  cursor: pointer;
}

.switch span {
  width: 18px;
  height: 18px;
  position: absolute;
  top: 3px;
  left: 3px;
  background: #ffffff;
  border-radius: 50%;
  transition: 0.2s;
}

.switch.active {
  background: #111827;
}

.switch.active span {
  transform: translateX(20px);
}

.form-error {
  margin: 0;
  color: #dc2626;
  font-size: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.cancel-button,
.save-button,
.danger-button {
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.cancel-button {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.save-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: #111827;
  color: #ffffff;
}

.danger-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: #b91c1c;
  color: #ffffff;
}

.dialog-close:disabled,
.edit-form input:disabled,
.edit-form select:disabled,
.edit-form textarea:disabled,
.switch:disabled,
.cancel-button:disabled,
.save-button:disabled,
.danger-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.delete-error {
  margin: 14px 0 0;
  color: #b91c1c;
  font-size: 12px;
}

@media (max-width: 620px) {
  .edit-form {
    grid-template-columns: 1fr;
  }

  .full-row {
    grid-column: auto;
  }
}
</style>
