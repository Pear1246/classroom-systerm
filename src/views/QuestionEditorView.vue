<template>
  <div class="editor-page">
    <header class="editor-header">
      <div class="breadcrumb-block">
        <button type="button" class="back-button" @click="goBack">
          <AppIcon name="arrow-left" />
          <span>返回题目库</span>
        </button>

        <div>
          <div class="breadcrumb">
            <span>{{ courseName }}</span>
            <span>/</span>
            <span>课程题库</span>
            <span>/</span>
            <span>{{ isEditMode ? "编辑题目" : "新建题目" }}</span>
          </div>

          <strong>{{ isEditMode ? "编辑题目" : "新建题目" }}</strong>
        </div>
      </div>

      <button type="button" class="save-button" @click="saveQuestion">
        <AppIcon name="save" />
        <span>保存题目</span>
      </button>
    </header>

    <main class="editor-content">
      <section class="form-card">
        <div class="card-heading">
          <div>
            <h2>题目内容</h2>
            <p>选择题型并填写题干与答案。</p>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label"
            >题型 <span class="required-mark">*</span></label
          >

          <div class="type-grid">
            <button
              v-for="item in typeOptions"
              :key="item.value"
              type="button"
              class="type-card"
              :class="{ active: form.type === item.value }"
              @click="changeType(item.value)"
            >
              <span class="type-card-icon">
                <AppIcon :name="item.icon" />
              </span>

              <span>
                <strong>{{ item.label }}</strong>
                <small>{{ item.description }}</small>
              </span>
            </button>
          </div>
        </div>

        <div
          class="field-group"
          data-validation-key="stem"
          :class="{ 'validation-highlight': validationTarget === 'stem' }"
        >
          <label class="field-label" for="stem">
            题干 <span class="required-mark">*</span>
          </label>
          <textarea
            id="stem"
            v-model="form.stem"
            class="stem-input"
            rows="4"
            placeholder="请输入题目内容"
          ></textarea>
        </div>

        <div
          v-if="isChoiceType"
          class="field-group"
          data-validation-key="options"
          :class="{
            'validation-highlight':
              validationTarget === 'options' || validationTarget === 'answer',
          }"
        >
          <div class="field-label-row">
            <div>
              <label class="field-label">
                选项与正确答案 <span class="required-mark">*</span>
              </label>
              <span class="answer-guidance">
                {{
                  form.type === "single"
                    ? "请选择 1 个正确答案，勾选后整行会高亮。"
                    : "请选择一个或多个正确答案，多选题至少选择 2 个。"
                }}
              </span>
            </div>
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
                  name="correct-answer"
                  :checked="isAnswerSelected(option.key)"
                  @change="toggleAnswer(option.key)"
                />
                <span>{{ option.key }}</span>
              </label>

              <input
                v-model="option.text"
                class="option-text-input"
                type="text"
                :placeholder="`请输入选项 ${option.key}`"
              />

              <span v-if="isAnswerSelected(option.key)" class="correct-tag">
                正确答案
              </span>

              <button
                type="button"
                class="remove-option"
                :disabled="form.options.length <= 2"
                title="删除选项"
                @click="removeOption(index)"
              >
                <AppIcon name="delete" />
              </button>
            </div>
          </div>

          <button
            type="button"
            class="add-option"
            :disabled="form.options.length >= optionKeys.length"
            @click="addOption"
          >
            <AppIcon name="plus" />
            <span>添加选项</span>
          </button>
        </div>

        <div
          v-else-if="form.type === 'judgment'"
          class="field-group"
          data-validation-key="answer"
          :class="{ 'validation-highlight': validationTarget === 'answer' }"
        >
          <label class="field-label">
            正确答案 <span class="required-mark">*</span>
          </label>
          <p class="answer-guidance">请选择本题的正确判断。</p>

          <div class="judgment-grid">
            <button
              type="button"
              class="judgment-card"
              :class="{ active: form.answer[0] === 'true' }"
              @click="form.answer = ['true']"
            >
              <span
                class="radio-visual"
                :class="{ checked: form.answer[0] === 'true' }"
              ></span>
              <strong>正确</strong>
            </button>

            <button
              type="button"
              class="judgment-card"
              :class="{ active: form.answer[0] === 'false' }"
              @click="form.answer = ['false']"
            >
              <span
                class="radio-visual"
                :class="{ checked: form.answer[0] === 'false' }"
              ></span>
              <strong>错误</strong>
            </button>
          </div>
        </div>

        <div v-else class="subjective-fields">
          <div
            class="field-group"
            data-validation-key="referenceAnswer"
            :class="{
              'validation-highlight': validationTarget === 'referenceAnswer',
            }"
          >
            <label class="field-label" for="referenceAnswer">
              参考答案 <span class="required-mark">*</span>
            </label>
            <textarea
              id="referenceAnswer"
              v-model="form.referenceAnswer"
              class="stem-input"
              rows="5"
              placeholder="请输入教师参考答案"
            ></textarea>
          </div>

          <div class="field-group">
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
                  class="remove-scoring-point"
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
              class="add-scoring-point"
              @click="addScoringPoint"
            >
              <AppIcon name="plus" />
              <span>添加评分要点</span>
            </button>
          </div>
        </div>
      </section>

      <aside class="side-column">
        <section class="form-card compact-card">
          <div class="card-heading">
            <div>
              <h2>题目设置</h2>
              <p>补充章节、难度和知识点。</p>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">难度</label>

            <div class="difficulty-grid">
              <button
                v-for="item in difficultyOptions"
                :key="item.value"
                type="button"
                class="difficulty-button"
                :class="[
                  `difficulty-${item.value}`,
                  { active: form.difficulty === item.value },
                ]"
                @click="form.difficulty = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

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
            <label class="field-label" for="knowledgePoint">知识点</label>
            <input
              id="knowledgePoint"
              v-model="form.knowledgePoint"
              class="text-input"
              type="text"
              placeholder="例如：栈的基本操作"
            />
          </div>
        </section>

        <section class="form-card compact-card">
          <div class="card-heading">
            <div>
              <h2>答案解析</h2>
              <p>学生提交答案后用于理解知识点。</p>
            </div>
          </div>

          <textarea
            v-model="form.explanation"
            class="explanation-input"
            rows="8"
            placeholder="请输入答案解析"
          ></textarea>
        </section>
      </aside>
    </main>

    <AppFeedbackDialog
      v-if="showValidationDialog"
      title="请完善题目信息"
      description="保存前还有以下内容需要完成："
      :messages="validationMessages"
      @confirm="closeValidationDialog"
    />

    <div v-if="showLeaveDialog" class="dialog-mask">
      <div class="confirm-dialog">
        <div class="dialog-title-row">
          <div>
            <h3>还有未保存的修改</h3>
            <p>离开后，本次修改不会保留。</p>
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
          <button
            type="button"
            class="save-dialog-button"
            @click="saveAndLeave"
          >
            <AppIcon name="save" />
            <span>保存并退出</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppFeedbackDialog from "../components/AppFeedbackDialog.vue";
