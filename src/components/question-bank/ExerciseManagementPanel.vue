<template>
  <div class="exercise-panel">
    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-icon dark">
          <AppIcon name="question-bank" />
        </span>
        <div>
          <strong>{{ stats.total }}</strong>
          <span>全部练习</span>
        </div>
      </article>

      <article class="stat-card">
        <span class="stat-icon draft">
          <AppIcon name="edit" />
        </span>
        <div>
          <strong>{{ stats.draft }}</strong>
          <span>草稿</span>
        </div>
      </article>

      <article class="stat-card">
        <span class="stat-icon active">
          <AppIcon name="time" />
        </span>
        <div>
          <strong>{{ stats.active }}</strong>
          <span>进行中</span>
        </div>
      </article>

      <article class="stat-card">
        <span class="stat-icon ended">
          <AppIcon name="ended" />
        </span>
        <div>
          <strong>{{ stats.ended }}</strong>
          <span>已结束</span>
        </div>
      </article>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h3>练习管理</h3>
          <p>统一管理课堂练习与课后作业，快速查看发布与提交情况。</p>
        </div>

        <button
          v-if="courseAccess.canCreateExercise"
          type="button"
          class="primary-button"
          @click="createExercise"
        >
          <AppIcon name="plus" />
          <span>新建练习</span>
        </button>
      </div>

      <div class="filters-row">
        <label class="search-box">
          <AppIcon name="search" />
          <input
            v-model.trim="filters.keyword"
            type="text"
            placeholder="搜索练习名称或说明"
          />
        </label>

        <AppSelect v-model="filters.type" :options="typeOptions" />
        <AppSelect v-model="filters.status" :options="statusOptions" />
      </div>

      <div v-if="pagedExercises.length" class="table-wrap">
        <table class="exercise-table">
          <thead>
            <tr>
              <th>练习名称</th>
              <th>类型</th>
              <th>题目数量</th>
              <th>提交情况</th>
              <th>时间</th>
              <th>状态</th>
              <th class="actions-heading">操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="exercise in pagedExercises" :key="exercise.id">
              <td>
                <div class="exercise-name-cell">
                  <strong>{{ exercise.name }}</strong>
                  <span>{{ exercise.description || "暂无练习说明" }}</span>
                </div>
              </td>

              <td>
                <span class="type-tag">{{ typeLabel(exercise.type) }}</span>
              </td>

              <td>
                <span class="plain-value">{{ exercise.questionCount }} 题</span>
              </td>

              <td>
                <span
                  class="submission-value"
                  :class="{ muted: exercise.status === 'DRAFT' }"
                >
                  {{ submissionText(exercise) }}
                </span>
              </td>

              <td>
                <span class="time-value">{{ timeText(exercise) }}</span>
              </td>

              <td>
                <span
                  class="status-pill"
                  :class="`status-${exercise.status.toLowerCase()}`"
                >
                  {{ statusLabel(exercise.status) }}
                </span>
              </td>

              <td>
                <div class="row-actions">
                  <template v-if="exercise.status === 'DRAFT'">
                    <button
                      type="button"
                      class="action-button primary-action"
                      :title="
                        canEditExercise(exercise) ? '编辑练习' : '查看练习'
                      "
                      @click="editExercise(exercise)"
                    >
                      <AppIcon
                        :name="canEditExercise(exercise) ? 'edit' : 'eye'"
                      />
                      <span>{{
                        canEditExercise(exercise) ? "编辑" : "查看"
                      }}</span>
                    </button>

                    <button
                      type="button"
                      class="action-button"
                      title="复制到其他班级"
                      @click="openCopyDialog(exercise)"
                    >
                      <AppIcon name="copy" />
                      <span>复制</span>
                    </button>

                    <button
                      v-if="canDeleteExercise(exercise)"
                      type="button"
                      class="action-button danger"
                      title="删除草稿"
                      @click="openDeleteDialog(exercise)"
                    >
                      <AppIcon name="delete" />
                      <span>删除</span>
                    </button>
                  </template>

                  <template v-else-if="exercise.status === 'ACTIVE'">
                    <button
                      v-if="canViewResults(exercise)"
                      type="button"
                      class="action-button primary-action"
                      title="查看练习结果"
                      @click="viewResults(exercise)"
                    >
                      <AppIcon name="data-analysis" />
                      <span>结果</span>
                    </button>

                    <button
                      type="button"
                      class="action-button"
                      :title="
                        canEditExercise(exercise) ? '编辑练习' : '查看练习'
                      "
                      @click="editExercise(exercise)"
                    >
                      <AppIcon
                        :name="canEditExercise(exercise) ? 'edit' : 'eye'"
                      />
                      <span>{{
                        canEditExercise(exercise) ? "编辑" : "查看"
                      }}</span>
                    </button>

                    <button
                      type="button"
                      class="action-button"
                      title="复制到其他班级"
                      @click="openCopyDialog(exercise)"
                    >
                      <AppIcon name="copy" />
                      <span>复制</span>
                    </button>
                  </template>

                  <template v-else>
                    <button
                      v-if="canViewResults(exercise)"
                      type="button"
                      class="action-button primary-action"
                      title="查看练习结果"
                      @click="viewResults(exercise)"
                    >
                      <AppIcon name="data-analysis" />
                      <span>结果</span>
                    </button>

                    <button
                      type="button"
                      class="action-button"
                      title="查看练习"
                      @click="editExercise(exercise)"
                    >
                      <AppIcon name="eye" />
                      <span>查看</span>
                    </button>

                    <button
                      type="button"
                      class="action-button"
                      title="复制到其他班级"
                      @click="openCopyDialog(exercise)"
                    >
                      <AppIcon name="copy" />
                      <span>复制</span>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <span class="empty-icon">
          <AppIcon name="question-bank" />
        </span>
        <strong>没有找到符合条件的练习</strong>
        <p>
          {{
            courseAccess.canCreateExercise
              ? "调整搜索或筛选条件，也可以新建一份练习。"
              : "当前课程已结课，这里只保留历史练习记录。"
          }}
        </p>
      </div>

      <div v-if="filteredExercises.length" class="pagination-row">
        <span class="pagination-summary">
          第 {{ currentPage }} / {{ totalPages }} 页，共
          {{ filteredExercises.length }} 份练习
        </span>

        <div class="pagination-controls">
          <button
            type="button"
            class="page-button text-page-button"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            上一页
          </button>

          <template v-for="item in pageItems" :key="String(item)">
            <span v-if="item === '...'" class="page-ellipsis">…</span>

            <button
              v-else
              type="button"
              class="page-button number-page-button"
              :class="{ active: currentPage === item }"
              @click="goToPage(item)"
            >
              {{ item }}
            </button>
          </template>

          <button
            type="button"
            class="page-button text-page-button"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </section>

    <AppToast :message="toastText" :type="toastType" />

    <div
      v-if="showDeleteDialog"
      class="dialog-mask"
      @click.self="closeDeleteDialog"
    >
      <div class="confirm-dialog">
        <div class="dialog-title-row">
          <div>
            <h3>删除草稿？</h3>
            <p>删除后将无法恢复，请确认是否继续。</p>
          </div>

          <button
            type="button"
            class="dialog-close"
            aria-label="关闭删除确认"
            @click="closeDeleteDialog"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div class="delete-preview">
          {{ pendingDelete?.name }}
        </div>

        <div class="dialog-actions">
          <button
            type="button"
            class="secondary-button"
            @click="closeDeleteDialog"
          >
            取消
          </button>

          <button type="button" class="danger-button" @click="confirmDelete">
            <AppIcon name="delete" />
            <span>确认删除</span>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showCopyDialog"
      class="dialog-mask"
      @click.self="closeCopyDialog"
    >
      <div class="confirm-dialog copy-dialog">
        <div class="dialog-title-row">
          <div>
            <h3>复制练习到其他班级</h3>
            <p>选择同一课程下的教学班，系统会分别创建一份新的草稿。</p>
          </div>

          <button
            type="button"
            class="dialog-close"
            aria-label="关闭复制练习"
            @click="closeCopyDialog"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div class="copy-preview">
          <strong>{{ pendingCopy?.name }}</strong>
          <span>复制后不会带入学生提交记录和发布状态。</span>
        </div>

        <div v-if="copyTargetClasses.length" class="copy-target-list">
          <label
            v-for="item in copyTargetClasses"
            :key="String(item.id)"
            class="copy-target-item"
          >
            <input
              v-model="selectedCopyTargetIds"
              type="checkbox"
              :value="String(item.id)"
            />
            <span class="copy-checkmark"></span>
            <span class="copy-target-text">
              <strong>{{ item.className }}</strong>
              <small>{{ item.semester || "当前学期" }}</small>
            </span>
          </label>
        </div>

        <div v-else class="copy-empty-state">
          当前课程暂时没有可复制的其他教学班。
        </div>

        <div class="dialog-actions">
          <button
            type="button"
            class="secondary-button"
            @click="closeCopyDialog"
          >
            取消
          </button>
          <button
            type="button"
            class="primary-button dialog-primary"
            :disabled="!selectedCopyTargetIds.length"
            @click="confirmCopy"
          >
            <AppIcon name="copy" />
            <span>复制到所选班级</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppIcon from "../AppIcon.vue";
