<template>
  <div class="answer-page">
    <header class="answer-header">
      <button type="button" class="back-button" @click="goBack">
        <AppIcon name="arrow-left" />
        <span>返回练习结果</span>
      </button>

      <div class="header-title-wrap">
        <div class="title-line">
          <h1>{{ submission?.studentName || "学生作答" }}</h1>
          <span
            v-if="result"
            class="grading-pill"
            :class="result.fullyGraded ? 'done' : 'pending'"
          >
            {{ result.fullyGraded ? "已完成批改" : "待批改" }}
          </span>
        </div>
        <p>
          {{ exercise?.name || "练习" }}
          <template v-if="submission">
            · {{ submission.studentId }} ·
            {{ submission.submittedAt }}</template
          >
        </p>
      </div>

      <button
        v-if="hasSubjectiveQuestions"
        type="button"
        class="primary-button"
        @click="saveGrades"
      >
        <AppIcon name="save" />
        <span>保存批改</span>
      </button>
      <span v-else class="header-placeholder"></span>
    </header>

    <main v-if="exercise && submission && result" class="answer-main">
      <section class="summary-grid">
        <article class="summary-card">
          <span>客观题得分</span>
          <strong
            >{{ result.objectiveScore }} /
            {{ result.objectiveMaxScore }}</strong
          >
          <small>单选、多选与判断题自动判分</small>
        </article>

        <article class="summary-card">
          <span>主观题批改</span>
          <strong>
            {{ subjectiveGradedCount }} / {{ subjectiveQuestionCount }}
          </strong>
          <small>{{
            result.pendingSubjectiveCount
              ? `${result.pendingSubjectiveCount} 题待评分`
              : "已完成全部评分"
          }}</small>
        </article>

        <article class="summary-card">
          <span>当前总分</span>
          <strong>{{
            result.finalScore === null
              ? "待批改"
              : `${result.finalScore} / ${result.maxScore}`
          }}</strong>
          <small>满分 {{ result.maxScore }} 分</small>
        </article>
      </section>

      <section class="answer-list-card">
        <div class="section-heading">
          <div>
            <h2>逐题作答</h2>
            <p>查看学生每道题的作答情况；简答题可在此评分并填写评语。</p>
          </div>
          <span class="question-summary"
            >共 {{ result.details.length }} 题</span
          >
        </div>

        <div class="answer-list">
          <article
            v-for="(detail, index) in result.details"
            :key="detail.question.id"
            class="answer-card"
            :data-grade-key="String(detail.question.id)"
            :class="{
              'validation-highlight':
                validationTarget === String(detail.question.id),
            }"
          >
            <header class="answer-card-header">
              <div class="question-heading">
                <span class="question-index">{{
                  String(index + 1).padStart(2, "0")
                }}</span>
                <div>
                  <div class="question-title-line">
                    <AppIcon :name="typeIcon(detail.question.type)" />
                    <strong>{{ detail.question.stem }}</strong>
                  </div>
                  <div class="question-meta">
                    <span>{{ typeLabel(detail.question.type) }}</span>
                    <span>{{ detail.maxScore }} 分</span>
                    <span>{{ detail.question.chapter || "未分类" }}</span>
                  </div>
                </div>
              </div>

              <span
                v-if="!detail.subjective"
                class="result-tag"
                :class="detail.correct ? 'correct' : 'wrong'"
              >
                {{ detail.correct ? "回答正确" : "回答错误" }} ·
                {{ detail.score }} / {{ detail.maxScore }} 分
              </span>
              <span v-else class="result-tag subjective">
                {{
                  gradeValue(detail.question.id) === ""
                    ? "待评分"
                    : `${gradeValue(detail.question.id)} / ${
                        detail.maxScore
                      } 分`
                }}
              </span>
            </header>

            <div v-if="!detail.subjective" class="objective-body">
              <div
                v-if="
                  detail.question.type === 'single' ||
                  detail.question.type === 'multiple'
                "
                class="option-review-list"
              >
                <div
                  v-for="option in detail.question.options || []"
                  :key="option.key"
                  class="option-review-row"
                  :class="optionReviewClass(detail, option.key)"
                >
                  <span class="option-key">{{ option.key }}</span>
                  <span class="option-text">{{ option.text }}</span>
                  <div class="option-tags">
                    <span
                      v-if="isStudentSelected(detail, option.key)"
                      class="student-tag"
                      >学生选择</span
                    >
                    <span
                      v-if="isCorrectOption(detail, option.key)"
                      class="correct-tag"
                      >正确答案</span
                    >
                  </div>
                </div>
              </div>

              <div
                v-else-if="detail.question.type === 'judgment'"
                class="option-review-list compact-options"
              >
                <div
                  v-for="option in judgmentOptions"
                  :key="option.key"
                  class="option-review-row"
                  :class="optionReviewClass(detail, option.key)"
                >
                  <span class="option-key judgment-key">{{ option.text }}</span>
                  <div class="option-tags">
                    <span
                      v-if="isStudentSelected(detail, option.key)"
                      class="student-tag"
                      >学生选择</span
                    >
                    <span
                      v-if="isCorrectOption(detail, option.key)"
                      class="correct-tag"
                      >正确答案</span
                    >
                  </div>
                </div>
              </div>

              <p
                v-if="!studentAnswerValues(detail).length"
                class="unanswered-tip"
              >
                学生未作答
              </p>

              <div v-if="detail.question.explanation" class="explanation-block">
                <span>答案解析</span>
                <p>{{ detail.question.explanation }}</p>
              </div>
            </div>

            <div v-else class="subjective-body">
              <section class="student-response-panel">
                <div class="subjective-section-heading">
                  <span class="section-title">学生作答</span>
                </div>
                <p class="student-response-text">
                  {{ detail.answerRecord?.answerText || "未作答" }}
                </p>
              </section>

              <section class="grading-reference-panel">
                <div class="subjective-section-heading">
                  <span class="section-title">评分参考</span>
                  <small>用于批改时对照</small>
                </div>

                <div class="reference-answer-row">
                  <span class="subsection-label">参考答案</span>
                  <p>{{ detail.question.referenceAnswer || "暂无参考答案" }}</p>
                </div>

                <div
                  v-if="detail.question.scoringPoints?.length"
                  class="scoring-reference"
                >
                  <span class="subsection-label">评分要点</span>
                  <ul>
                    <li
                      v-for="point in detail.question.scoringPoints"
                      :key="point"
                    >
                      {{ point }}
                    </li>
                  </ul>
                </div>
              </section>

              <section class="teacher-grading-panel">
                <div class="subjective-section-heading">
                  <span class="section-title">教师批改</span>
                  <small>填写本题得分，评语可选</small>
                </div>

                <div class="grading-grid">
                  <label class="field-group">
                    <span class="field-label"
                      >教师评分 <span class="required-mark">*</span></span
                    >
                    <div class="score-input-wrap">
                      <input
                        :value="gradeValue(detail.question.id)"
                        type="number"
                        min="0"
                        :max="detail.maxScore"
                        step="0.5"
                        @input="
                          updateGradeScore(
                            detail.question.id,
                            $event.target.value
                          )
                        "
                      />
                      <span>/ {{ detail.maxScore }} 分</span>
                    </div>
                  </label>

                  <label class="field-group comment-field">
                    <span class="field-label"
                      >教师评语
                      <span class="optional-mark">（选填）</span></span
                    >
                    <textarea
                      :value="commentValue(detail.question.id)"
                      rows="3"
                      maxlength="240"
                      placeholder="可填写批改建议或反馈"
                      @input="
                        updateGradeComment(
                          detail.question.id,
                          $event.target.value
                        )
                      "
                    ></textarea>
                  </label>
                </div>
              </section>
            </div>
          </article>
        </div>
      </section>
    </main>

    <AppFeedbackDialog
      v-if="showValidationDialog"
      title="请检查评分"
      description="保存前还有以下内容需要处理："
      :messages="validationMessages"
      @confirm="closeValidationDialog"
    />

    <div v-if="showLeaveDialog" class="dialog-mask">
      <section class="confirm-dialog">
        <div>
          <h3>还有未保存的批改</h3>
          <p>离开后，本次尚未保存的评分与评语将不会保留。</p>
        </div>
        <div class="dialog-actions">
          <button type="button" class="secondary-button" @click="cancelLeave">
            继续批改
          </button>
          <button type="button" class="secondary-button" @click="confirmLeave">
            放弃修改
          </button>
          <button type="button" class="primary-button" @click="saveAndLeave">
            <AppIcon name="save" />
            <span>保存并返回</span>
          </button>
        </div>
      </section>
    </div>

    <AppToast :message="toastText" />
  </div>