import AppIcon from "../components/AppIcon.vue";
import AppSelect from "../components/AppSelect.vue";
import { useCourseStore } from "../store/courseStore";
import { useQuestionStore } from "../store/questionStore";
import {
  OPTION_KEYS,
  QUESTION_SOURCES,
  QUESTION_TYPES,
  buildQuestionContent,
  createDefaultOptions,
  isChoiceQuestion,
  normalizeScoringPoints,
} from "../utils/questionModel";

export default {
  name: "QuestionEditorView",

  components: {
    AppFeedbackDialog,
    AppIcon,
    AppSelect,
  },

  data() {
    return {
      optionKeys: OPTION_KEYS,
      typeOptions: [
        {
          value: QUESTION_TYPES.SINGLE,
          label: "单选题",
          description: "仅有一个正确答案",
          icon: "single-choice",
        },
        {
          value: QUESTION_TYPES.MULTIPLE,
          label: "多选题",
          description: "可设置多个正确答案",
          icon: "multiple-choice",
        },
        {
          value: QUESTION_TYPES.JUDGMENT,
          label: "判断题",
          description: "选择正确或错误",
          icon: "judgment",
        },
        {
          value: QUESTION_TYPES.SHORT_ANSWER,
          label: "简答题",
          description: "主观作答，由教师评分",
          icon: "short-answer",
        },
      ],
      difficultyOptions: [
        { value: "easy", label: "简单" },
        { value: "medium", label: "中等" },
        { value: "hard", label: "困难" },
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
        chapter: "",
        knowledgePoint: "",
      },
      originalQuestion: null,
      initialSnapshot: "",
      showValidationDialog: false,
      validationMessages: [],
      validationTarget: "",
      showLeaveDialog: false,
      pendingNavigation: null,
    };
  },

  computed: {
    questionStore() {
      return useQuestionStore();
    },

    courseStore() {
      return useCourseStore();
    },

    teachingClassId() {
      return String(this.$route.params.teachingClassId || "");
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

    questionId() {
      return String(this.$route.params.questionId || "");
    },

    isEditMode() {
      return this.$route.meta.questionMode === "edit";
    },

    courseName() {
      return this.currentTeachingClass?.courseName || "当前课程";
    },

    isChoiceType() {
      return isChoiceQuestion(this.form.type);
    },

    currentSnapshot() {
      return JSON.stringify(this.form);
    },

    isDirty() {
      return Boolean(
        this.initialSnapshot && this.currentSnapshot !== this.initialSnapshot
      );
    },
  },

  mounted() {
    this.questionStore.ensureCourse(this.questionBankScopeId);

    if (this.isEditMode) {
      const question = this.questionStore.getQuestion(
        this.questionBankScopeId,
        this.questionId
      );

      if (!question) {
        this.$router.replace({
          path: `/course/${this.teachingClassId}/questions`,
          query: { section: "library" },
        });
        return;
      }

      this.originalQuestion = question;
      this.form = {
        type: question.type || QUESTION_TYPES.SINGLE,
        stem: question.stem || "",
        options: JSON.parse(JSON.stringify(question.options || [])),
        answer: [...(question.answer || [])],
        referenceAnswer: question.referenceAnswer || "",
        scoringPoints: question.scoringPoints?.length
          ? [...question.scoringPoints]
          : [""],
        explanation: question.explanation || "",
        difficulty: question.difficulty || "medium",
        chapter: question.chapter || "",
        knowledgePoint: question.knowledgePoint || "",
      };

      if (isChoiceQuestion(this.form.type) && !this.form.options.length) {
        this.form.options = createDefaultOptions();
      }
    }

    this.$nextTick(() => {
      this.initialSnapshot = this.currentSnapshot;
    });
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
    changeType(type) {
      if (this.form.type === type) {
        return;
      }

      this.form.type = type;
      this.form.answer = [];
      this.form.referenceAnswer = "";
      this.form.scoringPoints = [""];

      if (type === QUESTION_TYPES.JUDGMENT) {
        this.form.options = [];
      } else if (isChoiceQuestion(type)) {
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
      if (this.form.options.length >= OPTION_KEYS.length) {
        return;
      }

      const key = OPTION_KEYS[this.form.options.length];
      this.form.options.push({ key, text: "" });
    },

    removeOption(index) {
      if (this.form.options.length <= 2) {
        return;
      }

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

      if (!this.form.stem.trim()) {
        add("请输入题目内容。", "stem");
      }

      if (!this.form.chapter) {
        add("请选择所属章节。", "chapter");
      }

      if (isChoiceQuestion(this.form.type)) {
        if (this.form.options.some((option) => !option.text.trim())) {
          add("请填写完整的题目选项。", "options");
        }

        if (!this.form.answer.length) {
          add("请选择正确答案。", "options");
        }

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

    buildPayload() {
      const content = buildQuestionContent({
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
        source: this.originalQuestion?.source || QUESTION_SOURCES.MANUAL,
        aiMeta: this.originalQuestion?.aiMeta ?? null,
      });

      return {
        id: this.isEditMode ? String(this.questionId) : undefined,
        ...content,
      };
    },

    saveQuestion({ leaveAfterSave = false } = {}) {
      const validation = this.validateForm();

      if (validation.messages.length) {
        this.openValidationDialog(validation);
        return false;
      }

      const saved = this.questionStore.saveQuestion(
        this.questionBankScopeId,
        this.buildPayload()
      );

      if (!saved) {
        this.openValidationDialog({
          messages: ["题目保存失败，请稍后重试。"],
          target: "",
        });
        return false;
      }

      this.initialSnapshot = this.currentSnapshot;

      if (leaveAfterSave && this.pendingNavigation) {
        const next = this.pendingNavigation;
        this.pendingNavigation = null;
        this.showLeaveDialog = false;
        next();
        return true;
      }

      this.$router.push({
        path: `/course/${this.teachingClassId}/questions`,
        query: { section: "library", saved: "1" },
      });

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
        const focusable = target?.querySelector(
          "textarea, input, button, [tabindex]"
        );
        focusable?.focus?.();
      }, 350);
    },

    goBack() {
      this.$router.push({
        path: `/course/${this.teachingClassId}/questions`,
        query: { section: "library" },
      });
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
      this.saveQuestion({ leaveAfterSave: true });
    },
  },
};
</script>

<style scoped>
.editor-page {
  min-height: calc(100vh - 48px);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 18px;
}

.breadcrumb-block {
  display: flex;
  align-items: center;
  gap: 13px;
}

.back-button,
.save-button,
.type-card,
.remove-option,
.add-option,
.judgment-card,
.difficulty-button,
.dialog-close,
.secondary-button,
.save-dialog-button {
  border: none;
  cursor: pointer;
  font: inherit;
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 15px;
  border: 1px solid #dfe3e8;
  border-radius: 999px;
  color: #374151;
  background: #ffffff;
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

.breadcrumb {
  display: flex;
  gap: 7px;
  margin-bottom: 5px;
  color: #9ca3af;
  font-size: 13px;
}

.breadcrumb-block strong {
  color: #111827;
  font-size: 16px;
}

.save-button,
.save-dialog-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 17px;
  border-radius: 11px;
  color: #ffffff;
  background: #111827;
  font-size: 14px;
  font-weight: 700;
}

.editor-content {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.75fr);
  gap: 18px;
  align-items: start;
  margin-top: 18px;
}

.side-column {
  display: grid;
  gap: 18px;
}

.form-card {
  padding: 26px;
  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 20px;
}

.compact-card {
  padding: 22px;
}

.card-heading h2,
.confirm-dialog h3 {
  margin: 0;
  color: #111827;
}

.card-heading h2 {
  font-size: 20px;
}

.card-heading p,
.confirm-dialog p {
  margin: 7px 0 0;
  color: #9ca3af;
  font-size: 13.5px;
  line-height: 1.6;
}

.field-group {
  margin-top: 24px;
  padding: 1px;
  border-radius: 13px;
  transition: 0.2s ease;
}

.field-label {
  display: block;
  margin-bottom: 9px;
  color: #374151;
  font-size: 14.5px;
  font-weight: 700;
}

.required-mark {
  color: #dc2626;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.answer-guidance,
.field-hint {
  display: block;
  margin: 5px 0 0;
  color: #858e9b;
  font-size: 13px;
  line-height: 1.55;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.type-card {
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 80px;
  padding: 13px;
  text-align: left;
  color: #374151;
  background: #fafafa;
  border: 1px solid #ececec;
  border-radius: 14px;
}

.type-card:hover,
.type-card.active {
  border-color: #111827;
  background: #ffffff;
}

.type-card-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 11px;
  background: #eeeeee;
  color: #4b5563;
  font-size: 19px;
}

.type-card.active .type-card-icon {
  color: #ffffff;
  background: #111827;
}

.type-card strong,
.type-card small {
  display: block;
}

.type-card strong {
  color: #111827;
  font-size: 14.5px;
}

.type-card small {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 12.5px;
  line-height: 1.45;
}

.stem-input,
.explanation-input,
.text-input,
.option-text-input {
  box-sizing: border-box;
  border: 1px solid #e5e7eb;
  border-radius: 11px;
  background: #ffffff;
  font: inherit;
  color: #111827;
  outline: none;
}

.stem-input,
.explanation-input {
  width: 100%;
  padding: 13px 14px;
  resize: vertical;
  line-height: 1.7;
  font-size: 14.5px;
}

.text-input {
  width: 100%;
  height: 44px;
  padding: 0 13px;
  font-size: 14.5px;
}

.stem-input:focus,
.explanation-input:focus,
.text-input:focus,
.option-text-input:focus {
  border-color: #9ca3af;
}

.option-list {
  display: grid;
  gap: 10px;
  margin-top: 11px;
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
  transition: 0.16s ease;
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
  font-size: 14px;
  font-weight: 800;
}

.answer-control input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #16845b;
  cursor: pointer;
}

.option-text-input {
  min-width: 0;
  height: 42px;
  padding: 0 12px;
  font-size: 14.5px;
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

.remove-option {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: #9ca3af;
  background: transparent;
  font-size: 18px;
}

.remove-option:hover:not(:disabled) {
  color: #b91c1c;
  background: #fef2f2;
}

.remove-option:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.add-option {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 11px;
  padding: 9px 11px;
  border-radius: 9px;
  color: #374151;
  background: #f3f4f6;
  font-weight: 700;
  font-size: 13.5px;
}

.add-option:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.judgment-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.judgment-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 64px;
  border: 1px solid #e5e7eb;
  border-radius: 13px;
  color: #4b5563;
  background: #fafafa;
}

.judgment-card.active {
  color: #15803d;
  border-color: #a7e7c8;
  background: #f0fbf5;
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

.subjective-fields {
  display: grid;
  gap: 2px;
}

.optional-mark {
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
}

.scoring-point-list {
  display: grid;
  gap: 10px;
  margin-top: 11px;
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

.remove-scoring-point,
.add-scoring-point {
  border: none;
  cursor: pointer;
  font: inherit;
}

.remove-scoring-point {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: #9ca3af;
  background: transparent;
  font-size: 18px;
}

.remove-scoring-point:hover:not(:disabled) {
  color: #b91c1c;
  background: #fef2f2;
}

.remove-scoring-point:disabled {
  opacity: 0.28;
  cursor: not-allowed;
}

.add-scoring-point {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  margin-top: 11px;
  padding: 9px 11px;
  border-radius: 9px;
  color: #374151;
  background: #f3f4f6;
  font-size: 13.5px;
  font-weight: 700;
}

.add-scoring-point:hover {
  background: #e9ebef;
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.difficulty-button {
  min-height: 41px;
  border-radius: 10px;
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 700;
}

.difficulty-button.active.difficulty-easy {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.difficulty-button.active.difficulty-medium {
  color: #9a6700;
  background: #fffbeb;
  border-color: #fde68a;
}

.difficulty-button.active.difficulty-hard {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.validation-highlight {
  padding: 10px;
  margin-left: -10px;
  margin-right: -10px;
  border: 1px solid #fecaca;
  background: #fffafa;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(17, 24, 39, 0.28);
}

.confirm-dialog {
  width: min(500px, 100%);
  padding: 24px;
  box-sizing: border-box;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.16);
}

.dialog-title-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.confirm-dialog h3 {
  font-size: 18px;
}

.dialog-close {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 17px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 22px;
}

.secondary-button,
.save-dialog-button {
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 700;
}

.secondary-button {
  color: #374151;
  background: #f3f4f6;
}

.save-button :deep(.app-icon),
.save-dialog-button :deep(.app-icon) {
  font-size: 17px;
}

.compact-card :deep(.select-trigger) {
  font-size: 14.5px;
}

@media (max-width: 1180px) {
  .type-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1050px) {
  .editor-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .editor-header {
    align-items: flex-start;
  }

  .breadcrumb {
    display: none;
  }

  .type-grid {
    grid-template-columns: 1fr;
  }

  .option-row {
    grid-template-columns: 70px minmax(0, 1fr) 38px;
  }

  .correct-tag {
    display: none;
  }
}
</style>
