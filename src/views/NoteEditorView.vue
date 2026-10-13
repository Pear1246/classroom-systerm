<template>
  <div class="note-editor-page">
    <section class="focus-header">
      <div class="focus-nav">
        <button
          class="focus-back"
          :title="currentNoteId ? '返回阅读模式' : '返回课程知识库'"
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
            <span>{{ currentCategoryName }}</span>
          </div>

          <span class="location-hint">
            {{ isNewNote ? "新建在线笔记" : "编辑在线笔记" }}
          </span>
        </div>
      </div>

      <div class="header-actions">
        <span class="save-state" :class="{ dirty: isDirty && !isSaving }">
          {{ isSaving ? "正在保存..." : isDirty ? "有未保存修改" : "已保存" }}
        </span>

        <button
          class="save-button"
          title="保存（Ctrl+S / ⌘S）"
          :disabled="isSaving"
          @click="saveNote"
        >
          <AppIcon name="save" />
          <span>{{ isSaving ? "保存中" : "保存" }}</span>
        </button>
      </div>
    </section>

    <section class="note-settings-card">
      <div class="form-grid">
        <label class="title-field">
          <span class="field-label">
            笔记标题
            <span class="required-mark">*</span>
          </span>

          <input
            v-model="form.title"
            type="text"
            placeholder="例如：第一章 数据结构概述"
          />
        </label>

        <label>
          <span class="field-label">
            所属分类
            <span class="required-mark">*</span>
          </span>

          <AppSelect v-model="form.categoryId" :options="categories" />
        </label>

        <div class="visibility-setting">
          <span class="visibility-icon">
            <AppIcon :name="form.visibleToStudents ? 'eye-open' : 'eye-off'" />
          </span>

          <span class="visibility-copy">
            <strong>对学生可见</strong>
            <small>
              {{
                form.visibleToStudents
                  ? "学生可在课程知识库中阅读"
                  : "仅教师可查看"
              }}
            </small>
          </span>

          <button
            type="button"
            class="switch"
            :class="{ active: form.visibleToStudents }"
            @click="form.visibleToStudents = !form.visibleToStudents"
          >
            <span></span>
          </button>
        </div>
      </div>

      <p v-if="formError" class="form-error">
        {{ formError }}
      </p>
    </section>

    <section class="editor-card">
      <div class="editor-card-heading">
        <div>
          <h3>笔记内容</h3>
          <p>
            可使用顶部工具栏、Markdown 快捷语法或 / 命令菜单进行编辑。
            鼠标停在工具图标上可查看中文说明，Ctrl+S / ⌘S 可快速保存。
          </p>
        </div>
      </div>

      <MilkdownProvider v-if="editorReady">
        <MilkdownNoteEditor v-model="form.content" />
      </MilkdownProvider>
    </section>

    <div
      v-if="showLeaveDialog"
      class="leave-dialog-mask"
      @click.self="cancelLeave"
    >
      <div class="leave-dialog">
        <div class="leave-dialog-head">
          <div class="leave-dialog-copy">
            <h3>还有未保存的修改</h3>
            <p>可以先保存再离开，也可以放弃本次修改。</p>
          </div>

          <button
            class="leave-dialog-close"
            title="继续编辑"
            aria-label="继续编辑"
            @click="cancelLeave"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div class="leave-dialog-actions">
          <button class="discard-button" @click="discardAndLeave">
            放弃修改
          </button>

          <button class="save-leave-button" @click="saveAndLeave">
            <AppIcon name="save" />
            <span>保存并退出</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { MilkdownProvider } from "@milkdown/vue";

import AppIcon from "../components/AppIcon.vue";
import AppSelect from "../components/AppSelect.vue";
import MilkdownNoteEditor from "../components/MilkdownNoteEditor.vue";

import { useCourseStore } from "../store/courseStore";
import { useCourseKnowledgeStore } from "../store/courseKnowledgeStore";
import { useCourseLifecycleStore } from "../store/courseLifecycleStore";
import { getCourseAccessPolicy } from "../utils/coursePermissions";