</template>

<script>
import AppFeedbackDialog from "../components/AppFeedbackDialog.vue";
import AppIcon from "../components/AppIcon.vue";
import AppToast from "../components/AppToast.vue";
import { useExerciseStore } from "../store/exerciseStore";
import { useExerciseSubmissionStore } from "../store/exerciseSubmissionStore";
import {
  calculateSubmissionResult,
  isSubjectiveQuestion,
  normalizeAnswer,
} from "../utils/exerciseGrading";
import { questionTypeIcon, questionTypeLabel } from "../utils/questionModel";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export default {
  name: "SubmissionAnswerView",
  components: { AppFeedbackDialog, AppIcon, AppToast },
  data() {
    return {
      gradeDrafts: {},
      initialGradeSnapshot: "",
      validationMessages: [],
      validationTarget: "",
      showValidationDialog: false,
      showLeaveDialog: false,
      pendingNavigation: null,
      toastText: "",
      toastTimer: null,
      judgmentOptions: [
        { key: "true", text: "正确" },
        { key: "false", text: "错误" },
      ],
    };
  },
  computed: {
    exerciseStore() {
      return useExerciseStore();
    },
    submissionStore() {
      return useExerciseSubmissionStore();
    },
    teachingClassId() {
      return String(this.$route.params.teachingClassId || "");
    },
    exerciseId() {
      return String(this.$route.params.exerciseId || "");
    },
    studentId() {
      return String(this.$route.params.studentId || "");
    },
    exercise() {
      return this.exerciseStore.getExercise(
        this.teachingClassId,
        this.exerciseId
      );
    },
    submission() {
      if (!this.exercise) return null;
      return this.submissionStore.getSubmission(
        this.teachingClassId,
        this.exercise,
        this.studentId
      );
    },
    draftSubmission() {
      if (!this.submission) return null;
      const next = clone(this.submission);
      next.answers = (next.answers || []).map((answer) => {
        const draft = this.gradeDrafts[String(answer.questionId)];
        if (!draft) return answer;
        return {
          ...answer,
          teacherScore:
            draft.teacherScore === "" ? null : Number(draft.teacherScore),
          teacherComment: String(draft.teacherComment || ""),
        };
      });
      return next;
    },
    result() {
      if (!this.exercise || !this.draftSubmission) return null;
      return calculateSubmissionResult(this.exercise, this.draftSubmission);
    },
    hasSubjectiveQuestions() {
      return (this.exercise?.questions || []).some((question) =>
        isSubjectiveQuestion(question)
      );
    },
    subjectiveQuestionCount() {
      return (
        this.result?.details.filter((detail) => detail.subjective).length || 0
      );
    },
    subjectiveGradedCount() {
      return Math.max(
        0,
        this.subjectiveQuestionCount -
          Number(this.result?.pendingSubjectiveCount || 0)
      );
    },
    currentGradeSnapshot() {
      return JSON.stringify(this.gradeDrafts);
    },
    isDirty() {
      return Boolean(
        this.initialGradeSnapshot &&
          this.currentGradeSnapshot !== this.initialGradeSnapshot
      );
    },
  },
  mounted() {
    this.exerciseStore.ensureTeachingClass(this.teachingClassId);

    if (!this.exercise || this.exercise.status === "DRAFT") {
      this.$router.replace(`/course/${this.teachingClassId}/questions`);
      return;
    }

    this.submissionStore.ensureExercise(this.teachingClassId, this.exercise);

    if (!this.submission?.submitted) {
      this.$router.replace(
        `/course/${this.teachingClassId}/questions/exercises/${this.exerciseId}/results`
      );
      return;
    }

    this.initializeGradeDrafts();
  },
  beforeUnmount() {
    window.clearTimeout(this.toastTimer);
  },
  beforeRouteLeave(to, from, next) {
    if (!this.isDirty) {
      next();
      return;
    }

    this.pendingNavigation = next;
    this.showLeaveDialog = true;
  },
  methods: {
    initializeGradeDrafts() {
      const drafts = {};
      const answerMap = new Map(
        (this.submission?.answers || []).map((answer) => [
          String(answer.questionId),
          answer,
        ])
      );

      (this.exercise?.questions || []).forEach((question) => {
        if (!isSubjectiveQuestion(question)) return;
        const answer = answerMap.get(String(question.id));
        drafts[String(question.id)] = {
          teacherScore:
            answer?.teacherScore === null ||
            answer?.teacherScore === undefined ||
            answer?.teacherScore === ""
              ? ""
              : Number(answer.teacherScore),
          teacherComment: String(answer?.teacherComment || ""),
        };
      });

      this.gradeDrafts = drafts;
      this.$nextTick(() => {
        this.initialGradeSnapshot = this.currentGradeSnapshot;
      });
    },
    typeLabel(type) {
      return questionTypeLabel(type);
    },
    typeIcon(type) {
      return questionTypeIcon(type);
    },
    gradeValue(questionId) {
      return this.gradeDrafts[String(questionId)]?.teacherScore ?? "";
    },
    commentValue(questionId) {
      return this.gradeDrafts[String(questionId)]?.teacherComment || "";
    },
    updateGradeScore(questionId, value) {
      const key = String(questionId);
      if (!this.gradeDrafts[key]) {
        this.gradeDrafts[key] = { teacherScore: "", teacherComment: "" };
      }
      this.gradeDrafts[key].teacherScore = value === "" ? "" : Number(value);
    },
    updateGradeComment(questionId, value) {
      const key = String(questionId);
      if (!this.gradeDrafts[key]) {
        this.gradeDrafts[key] = { teacherScore: "", teacherComment: "" };
      }
      this.gradeDrafts[key].teacherComment = String(value || "");
    },
    studentAnswerValues(detail) {
      return normalizeAnswer(detail.answerRecord?.answer);
    },
    correctAnswerValues(detail) {
      return normalizeAnswer(detail.question.answer);
    },
    isStudentSelected(detail, key) {
      return this.studentAnswerValues(detail).includes(String(key));
    },
    isCorrectOption(detail, key) {
      return this.correctAnswerValues(detail).includes(String(key));
    },
    optionReviewClass(detail, key) {
      const selected = this.isStudentSelected(detail, key);
      const correct = this.isCorrectOption(detail, key);
      return {
        "correct-option": correct,
        "wrong-selected": selected && !correct,
        "student-selected": selected,
      };
    },
    validateGrades() {
      const messages = [];
      let target = "";

      (this.result?.details || []).forEach((detail, index) => {
        if (!detail.subjective) return;
        const score = Number(this.gradeValue(detail.question.id));
        if (
          this.gradeValue(detail.question.id) === "" ||
          !Number.isFinite(score) ||
          score < 0 ||
          score > detail.maxScore
        ) {
          messages.push(
            `第 ${index + 1} 题评分应在 0–${detail.maxScore} 分之间。`
          );
          if (!target) target = String(detail.question.id);
        }
      });

      return { messages, target };
    },
    saveGrades({ leaveAfterSave = false } = {}) {
      if (!this.hasSubjectiveQuestions) return true;
      const validation = this.validateGrades();

      if (validation.messages.length) {
        this.validationMessages = validation.messages;
        this.validationTarget = validation.target;
        this.showValidationDialog = true;
        return false;
      }

      Object.entries(this.gradeDrafts).forEach(([questionId, draft]) => {
        this.submissionStore.saveSubjectiveGrade(
          this.teachingClassId,
          this.exerciseId,
          this.studentId,
          questionId,
          {
            teacherScore: Number(draft.teacherScore),
            teacherComment: String(draft.teacherComment || "").trim(),
          }
        );
      });

      this.initialGradeSnapshot = this.currentGradeSnapshot;
      this.showToast("批改已保存");

      if (leaveAfterSave && this.pendingNavigation) {
        const next = this.pendingNavigation;
        this.pendingNavigation = null;
        this.showLeaveDialog = false;
        next();
      }

      return true;
    },
    closeValidationDialog() {
      this.showValidationDialog = false;
      this.$nextTick(() => {
        const target = this.$el.querySelector(
          `[data-grade-key="${this.validationTarget}"]`
        );
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => target?.querySelector("input")?.focus?.(), 350);
      });
    },
    goBack() {
      this.$router.push(
        `/course/${this.teachingClassId}/questions/exercises/${this.exerciseId}/results`
      );
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
      this.showLeaveDialog = false;
      const saved = this.saveGrades({ leaveAfterSave: true });

      if (!saved && this.pendingNavigation) {
        const next = this.pendingNavigation;
        this.pendingNavigation = null;
        next(false);
      }
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
.answer-page {
  min-height: 100%;
  background: #f7f7f8;
  color: #111827;
}

.answer-header {
  position: sticky;
  top: 0;
  z-index: 80;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 220px;
  align-items: center;
  gap: 20px;
  padding: 18px 28px;
  border: 1px solid #e8eaed;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 8px 26px rgba(15, 23, 42, 0.04);
  backdrop-filter: blur(10px);
}

.back-button,
.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 15px;
  border-radius: 11px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.back-button {
  justify-self: start;
  width: fit-content;
  border: 1px solid #dfe3e8;
  border-radius: 999px;
  background: #fff;
  color: #4b5563;
}

.back-button:hover,
.secondary-button:hover {
  border-color: #cfd4dc;
  background: #f7f7f8;
  color: #111827;
}

.primary-button {
  justify-self: end;
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
}

.primary-button:hover {
  background: #1f2937;
}

.secondary-button {
  border: 1px solid #dfe3e8;
  background: #fff;
  color: #374151;
}

.header-placeholder {
  min-height: 42px;
}

.header-title-wrap {
  min-width: 0;
  text-align: center;
}

.title-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.title-line h1 {
  margin: 0;
  overflow: hidden;
  color: #111827;
  font-size: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-title-wrap p {
  margin: 5px 0 0;
  overflow: hidden;
  color: #7b8492;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grading-pill {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.grading-pill.done {
  color: #047857;
  background: #ecfdf5;
}

.grading-pill.pending {
  color: #9a6700;
  background: #fff7db;
}

.answer-main {
  width: min(1480px, calc(100% - 56px));
  margin: 20px auto 42px;
  display: grid;
  gap: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary-card,
.answer-list-card {
  border: 1px solid #e8eaed;
  background: #fff;
}

.summary-card {
  padding: 19px 20px;
  border-radius: 17px;
}

.summary-card span {
  color: #7b8492;
  font-size: 14px;
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  color: #111827;
  font-size: 24px;
}

.summary-card small {
  display: block;
  margin-top: 6px;
  color: #9aa1aa;
  font-size: 12px;
}

.answer-list-card {
  padding: 26px;
  border-radius: 20px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.section-heading h2 {
  margin: 0;
  font-size: 20px;
}

.section-heading p {
  margin: 6px 0 0;
  color: #7b8492;
  font-size: 14px;
}

.question-summary {
  padding: 7px 11px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #667085;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.answer-list {
  display: grid;
  gap: 15px;
  margin-top: 20px;
}

.answer-card {
  overflow: hidden;
  border: 1px solid #e8eaed;
  border-radius: 16px;
  background: #fff;
  transition: 0.18s ease;
}

.answer-card.validation-highlight {
  border-color: #f1aaa2;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.06);
}

.answer-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 17px 18px;
  border-bottom: 1px solid #eef0f2;
  background: #fbfbfb;
}

.question-heading {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.question-index {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.question-title-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #111827;
  line-height: 1.65;
}

.question-title-line :deep(.app-icon) {
  margin-top: 4px;
  color: #4b5563;
  font-size: 17px;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 7px;
  color: #7b8492;
  font-size: 13px;
}

.result-tag {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.result-tag.correct {
  color: #047857;
  background: #ecfdf5;
}

.result-tag.wrong {
  color: #b42318;
  background: #fff1f0;
}

.result-tag.subjective {
  color: #9a6700;
  background: #fff7db;
}

.objective-body,
.subjective-body {
  padding: 18px;
}

.option-review-list {
  display: grid;
  gap: 9px;
}

.option-review-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 11px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.option-review-row.correct-option {
  border-color: #b8e5d2;
  background: #f3fbf7;
}

.option-review-row.wrong-selected {
  border-color: #f0c3bf;
  background: #fff6f5;
}

.option-review-row.student-selected.correct-option {
  box-shadow: inset 3px 0 0 #22a06b;
}

.option-key {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  font-weight: 800;
}

.judgment-key {
  width: auto;
  min-width: 58px;
  padding: 0 10px;
  border-radius: 999px;
}

.option-text {
  color: #1f2937;
  font-size: 14px;
  line-height: 1.65;
}

.option-tags {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.student-tag,
.correct-tag {
  padding: 4px 7px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}

.student-tag {
  color: #374151;
  background: #eef0f3;
}

.correct-tag {
  color: #047857;
  background: #ddf7ea;
}

.wrong-selected .student-tag {
  color: #b42318;
  background: #fee9e7;
}

.compact-options .option-review-row {
  grid-template-columns: minmax(0, 1fr) auto;
}

.unanswered-tip {
  margin: 12px 0 0;
  color: #b42318;
  font-size: 13px;
}

.explanation-block {
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px solid #eceef0;
  border-radius: 12px;
  background: #fafafa;
}

.explanation-block > span {
  color: #7b8492;
  font-size: 13px;
  font-weight: 700;
}

.explanation-block p {
  margin: 8px 0 0;
  color: #1f2937;
  font-size: 14.5px;
  line-height: 1.78;
  white-space: pre-wrap;
}

.subjective-body {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.student-response-panel,
.grading-reference-panel,
.teacher-grading-panel {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px 20px;
}

.student-response-panel {
  border-left: 4px solid #111827;
  background: #ffffff;
}

.grading-reference-panel {
  border-color: #e8ebef;
  background: #f8f9fb;
}

.teacher-grading-panel {
  background: #ffffff;
}

.subjective-section-heading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
}

.section-title {
  color: #111827;
  font-size: 15.5px;
  font-weight: 800;
}

.subjective-section-heading small {
  color: #98a1ad;
  font-size: 12.5px;
}

.student-response-text {
  margin: 0;
  color: #111827;
  font-size: 16px;
  line-height: 1.9;
  white-space: pre-wrap;
}

.reference-answer-row p {
  margin: 8px 0 0;
  color: #374151;
  font-size: 15px;
  line-height: 1.82;
  white-space: pre-wrap;
}

.subsection-label {
  color: #667085;
  font-size: 13.5px;
  font-weight: 750;
}

.scoring-reference {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e1e5ea;
}

.scoring-reference ul {
  margin: 9px 0 0;
  padding-left: 21px;
  color: #475467;
  font-size: 14.5px;
  line-height: 1.85;
}

.grading-grid {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.field-group {
  display: grid;
  gap: 8px;
}

.field-label {
  color: #344054;
  font-size: 15px;
  font-weight: 750;
}

.required-mark {
  color: #dc2626;
}

.optional-mark {
  color: #98a1ad;
  font-weight: 500;
}

.score-input-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
}

.score-input-wrap input,
.comment-field textarea {
  box-sizing: border-box;
  border: 1px solid #dfe3e8;
  border-radius: 11px;
  background: #fff;
  color: #1f2937;
  outline: none;
  font: inherit;
  font-size: 15px;
}

.score-input-wrap input {
  width: 118px;
  min-height: 46px;
  padding: 0 13px;
}

.score-input-wrap span {
  color: #667085;
  font-size: 14px;
  white-space: nowrap;
}

.comment-field textarea {
  width: 100%;
  min-height: 98px;
  padding: 12px 14px;
  resize: vertical;
  line-height: 1.7;
}

.score-input-wrap input:focus,
.comment-field textarea:focus {
  border-color: #98a2b3;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05);
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 700;
  display: grid;
  place-items: center;
  padding: 22px;
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  width: min(520px, calc(100vw - 40px));
  padding: 22px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 22px 64px rgba(15, 23, 42, 0.16);
}

.confirm-dialog h3 {
  margin: 0;
  color: #111827;
  font-size: 19px;
}

.confirm-dialog p {
  margin: 8px 0 0;
  color: #7b8492;
  font-size: 14px;
  line-height: 1.7;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 20px;
}

@media (max-width: 980px) {
  .answer-header {
    grid-template-columns: 1fr;
  }

  .header-title-wrap {
    order: -1;
  }

  .back-button,
  .primary-button {
    justify-self: stretch;
  }

  .summary-grid,
  .grading-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .answer-header {
    padding: 15px;
  }

  .answer-main {
    width: min(100% - 24px, 1480px);
  }

  .answer-list-card {
    padding: 18px;
  }

  .answer-card-header {
    flex-direction: column;
  }

  .option-review-row {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .option-tags {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
