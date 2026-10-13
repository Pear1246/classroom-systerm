<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <section class="submission-dialog" role="dialog" aria-modal="true">
      <header class="dialog-header">
        <div>
          <div class="title-row">
            <h2>{{ submission.studentName }}</h2>
            <span class="student-id">{{ submission.studentId }}</span>
          </div>
          <p>{{ exercise.name }} · 提交于 {{ submission.submittedAt }}</p>
        </div>

        <button
          type="button"
          class="icon-close"
          aria-label="关闭"
          @click="$emit('close')"
        >
          <AppIcon name="close" />
        </button>
      </header>

      <div class="summary-row">
        <div>
          <span>客观题</span>
          <strong
            >{{ result.objectiveScore }} /
            {{ result.objectiveMaxScore }}</strong
          >
        </div>
        <div>
          <span>主观题</span>
          <strong>
            {{ result.subjectiveScore }} / {{ result.subjectiveMaxScore }}
          </strong>
        </div>
        <div>
          <span>总分</span>
          <strong>{{
            result.finalScore === null
              ? "待批改"
              : `${result.finalScore} / ${result.maxScore}`
          }}</strong>
        </div>
      </div>

      <main class="dialog-body">
        <article
          v-for="(detail, index) in localDetails"
          :key="String(detail.question.id)"
          class="answer-card"
        >
          <div class="answer-card-header">
            <div class="question-heading">
              <span class="question-index">{{
                String(index + 1).padStart(2, "0")
              }}</span>
              <div>
                <div class="question-title-line">
                  <span class="type-icon"
                    ><AppIcon :name="typeIcon(detail.question.type)"
                  /></span>
                  <strong>{{ detail.question.stem }}</strong>
                </div>
                <div class="question-meta">
                  <span>{{ typeLabel(detail.question.type) }}</span>
                  <span>{{ detail.maxScore }} 分</span>
                </div>
              </div>
            </div>

            <span
              v-if="!detail.subjective"
              class="result-tag"
              :class="detail.correct ? 'correct' : 'wrong'"
            >
              {{ detail.correct ? "正确" : "错误" }} · {{ detail.score }} 分
            </span>
            <span v-else class="result-tag subjective">
              {{ detail.score === null ? "待批改" : `${detail.score} 分` }}
            </span>
          </div>

          <div v-if="!detail.subjective" class="objective-detail">
            <div class="answer-line">
              <span>学生答案</span>
              <strong :class="detail.correct ? 'correct-text' : 'wrong-text'">
                {{
                  answerText(detail.question, detail.answerRecord?.answer) ||
                  "未作答"
                }}
              </strong>
            </div>
            <div class="answer-line">
              <span>正确答案</span>
              <strong>{{
                answerText(detail.question, detail.question.answer)
              }}</strong>
            </div>
            <p v-if="detail.question.explanation" class="explanation">
              {{ detail.question.explanation }}
            </p>
          </div>

          <div v-else class="subjective-detail">
            <div class="subjective-block">
              <span class="block-label">学生作答</span>
              <p>{{ detail.answerRecord?.answerText || "未作答" }}</p>
            </div>

            <div class="subjective-block reference-block">
              <span class="block-label">参考答案</span>
              <p>{{ detail.question.referenceAnswer || "暂无参考答案" }}</p>
              <ul
                v-if="detail.question.scoringPoints?.length"
                class="scoring-points"
              >
                <li v-for="point in detail.question.scoringPoints" :key="point">
                  {{ point }}
                </li>
              </ul>
            </div>

            <div class="grading-grid">
              <label class="field-group">
                <span class="field-label"
                  >教师评分 <span class="required-mark">*</span></span
                >
                <div class="score-input-wrap">
                  <input
                    v-model.number="detail.teacherScore"
                    type="number"
                    min="0"
                    :max="detail.maxScore"
                    step="0.5"
                  />
                  <span>/ {{ detail.maxScore }} 分</span>
                </div>
              </label>

              <label class="field-group">
                <span class="field-label">批改评语</span>
                <input
                  v-model="detail.teacherComment"
                  type="text"
                  placeholder="可填写简短评语"
                />
              </label>
            </div>
          </div>
        </article>
      </main>

      <footer class="dialog-footer">
        <button type="button" class="secondary-button" @click="$emit('close')">
          关闭
        </button>
        <button
          v-if="hasSubjectiveQuestions"
          type="button"
          class="primary-button"
          @click="saveGrades"
        >
          <AppIcon name="save" />
          <span>保存批改</span>
        </button>
      </footer>

      <AppFeedbackDialog
        v-if="showValidationDialog"
        title="请检查评分"
        description="保存前还有以下内容需要处理："
        :messages="validationMessages"
        @confirm="showValidationDialog = false"
      />
    </section>
  </div>
</template>

