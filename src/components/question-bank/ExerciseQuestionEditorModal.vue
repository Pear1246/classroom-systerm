<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <section class="question-modal" role="dialog" aria-modal="true">
      <header class="modal-header">
        <div>
          <h2>{{ isEditMode ? "编辑练习题目" : "新建题目" }}</h2>
          <p>
            {{
              isEditMode
                ? "本次修改只作用于当前练习中的题目副本。"
                : "题目默认只加入当前练习，需要长期复用时再保存到题目库。"
            }}
          </p>
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

      <div class="modal-body">
        <div class="form-grid">
          <div class="field-group">
            <label class="field-label">
              题型 <span class="required-mark">*</span>
            </label>
            <AppSelect
              :model-value="form.type"
              :options="typeOptions"
              @update:modelValue="changeQuestionType"
            />
          </div>

          <div class="field-group">
            <label class="field-label">
              难度 <span class="required-mark">*</span>
            </label>
            <AppSelect v-model="form.difficulty" :options="difficultyOptions" />
          </div>

          <div
            class="field-group full-width"
            data-validation-key="score"
            :class="{ 'validation-highlight': validationTarget === 'score' }"
          >
            <label class="field-label" for="exerciseQuestionScore">
              本题分值 <span class="required-mark">*</span>
            </label>
            <div class="score-input-wrap">
              <input
                id="exerciseQuestionScore"
                v-model.number="form.score"
                class="text-input score-input"
                type="number"
                min="1"
                :max="scoreUpperLimit"
                step="1"
              />
              <span>分</span>
            </div>
          </div>

          <div
            class="field-group full-width"
            data-validation-key="stem"
            :class="{ 'validation-highlight': validationTarget === 'stem' }"
          >
            <label class="field-label">
              题干 <span class="required-mark">*</span>
            </label>
            <textarea
              v-model="form.stem"
              class="text-area stem-input"
              rows="3"
              placeholder="请输入题目内容"
            ></textarea>
          </div>

          <div
            v-if="isChoiceType"
            class="field-group full-width"
            data-validation-key="options"
            :class="{
              'validation-highlight':
                validationTarget === 'options' || validationTarget === 'answer',
            }"
          >
            <div class="field-title-row">
              <div>
                <label class="field-label">
                  选项与正确答案 <span class="required-mark">*</span>
                </label>
                <p class="field-hint">
                  {{
                    form.type === "single"
                      ? "请选择 1 个正确答案，选中后整行会高亮。"
                      : "请选择一个或多个正确答案，多选题至少选择 2 个。"
                  }}
                </p>
              </div>

              <button
                type="button"
                class="text-action"
                :disabled="form.options.length >= optionKeys.length"
                @click="addOption"
              >
                <AppIcon name="plus" />
                <span>添加选项</span>
              </button>
            </div>

            <div class="option-list">
              <div
                v-for="(option, index) in form.options"
                :key="option.key"
                class="option-row"
                :class="{ selected: isAnswerSelected(option.key) }"
              >
                <label
                  class="answer-control"
                  :title="`选择 ${option.key} 为正确答案`"
                >
                  <input
                    :type="form.type === 'single' ? 'radio' : 'checkbox'"
                    name="exercise-correct-answer"
                    :checked="isAnswerSelected(option.key)"
                    @change="toggleAnswer(option.key)"
                  />
                  <span>{{ option.key }}</span>
                </label>

                <input
                  v-model="option.text"
                  class="text-input"
                  type="text"
                  :placeholder="`请输入选项 ${option.key}`"
                />

                <span v-if="isAnswerSelected(option.key)" class="correct-tag">
                  正确答案
                </span>

                <button
                  type="button"
                  class="icon-action danger"
                  :disabled="form.options.length <= 2"
                  title="删除选项"
                  @click="removeOption(index)"
                >
                  <AppIcon name="delete" />
                </button>
              </div>
            </div>
          </div>

          <div
            v-else-if="form.type === 'judgment'"
            class="field-group full-width"
            data-validation-key="answer"
            :class="{ 'validation-highlight': validationTarget === 'answer' }"
          >
            <label class="field-label">
              正确答案 <span class="required-mark">*</span>
            </label>
            <p class="field-hint">请选择本题的正确判断。</p>

            <div class="judgment-options">
              <button
                type="button"
                class="judgment-button"
                :class="{ selected: form.answer[0] === 'true' }"
                @click="form.answer = ['true']"
              >
                <span
                  class="radio-visual"
                  :class="{ checked: form.answer[0] === 'true' }"
                ></span>
                正确
              </button>
              <button
                type="button"
                class="judgment-button"
                :class="{ selected: form.answer[0] === 'false' }"
                @click="form.answer = ['false']"
              >
                <span
                  class="radio-visual"
                  :class="{ checked: form.answer[0] === 'false' }"
                ></span>
                错误
              </button>
            </div>
          </div>

          <template v-else>
            <div
              class="field-group full-width"
              data-validation-key="referenceAnswer"
              :class="{
                'validation-highlight': validationTarget === 'referenceAnswer',
              }"
            >
              <label class="field-label">
                参考答案 <span class="required-mark">*</span>
              </label>
              <textarea
                v-model="form.referenceAnswer"
                class="text-area"
                rows="4"
                placeholder="请输入教师参考答案"
              ></textarea>
            </div>

            <div class="field-group full-width">
              <label class="field-label">
                评分要点 <span class="optional-mark">（选填）</span>
              </label>
              <p class="field-hint">可填写批改时需要关注的关键内容。</p>

              <div class="scoring-point-list">
                <div
                  v-for="(point, index) in form.scoringPoints"
                  :key="`scoring-point-${index}`"
                  class="scoring-point-row"
                >
                  <span class="scoring-point-index">{{ index + 1 }}</span>
                  <input
                    v-model="form.scoringPoints[index]"
                    class="text-input"
                    type="text"
                    :placeholder="
                      index === 0
                        ? '例如：说明栈是后进先出'
                        : `请输入评分要点 ${index + 1}`
                    "
                  />
                  <button
                    type="button"
                    class="icon-action danger"
                    :disabled="form.scoringPoints.length <= 1"
                    title="删除评分要点"
                    @click="removeScoringPoint(index)"
                  >
                    <AppIcon name="delete" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                class="text-action add-scoring-point"
                @click="addScoringPoint"
              >
                <AppIcon name="plus" />
                <span>添加评分要点</span>
              </button>
            </div>
          </template>

          <div
            class="field-group"
            data-validation-key="chapter"
            :class="{ 'validation-highlight': validationTarget === 'chapter' }"
          >
            <label class="field-label">
              所属章节 <span class="required-mark">*</span>
            </label>
            <AppSelect
              v-model="form.chapter"
              :options="chapterOptions"
              placeholder="请选择章节"
            />
          </div>

          <div class="field-group">
            <label class="field-label">知识点</label>
            <input
              v-model="form.knowledgePoint"
              class="text-input"
              type="text"
              placeholder="例如：栈的基本操作"
            />
          </div>

          <div class="field-group full-width">
            <label class="field-label">答案解析</label>
            <textarea
              v-model="form.explanation"
              class="text-area"
              rows="4"
              placeholder="可填写解题思路或知识点说明"
            ></textarea>
          </div>
        </div>

        <label v-if="canOfferSaveToBank" class="save-to-bank-row">
          <input v-model="saveToBank" type="checkbox" />
          <span>
            <strong>同时保存到题目库</strong>
            <small>
              {{
                isEditMode
                  ? "即使练习已经发布或结束，也可以把这道题沉淀为可复用题目。"
                  : "方便以后在其他练习中复用，默认不勾选。"
              }}
            </small>
          </span>
        </label>
      </div>

      <footer class="modal-footer">
        <button type="button" class="secondary-button" @click="$emit('close')">
          取消
        </button>
        <button type="button" class="primary-button" @click="submitQuestion">
          <AppIcon :name="isEditMode ? 'save' : 'plus'" />
          <span>{{ isEditMode ? "保存修改" : "加入练习" }}</span>
        </button>
      </footer>
    </section>

    <AppFeedbackDialog
      v-if="showValidationDialog"
      title="请完善题目信息"
      description="继续前还有以下内容需要完成："
      :messages="validationMessages"
      @confirm="closeValidationDialog"
    />
  </div>