import AppToast from "../AppToast.vue";
import AppSelect from "../AppSelect.vue";
import { useCourseStore } from "../../store/courseStore";
import { useCourseLifecycleStore } from "../../store/courseLifecycleStore";
import { useExerciseStore } from "../../store/exerciseStore";
import { getCourseAccessPolicy } from "../../utils/coursePermissions";

const PAGE_SIZE = 10;

export default {
  name: "ExerciseManagementPanel",

  components: {
    AppIcon,
    AppSelect,
    AppToast,
  },

  props: {
    teachingClassId: {
      type: String,
      required: true,
    },

    courseStatus: {
      type: String,
      default: "ACTIVE",
    },
  },

  data() {
    return {
      filters: {
        keyword: "",
        type: "all",
        status: "all",
      },

      typeOptions: [
        { label: "全部类型", value: "all" },
        { label: "课堂练习", value: "CLASSROOM" },
        { label: "课后作业", value: "HOMEWORK" },
      ],

      statusOptions: [
        { label: "全部状态", value: "all" },
        { label: "草稿", value: "DRAFT" },
        { label: "进行中", value: "ACTIVE" },
        { label: "已结束", value: "ENDED" },
      ],

      currentPage: 1,

      showDeleteDialog: false,
      pendingDelete: null,
      showCopyDialog: false,
      pendingCopy: null,
      selectedCopyTargetIds: [],
      toastText: "",
      toastType: "success",
      toastTimer: null,
    };
  },

  computed: {
    courseStore() {
      return useCourseStore();
    },

    exerciseStore() {
      return useExerciseStore();
    },

    courseLifecycleStore() {
      return useCourseLifecycleStore();
    },

    courseAccess() {
      return getCourseAccessPolicy(this.courseStatus);
    },

    currentTeachingClass() {
      return (
        this.courseStore.teachingClasses.find(
          (item) => String(item.id) === String(this.teachingClassId)
        ) || null
      );
    },

    copyTargetClasses() {
      const current = this.currentTeachingClass;
      if (!current) return [];

      return this.courseStore.teachingClasses.filter((item) => {
        if (String(item.id) === String(this.teachingClassId)) return false;

        const sameCourseId =
          current.courseId &&
          item.courseId &&
          String(current.courseId) === String(item.courseId);
        const sameCourseName =
          current.courseName &&
          item.courseName &&
          String(current.courseName).trim() === String(item.courseName).trim();

        const sameCourse = sameCourseId || sameCourseName;
        const targetStatus = this.courseLifecycleStore.getStatus(item);

        return sameCourse && targetStatus !== "ENDED";
      });
    },

    exercises() {
      const exercises = this.exerciseStore.getExercises(this.teachingClassId);

      if (this.courseAccess.isUpcoming) {
        return exercises.filter((item) => item.status === "DRAFT");
      }

      return exercises;
    },

    stats() {
      return {
        total: this.exercises.length,
        draft: this.exercises.filter((item) => item.status === "DRAFT").length,
        active: this.exercises.filter((item) => item.status === "ACTIVE")
          .length,
        ended: this.exercises.filter((item) => item.status === "ENDED").length,
      };
    },

    filteredExercises() {
      const keyword = this.filters.keyword.trim().toLowerCase();

      return this.exercises.filter((exercise) => {
        const matchesKeyword =
          !keyword ||
          String(exercise.name || "")
            .toLowerCase()
            .includes(keyword) ||
          String(exercise.description || "")
            .toLowerCase()
            .includes(keyword);

        const matchesType =
          this.filters.type === "all" || exercise.type === this.filters.type;

        const matchesStatus =
          this.filters.status === "all" ||
          exercise.status === this.filters.status;

        return matchesKeyword && matchesType && matchesStatus;
      });
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredExercises.length / PAGE_SIZE));
    },

    pagedExercises() {
      const start = (this.currentPage - 1) * PAGE_SIZE;
      return this.filteredExercises.slice(start, start + PAGE_SIZE);
    },

    pageItems() {
      const total = this.totalPages;
      const current = this.currentPage;

      if (total <= 7) {
        return Array.from({ length: total }, (_, index) => index + 1);
      }

      if (current <= 4) {
        return [1, 2, 3, 4, 5, "...", total];
      }

      if (current >= total - 3) {
        return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
      }

      return [1, "...", current - 1, current, current + 1, "...", total];
    },
  },

  watch: {
    "filters.keyword"() {
      this.currentPage = 1;
    },

    "filters.type"() {
      this.currentPage = 1;
    },

    "filters.status"() {
      this.currentPage = 1;
    },

    teachingClassId() {
      this.currentPage = 1;
      this.exerciseStore.ensureTeachingClass(this.teachingClassId);
      this.syncCourseLifecycle();
    },

    courseStatus() {
      this.syncCourseLifecycle();
    },
  },

  mounted() {
    this.exerciseStore.ensureTeachingClass(this.teachingClassId);
    this.syncCourseLifecycle();
  },

  beforeUnmount() {
    window.clearTimeout(this.toastTimer);
  },

  methods: {
    syncCourseLifecycle() {
      if (this.courseAccess.isEnded) {
        this.exerciseStore.endActiveExercises(this.teachingClassId);
      }
    },

    typeLabel(type) {
      return (
        {
          CLASSROOM: "课堂练习",
          HOMEWORK: "课后作业",
        }[type] || "练习"
      );
    },

    statusLabel(status) {
      return (
        {
          DRAFT: "草稿",
          ACTIVE: "进行中",
          ENDED: "已结束",
        }[status] || "未知"
      );
    },

    submissionText(exercise) {
      if (exercise.status === "DRAFT") {
        return "未发布";
      }

      return `${exercise.submittedCount} / ${exercise.expectedCount}`;
    },

    timeText(exercise) {
      if (exercise.type === "CLASSROOM") {
        return `限时 ${exercise.durationMinutes || 0} 分钟`;
      }

      return exercise.deadline ? `截止 ${exercise.deadline}` : "未设置截止时间";
    },

    goToPage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return;
      }

      this.currentPage = page;
    },

    canEditExercise(exercise) {
      if (!exercise) return false;
      if (this.courseAccess.isEnded) return false;
      if (exercise.status === "DRAFT") return true;
      return this.courseAccess.isActive && exercise.status === "ACTIVE";
    },

    canDeleteExercise(exercise) {
      return Boolean(
        exercise && exercise.status === "DRAFT" && !this.courseAccess.isEnded
      );
    },

    canViewResults(exercise) {
      return Boolean(
        exercise &&
          exercise.status !== "DRAFT" &&
          this.courseAccess.canViewExerciseResults
      );
    },

    createExercise() {
      if (!this.courseAccess.canCreateExercise) return;

      this.$router.push(
        `/course/${this.teachingClassId}/questions/exercises/new`
      );
    },

    editExercise(exercise) {
      this.$router.push(
        `/course/${this.teachingClassId}/questions/exercises/${String(
          exercise.id
        )}/edit`
      );
    },

    viewResults(exercise) {
      if (!this.canViewResults(exercise)) return;
      this.$router.push(
        `/course/${this.teachingClassId}/questions/exercises/${String(
          exercise.id
        )}/results`
      );
    },

    openDeleteDialog(exercise) {
      if (!this.canDeleteExercise(exercise)) {
        return;
      }
      this.pendingDelete = exercise;
      this.showDeleteDialog = true;
    },

    openCopyDialog(exercise) {
      this.pendingCopy = exercise;
      this.selectedCopyTargetIds = [];
      this.showCopyDialog = true;
    },

    closeCopyDialog() {
      this.showCopyDialog = false;
      this.pendingCopy = null;
      this.selectedCopyTargetIds = [];
    },

    confirmCopy() {
      if (!this.pendingCopy || !this.selectedCopyTargetIds.length) {
        return;
      }

      const copied = this.selectedCopyTargetIds
        .map((targetTeachingClassId) =>
          this.exerciseStore.duplicateExerciseToTeachingClass(
            this.teachingClassId,
            this.pendingCopy.id,
            targetTeachingClassId
          )
        )
        .filter(Boolean);

      const copiedCount = copied.length;
      this.closeCopyDialog();

      if (!copiedCount) {
        this.showToast("复制失败，请稍后重试", "error");
        return;
      }

      this.showToast(`已复制到 ${copiedCount} 个班级并保存为草稿`);
    },

    closeDeleteDialog() {
      this.showDeleteDialog = false;
      this.pendingDelete = null;
    },

    confirmDelete() {
      if (!this.pendingDelete) {
        return;
      }

      const removed = this.exerciseStore.deleteExercise(
        this.teachingClassId,
        this.pendingDelete.id
      );

      this.closeDeleteDialog();

      if (!removed) {
        this.showToast("练习删除失败", "error");
        return;
      }

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

      this.showToast("练习已删除");
    },

    showToast(text, type = "success") {
      this.toastType = type;
      this.toastText = text;
      window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.toastText = "";
      }, 1900);
    },
  },
};
</script>

