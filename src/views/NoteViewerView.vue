<template>
  <div v-if="detailLoading" class="note-state-page">
    <div class="note-state-card">
      <strong>正在加载在线笔记...</strong>
      <span>正在从课程知识库获取最新内容</span>
    </div>
  </div>

  <div v-else-if="detailError" class="note-state-page">
    <div class="note-state-card error">
      <strong>在线笔记加载失败</strong>
      <span>{{ detailError }}</span>

      <button @click="goBackToKnowledgeBase">返回课程知识库</button>
    </div>
  </div>

  <div v-else-if="noteResult" class="focus-page">
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

          <span class="location-hint">在线笔记 · 阅读模式</span>
        </div>
      </div>

      <div class="header-actions">
        <span v-if="isCourseEnded" class="readonly-badge"> 已结课 · 只读 </span>

        <button
          class="export-button"
          title="导出为 Markdown 文件"
          @click="exportNote"
        >
          <AppIcon name="download" />
          <span>导出 .md</span>
        </button>

        <button
          v-if="canManageMaterials"
          class="delete-button"
          @click="openDeleteDialog"
        >
          <AppIcon name="delete" />
          <span>删除</span>
        </button>

        <button v-if="canManageMaterials" class="edit-button" @click="editNote">
          <AppIcon name="edit" />
          <span>编辑笔记</span>
        </button>
      </div>
    </section>

    <section class="note-title-card">
      <div>
        <div class="tag-row">
          <span class="type-tag">在线笔记</span>

          <span
            class="visibility-tag"
            :class="{ private: !note.visibleToStudents }"
          >
            <AppIcon :name="note.visibleToStudents ? 'eye-open' : 'eye-off'" />

            {{ note.visibleToStudents ? "学生可见" : "仅教师" }}
          </span>
        </div>

        <h1>{{ note.title }}</h1>

        <p>
          {{ className || "当前班级" }}
          <span> · 更新于 {{ note.updatedAt }}</span>
        </p>
      </div>
    </section>

    <section class="note-content-card">
      <div class="content-heading">
        <div>
          <h3>笔记内容</h3>
          <p>
            {{
              isCourseEnded
                ? "课程已结课，当前保留笔记内容供查看与导出。"
                : "当前为只读阅读模式，需要修改时点击右上角“编辑笔记”。"
            }}
          </p>
        </div>
      </div>

      <div class="note-render-area">
        <MilkdownProvider>
          <MilkdownNoteViewer :content="note.content" />
        </MilkdownProvider>
      </div>
    </section>

    <div
      v-if="showDeleteDialog"
      class="dialog-mask"
      @click.self="showDeleteDialog = false"
    >
      <div class="confirm-dialog">
        <div class="confirm-head">
          <div>
            <h3>删除在线笔记？</h3>
            <p>删除后这篇笔记将从当前课程知识库中移除。</p>
          </div>

          <button
            class="dialog-close"
            aria-label="关闭"
            @click="showDeleteDialog = false"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <p v-if="deleteError" class="delete-error">
          {{ deleteError }}
        </p>

        <div class="confirm-actions">
          <button
            class="cancel-button"
            :disabled="isDeleting"
            @click="showDeleteDialog = false"
          >
            取消
          </button>

          <button
            class="danger-button"
            :disabled="isDeleting"
            @click="deleteNote"
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
import { MilkdownProvider } from "@milkdown/vue";

import AppIcon from "../components/AppIcon.vue";
import MilkdownNoteViewer from "../components/MilkdownNoteViewer.vue";

import { useCourseStore } from "../store/courseStore";
import { useCourseKnowledgeStore } from "../store/courseKnowledgeStore";
import { useCourseLifecycleStore } from "../store/courseLifecycleStore";
import { getCourseAccessPolicy } from "../utils/coursePermissions";
import { exportMarkdownFile } from "../utils/exportMarkdown";