</template>

<script>
import AppFeedbackDialog from "../AppFeedbackDialog.vue";
import AppIcon from "../AppIcon.vue";
import AppSelect from "../AppSelect.vue";
import {
  OPTION_KEYS,
  QUESTION_SOURCES,
  QUESTION_TYPES,
  buildQuestionContent,
  createDefaultOptions,
  isChoiceQuestion,
  normalizeScoringPoints,
} from "../../utils/questionModel";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export default {
  name: "ExerciseQuestionEditorModal",

  components: {
    AppFeedbackDialog,
    AppIcon,
    AppSelect,
  },

  props: {
    initialQuestion: {
      type: Object,
      default: null,
    },
    maxAllowedScore: {
      type: Number,
      default: 100,
    },
  },

  emits: ["close", "save"],

  data() {
    return {
      optionKeys: OPTION_KEYS,
      typeOptions: [
        { label: "单选题", value: QUESTION_TYPES.SINGLE },
        { label: "多选题", value: QUESTION_TYPES.MULTIPLE },
        { label: "判断题", value: QUESTION_TYPES.JUDGMENT },
        { label: "简答题", value: QUESTION_TYPES.SHORT_ANSWER },
      ],
      difficultyOptions: [
        { label: "简单", value: "easy" },
        { label: "中等", value: "medium" },
        { label: "困难", value: "hard" },
      ],
      chapterOptions: [
        "第一章 绪论",
        "第二章 线性表",
        "第三章 栈和队列",
        "第四章 串、数组和广义表",
        "第五章 树和二叉树",
        "第六章 图",
      ],
      form: {
        type: QUESTION_TYPES.SINGLE,
        stem: "",
        options: createDefaultOptions(),
        answer: [],
        referenceAnswer: "",
        scoringPoints: [""],
        explanation: "",
        difficulty: "medium",
        score: 10,
        chapter: "",
        knowledgePoint: "",
      },
      saveToBank: false,
      showValidationDialog: false,
      validationMessages: [],
      validationTarget: "",
    };
  },

  computed: {
    isEditMode() {
      return Boolean(this.initialQuestion);
    },

    isChoiceType() {
      return isChoiceQuestion(this.form.type);
    },

    canOfferSaveToBank() {
      return !this.initialQuestion?.sourceQuestionId;
    },

    scoreUpperLimit() {
      const value = Number(this.maxAllowedScore);
      if (!Number.isFinite(value)) return 100;
      return Math.min(100, Math.max(1, value));
    },
  },

  mounted() {
    if (!this.initialQuestion) return;

    this.form = {
      type: this.initialQuestion.type || QUESTION_TYPES.SINGLE,
      stem: this.initialQuestion.stem || "",
      options: clone(this.initialQuestion.options || []),
      answer: clone(this.initialQuestion.answer || []),
      referenceAnswer: this.initialQuestion.referenceAnswer || "",
      scoringPoints: this.initialQuestion.scoringPoints?.length
        ? [...this.initialQuestion.scoringPoints]
        : [""],
      explanation: this.initialQuestion.explanation || "",
      difficulty: this.initialQuestion.difficulty || "medium",
      score:
        Number.isFinite(Number(this.initialQuestion.score)) &&
        Number(this.initialQuestion.score) > 0
          ? Number(this.initialQuestion.score)
          : 10,
      chapter: this.initialQuestion.chapter || "",
      knowledgePoint: this.initialQuestion.knowledgePoint || "",
    };

    if (isChoiceQuestion(this.form.type) && !this.form.options.length) {
      this.form.options = createDefaultOptions();
    }
  },

  methods: {
    changeQuestionType(nextType) {
      if (this.form.type === nextType) return;

      this.form.type = nextType;
      this.form.answer = [];
      this.form.referenceAnswer = "";
      this.form.scoringPoints = [""];

      if (nextType === QUESTION_TYPES.JUDGMENT) {
        this.form.options = [];
      } else if (isChoiceQuestion(nextType)) {
        this.form.options = createDefaultOptions();
      } else {
        this.form.options = [];
      }
    },

    isAnswerSelected(key) {
      return this.form.answer.includes(key);
    },

    toggleAnswer(key) {
      if (this.form.type === QUESTION_TYPES.SINGLE) {
        this.form.answer = [key];
        return;
      }

      if (this.form.answer.includes(key)) {
        this.form.answer = this.form.answer.filter((item) => item !== key);
      } else {
        this.form.answer = [...this.form.answer, key].sort();
      }
    },

    addOption() {
      if (this.form.options.length >= OPTION_KEYS.length) return;
      const key = OPTION_KEYS[this.form.options.length];
      this.form.options.push({ key, text: "" });
    },

    removeOption(index) {
      if (this.form.options.length <= 2) return;

      const removedKey = this.form.options[index].key;
      this.form.options.splice(index, 1);
      this.form.options = this.form.options.map((option, optionIndex) => ({
        ...option,
        key: OPTION_KEYS[optionIndex],
      }));
      this.form.answer = this.form.answer
        .filter((item) => item !== removedKey)
        .map((item) => {
          const oldIndex = OPTION_KEYS.indexOf(item);
          return oldIndex > index ? OPTION_KEYS[oldIndex - 1] : item;
        });
    },

    addScoringPoint() {
      this.form.scoringPoints.push("");
    },

    removeScoringPoint(index) {
      if (this.form.scoringPoints.length <= 1) {
        this.form.scoringPoints = [""];
        return;
      }

      this.form.scoringPoints.splice(index, 1);
    },

    validateForm() {
      const messages = [];
      let target = "";
      const add = (message, key) => {
        messages.push(message);
        if (!target) target = key;
      };

      const score = Number(this.form.score);
      if (
        !Number.isFinite(score) ||
        score < 1 ||
        score > this.scoreUpperLimit
      ) {
        add(
          this.scoreUpperLimit < 100
            ? `本题最多可设置 ${this.scoreUpperLimit} 分，整份练习总分不能超过 100 分。`
            : "请设置 1–100 分之间的本题分值。",
          "score"
        );
      }
      if (!this.form.stem.trim()) add("请输入题目内容。", "stem");
      if (!this.form.chapter) add("请选择所属章节。", "chapter");

      if (isChoiceQuestion(this.form.type)) {
        if (this.form.options.some((option) => !option.text.trim())) {
          add("请填写完整的题目选项。", "options");
        }
        if (!this.form.answer.length) add("请选择正确答案。", "options");
        if (
          this.form.type === QUESTION_TYPES.MULTIPLE &&
          this.form.answer.length < 2
        ) {
          add("多选题请至少选择两个正确答案。", "options");
        }
      } else if (
        this.form.type === QUESTION_TYPES.JUDGMENT &&
        !this.form.answer.length
      ) {
        add("请选择判断题的正确答案。", "answer");
      } else if (
        this.form.type === QUESTION_TYPES.SHORT_ANSWER &&
        !this.form.referenceAnswer.trim()
      ) {
        add("请填写简答题的参考答案。", "referenceAnswer");
      }

      return { messages, target };
    },

    submitQuestion() {
      const validation = this.validateForm();
      if (validation.messages.length) {
        this.validationMessages = validation.messages;
        this.validationTarget = validation.target;
        this.showValidationDialog = true;
        return;
      }

      const question = {
        ...buildQuestionContent({
          type: this.form.type,
          stem: this.form.stem,
          options: this.form.options,
          answer: this.form.answer,
          referenceAnswer: this.form.referenceAnswer,
          scoringPoints: normalizeScoringPoints(this.form.scoringPoints),
          explanation: this.form.explanation,
          difficulty: this.form.difficulty,
          chapter: this.form.chapter,
          knowledgePoint: this.form.knowledgePoint,
          source: this.initialQuestion?.source || QUESTION_SOURCES.MANUAL,
          aiMeta: this.initialQuestion?.aiMeta ?? null,
        }),
        score: Number(this.form.score),
      };

      this.$emit("save", {
        question,
        saveToBank: this.canOfferSaveToBank && this.saveToBank,
      });
    },

    closeValidationDialog() {
      this.showValidationDialog = false;
      this.$nextTick(() => {
        const target = this.$el.querySelector(
          `[data-validation-key="${this.validationTarget}"]`
        );
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
          target?.querySelector("textarea, input, button")?.focus?.();
        }, 300);
      });
    },
  },
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(2px);
}