<style scoped>
.exercise-panel {
  display: grid;
  gap: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.stat-card,
.content-card {
  background: #ffffff;
  border: 1px solid #eeeeee;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  min-height: 96px;
  padding: 19px 21px;
  border-radius: 18px;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 13px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 20px;
}

.stat-icon.dark {
  color: #ffffff;
  background: #111827;
}

.stat-icon.active {
  color: #047857;
  background: #ecfdf5;
}

.stat-icon.ended {
  color: #2563eb;
  background: #eff6ff;
}

.stat-icon :deep(.app-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.stat-card strong,
.stat-card > div > span {
  display: block;
}

.stat-card strong {
  color: #111827;
  font-size: 25px;
  line-height: 1.15;
}

.stat-card > div > span {
  margin-top: 5px;
  color: #7b8491;
  font-size: 14px;
}

.content-card {
  padding: 27px;
  border-radius: 22px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.section-heading h3,
.confirm-dialog h3 {
  margin: 0;
  color: #111827;
}

.section-heading h3 {
  font-size: 21px;
}

.section-heading p,
.confirm-dialog p {
  margin: 7px 0 0;
  color: #8b93a0;
  font-size: 13.5px;
  line-height: 1.7;
}

.primary-button,
.action-button,
.icon-action,
.page-button,
.secondary-button,
.danger-button,
.dialog-close {
  border: none;
  cursor: pointer;
  font: inherit;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 11px;
  color: #ffffff;
  background: #111827;
  font-size: 14px;
  font-weight: 700;
}

.primary-button :deep(.app-icon) {
  font-size: 17px;
}

.primary-button:hover {
  background: #1f2937;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.filters-row {
  display: grid;
  grid-template-columns: minmax(280px, 1.7fr) minmax(165px, 0.7fr) minmax(
      165px,
      0.7fr
    );
  gap: 10px;
  margin-top: 22px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 46px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #ffffff;
  color: #8f97a3;
  font-size: 15px;
}

.search-box:focus-within {
  border-color: #111827;
}

.search-box :deep(.app-icon) {
  font-size: 17px;
}

.search-box input {
  min-width: 0;
  flex: 1;
  border: none;
  outline: none;
  color: #111827;
  background: transparent;
  font: inherit;
}

.search-box input::placeholder {
  color: #b7bdc7;
}

.filters-row :deep(.select-trigger) {
  font-size: 14.5px;
}

.table-wrap {
  margin-top: 19px;
  overflow-x: auto;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
}

.exercise-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
}

.exercise-table th,
.exercise-table td {
  padding: 16px 15px;
  text-align: left;
  vertical-align: middle;
}

.exercise-table th {
  color: #7f8793;
  background: #fafafa;
  border-bottom: 1px solid #eeeeee;
  font-size: 13.5px;
  font-weight: 700;
  white-space: nowrap;
}

.exercise-table td {
  color: #4b5563;
  border-bottom: 1px solid #f1f1f1;
  font-size: 14.5px;
}

.exercise-table tbody tr:last-child td {
  border-bottom: none;
}

.exercise-table tbody tr {
  transition: 0.18s ease;
}

.exercise-table tbody tr:hover {
  background: #fcfcfc;
}

.exercise-table th:not(:first-child),
.exercise-table td:not(:first-child) {
  text-align: center;
}

.actions-heading {
  text-align: center !important;
}

.exercise-name-cell {
  display: grid;
  gap: 5px;
  min-width: 235px;
}

.exercise-name-cell strong {
  color: #111827;
  font-size: 15.5px;
  line-height: 1.5;
}

.exercise-name-cell span {
  max-width: 310px;
  overflow: hidden;
  color: #8f97a3;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-tag,
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
}

.type-tag {
  padding: 7px 10px;
  color: #4b5563;
  background: #f3f4f6;
  border-radius: 9px;
}

.status-pill {
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 999px;
}

.status-draft {
  color: #606875;
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.status-active {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.status-ended {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.plain-value,
.submission-value,
.time-value {
  white-space: nowrap;
}

.submission-value {
  color: #111827;
  font-weight: 700;
}

.submission-value.muted {
  color: #8f97a3;
  font-weight: 500;
}

.time-value {
  color: #667085;
  font-size: 13.5px;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 260px;
}

.action-button,
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  background: transparent;
  border-radius: 10px;
}

.action-button {
  gap: 7px;
  min-height: 38px;
  padding: 0 11px;
  font-size: 13.5px;
  font-weight: 700;
}

.action-button.primary-action {
  border: 1px solid #d9dde3;
  background: #f7f8fa;
  color: #111827;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.action-button.primary-action:hover:not(:disabled) {
  border-color: #cbd1d9;
  background: #f1f3f5;
}

.action-button :deep(.app-icon) {
  font-size: 17px;
}

.icon-action {
  width: 38px;
  height: 38px;
  font-size: 18px;
}

.action-button:hover:not(:disabled),
.icon-action:hover {
  color: #111827;
  background: #f3f4f6;
}

.action-button:disabled {
  color: #c4c8cf;
  cursor: not-allowed;
}

.action-button.danger:hover,
.icon-action.danger:hover {
  color: #b42318;
  background: #fff4f2;
}

.copy-dialog {
  width: min(560px, calc(100vw - 40px));
}

.copy-preview {
  display: grid;
  gap: 4px;
  margin-top: 18px;
  padding: 14px 15px;
  border: 1px solid #eceef1;
  border-radius: 12px;
  background: #fafafa;
}

.copy-preview strong {
  color: #111827;
  font-size: 14.5px;
}

.copy-preview span,
.copy-target-text small {
  color: #8b93a0;
  font-size: 12.5px;
}

.copy-target-list {
  display: grid;
  gap: 9px;
  margin-top: 14px;
  max-height: 260px;
  overflow-y: auto;
}

.copy-target-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 54px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.16s ease;
}

.copy-target-item:hover {
  border-color: #cfd4dc;
  background: #fbfbfb;
}

.copy-target-item input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.copy-checkmark {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border: 1.5px solid #c9ced6;
  border-radius: 5px;
  background: #ffffff;
  box-sizing: border-box;
}

.copy-target-item input:checked + .copy-checkmark {
  border-color: #111827;
  background: #111827;
  box-shadow: inset 0 0 0 4px #ffffff;
}

.copy-target-text {
  display: grid;
  gap: 3px;
}

.copy-target-text strong {
  color: #303845;
  font-size: 14px;
}

.copy-empty-state {
  margin-top: 14px;
  padding: 18px;
  border: 1px dashed #dfe3e8;
  border-radius: 12px;
  color: #8b93a0;
  background: #fbfbfb;
  text-align: center;
  font-size: 13.5px;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 9px;
  min-height: 260px;
  margin-top: 19px;
  border: 1px dashed #e5e7eb;
  border-radius: 16px;
  text-align: center;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 21px;
}

.empty-state strong {
  color: #111827;
  font-size: 15px;
}

.empty-state p {
  margin: 0;
  color: #8f97a3;
  font-size: 13px;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 20px;
}

.pagination-summary {
  color: #8f97a3;
  font-size: 13px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-button {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  color: #6b7280;
  background: #ffffff;
  font-size: 13px;
}

.page-button:hover:not(:disabled) {
  color: #111827;
  border-color: #d1d5db;
  background: #fafafa;
}

.page-button.active {
  color: #ffffff;
  border-color: #111827;
  background: #111827;
}

.page-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-ellipsis {
  padding: 0 3px;
  color: #9ca3af;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.34);
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  width: min(460px, 100%);
  padding: 24px;
  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
}

.dialog-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.dialog-close {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 10px;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 17px;
}

.delete-preview {
  margin-top: 18px;
  padding: 14px 15px;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 20px;
}

.secondary-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
  padding: 0 15px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}

.secondary-button {
  color: #4b5563;
  background: #f3f4f6;
}

.danger-button {
  color: #ffffff;
  background: #b42318;
}

.dialog-primary {
  min-height: 42px;
  padding: 0 15px;
  border-radius: 10px;
}

@media (max-width: 980px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters-row {
    grid-template-columns: 1fr 1fr;
  }

  .search-box {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .stats-grid,
  .filters-row {
    grid-template-columns: 1fr;
  }

  .content-card {
    padding: 20px;
  }

  .section-heading {
    flex-direction: column;
  }

  .primary-button {
    width: 100%;
  }

  .pagination-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .pagination-controls {
    max-width: 100%;
    overflow-x: auto;
  }
}
</style>
