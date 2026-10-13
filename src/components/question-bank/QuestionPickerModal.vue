<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <section class="picker-modal" role="dialog" aria-modal="true">
      <header class="modal-header">
        <div>
          <h2>从题目库选择</h2>
          <p>选择已经沉淀的题目加入当前练习，不会修改题目库原题。</p>
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
        <div class="picker-layout">
          <aside class="chapter-panel" aria-label="题目章节">
            <div class="chapter-panel-heading">
              <div>
                <strong>章节</strong>
                <span>先按章节缩小范围</span>
              </div>
            </div>

            <div class="chapter-list">
              <button
                v-for="item in chapterItems"
                :key="item.key"
                type="button"
                class="chapter-button"
                :class="{ active: selectedChapter === item.key }"
                @click="selectChapter(item.key)"
              >
                <span class="chapter-name">{{ item.label }}</span>
                <span class="chapter-count">{{ item.count }}</span>
              </button>
            </div>
          </aside>

          <div class="picker-main">
            <div class="current-chapter-row">
              <span>当前范围</span>
              <strong>{{ selectedChapterLabel }}</strong>
            </div>

            <div class="filters-row">
              <label class="search-box">
                <AppIcon name="search" />
                <input
                  v-model.trim="filters.keyword"
                  type="text"
                  placeholder="搜索题干、章节或知识点"
                />
              </label>

              <AppSelect v-model="filters.type" :options="typeOptions" />
              <AppSelect
                v-model="filters.difficulty"
                :options="difficultyOptions"
              />
            </div>

            <div v-if="pagedQuestions.length" class="question-list">
              <label
                v-for="question in pagedQuestions"
                :key="question.id"
                class="question-item"
                :class="{
                  selected: selectedIds.includes(String(question.id)),
                  disabled: isAlreadyAdded(question),
                }"
              >
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(String(question.id))"
                  :disabled="isAlreadyAdded(question)"
                  @change="toggleQuestion(question)"
                />

                <div class="question-main">
                  <div class="question-title-row">
                    <span class="type-icon">
                      <AppIcon :name="typeIcon(question.type)" />
                    </span>
                    <strong>{{ question.stem }}</strong>
                  </div>

                  <div class="meta-row">
                    <span>{{ typeLabel(question.type) }}</span>
                    <span>{{ question.chapter || "未分类" }}</span>
                    <span
                      class="difficulty-tag"
                      :class="`difficulty-${question.difficulty}`"
                    >
                      {{ difficultyLabel(question.difficulty) }}
                    </span>
                    <span v-if="isAlreadyAdded(question)" class="added-tag">
                      已加入练习
                    </span>
                  </div>
                </div>
              </label>
            </div>

            <div v-else class="empty-state">
              <AppIcon name="question-bank" />
              <strong>没有找到符合条件的题目</strong>
              <p>可以调整章节或筛选条件，或返回练习中直接新建题目。</p>
            </div>

            <div v-if="filteredQuestions.length" class="pagination-row">
              <span>
                第 {{ currentPage }} / {{ totalPages }} 页，共
                {{ filteredQuestions.length }} 道题
              </span>

              <div class="pagination-controls">
                <button
                  type="button"
                  class="page-button"
                  :disabled="currentPage === 1"
                  @click="goToPage(currentPage - 1)"
                >
                  上一页
                </button>

                <button
                  v-for="page in pageNumbers"
                  :key="page"
                  type="button"
                  class="page-button number-button"
                  :class="{ active: currentPage === page }"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>

                <button
                  type="button"
                  class="page-button"
                  :disabled="currentPage === totalPages"
                  @click="goToPage(currentPage + 1)"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <span class="selected-summary">已选择 {{ selectedIds.length }} 道</span>
        <div class="footer-actions">
          <button
            type="button"
            class="secondary-button"
            @click="$emit('close')"
          >
            取消
          </button>
          <button
            type="button"
            class="primary-button"
            :disabled="!selectedIds.length"
            @click="confirmSelection"
          >
            加入练习
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script>
import AppIcon from "../AppIcon.vue";
import AppSelect from "../AppSelect.vue";
import {
  ALL_CHAPTERS,
  buildChapterItems,
  questionMatchesChapter,
} from "../../utils/questionChapters";

const PAGE_SIZE = 10;