export default {
  name: "NoteEditorView",

  components: {
    AppIcon,
    AppSelect,
    MilkdownProvider,
    MilkdownNoteEditor,
  },

  data() {
    return {
      editorReady: false,
      isDirty: false,
      isSaving: false,
      formError: "",

      showLeaveDialog: false,
      pendingNavigation: null,

      currentNoteId: "",

      form: {
        title: "",
        categoryId: "",
        visibleToStudents: true,
        content: "",
      },

      initialSnapshot: "",
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

    routeNoteId() {
      return String(this.$route.params.noteId || "");
    },

    isNewNote() {
      return this.$route.meta.noteMode === "new" && !this.currentNoteId;
    },

    knowledgeData() {
      return this.knowledgeStore.getCourseData(this.teachingClassId);
    },

    categories() {
      return this.knowledgeData?.categories || [];
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

    currentCategoryName() {
      return (
        this.categories.find((category) => category.id === this.form.categoryId)
          ?.name || "未选择分类"
      );
    },

    currentSnapshot() {
      return JSON.stringify({
        title: this.form.title,
        categoryId: this.form.categoryId,
        visibleToStudents: this.form.visibleToStudents,
        content: this.form.content,
      });
    },
  },

  watch: {
    currentSnapshot() {
      if (!this.editorReady) {
        return;
      }

      this.isDirty = this.currentSnapshot !== this.initialSnapshot;
    },

    currentTeachingClass() {
      this.guardCourseLifecycle();
    },
  },

  beforeRouteLeave(to, from, next) {
    if (!this.isDirty) {
      next();
      return;
    }

    this.pendingNavigation = next;
    this.showLeaveDialog = true;
  },

  mounted() {
    if (!this.guardCourseLifecycle()) {
      this.loadNote();
    }

    window.addEventListener("keydown", this.handleSaveShortcut);

    window.addEventListener("beforeunload", this.handleBeforeUnload);
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.handleSaveShortcut);

    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },

  methods: {
    guardCourseLifecycle() {
      if (!this.currentTeachingClass || this.canManageMaterials) {
        return false;
      }

      this.isDirty = false;

      if (this.routeNoteId) {
        this.$router.replace(
          `/course/${this.teachingClassId}/materials/note/${this.routeNoteId}`
        );
      } else {
        this.$router.replace(`/course/${this.teachingClassId}/materials`);
      }

      return true;
    },

    handleBeforeUnload(event) {
      if (!this.isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    },

    cancelLeave() {
      const next = this.pendingNavigation;

      this.pendingNavigation = null;
      this.showLeaveDialog = false;

      if (next) {
        next(false);
      }
    },

    discardAndLeave() {
      const next = this.pendingNavigation;

      this.pendingNavigation = null;
      this.showLeaveDialog = false;
      this.isDirty = false;

      if (next) {
        next();
      }
    },

    handleSaveShortcut(event) {
      if (event.key === "Escape" && this.showLeaveDialog) {
        event.preventDefault();
        this.cancelLeave();
        return;
      }

      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";

      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();

      if (!this.isSaving) {
        this.saveNote();
      }
    },

    async loadNote() {
      const defaultCategoryId = this.categories[0]?.id || "";

      this.editorReady = false;

      if (this.$route.meta.noteMode === "new") {
        this.form = {
          title: "",
          categoryId: defaultCategoryId,
          visibleToStudents: true,
          content: "",
        };

        this.currentNoteId = "";
      } else {
        let result = null;

        try {
          result = await this.knowledgeStore.fetchKnowledgeBaseDetail(
            this.teachingClassId,
            this.routeNoteId
          );
        } catch (error) {
          console.error("加载待编辑在线笔记失败：", error);

          this.$router.replace(`/course/${this.teachingClassId}/materials`);

          return;
        }

        if (!result || result.material.materialKind !== "note") {
          this.$router.replace(`/course/${this.teachingClassId}/materials`);

          return;
        }

        this.currentNoteId = String(result.material.id);

        this.form = {
          title: result.material.title || "",
          categoryId: result.category.id,
          visibleToStudents: result.material.visibleToStudents !== false,
          content: result.material.content || "",
        };
      }

      this.$nextTick(() => {
        this.initialSnapshot = this.currentSnapshot;

        this.isDirty = false;
        this.editorReady = true;
      });
    },

    async saveNote(options = {}) {
      const { replaceRouteAfterCreate = true } = options;

      if (!this.canManageMaterials) {
        this.formError = "课程已结课，知识库内容当前仅供查看。";
        return false;
      }

      if (this.isSaving) {
        return false;
      }

      this.formError = "";

      if (!this.form.title.trim()) {
        this.formError = "请输入笔记标题。";
        return false;
      }

      if (!this.form.categoryId) {
        this.formError = "请选择所属分类。";
        return false;
      }

      this.isSaving = true;

      try {
        const result = await this.knowledgeStore.saveNote(
          this.teachingClassId,
          {
            id: this.currentNoteId || null,
            title: this.form.title,
            categoryId: this.form.categoryId,
            visibleToStudents: this.form.visibleToStudents,
            content: this.form.content,
          }
        );

        if (!result) {
          this.formError = "保存失败，请检查笔记信息后重试。";
          return false;
        }

        const wasNewNote = !this.currentNoteId;

        this.currentNoteId = String(result.material.id);

        this.form = {
          title: result.material.title || "",
          categoryId: result.category.id,
          visibleToStudents: result.material.visibleToStudents !== false,
          content: result.material.content || "",
        };

        await this.$nextTick();

        this.initialSnapshot = this.currentSnapshot;

        this.isDirty = false;

        if (replaceRouteAfterCreate && wasNewNote) {
          await this.$router.replace(
            `/course/${this.teachingClassId}/materials/note/${this.currentNoteId}/edit`
          );
        }

        return true;
      } catch (error) {
        this.formError = error?.message || "在线笔记保存失败";

        console.error("保存在线笔记失败：", error);

        return false;
      } finally {
        this.isSaving = false;
      }
    },

    async saveAndLeave() {
      const next = this.pendingNavigation;

      const saved = await this.saveNote({
        replaceRouteAfterCreate: false,
      });

      if (!saved) {
        this.showLeaveDialog = false;
        this.pendingNavigation = null;

        if (next) {
          next(false);
        }

        return;
      }

      this.showLeaveDialog = false;
      this.pendingNavigation = null;

      if (next) {
        next();
      }
    },

    goBackToKnowledgeBase() {
      if (this.currentNoteId) {
        this.$router.push(
          `/course/${this.teachingClassId}/materials/note/${this.currentNoteId}`
        );
        return;
      }

      this.$router.push(`/course/${this.teachingClassId}/materials`);
    },
  },
};
</script>

<style scoped>
.note-editor-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1400px;
  margin: 0 auto;
}

.focus-header,
.note-settings-card,
.editor-card {
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
  gap: 12px;
  flex-shrink: 0;
}

.save-state {
  color: #059669;
  font-size: 12px;
  font-weight: 700;
}

.save-state.dirty {
  color: #b45309;
}

.save-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 15px;
  background: #111827;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.save-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.note-settings-card {
  padding: 20px 24px;
}