<script>
import AppFeedbackDialog from "../AppFeedbackDialog.vue";
import AppIcon from "../AppIcon.vue";
import {
  calculateSubmissionResult,
  isSubjectiveQuestion,
} from "../../utils/exerciseGrading";
import { questionTypeIcon, questionTypeLabel } from "../../utils/questionModel";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export default {
  name: "SubmissionDetailDialog",
  components: { AppFeedbackDialog, AppIcon },
  props: {
    exercise: { type: Object, required: true },
    submission: { type: Object, required: true },
  },
  emits: ["close", "save"],
  data() {
    return {
      localSubmission: clone(this.submission),
      showValidationDialog: false,
      validationMessages: [],
    };
  },
  computed: {
    result() {
      return calculateSubmissionResult(this.exercise, this.localSubmission);
    },
    localDetails() {
      return this.result.details.map((detail) => ({
        ...detail,
        teacherScore: detail.answerRecord?.teacherScore ?? "",
        teacherComment: detail.answerRecord?.teacherComment || "",
      }));
    },
    hasSubjectiveQuestions() {
      return (this.exercise.questions || []).some((question) =>
        isSubjectiveQuestion(question)
      );
    },
  },
  methods: {
    typeLabel(type) {
      return questionTypeLabel(type);
    },
    typeIcon(type) {
      return questionTypeIcon(type);
    },
    answerText(question, answer) {
      const values = Array.isArray(answer) ? answer : [];
      if (!values.length) return "";

      if (question.type === "judgment") {
        return values[0] === "true" ? "正确" : "错误";
      }

      const optionMap = new Map(
        (question.options || []).map((option) => [
          String(option.key),
          option.text,
        ])
      );

      return values
        .map(
          (key) =>
            `${key}${
              optionMap.get(String(key))
                ? `（${optionMap.get(String(key))}）`
                : ""
            }`
        )
        .join("、");
    },
    saveGrades() {
      const grades = [];
      const messages = [];

      this.localDetails.forEach((detail, index) => {
        if (!detail.subjective) return;

        const score = Number(detail.teacherScore);
        if (!Number.isFinite(score) || score < 0 || score > detail.maxScore) {
          messages.push(
            `第 ${index + 1} 题评分应在 0–${detail.maxScore} 分之间。`
          );
          return;
        }

        grades.push({
          questionId: String(detail.question.id),
          teacherScore: score,
          teacherComment: String(detail.teacherComment || "").trim(),
        });
      });

      if (messages.length) {
        this.validationMessages = messages;
        this.showValidationDialog = true;
        return;
      }

      this.$emit("save", grades);
    },
  },
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 520;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(2px);
}

.submission-dialog {
  width: min(1040px, 100%);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
}

.dialog-header,
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
}

.dialog-header {
  border-bottom: 1px solid #eef0f2;
}
.dialog-footer {
  justify-content: flex-end;
  border-top: 1px solid #eef0f2;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dialog-header h2 {
  margin: 0;
  color: #111827;
  font-size: 22px;
}
.dialog-header p {
  margin: 5px 0 0;
  color: #7b8492;
  font-size: 14px;
}
.student-id {
  color: #6b7280;
  font-size: 13px;
}

.icon-close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 18px;
}
.icon-close:hover {
  background: #f5f5f5;
  color: #111827;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px 24px;
  background: #fafafa;
  border-bottom: 1px solid #eef0f2;
}
.summary-row > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.summary-row span {
  color: #7b8492;
  font-size: 13px;
}
.summary-row strong {
  color: #111827;
  font-size: 17px;
}

.dialog-body {
  overflow-y: auto;
  padding: 22px 24px 28px;
  display: grid;
  gap: 14px;
}

.answer-card {
  border: 1px solid #e8eaed;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}
.answer-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 17px 18px;
  background: #fbfbfb;
  border-bottom: 1px solid #eef0f2;
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
.type-icon {
  margin-top: 3px;
  color: #4b5563;
  font-size: 17px;
}
.question-meta {
  display: flex;
  gap: 12px;
  margin-top: 7px;
  color: #7b8492;
  font-size: 13px;
}

.result-tag {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
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
  color: #7c5b12;
  background: #fffbeb;
}

.objective-detail,
.subjective-detail {
  padding: 18px;
}
.answer-line {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 12px;
  padding: 7px 0;
  font-size: 14px;
}
.answer-line span {
  color: #7b8492;
}
.answer-line strong {
  color: #1f2937;
  font-weight: 600;
}
.correct-text {
  color: #047857 !important;
}
.wrong-text {
  color: #b42318 !important;
}
.explanation {
  margin: 12px 0 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8f9fa;
  color: #5f6875;
  font-size: 14px;
  line-height: 1.7;
}

.subjective-detail {
  display: grid;
  gap: 14px;
}
.subjective-block {
  padding: 14px 15px;
  border: 1px solid #eceef0;
  border-radius: 13px;
}
.reference-block {
  background: #fafafa;
}
.block-label {
  color: #7b8492;
  font-size: 13px;
}
.subjective-block p {
  margin: 7px 0 0;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
}
.scoring-points {
  margin: 10px 0 0;
  padding-left: 20px;
  color: #5f6875;
  font-size: 13px;
  line-height: 1.8;
}

.grading-grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 14px;
}
.field-group {
  display: grid;
  gap: 7px;
}
.field-label {
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}
.required-mark {
  color: #dc2626;
}
.field-group input {
  width: 100%;
  min-height: 42px;
  box-sizing: border-box;
  border: 1px solid #dfe3e8;
  border-radius: 11px;
  padding: 0 12px;
  outline: none;
  color: #1f2937;
  font-size: 14px;
}
.field-group input:focus {
  border-color: #9ca3af;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05);
}
.score-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.score-input-wrap input {
  width: 110px;
}
.score-input-wrap span {
  color: #6b7280;
  font-size: 13px;
  white-space: nowrap;
}

.secondary-button,
.primary-button {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 11px;
  border: 1px solid #dfe3e8;
  font-size: 14px;
  cursor: pointer;
}
.secondary-button {
  background: #fff;
  color: #374151;
}
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-color: #111827;
  background: #111827;
  color: #fff;
}

@media (max-width: 760px) {
  .modal-mask {
    padding: 12px;
  }
  .summary-row {
    grid-template-columns: 1fr;
  }
  .grading-grid {
    grid-template-columns: 1fr;
  }
  .answer-card-header {
    flex-direction: column;
  }
}
</style>