export default {
  name: "QuestionPickerModal",

  components: {
    AppIcon,
    AppSelect,
  },

  props: {
    questions: {
      type: Array,
      default: () => [],
    },
    addedQuestionIds: {
      type: Array,
      default: () => [],
    },
  },

  emits: ["close", "confirm"],

  data() {
    return {
      currentPage: 1,
      selectedIds: [],
      filters: {
        keyword: "",
        type: "all",
        difficulty: "all",
      },
      selectedChapter: ALL_CHAPTERS,
      typeOptions: [
        { label: "全部题型", value: "all" },
        { label: "单选题", value: "single" },
        { label: "多选题", value: "multiple" },
        { label: "判断题", value: "judgment" },
        { label: "简答题", value: "short-answer" },
      ],
      difficultyOptions: [
        { label: "全部难度", value: "all" },
        { label: "简单", value: "easy" },
        { label: "中等", value: "medium" },
        { label: "困难", value: "hard" },
      ],
    };
  },

  computed: {
    chapterItems() {
      return buildChapterItems(this.questions);
    },

    selectedChapterLabel() {
      return (
        this.chapterItems.find((item) => item.key === this.selectedChapter)
          ?.label || "全部题目"
      );
    },

    filteredQuestions() {
      const keyword = this.filters.keyword.trim().toLowerCase();

      return this.questions.filter((question) => {
        const keywordMatched =
          !keyword ||
          [question.stem, question.chapter, question.knowledgePoint]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword));

        const typeMatched =
          this.filters.type === "all" || question.type === this.filters.type;
        const difficultyMatched =
          this.filters.difficulty === "all" ||
          question.difficulty === this.filters.difficulty;
        const chapterMatched = questionMatchesChapter(
          question,
          this.selectedChapter
        );

        return (
          keywordMatched && typeMatched && difficultyMatched && chapterMatched
        );
      });
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredQuestions.length / PAGE_SIZE));
    },

    pagedQuestions() {
      const start = (this.currentPage - 1) * PAGE_SIZE;
      return this.filteredQuestions.slice(start, start + PAGE_SIZE);
    },

    pageNumbers() {
      return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    },
  },

  watch: {
    "filters.keyword"() {
      this.currentPage = 1;
    },
    "filters.type"() {
      this.currentPage = 1;
    },
    "filters.difficulty"() {
      this.currentPage = 1;
    },
    selectedChapter() {
      this.currentPage = 1;
    },
  },

  methods: {
    selectChapter(chapterKey) {
      this.selectedChapter = String(chapterKey || ALL_CHAPTERS);
    },

    isAlreadyAdded(question) {
      return this.addedQuestionIds.some(
        (id) => String(id) === String(question.id)
      );
    },

    toggleQuestion(question) {
      if (this.isAlreadyAdded(question)) {
        return;
      }

      const id = String(question.id);

      if (this.selectedIds.includes(id)) {
        this.selectedIds = this.selectedIds.filter((item) => item !== id);
      } else {
        this.selectedIds = [...this.selectedIds, id];
      }
    },

    confirmSelection() {
      const selected = this.questions.filter((question) =>
        this.selectedIds.includes(String(question.id))
      );

      this.$emit("confirm", selected);
    },

    goToPage(page) {
      if (page < 1 || page > this.totalPages) {
        return;
      }

      this.currentPage = page;
    },

    typeLabel(type) {
      return (
        {
          single: "单选题",
          multiple: "多选题",
          judgment: "判断题",
          "short-answer": "简答题",
        }[type] || "题目"
      );
    },

    typeIcon(type) {
      return (
        {
          single: "single-choice",
          multiple: "multiple-choice",
          judgment: "judgment",
          "short-answer": "short-answer",
        }[type] || "question-bank"
      );
    },

    difficultyLabel(difficulty) {
      return (
        {
          easy: "简单",
          medium: "中等",
          hard: "困难",
        }[difficulty] || "中等"
      );
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

.picker-modal {
  width: min(1080px, 100%);
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
}

.icon-close {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #5f6875;
  cursor: pointer;
  font-size: 20px;
}

.icon-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  min-height: 0;
  overflow-y: auto;
  padding: 20px 22px;
}

.picker-layout {
  display: grid;
  grid-template-columns: 205px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.chapter-panel {
  padding: 10px;
  border: 1px solid #eceff2;
  border-radius: 15px;
  background: #fafafa;
}

.chapter-panel-heading {
  padding: 7px 8px 10px;
}

.chapter-panel-heading strong,
.chapter-panel-heading span {
  display: block;
}

.chapter-panel-heading strong {
  color: #111827;
  font-size: 14.5px;
}

.chapter-panel-heading span {
  margin-top: 4px;
  color: #9aa1ab;
  font-size: 12px;
}

.chapter-list {
  display: grid;
  gap: 5px;
}

.chapter-button {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 9px;
  padding: 7px 9px 7px 11px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #667085;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: 0.16s ease;
}

.chapter-button:hover {
  color: #111827;
  background: #ffffff;
}

.chapter-button.active {
  border-color: #e1e5ea;
  background: #ffffff;
  color: #111827;
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.04);
}

.chapter-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 650;
}