.form-grid {
  display: grid;
  grid-template-columns:
    minmax(0, 1.5fr)
    minmax(220px, 0.7fr)
    minmax(260px, 0.8fr);
  align-items: end;
  gap: 16px;
}

.form-grid label {
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

.form-grid input,
.form-grid select {
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

.form-grid select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 38px;
  cursor: pointer;
}

.select-wrap {
  position: relative;
}

.select-wrap select {
  display: block;
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

.form-grid input:focus,
.form-grid select:focus {
  border-color: #111827;
}

.visibility-setting {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 7px 10px;
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
  transition: 0.2s;
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
  margin: 12px 0 0;
  color: #dc2626;
  font-size: 12px;
}

.editor-card {
  overflow: hidden;
}

.editor-card-heading {
  padding: 18px 24px;
  border-bottom: 1px solid #eeeeee;
}

.editor-card-heading h3,
.editor-card-heading p {
  margin: 0;
}

.editor-card-heading h3 {
  color: #111827;
  font-size: 16px;
}

.editor-card-heading p {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 11px;
}

.leave-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.42);
}

.leave-dialog {
  width: min(430px, 100%);
  padding: 24px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.2);
}

.leave-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.leave-dialog-copy h3,
.leave-dialog-copy p {
  margin: 0;
}

.leave-dialog-copy h3 {
  color: #111827;
  font-size: 19px;
}

.leave-dialog-copy p {
  margin-top: 9px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.7;
}

.leave-dialog-close {
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

.leave-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.discard-button,
.save-leave-button {
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.discard-button {
  background: #ffffff;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.save-leave-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: #111827;
  color: #ffffff;
}

@media (max-width: 1050px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .visibility-setting {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .focus-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .breadcrumb {
    flex-wrap: wrap;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .visibility-setting {
    grid-column: auto;
  }

  .leave-dialog-actions {
    flex-direction: column-reverse;
  }

  .discard-button,
  .save-leave-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
