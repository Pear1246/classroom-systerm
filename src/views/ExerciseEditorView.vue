<template>
  <div class="exercise-editor-page">
    <header class="editor-header">
      <button type="button" class="back-button" @click="goBack">
        <AppIcon name="arrow-left" />
        <span>返回课程题库</span>
      </button>

      <div class="header-title-wrap">
        <div class="title-line">
          <h1>
            {{
              isEndedReadOnly
                ? "查看练习"
                : isEditMode
                ? "编辑练习"
                : "新建练习"
            }}
          </h1>
          <span v-if="isEditMode" class="status-pill" :class="statusClass">
            {{ statusLabel(originalStatus) }}
          </span>
        </div>
        <p>{{ courseName }} · {{ className }}</p>
      </div>

      <div class="header-actions">
        <button
          v-if="showReuseButton"
          type="button"
          class="secondary-button"
          @click="openReuseDialog"
        >
          <AppIcon name="refresh" />
          <span>再次使用</span>
        </button>

        <template v-else-if="!isEndedReadOnly">
          <button
            v-if="canEndExercise"
            type="button"
            class="end-exercise-button"
            @click="openEndDialog"
          >
            <AppIcon name="ended" />
            <span>结束练习</span>
          </button>

          <button
            v-if="canSaveDraft"
            type="button"
            class="secondary-button"
            @click="saveDraft"
          >
            <AppIcon name="save" />
            <span>保存草稿</span>
          </button>

          <button
            type="button"
            class="primary-button"
            :disabled="!canUsePrimaryAction"
            :title="primaryActionTitle"
            @click="savePrimary"
          >
            <AppIcon name="save" />
            <span>{{ primaryActionText }}</span>
          </button>
        </template>
      </div>
    </header>

    <main class="editor-main">
      <section
        v-if="courseAccess.isUpcoming || courseAccess.isEnded"
        class="course-mode-note"
        :class="courseAccess.status.toLowerCase()"
      >
        <AppIcon :name="courseAccess.isUpcoming ? 'time' : 'ended'" />
        <div>
          <strong>
            {{ courseAccess.isUpcoming ? "课程尚未开始" : "课程已结课" }}
          </strong>
          <span>
            {{
              courseAccess.isUpcoming
                ? "你可以继续准备练习并保存草稿，课程开始后即可发布给学生。"
                : "当前练习内容为只读状态；你仍可以查看历史结果和已提交作答，并继续完成批改。"
            }}
          </span>
        </div>
      </section>
      <section class="form-card">
        <div class="card-heading">
          <div>
            <h2>基本信息</h2>
            <p>先说明这份练习用于什么场景，再设置对应的作答方式。</p>
          </div>
        </div>

        <div class="basic-grid">
          <div
            class="field-group name-field"
            data-validation-key="name"
            :class="{ 'validation-highlight': validationTarget === 'name' }"
          >
            <label class="field-label" for="exerciseName">
              练习名称 <span class="required-mark">*</span>
            </label>
            <input
              id="exerciseName"
              v-model="form.name"
              class="text-input"
              type="text"
              maxlength="60"
              :disabled="isEndedReadOnly"
              placeholder="例如：第三章栈与队列课堂练习"
            />
          </div>

          <div class="field-group">
            <label class="field-label">
              练习类型 <span class="required-mark">*</span>
            </label>
            <div class="type-switcher">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                class="type-option"
                :class="{ active: form.type === option.value }"
                :disabled="isEndedReadOnly"
                @click="changeExerciseType(option.value)"
              >
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </button>
            </div>
          </div>

          <div class="field-group full-width">
            <label class="field-label" for="exerciseDescription"
              >练习说明</label
            >
            <textarea
              id="exerciseDescription"
              v-model="form.description"
              class="text-area"
              rows="3"
              maxlength="240"
              :disabled="isEndedReadOnly"
              placeholder="可填写练习目标、作答要求或给学生的说明"
            ></textarea>
          </div>
        </div>
      </section>

      <section class="form-card">
        <div class="card-heading">
          <div>
            <h2>时间设置</h2>
            <p>
              {{
                form.type === "CLASSROOM"
                  ? "课堂练习按作答时长控制。"
                  : "课后作业按照截止时间提交。"
              }}
            </p>
          </div>
        </div>

        <div class="time-setting-row">
          <div
            v-if="form.type === 'CLASSROOM'"
            class="field-group time-field"
            data-validation-key="duration"
            :class="{ 'validation-highlight': validationTarget === 'duration' }"
          >
            <label class="field-label" for="durationMinutes">
              作答时长 <span class="required-mark">*</span>
            </label>
            <div class="number-input-wrap">
              <input
                id="durationMinutes"
                v-model.number="form.durationMinutes"
                class="text-input"
                type="number"
                min="1"
                max="180"
                :disabled="isEndedReadOnly"
                placeholder="例如 5"
              />
              <span>分钟</span>
            </div>
            <small>建议课堂练习保持短而集中，发布后学生按该时长作答。</small>
          </div>

          <div
            v-else
            class="field-group time-field"
            data-validation-key="deadline"
            :class="{ 'validation-highlight': validationTarget === 'deadline' }"
          >
            <label class="field-label" for="deadline">
              截止时间 <span class="required-mark">*</span>
            </label>
            <input
              id="deadline"
              v-model="form.deadline"
              class="text-input datetime-input"
              type="datetime-local"
              :disabled="isEndedReadOnly"
            />
            <small>学生需要在截止时间前完成提交。</small>
          </div>
        </div>
      </section>

      <section
        class="form-card question-section"
        data-validation-key="questions"
        :class="{ 'validation-highlight': validationTarget === 'questions' }"
      >
        <div class="card-heading question-heading">
          <div>
            <div class="heading-title-row">
              <h2>题目</h2>
              <span class="question-count"
                >{{ form.questions.length }} 道 · {{ totalScore }} / 100
                分</span
              >
            </div>
            <p>{{ questionSectionDescription }}</p>
            <p v-if="form.questions.length" class="sort-hint">
              <AppIcon name="drag" />
              <span>{{ questionStructureHint }}</span>
            </p>
          </div>

          <div v-if="canModifyQuestionStructure" class="question-toolbar">
            <button
              type="button"
              class="tool-button"
              @click="openCreateQuestion"
            >
              <AppIcon name="plus" />
              <span>新建题目</span>
            </button>

            <button
              type="button"
              class="tool-button"
              @click="openQuestionPicker"
            >
              <AppIcon name="question-bank" />
              <span>从题目库选择</span>
            </button>

            <button
              type="button"
              class="tool-button"
              @click="openQuestionImport"
            >
              <AppIcon name="upload" />
              <span>批量导入</span>
            </button>
          </div>
        </div>

        <div v-if="form.questions.length" class="exercise-question-list">
          <article
            v-for="(question, index) in form.questions"
            :key="question.id"
            class="exercise-question-item"
            :class="{
              dragging: draggedQuestionIndex === index,
              'drop-target': dragOverQuestionIndex === index,
            }"
            @dragover.prevent="handleDragOver(index)"
            @drop.prevent="handleQuestionDrop(index)"
          >
            <button
              type="button"
              class="drag-handle"
              :class="{ disabled: !canReorderQuestions }"
              :draggable="canReorderQuestions"
              :title="
                canReorderQuestions
                  ? '拖拽调整题目顺序'
                  : '当前状态不允许调整题目顺序'
              "
              @dragstart="startQuestionDrag(index, $event)"
              @dragend="endQuestionDrag"
            >
              <AppIcon name="drag" />
            </button>

            <div class="question-index">
              {{ String(index + 1).padStart(2, "0") }}
            </div>

            <div class="question-body">
              <div class="question-title-row">
                <span class="type-icon">
                  <AppIcon :name="typeIcon(question.type)" />
                </span>
                <strong>{{ question.stem }}</strong>
              </div>

              <div class="question-meta-row">
                <span>{{ typeLabel(question.type) }}</span>
                <span>{{ question.chapter || "未分类" }}</span>
                <span
                  class="difficulty-tag"
                  :class="`difficulty-${question.difficulty}`"
                >
                  {{ difficultyLabel(question.difficulty) }}
                </span>
                <span class="source-tag">
                  {{ question.sourceQuestionId ? "已在题目库" : "本练习" }}
                </span>
                <label
                  v-if="!isEndedReadOnly"
                  class="score-editor"
                  title="本题分值"
                >
                  <input
                    :value="questionScoreValue(question)"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    @change="handleInlineScoreChange(question, index, $event)"
                  />
                  <span>分</span>
                </label>
                <span v-else class="score-readonly"
                  >{{ questionScoreValue(question) }} 分</span
                >
              </div>
            </div>

            <div class="question-actions">
              <button
                v-if="
                  isEditMode &&
                  originalStatus !== 'DRAFT' &&
                  !question.sourceQuestionId
                "
                type="button"
                class="text-question-action"
                title="保存到题目库"
                @click="saveExistingQuestionToBank(question, index)"
              >
                <AppIcon name="question-bank" />
                <span>存入题库</span>
              </button>

              <button
                v-if="canEditQuestionContent"
                type="button"
                class="icon-action"
                title="编辑当前练习中的题目"
                @click="openEditQuestion(question, index)"
              >
                <AppIcon name="edit" />
              </button>

              <button
                v-if="canModifyQuestionStructure"
                type="button"
                class="icon-action danger"
                title="从练习中移除"
                @click="removeQuestion(index)"
              >
                <AppIcon name="delete" />
              </button>
            </div>
          </article>
        </div>

        <div v-else class="empty-question-state">
          <span class="empty-icon">
            <AppIcon name="question-bank" />
          </span>
          <strong>还没有加入题目</strong>
          <p>可以直接新建、从课程题目库选择，也可以使用 Excel 批量导入。</p>
        </div>
      </section>
    </main>

    <ExerciseQuestionEditorModal
      v-if="showQuestionEditor"
      :initial-question="editingQuestion"
      :max-allowed-score="questionEditorMaxScore"
      @close="closeQuestionEditor"
      @save="handleQuestionEditorSave"
    />

    <QuestionPickerModal
      v-if="showQuestionPicker"
      :questions="bankQuestions"
      :added-question-ids="addedLibraryQuestionIds"
      @close="showQuestionPicker = false"
      @confirm="addQuestionsFromLibrary"
    />

    <QuestionImportModal
      v-if="showQuestionImport"
      :current-score="totalScore"
      @close="showQuestionImport = false"
      @confirm="addImportedQuestions"
    />

    <AppFeedbackDialog
      v-if="showValidationDialog"
      title="请完善练习信息"
      description="继续前还有以下内容需要完成："
      :messages="validationMessages"
      @confirm="closeValidationDialog"
    />

    <AppToast :message="toastText" />

    <div v-if="showEndDialog" class="dialog-mask" @click.self="closeEndDialog">
      <section class="confirm-dialog">
        <div class="dialog-title-row">
          <div>
            <h3>结束当前练习？</h3>
            <p>
              {{
                isDirty
                  ? "结束后学生将无法继续提交；当前尚未保存的页面修改不会保留，已提交的作答记录仍会保留。"
                  : "结束后学生将无法继续提交，本次已提交的作答记录会保留。"
              }}
            </p>
          </div>

          <button
            type="button"
            class="dialog-close"
            aria-label="关闭结束练习确认"
            @click="closeEndDialog"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div class="dialog-actions">
          <button
            type="button"
            class="secondary-button"
            @click="closeEndDialog"
          >
            取消
          </button>
          <button
            type="button"
            class="end-confirm-button"
            @click="confirmEndExercise"
          >
            <AppIcon name="ended" />
            <span>确认结束</span>
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="showReuseDialog"
      class="dialog-mask"
      @click.self="closeReuseDialog"
    >
      <section class="confirm-dialog">
        <div class="dialog-title-row">
          <div>
            <h3>再次使用这份练习？</h3>
            <p>系统会创建一份新的草稿，原练习和历史记录不会改变。</p>
          </div>

          <button
            type="button"
            class="dialog-close"
            aria-label="关闭再次使用确认"
            @click="closeReuseDialog"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div class="dialog-actions">
          <button
            type="button"
            class="secondary-button"
            @click="closeReuseDialog"
          >
            取消
          </button>
          <button type="button" class="primary-button" @click="confirmReuse">
            <AppIcon name="refresh" />
            <span>创建草稿</span>
          </button>
        </div>
      </section>
    </div>

    <div v-if="showLeaveDialog" class="dialog-mask">
      <section class="confirm-dialog">
        <div class="dialog-title-row">
          <div>
            <h3>还有未保存的修改</h3>
            <p>离开后，本次修改将不会保留。</p>
          </div>

          <button type="button" class="dialog-close" @click="cancelLeave">
            <AppIcon name="close" />
          </button>
        </div>

        <div class="dialog-actions">
          <button type="button" class="secondary-button" @click="cancelLeave">
            继续编辑
          </button>
          <button type="button" class="secondary-button" @click="confirmLeave">
            放弃修改
          </button>
          <button type="button" class="primary-button" @click="saveAndLeave">
            <AppIcon name="save" />
            <span>{{
              canSaveDraft ? "保存草稿并退出" : "保存修改并退出"
            }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import AppFeedbackDialog from "../components/AppFeedbackDialog.vue";
import AppIcon from "../components/AppIcon.vue";
import AppToast from "../components/AppToast.vue";
import ExerciseQuestionEditorModal from "../components/question-bank/ExerciseQuestionEditorModal.vue";
import QuestionImportModal from "../components/question-bank/QuestionImportModal.vue";
import QuestionPickerModal from "../components/question-bank/QuestionPickerModal.vue";
import { useCourseStore } from "../store/courseStore";
import { useCourseLifecycleStore } from "../store/courseLifecycleStore";
import { useExerciseStore } from "../store/exerciseStore";
import { useQuestionStore } from "../store/questionStore";
import { getCourseAccessPolicy } from "../utils/coursePermissions";
import {
  QUESTION_SOURCES,
  buildQuestionContent,
  normalizeQuestion,
  questionTypeIcon,
  questionTypeLabel,
} from "../utils/questionModel";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createLocalQuestionId() {
  return `exercise-question-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function toDateTimeLocal(value) {
  return value ? String(value).replace(" ", "T").slice(0, 16) : "";
}

function toStoredDateTime(value) {
  return value ? String(value).replace("T", " ").slice(0, 16) : "";
}

export default {
  name: "ExerciseEditorView",

  components: {
    AppFeedbackDialog,
    AppIcon,
    AppToast,
    ExerciseQuestionEditorModal,
    QuestionImportModal,
    QuestionPickerModal,
  },

  data() {
    return {
      typeOptions: [
        {
          value: "CLASSROOM",
          label: "课堂练习",
          description: "设置作答时长，适合课堂即时检测",
        },
        {
          value: "HOMEWORK",
          label: "课后作业",
          description: "设置截止时间，适合课后巩固",
        },
      ],
      form: {
        name: "",
        type: "CLASSROOM",
        description: "",
        durationMinutes: 5,
        deadline: "",
        questions: [],
      },
      originalStatus: "DRAFT",
      originalExercise: null,
      initialSnapshot: "",
      toastText: "",
      toastTimer: null,
      showQuestionEditor: false,
      editingQuestion: null,
      editingQuestionIndex: -1,
      showQuestionPicker: false,
      showQuestionImport: false,
      showValidationDialog: false,
      validationMessages: [],
      showEndDialog: false,
      showReuseDialog: false,
      validationTarget: "",
      showLeaveDialog: false,
      pendingNavigation: null,
      draggedQuestionIndex: -1,
      dragOverQuestionIndex: -1,
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

    questionStore() {
      return useQuestionStore();
    },

    teachingClassId() {
      return String(this.$route.params.teachingClassId || "");
    },

    exerciseId() {
      return String(this.$route.params.exerciseId || "");
    },

    isEditMode() {
      return this.$route.meta.exerciseMode === "edit";
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

    questionBankScopeId() {
      return String(
        this.currentTeachingClass?.courseId || this.teachingClassId
      );
    },

    courseName() {
      return this.currentTeachingClass?.courseName || "当前课程";
    },

    className() {
      return this.currentTeachingClass?.className || "当前教学班";
    },

    courseAccess() {
      const status = this.currentTeachingClass
        ? this.courseLifecycleStore.getStatus(this.currentTeachingClass)
        : "ACTIVE";

      return getCourseAccessPolicy(status);
    },

    isCourseEnded() {
      return this.courseAccess.isEnded;
    },

    isExerciseEndedReadOnly() {
      return this.isEditMode && this.originalStatus === "ENDED";
    },

    bankQuestions() {
      return this.questionStore.getQuestions(this.questionBankScopeId);
    },

    addedLibraryQuestionIds() {
      return this.form.questions
        .filter((item) => item.sourceQuestionId)
        .map((item) => String(item.sourceQuestionId));
    },

    currentSnapshot() {
      return JSON.stringify(this.form);
    },

    isEndedReadOnly() {
      const upcomingPublishedExercise =
        this.courseAccess.isUpcoming &&
        this.isEditMode &&
        this.originalStatus !== "DRAFT";

      return (
        this.isCourseEnded ||
        this.isExerciseEndedReadOnly ||
        upcomingPublishedExercise
      );
    },

    showReuseButton() {
      return this.isExerciseEndedReadOnly && !this.isCourseEnded;
    },

    hasSubmissions() {
      return Number(this.originalExercise?.submittedCount || 0) > 0;
    },

    isDirty() {
      if (this.isEndedReadOnly) return false;
      return Boolean(
        this.initialSnapshot && this.currentSnapshot !== this.initialSnapshot
      );
    },

    canSaveDraft() {
      return (
        !this.isEndedReadOnly &&
        this.courseAccess.canModifyExercise &&
        (!this.isEditMode || this.originalStatus === "DRAFT")
      );
    },

    canEndExercise() {
      return (
        this.courseAccess.canEndExercise &&
        this.isEditMode &&
        this.originalStatus === "ACTIVE"
      );
    },

    canUsePrimaryAction() {
      if (this.isEndedReadOnly) return false;

      if (!this.isEditMode || this.originalStatus === "DRAFT") {
        return this.courseAccess.canPublishExercise;
      }

      return this.courseAccess.isActive;
    },

    primaryActionText() {
      if (!this.isEditMode || this.originalStatus === "DRAFT") {
        return "发布练习";
      }
      return "保存修改";
    },

    primaryActionTitle() {
      if (
        this.courseAccess.isUpcoming &&
        (!this.isEditMode || this.originalStatus === "DRAFT")
      ) {
        return "课程尚未开始，当前只能保存草稿";
      }

      return this.primaryActionText;
    },

    statusClass() {
      return `status-${String(this.originalStatus || "DRAFT").toLowerCase()}`;
    },

    canModifyQuestionStructure() {
      if (this.isEndedReadOnly) return false;
      if (!this.isEditMode || this.originalStatus === "DRAFT") return true;
      return !this.hasSubmissions;
    },

    canReorderQuestions() {
      return this.canModifyQuestionStructure;
    },

    canEditQuestionContent() {
      return !this.isEndedReadOnly;
    },

    totalScore() {
      return this.form.questions.reduce(
        (sum, question) => sum + this.questionScoreValue(question),
        0
      );
    },

    questionEditorMaxScore() {
      let usedScore = this.totalScore;

      if (this.editingQuestionIndex >= 0) {
        const current = this.form.questions[this.editingQuestionIndex];
        usedScore -= this.questionScoreValue(current);
      }

      return Math.max(1, 100 - usedScore);
    },

    questionSectionDescription() {
      if (this.isCourseEnded) {
        return "课程已结课，练习内容与顺序保持不变；未收录的题目仍可保存到课程题目库。";
      }

      if (this.isExerciseEndedReadOnly) {
        return "练习已结束，题目内容与顺序保持不变；未收录的题目仍可保存到题目库。";
      }

      if (
        this.isEditMode &&
        this.originalStatus === "ACTIVE" &&
        this.hasSubmissions
      ) {
        return "已有学生提交，题目数量与顺序已锁定；如发现题目内容有误，仍可进行纠正。";
      }

      return "可直接新建、从题目库选择或使用 Excel 批量导入；练习保存的是独立题目副本。";
    },

    questionStructureHint() {
      if (this.isCourseEnded) {
        return "课程已结课，题目顺序已锁定。";
      }

      if (this.isExerciseEndedReadOnly) {
        return "练习已结束，题目顺序已锁定。";
      }

      if (
        this.isEditMode &&
        this.originalStatus === "ACTIVE" &&
        this.hasSubmissions
      ) {
        return "已有学生提交，不能增加、删除或调整题目顺序。";
      }

      return "拖拽每道题左侧把手可调整顺序。";
    },
  },

  watch: {
    currentTeachingClass() {
      this.syncCourseLifecycle();
    },
  },

  mounted() {
    this.exerciseStore.ensureTeachingClass(this.teachingClassId);
    this.questionStore.ensureCourse(this.questionBankScopeId);
    this.syncCourseLifecycle();

    if (this.isEditMode) {
      const exercise = this.exerciseStore.getExercise(
        this.teachingClassId,
        this.exerciseId
      );

      if (!exercise) {
        this.$router.replace(`/course/${this.teachingClassId}/questions`);
        return;
      }

      this.originalExercise = clone(exercise);
      this.originalStatus = exercise.status || "DRAFT";
      this.applyExerciseToForm(exercise);
    }

    this.$nextTick(() => {
      this.initialSnapshot = this.currentSnapshot;
    });
  },

  beforeUnmount() {
    window.clearTimeout(this.toastTimer);
  },

  beforeRouteLeave(to, from, next) {
    if (this.isEndedReadOnly || !this.isDirty) {
      next();
      return;
    }

    this.pendingNavigation = next;
    this.showLeaveDialog = true;
  },

  methods: {
    syncCourseLifecycle() {
      if (!this.isCourseEnded) {
        return;
      }

      this.exerciseStore.endActiveExercises(this.teachingClassId);

      if (!this.isEditMode || !this.exerciseId) {
        return;
      }

      const updated = this.exerciseStore.getExercise(
        this.teachingClassId,
        this.exerciseId
      );

      if (!updated) {
        return;
      }

      this.originalExercise = clone(updated);
      this.originalStatus = updated.status || this.originalStatus;
      this.applyExerciseToForm(updated);
      this.$nextTick(() => {
        this.initialSnapshot = this.currentSnapshot;
      });
    },

    questionScoreValue(question) {
      const score = Number(question?.score);
      return Number.isFinite(score) && score > 0 ? score : 10;
    },

    applyExerciseToForm(exercise) {
      this.form = {
        name: exercise.name || "",
        type: exercise.type || "CLASSROOM",
        description: exercise.description || "",
        durationMinutes: exercise.durationMinutes || 5,
        deadline: toDateTimeLocal(exercise.deadline),
        questions: clone(exercise.questions || []).map((question) => ({
          ...normalizeQuestion(question),
          id: String(question.id),
          sourceQuestionId: question.sourceQuestionId
            ? String(question.sourceQuestionId)
            : "",
          score: this.questionScoreValue(question),
        })),
      };
    },

    changeExerciseType(type) {
      if (this.isEndedReadOnly || this.form.type === type) return;
      this.form.type = type;
    },

    handleInlineScoreChange(question, index, event) {
      const previousScore = this.questionScoreValue(question);
      const nextScore = Number(event.target.value);
      const otherScore = this.totalScore - previousScore;

      if (!Number.isFinite(nextScore) || nextScore < 1 || nextScore > 100) {
        event.target.value = String(previousScore);
        this.openValidationDialog({
          messages: ["每道题的分值需设置为 1–100 分。"],
          target: "questions",
        });
        return;
      }

      if (otherScore + nextScore > 100) {
        event.target.value = String(previousScore);
        this.openValidationDialog({
          messages: [
            `整份练习总分不能超过 100 分。当前其他题目共 ${otherScore} 分，本题最多可设置 ${
              100 - otherScore
            } 分。`,
          ],
          target: "questions",
        });
        return;
      }

      this.form.questions.splice(index, 1, {
        ...question,
        score: nextScore,
      });
    },

    openCreateQuestion() {
      if (!this.canModifyQuestionStructure) return;

      if (this.totalScore >= 100) {
        this.openValidationDialog({
          messages: [
            "当前练习总分已达到 100 分，请先调整已有题目分值后再添加题目。",
          ],
          target: "questions",
        });
        return;
      }

      this.editingQuestion = null;
      this.editingQuestionIndex = -1;
      this.showQuestionEditor = true;
    },

    openEditQuestion(question, index) {
      if (!this.canEditQuestionContent) return;
      this.editingQuestion = clone(question);
      this.editingQuestionIndex = index;
      this.showQuestionEditor = true;
    },

    closeQuestionEditor() {
      this.showQuestionEditor = false;
      this.editingQuestion = null;
      this.editingQuestionIndex = -1;
    },

    saveQuestionToBank(question) {
      const saved = this.questionStore.saveQuestion(
        this.questionBankScopeId,
        buildQuestionContent({
          ...question,
          source: question.source || QUESTION_SOURCES.MANUAL,
          aiMeta: question.aiMeta ?? null,
        })
      );

      return saved || null;
    },

    saveExistingQuestionToBank(question, index) {
      if (question.sourceQuestionId) return;

      const saved = this.saveQuestionToBank(question);
      if (!saved) {
        this.openValidationDialog({
          messages: ["题目保存到题目库失败，请稍后重试。"],
          target: "questions",
        });
        return;
      }

      const sourceQuestionId = String(saved.id);
      const source = saved.source || QUESTION_SOURCES.MANUAL;

      if (this.isEditMode) {
        this.exerciseStore.linkQuestionToBank(
          this.teachingClassId,
          this.exerciseId,
          question.id,
          sourceQuestionId,
          source
        );
      }

      this.form.questions.splice(index, 1, {
        ...question,
        sourceQuestionId,
        source,
      });

      if (this.isEndedReadOnly) {
        this.initialSnapshot = this.currentSnapshot;
      }

      this.showToast("题目已保存到题目库");
    },

    handleQuestionEditorSave({ question, saveToBank }) {
      if (this.editingQuestionIndex >= 0) {
        const previous = this.form.questions[this.editingQuestionIndex];
        let sourceQuestionId = previous.sourceQuestionId || "";
        let source =
          question.source || previous.source || QUESTION_SOURCES.MANUAL;

        if (saveToBank && !sourceQuestionId) {
          const saved = this.saveQuestionToBank(question);
          if (!saved) {
            this.showValidationDialog = true;
            this.validationMessages = ["题目保存到题目库失败，请稍后重试。"];
            this.validationTarget = "questions";
            return;
          }
          sourceQuestionId = String(saved.id);
          source = saved.source || QUESTION_SOURCES.MANUAL;

          // “沉淀到题目库”是独立业务动作：即使老师随后放弃本页其他修改，
          // 已发布/已结束练习也能记住这道题已经进入题目库，避免重复保存。
          if (this.isEditMode) {
            this.exerciseStore.linkQuestionToBank(
              this.teachingClassId,
              this.exerciseId,
              previous.id,
              sourceQuestionId,
              source
            );
          }
        }

        const nextQuestion = {
          ...previous,
          ...clone(question),
          id: String(previous.id),
          sourceQuestionId,
          source,
        };

        this.form.questions.splice(this.editingQuestionIndex, 1, nextQuestion);
        this.closeQuestionEditor();
        this.showToast(
          saveToBank && !previous.sourceQuestionId
            ? "题目已修改并保存到题目库"
            : "题目修改已更新到当前练习"
        );
        return;
      }

      let sourceQuestionId = "";
      let source = question.source || QUESTION_SOURCES.MANUAL;

      if (saveToBank) {
        const saved = this.saveQuestionToBank(question);
        if (!saved) {
          this.showValidationDialog = true;
          this.validationMessages = ["题目保存到题目库失败，请稍后重试。"];
          this.validationTarget = "questions";
          return;
        }
        sourceQuestionId = String(saved.id);
        source = saved.source || QUESTION_SOURCES.MANUAL;
      }

      this.form.questions.push({
        ...clone(question),
        id: createLocalQuestionId(),
        sourceQuestionId,
        source,
        score: this.questionScoreValue(question),
      });

      this.closeQuestionEditor();
      this.showToast(
        saveToBank ? "题目已加入练习并保存到题目库" : "题目已加入当前练习"
      );
    },

    openQuestionPicker() {
      if (!this.canModifyQuestionStructure) return;
      this.showQuestionPicker = true;
    },

    openQuestionImport() {
      if (!this.canModifyQuestionStructure) return;

      if (this.totalScore >= 100) {
        this.openValidationDialog({
          messages: [
            "当前练习总分已达到 100 分，请先调整已有题目分值后再批量导入。",
          ],
          target: "questions",
        });
        return;
      }

      this.showQuestionImport = true;
    },

    addImportedQuestions({ questions, saveToBank }) {
      if (!this.canModifyQuestionStructure || !Array.isArray(questions)) return;

      const importedScore = questions.reduce(
        (sum, question) => sum + Number(question.score || 0),
        0
      );

      if (this.totalScore + importedScore > 100) {
        this.openValidationDialog({
          messages: [
            `本次导入题目共 ${importedScore} 分，加入后整份练习将超过 100 分，请调整 Excel 中的分值后重新上传。`,
          ],
          target: "questions",
        });
        return;
      }

      const snapshots = [];

      for (const importedQuestion of questions) {
        let sourceQuestionId = "";
        let source = QUESTION_SOURCES.IMPORT;

        if (saveToBank) {
          const saved = this.questionStore.saveQuestion(
            this.questionBankScopeId,
            buildQuestionContent({
              ...importedQuestion,
              source: QUESTION_SOURCES.IMPORT,
              aiMeta: null,
            })
          );

          if (!saved) {
            this.openValidationDialog({
              messages: [
                "部分题目保存到题目库失败，本次未执行导入，请稍后重试。",
              ],
              target: "questions",
            });
            return;
          }

          sourceQuestionId = String(saved.id);
          source = saved.source || QUESTION_SOURCES.IMPORT;
        }

        snapshots.push({
          ...normalizeQuestion(importedQuestion),
          id: createLocalQuestionId(),
          sourceQuestionId,
          source,
          score: Number(importedQuestion.score),
        });
      }

      this.form.questions.push(...snapshots);
      this.showQuestionImport = false;
      this.showToast(
        saveToBank
          ? `已导入 ${snapshots.length} 道题，并保存到题目库`
          : `已导入 ${snapshots.length} 道题`
      );
    },

    addQuestionsFromLibrary(questions) {
      if (!this.canModifyQuestionStructure) return;
      const existingIds = new Set(this.addedLibraryQuestionIds);
      const snapshots = questions
        .filter((question) => !existingIds.has(String(question.id)))
        .map((question) => ({
          ...normalizeQuestion(question),
          id: createLocalQuestionId(),
          sourceQuestionId: String(question.id),
          source: question.source || QUESTION_SOURCES.MANUAL,
          score: 10,
        }));

      const addedScore = snapshots.reduce(
        (sum, question) => sum + this.questionScoreValue(question),
        0
      );

      if (this.totalScore + addedScore > 100) {
        this.openValidationDialog({
          messages: [
            `加入这 ${snapshots.length} 道题后总分将超过 100 分，请减少选择数量或先调整已有题目分值。`,
          ],
          target: "questions",
        });
        return;
      }

      this.form.questions.push(...snapshots);
      this.showQuestionPicker = false;

      if (snapshots.length) {
        this.showToast(`已从题目库加入 ${snapshots.length} 道题`);
      }
    },

    removeQuestion(index) {
      if (!this.canModifyQuestionStructure) return;
      this.form.questions.splice(index, 1);
    },

    startQuestionDrag(index, event) {
      if (!this.canReorderQuestions) {
        event.preventDefault();
        return;
      }

      this.draggedQuestionIndex = index;
      this.dragOverQuestionIndex = index;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    },

    handleDragOver(index) {
      if (!this.canReorderQuestions || this.draggedQuestionIndex < 0) return;
      this.dragOverQuestionIndex = index;
    },

    handleQuestionDrop(index) {
      if (!this.canReorderQuestions || this.draggedQuestionIndex < 0) return;

      const from = this.draggedQuestionIndex;
      if (from !== index) {
        const [moved] = this.form.questions.splice(from, 1);
        this.form.questions.splice(index, 0, moved);
      }

      this.endQuestionDrag();
    },

    endQuestionDrag() {
      this.draggedQuestionIndex = -1;
      this.dragOverQuestionIndex = -1;
    },

    validateBase() {
      const messages = [];
      let target = "";
      const add = (message, key) => {
        messages.push(message);
        if (!target) target = key;
      };

      if (!this.form.name.trim()) add("请输入练习名称。", "name");
      if (!this.form.type) add("请选择练习类型。", "name");

      const invalidScore = this.form.questions.some((question) => {
        const score = Number(question.score);
        return !Number.isFinite(score) || score < 1 || score > 100;
      });
      if (invalidScore) {
        add("每道题的分值需设置为 1–100 分。", "questions");
      }

      if (this.totalScore > 100) {
        add(
          `整份练习总分不能超过 100 分，当前为 ${this.totalScore} 分。`,
          "questions"
        );
      }

      return { messages, target };
    },

    validateForPublish() {
      const base = this.validateBase();
      const messages = [...base.messages];
      let target = base.target;
      const add = (message, key) => {
        messages.push(message);
        if (!target) target = key;
      };

      if (this.form.type === "CLASSROOM") {
        const duration = Number(this.form.durationMinutes);
        if (!Number.isFinite(duration) || duration < 1 || duration > 180) {
          add("请设置 1–180 分钟之间的作答时长。", "duration");
        }
      }

      if (this.form.type === "HOMEWORK" && !this.form.deadline) {
        add("请设置课后作业的截止时间。", "deadline");
      }

      if (!this.form.questions.length) {
        add("至少加入 1 道题目后才能发布练习。", "questions");
      }

      return { messages, target };
    },

    buildPayload(status) {
      const previous = this.originalExercise || {};
      const expectedCount =
        status === "DRAFT"
          ? previous.expectedCount ?? 0
          : previous.expectedCount ||
            this.currentTeachingClass?.studentCount ||
            40;

      return {
        id: this.isEditMode ? String(this.exerciseId) : undefined,
        name: this.form.name.trim(),
        description: this.form.description.trim(),
        type: this.form.type,
        status,
        durationMinutes:
          this.form.type === "CLASSROOM"
            ? Number(this.form.durationMinutes)
            : null,
        deadline:
          this.form.type === "HOMEWORK"
            ? toStoredDateTime(this.form.deadline)
            : "",
        questions: clone(this.form.questions),
        submittedCount: previous.submittedCount ?? 0,
        expectedCount,
      };
    },

    saveWithStatus(status, { leaveAfterSave = false } = {}) {
      if (this.isEndedReadOnly) return false;

      if (status === "ACTIVE" && !this.courseAccess.canPublishExercise) {
        this.openValidationDialog({
          messages: [
            "课程尚未开始，当前可以继续保存草稿，进入当前学期后再发布练习。",
          ],
          target: "",
        });
        return false;
      }

      const validation =
        status === "DRAFT" ? this.validateBase() : this.validateForPublish();

      if (validation.messages.length) {
        this.openValidationDialog(validation);
        return false;
      }

      const saved = this.exerciseStore.saveExercise(
        this.teachingClassId,
        this.buildPayload(status)
      );

      if (!saved) {
        this.openValidationDialog({
          messages: ["练习保存失败，请稍后重试。"],
          target: "",
        });
        return false;
      }

      const wasNewExercise = !this.isEditMode;
      const previousStatus = this.originalStatus;

      this.originalExercise = clone(saved);
      this.originalStatus = saved.status;
      this.applyExerciseToForm(saved);
      this.initialSnapshot = this.currentSnapshot;

      if (leaveAfterSave && this.pendingNavigation) {
        const next = this.pendingNavigation;
        this.pendingNavigation = null;
        this.showLeaveDialog = false;
        next();
        return true;
      }

      // 用户主动保存只负责保存，不自动退出当前编辑页。
      // 新建练习首次保存后切换到正式编辑路由，避免后续再次保存重复创建。
      if (wasNewExercise) {
        this.$router.replace(
          `/course/${this.teachingClassId}/questions/exercises/${String(
            saved.id
          )}/edit`
        );
      }

      const successText =
        saved.status === "DRAFT"
          ? "草稿已保存"
          : wasNewExercise || previousStatus === "DRAFT"
          ? "练习已发布"
          : "修改已保存";
      this.showToast(successText);
      return true;
    },

    openValidationDialog({ messages, target }) {
      this.validationMessages = messages;
      this.validationTarget = target || "";
      this.showValidationDialog = true;
    },

    closeValidationDialog() {
      this.showValidationDialog = false;
      this.$nextTick(() => this.scrollToValidationTarget());
    },

    scrollToValidationTarget() {
      if (!this.validationTarget) return;
      const target = this.$el.querySelector(
        `[data-validation-key="${this.validationTarget}"]`
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        target?.querySelector("textarea, input, button")?.focus?.();
      }, 350);
    },

    openEndDialog() {
      if (!this.canEndExercise) return;
      this.showEndDialog = true;
    },

    closeEndDialog() {
      this.showEndDialog = false;
    },

    confirmEndExercise() {
      if (!this.canEndExercise) return;

      const ended = this.exerciseStore.endExercise(
        this.teachingClassId,
        this.exerciseId
      );

      if (!ended) {
        this.closeEndDialog();
        this.openValidationDialog({
          messages: ["练习状态已发生变化，请返回列表后重试。"],
          target: "",
        });
        return;
      }

      this.originalExercise = clone(ended);
      this.originalStatus = "ENDED";
      this.applyExerciseToForm(ended);
      this.closeEndDialog();

      this.$nextTick(() => {
        this.initialSnapshot = this.currentSnapshot;
      });

      this.showToast("练习已结束");
    },

    openReuseDialog() {
      if (!this.showReuseButton) return;
      this.showReuseDialog = true;
    },

    closeReuseDialog() {
      this.showReuseDialog = false;
    },

    confirmReuse() {
      if (!this.showReuseButton) return;

      const draft = this.exerciseStore.duplicateExerciseAsDraft(
        this.teachingClassId,
        this.exerciseId
      );

      this.closeReuseDialog();

      if (!draft) {
        this.openValidationDialog({
          messages: ["创建草稿失败，请稍后重试。"],
          target: "",
        });
        return;
      }

      this.$router.push(
        `/course/${this.teachingClassId}/questions/exercises/${String(
          draft.id
        )}/edit`
      );
    },

    saveDraft() {
      this.saveWithStatus("DRAFT");
    },

    savePrimary() {
      if (!this.canUsePrimaryAction) {
        if (this.courseAccess.isUpcoming) {
          this.openValidationDialog({
            messages: ["课程尚未开始，当前请先保存为草稿。"],
            target: "",
          });
        }
        return;
      }

      if (!this.isEditMode || this.originalStatus === "DRAFT") {
        this.saveWithStatus("ACTIVE");
        return;
      }
      this.saveWithStatus(this.originalStatus);
    },

    goBack() {
      this.$router.push(`/course/${this.teachingClassId}/questions`);
    },

    cancelLeave() {
      const next = this.pendingNavigation;
      this.pendingNavigation = null;
      this.showLeaveDialog = false;
      if (next) next(false);
    },

    confirmLeave() {
      const next = this.pendingNavigation;
      this.pendingNavigation = null;
      this.showLeaveDialog = false;
      if (next) next();
    },

    saveAndLeave() {
      const status = this.canSaveDraft ? "DRAFT" : this.originalStatus;
      this.saveWithStatus(status, { leaveAfterSave: true });
    },

    typeLabel(type) {
      return questionTypeLabel(type);
    },

    typeIcon(type) {
      return questionTypeIcon(type);
    },

    difficultyLabel(difficulty) {
      return (
        { easy: "简单", medium: "中等", hard: "困难" }[difficulty] || "中等"
      );
    },

    statusLabel(status) {
      return (
        { DRAFT: "草稿", ACTIVE: "进行中", ENDED: "已结束" }[status] || "草稿"
      );
    },

    showToast(text) {
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
.exercise-editor-page {
  min-height: calc(100vh - 48px);
}

.editor-header {
  position: sticky;
  top: 0;
  z-index: 80;
  display: grid;
  grid-template-columns: minmax(180px, 0.65fr) minmax(320px, 1fr) minmax(
      260px,
      0.65fr
    );
  align-items: center;
  gap: 20px;
  padding: 17px 20px;
  border: 1px solid #e9eaec;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(10px);
}

.back-button {
  width: fit-content;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid #dfe3e8;
  border-radius: 999px;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  transition: 0.16s ease;
}

.back-button:hover {
  color: #111827;
  border-color: #cfd4dc;
  background: #f7f7f8;
}

.back-button :deep(.app-icon) {
  font-size: 18px;
}

.header-title-wrap {
  text-align: center;
}

.title-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}

.header-title-wrap h1 {
  margin: 0;
  color: #111827;
  font-size: 22px;
  letter-spacing: -0.02em;
}

.header-title-wrap p {
  margin: 5px 0 0;
  color: #858e9b;
  font-size: 13px;
}

.status-pill {
  padding: 5px 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-draft {
  border-color: #e2e5e9;
  background: #f5f6f7;
  color: #667085;
}

.status-active {
  border-color: #bdebd7;
  background: #ecfdf3;
  color: #16845b;
}

.status-ended {
  border-color: #bfd4ef;
  background: #edf5ff;
  color: #2f6fa8;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

.secondary-button,
.primary-button,
.end-exercise-button,
.end-confirm-button {
  min-height: 42px;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 11px;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}

.secondary-button {
  border: 1px solid #d9dde3;
  background: #ffffff;
  color: #374151;
}

.primary-button {
  border: 1px solid #111827;
  background: #111827;
  color: #ffffff;
}

.primary-button:disabled {
  border-color: #d1d5db;
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.end-exercise-button {
  border: 1px solid #f0c9c5;
  background: #fffafa;
  color: #b42318;
}

.end-exercise-button:hover {
  border-color: #e5aaa4;
  background: #fff4f2;
  color: #991b1b;
}

.end-confirm-button {
  border: 1px solid #b42318;
  background: #b42318;
  color: #ffffff;
}

.end-confirm-button:hover {
  background: #991b1b;
  border-color: #991b1b;
}

.secondary-button :deep(.app-icon),
.primary-button :deep(.app-icon),
.end-exercise-button :deep(.app-icon),
.end-confirm-button :deep(.app-icon) {
  font-size: 17px;
}

/* 状态提醒属于编辑正文，与下方表单卡片共享同一内容宽度。 */
.course-mode-note {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 13px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  color: #4b5563;
}

.course-mode-note.upcoming {
  border-color: #f3dfb8;
  background: #fffaf1;
}

.course-mode-note.ended {
  border-color: #d7e4f5;
  background: #f6f9fd;
}

.course-mode-note div {
  display: grid;
  gap: 3px;
}

.course-mode-note strong {
  color: #1f2937;
  font-size: 14px;
}

.course-mode-note span {
  font-size: 13px;
  line-height: 1.6;
}

.editor-main {
  width: 100%;
  box-sizing: border-box;
  margin: 18px 0 0;
  display: grid;
  gap: 16px;
}

.form-card {
  padding: 24px;
  border: 1px solid #e8eaed;
  border-radius: 18px;
  background: #ffffff;
  transition: 0.2s ease;
}

.card-heading {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.card-heading h2 {
  margin: 0 0 5px;
  color: #202733;
  font-size: 18px;
}

.card-heading p {
  margin: 0;
  color: #858e9b;
  font-size: 14px;
  line-height: 1.6;
}

.basic-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.95fr);
  gap: 18px 22px;
}

.field-group {
  display: grid;
  gap: 8px;
  padding: 1px;
  border-radius: 13px;
  transition: 0.2s ease;
}

.full-width {
  grid-column: 1 / -1;
}

.field-label {
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

.required-mark {
  color: #dc2626;
}

.text-input,
.text-area {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d7dce2;
  border-radius: 12px;
  background: #ffffff;
  color: #111827;
  outline: none;
  font: inherit;
  font-size: 15px;
  transition: 0.16s ease;
}

.text-input {
  height: 46px;
  padding: 0 14px;
}

.text-area {
  min-height: 98px;
  padding: 12px 14px;
  resize: vertical;
  line-height: 1.65;
}

.text-input:focus,
.text-area:focus {
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05);
}

.text-input:disabled,
.text-area:disabled {
  color: #5f6875;
  background: #f8f9fa;
  cursor: default;
}

.type-switcher {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.type-option {
  min-height: 74px;
  padding: 12px 14px;
  display: grid;
  gap: 4px;
  border: 1px solid #e0e3e7;
  border-radius: 13px;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.type-option strong {
  color: #303846;
  font-size: 14px;
}

.type-option span {
  color: #8a93a0;
  font-size: 12px;
  line-height: 1.5;
}

.type-option.active {
  border-color: #111827;
  background: #f8f9fa;
}

.type-option.active strong {
  color: #111827;
}

.type-option:disabled {
  cursor: default;
}

.time-setting-row {
  max-width: 620px;
}

.time-field small {
  color: #8a93a0;
  font-size: 13px;
  line-height: 1.5;
}

.number-input-wrap {
  position: relative;
}

.number-input-wrap .text-input {
  padding-right: 56px;
}

.number-input-wrap > span {
  position: absolute;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  color: #7b8492;
  font-size: 14px;
}

.datetime-input {
  color-scheme: light;
}

.question-heading {
  align-items: center;
}

.heading-title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.question-count {
  padding: 4px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #667085;
  font-size: 12px;
  font-weight: 800;
}

.sort-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 7px !important;
  color: #727b89 !important;
  font-size: 13px !important;
}

.sort-hint :deep(.app-icon) {
  font-size: 16px;
}

.question-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-button {
  min-height: 40px;
  padding: 0 13px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #dfe3e8;
  border-radius: 10px;
  background: #ffffff;
  color: #414a57;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}

.tool-button:hover {
  border-color: #bfc5cd;
  background: #fafafa;
  color: #111827;
}

.tool-button :deep(.app-icon) {
  font-size: 17px;
}

.exercise-question-list {
  display: grid;
  gap: 10px;
}

.exercise-question-item {
  display: grid;
  grid-template-columns: 34px 42px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 15px 16px;
  border: 1px solid #e6e8eb;
  border-radius: 14px;
  background: #ffffff;
  transition: 0.16s ease;
}

.exercise-question-item.dragging {
  opacity: 0.48;
}

.exercise-question-item.drop-target {
  border-color: #9aa3af;
  box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.05);
}

.drag-handle {
  width: 34px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #8a93a0;
  cursor: grab;
  font-size: 19px;
}

.drag-handle:hover:not(.disabled) {
  background: #f3f4f6;
  color: #374151;
}

.drag-handle:active:not(.disabled) {
  cursor: grabbing;
}

.drag-handle.disabled {
  opacity: 0.32;
  cursor: not-allowed;
}

.question-index {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f4f5f6;
  color: #697281;
  font-size: 13px;
  font-weight: 800;
}

.question-body {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.question-title-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.type-icon {
  width: 31px;
  height: 31px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 17px;
}

.question-title-row strong {
  padding-top: 3px;
  color: #202733;
  font-size: 15px;
  line-height: 1.55;
}

.question-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: #7b8492;
  font-size: 13px;
}

.question-meta-row > span:not(.difficulty-tag):not(.source-tag) {
  padding-right: 7px;
  border-right: 1px solid #e5e7eb;
}

.difficulty-tag,
.source-tag {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.difficulty-easy {
  background: #ecfdf3;
  color: #16845b;
}

.difficulty-medium {
  background: #fff7e6;
  color: #b4690e;
}

.difficulty-hard {
  background: #fff1f2;
  color: #c2414b;
}

.source-tag {
  background: #f3f4f6;
  color: #667085;
}

.score-editor {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #6b7280;
  font-size: 13px;
}

.score-editor input {
  width: 58px;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  padding: 0 7px;
  outline: none;
  color: #1f2937;
  font-size: 13px;
  text-align: center;
}

.score-editor input:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05);
}

.score-readonly {
  color: #4b5563;
  font-weight: 600;
}

.question-actions {
  display: flex;
  gap: 5px;
}

.text-question-action {
  min-height: 38px;
  padding: 0 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #dfe3e8;
  border-radius: 9px;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
}

.text-question-action:hover {
  border-color: #bfc5cd;
  background: #f8f9fa;
  color: #111827;
}

.text-question-action :deep(.app-icon) {
  font-size: 16px;
}

.icon-action {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #53606f;
  cursor: pointer;
  font-size: 18px;
}

.icon-action:hover {
  background: #f3f4f6;
  color: #111827;
}

.icon-action.danger:hover {
  background: #fff1f2;
  color: #dc2626;
}

.empty-question-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px dashed #dfe3e8;
  border-radius: 14px;
  background: #fbfbfc;
  color: #8a93a0;
  text-align: center;
}

.empty-icon {
  width: 50px;
  height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #f0f2f4;
  color: #5f6875;
  font-size: 23px;
}

.empty-question-state strong {
  color: #4b5563;
  font-size: 15px;
}

.empty-question-state p {
  margin: 0;
  color: #8a93a0;
  font-size: 13px;
}

.validation-highlight {
  border-color: #fecaca !important;
  background: #fffafa !important;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.04);
}

.field-group.validation-highlight {
  padding: 10px;
  margin: -10px;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.28);
}

.confirm-dialog {
  width: min(510px, 100%);
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
}

.dialog-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.dialog-title-row h3 {
  margin: 0 0 6px;
  color: #111827;
  font-size: 18px;
}

.dialog-title-row p {
  margin: 0;
  color: #7b8492;
  font-size: 14px;
}

.dialog-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #5f6875;
  cursor: pointer;
  font-size: 18px;
}

.dialog-close:hover {
  background: #f3f4f6;
}

.dialog-actions {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 9px;
}

@media (max-width: 980px) {
  .editor-header {
    grid-template-columns: 1fr auto;
  }

  .header-title-wrap {
    grid-column: 1 / -1;
    grid-row: 2;
    text-align: left;
  }

  .title-line {
    justify-content: flex-start;
  }

  .basic-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}

@media (max-width: 700px) {
  .editor-header {
    position: static;
    display: flex;
    flex-wrap: wrap;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions > button {
    flex: 1;
  }

  .form-card {
    padding: 19px;
  }

  .type-switcher {
    grid-template-columns: 1fr;
  }

  .question-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .exercise-question-item {
    grid-template-columns: 34px 38px minmax(0, 1fr);
  }

  .question-actions {
    grid-column: 3;
    justify-content: flex-end;
  }
}
</style>