.question-modal {
  width: min(900px, 100%);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
}

.modal-header,
.modal-footer {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 22px;
}

.modal-header {
  border-bottom: 1px solid #eef0f2;
}

.modal-header h2 {
  margin: 0 0 5px;
  color: #111827;
  font-size: 21px;
}

.modal-header p {
  margin: 0;
  color: #7b8492;
  font-size: 14px;
  line-height: 1.6;
}

.modal-body {
  overflow-y: auto;
  padding: 22px;
}

.modal-footer {
  justify-content: flex-end;
  border-top: 1px solid #eef0f2;
}

.icon-close,
.icon-action {
  border: none;
  background: transparent;
  color: #5f6875;
  cursor: pointer;
}

.icon-close {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  font-size: 20px;
}

.icon-close:hover,
.icon-action:hover {
  background: #f3f4f6;
  color: #111827;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
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
  font-size: 14.5px;
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
  font: inherit;
  font-size: 15px;
  outline: none;
  transition: 0.16s ease;
}

.text-input {
  height: 46px;
  padding: 0 14px;
}

.text-area {
  resize: vertical;
  min-height: 104px;
  padding: 12px 14px;
  line-height: 1.65;
}

.score-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
}

.score-input {
  width: 150px;
}

.score-input-wrap > span {
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
}