.chapter-count {
  min-width: 24px;
  height: 23px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border-radius: 999px;
  background: #f0f1f3;
  color: #8a93a0;
  font-size: 11px;
  font-weight: 700;
}

.chapter-button.active .chapter-count {
  background: #111827;
  color: #ffffff;
}

.picker-main {
  min-width: 0;
}

.current-chapter-row {
  min-height: 34px;
  display: flex;
  align-items: baseline;
  gap: 9px;
  margin-bottom: 8px;
}

.current-chapter-row span {
  color: #9aa1ab;
  font-size: 12px;
}

.current-chapter-row strong {
  color: #111827;
  font-size: 15px;
}

.filters-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.7fr) repeat(2, minmax(150px, 0.72fr));
  gap: 10px;
  margin-bottom: 16px;
}

.search-box {
  height: 46px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 9px;
  box-sizing: border-box;
  border: 1px solid #d7dce2;
  border-radius: 12px;
  background: #ffffff;
  color: #8a93a0;
}

.search-box :deep(.app-icon) {
  font-size: 18px;
}

.search-box input {
  min-width: 0;
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #111827;
  font: inherit;
  font-size: 14px;
}

.question-list {
  display: grid;
  gap: 9px;
}

.question-item {
  padding: 14px 15px;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
  border: 1px solid #e6e8eb;
  border-radius: 14px;
  background: #ffffff;
  cursor: pointer;
  transition: 0.16s ease;
}

.question-item:hover {
  border-color: #c9ced6;
  background: #fcfcfc;
}

.question-item.selected {
  border-color: #aeb5bf;
  background: #f8f9fa;
}

.question-item.disabled {
  opacity: 0.62;
  cursor: default;
}

.question-item input {
  width: 17px;
  height: 17px;
  margin-top: 3px;
  accent-color: #111827;
}

.question-main {
  min-width: 0;
  display: grid;
  gap: 9px;
}

.question-title-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.question-title-row strong {
  color: #202733;
  font-size: 15px;
  line-height: 1.6;
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

.meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: #7b8492;
  font-size: 13px;
}

.meta-row > span:not(.difficulty-tag):not(.added-tag) {
  padding-right: 7px;
  border-right: 1px solid #e5e7eb;
}

.difficulty-tag,
.added-tag {
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

.added-tag {
  background: #f3f4f6;
  color: #667085;
}

.empty-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8a93a0;
  text-align: center;
}

.empty-state :deep(.app-icon) {
  font-size: 28px;
}

.empty-state strong {
  color: #4b5563;
  font-size: 15px;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

.pagination-row {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eef0f2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #7b8492;
  font-size: 13px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-button {
  min-width: 34px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #e0e3e7;
  border-radius: 9px;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}

.page-button.active {
  border-color: #111827;
  background: #111827;
  color: #ffffff;
}

.page-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.modal-footer {
  border-top: 1px solid #eef0f2;
}

.selected-summary {
  color: #5f6875;
  font-size: 14px;
  font-weight: 700;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.secondary-button,
.primary-button {
  min-height: 42px;
  padding: 0 17px;
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
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .picker-layout {
    grid-template-columns: 1fr;
  }

  .chapter-list {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .chapter-button {
    width: auto;
    min-width: max-content;
  }

  .filters-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 620px) {
  .modal-mask {
    padding: 12px;
  }

  .filters-row {
    grid-template-columns: 1fr;
  }

  .pagination-row,
  .modal-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .footer-actions {
    justify-content: flex-end;
  }
}
</style>