export default {
  name: "NoteViewerView",

  components: {
    AppIcon,
    MilkdownProvider,
    MilkdownNoteViewer,
  },

  data() {
    return {
      showDeleteDialog: false,
      isDeleting: false,
      deleteError: "",

      detailLoading: true,
      detailError: "",
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

    noteId() {
      return String(this.$route.params.noteId || "");
    },

    noteResult() {
      const result = this.knowledgeStore.findMaterial(
        this.teachingClassId,
        this.noteId
      );

      if (!result || result.material.materialKind !== "note") {
        return null;
      }

      return result;
    },

    note() {
      return this.noteResult?.material || {};
    },

    category() {
      return this.noteResult?.category || {};
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
  },

  async mounted() {
    this.detailLoading = true;
    this.detailError = "";

    try {
      const result = await this.knowledgeStore.fetchKnowledgeBaseDetail(
        this.teachingClassId,
        this.noteId
      );

      if (!result) {
        this.$router.replace(`/course/${this.teachingClassId}/materials`);
      }
    } catch (error) {
      this.detailError = error?.message || "在线笔记加载失败";

      console.error("阅读在线笔记失败：", error);
    } finally {
      this.detailLoading = false;
    }
  },

  methods: {
    goBackToKnowledgeBase() {
      this.$router.push(`/course/${this.teachingClassId}/materials`);
    },

    editNote() {
      if (!this.canManageMaterials) return;

      this.$router.push(
        `/course/${this.teachingClassId}/materials/note/${this.noteId}/edit`
      );
    },

    exportNote() {
      exportMarkdownFile(this.note.title, this.note.content);
    },

    openDeleteDialog() {
      if (!this.canManageMaterials) return;

      this.deleteError = "";
      this.showDeleteDialog = true;
    },

    async deleteNote() {
      if (!this.canManageMaterials || this.isDeleting) {
        return;
      }

      this.deleteError = "";
      this.isDeleting = true;

      try {
        await this.knowledgeStore.deleteBackendNote(
          this.teachingClassId,
          this.noteId
        );

        this.showDeleteDialog = false;

        await this.$router.replace(`/course/${this.teachingClassId}/materials`);
      } catch (error) {
        this.deleteError = error?.message || "删除失败，请稍后重试";

        console.error("删除在线笔记失败：", error);
      } finally {
        this.isDeleting = false;
      }
    },
  },
};
</script>

<style scoped>
.focus-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1320px;
  margin: 0 auto;
}

.focus-header,
.note-title-card,
.note-content-card {
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

.export-button,
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

.delete-button,
.edit-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.export-button {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.delete-button {
  background: #ffffff;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.edit-button {
  background: #111827;
  color: #ffffff;
  border: none;
}

.note-title-card {
  padding: 26px 30px;
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

.note-title-card h1,
.note-title-card p {
  margin: 0;
}

.note-title-card h1 {
  margin-top: 11px;
  color: #111827;
  font-size: 31px;
}

.note-title-card p {
  margin-top: 8px;
  color: #9ca3af;
  font-size: 12px;
}

.note-content-card {
  overflow: hidden;
}

.content-heading {
  padding: 18px 24px;
  border-bottom: 1px solid #eeeeee;
}

.content-heading h3,
.content-heading p {
  margin: 0;
}

.content-heading h3 {
  color: #111827;
  font-size: 16px;
}

.content-heading p {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 11px;
}

.note-render-area {
  max-width: 920px;
  margin: 0 auto;
  padding: 30px 44px 48px;
}

@media (max-width: 720px) {
  .focus-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .breadcrumb {
    flex-wrap: wrap;
  }

  .note-render-area {
    padding: 24px 20px 36px;
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

.confirm-dialog {
  width: min(430px, 100%);
  padding: 24px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.2);
}

.confirm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.confirm-head h3,
.confirm-head p {
  margin: 0;
}

.confirm-head h3 {
  color: #111827;
  font-size: 19px;
}

.confirm-head p {
  margin-top: 9px;
  color: #6b7280;
  font-size: 13px;
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

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.cancel-button,
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

.danger-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: #b91c1c;
  color: #ffffff;
}

.cancel-button:disabled,
.danger-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.delete-error {
  margin: 14px 0 0;
  color: #b91c1c;
  font-size: 12px;
}

.note-state-page {
  max-width: 760px;
  margin: 80px auto 0;
}

.note-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 42px 28px;
  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 20px;
  text-align: center;
}

.note-state-card strong {
  color: #111827;
  font-size: 16px;
}

.note-state-card span {
  color: #9ca3af;
  font-size: 12px;
}

.note-state-card.error strong {
  color: #b91c1c;
}

.note-state-card button {
  margin-top: 12px;
  padding: 9px 14px;
  border: none;
  background: #111827;
  color: #ffffff;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 700;
}
</style>