.stem-input {
  min-height: 92px;
}

.text-input:focus,
.text-area:focus {
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05);
}

.field-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.text-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: #374151;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}

.text-action:disabled {
  color: #b6bdc7;
  cursor: not-allowed;
}

.field-hint {
  margin: 4px 0 0;
  color: #8a93a0;
  font-size: 13px;
  line-height: 1.55;
}

.optional-mark {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
}

.scoring-point-list {
  display: grid;
  gap: 10px;
  margin-top: 2px;
}

.scoring-point-row {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 38px;
  gap: 10px;
  align-items: center;
}

.scoring-point-index {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.add-scoring-point {
  width: fit-content;
  margin-top: 2px;
}

.option-list {
  display: grid;
  gap: 10px;
}

.option-row {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr) auto 38px;
  gap: 10px;
  align-items: center;
  padding: 8px;
  border: 1px solid #eceef1;
  border-radius: 13px;
  background: #fafafa;
}

.option-row.selected {
  border-color: #a7e7c8;
  background: #f0fbf5;
}

.answer-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 10px;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  font-weight: 800;
}

.answer-control input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #16845b;
}

.correct-tag {
  padding: 5px 8px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.icon-action {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  font-size: 18px;
}

.icon-action.danger:hover {
  background: #fff1f2;
  color: #dc2626;
}

.icon-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.judgment-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.judgment-button {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid #d7dce2;
  border-radius: 12px;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
}

.judgment-button.selected {
  border-color: #a7e7c8;
  background: #f0fbf5;
  color: #15803d;
}

.radio-visual {
  width: 18px;
  height: 18px;
  box-sizing: border-box;
  border: 2px solid #c8ced6;
  border-radius: 50%;
  background: #ffffff;
}

.radio-visual.checked {
  border: 5px solid #16a36b;
}

.save-to-bank-row {
  margin-top: 20px;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fafafa;
  cursor: pointer;
}

.save-to-bank-row input {
  margin-top: 3px;
  width: 17px;
  height: 17px;
  accent-color: #111827;
}

.save-to-bank-row span {
  display: grid;
  gap: 3px;
}

.save-to-bank-row strong {
  color: #303846;
  font-size: 14px;
}

.save-to-bank-row small {
  color: #858e9b;
  font-size: 13px;
  line-height: 1.5;
}

.validation-highlight {
  padding: 10px;
  margin: -10px;
  border: 1px solid #fecaca;
  background: #fffafa;
}

.secondary-button,
.primary-button {
  min-height: 42px;
  padding: 0 16px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #111827;
  background: #111827;
  color: #ffffff;
}

.primary-button :deep(.app-icon) {
  font-size: 17px;
}

@media (max-width: 720px) {
  .modal-mask {
    padding: 12px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .option-row {
    grid-template-columns: 70px minmax(0, 1fr) 38px;
  }

  .correct-tag {
    display: none;
  }
}
</style>
