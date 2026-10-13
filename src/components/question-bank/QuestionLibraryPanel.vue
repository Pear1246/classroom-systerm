<template>
  <div class="question-library-panel">
    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-icon dark">
          <AppIcon name="question-bank" />
        </span>
        <div>
          <strong>{{ stats.total }}</strong>
          <span>题目总数</span>
        </div>
      </article>

      <article class="stat-card">
        <span class="stat-icon">
          <AppIcon name="single-choice" />
        </span>
        <div>
          <strong>{{ stats.single }}</strong>
          <span>单选题</span>
        </div>
      </article>

      <article class="stat-card">
        <span class="stat-icon">
          <AppIcon name="multiple-choice" />
        </span>
        <div>
          <strong>{{ stats.multiple }}</strong>
          <span>多选题</span>
        </div>
      </article>

      <article class="stat-card">
        <span class="stat-icon">
          <AppIcon name="folder" />
        </span>
        <div>
          <strong>{{ stats.chapterCount }}</strong>
          <span>覆盖章节</span>
        </div>
      </article>
    </section>

    <section class="content-card">
      <div class="section-heading">
        <div>
          <h3>题目库</h3>
          <p>保留教师主动沉淀的可复用题目，不再给单题设置发布状态。</p>
        </div>

        <button type="button" class="primary-button" @click="createQuestion">
          <AppIcon name="plus" />
          <span>新建题目</span>
        </button>
      </div>

      <div class="library-layout">
        <aside class="chapter-panel" aria-label="题目章节">
          <div class="chapter-panel-heading">
            <div>
              <strong>章节</strong>
              <span>按课程内容快速定位题目</span>
            </div>
            <span class="chapter-total">{{ stats.chapterCount }}</span>
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

        <div class="library-main">
          <div class="current-chapter-row">
            <div>
              <span class="current-chapter-label">当前范围</span>
              <strong>{{ selectedChapterLabel }}</strong>
            </div>
          </div>

          <div class="filters-row">
            <label class="search-box">
              <AppIcon name="search" />
              <input
                v-model.trim="filters.keyword"
                type="text"
                placeholder="搜索题目、章节或知识点"
              />
            </label>

            <AppSelect v-model="filters.type" :options="typeOptions" />
            <AppSelect
              v-model="filters.difficulty"
              :options="difficultyOptions"
            />
          </div>

          <div v-if="pagedQuestions.length" class="question-list">
            <article
              v-for="(question, index) in pagedQuestions"
              :key="question.id"
              class="question-card"
            >
              <div class="question-index">
                {{
                  String((currentPage - 1) * pageSize + index + 1).padStart(
                    2,
                    "0"
                  )
                }}
              </div>

              <div class="question-main">
                <div class="question-title-row">
                  <span class="type-icon">
                    <AppIcon :name="typeIcon(question.type)" />
                  </span>

                  <div class="question-title-wrap">
                    <h4>{{ question.stem }}</h4>

                    <div class="meta-row">
                      <span>{{ typeLabel(question.type) }}</span>
                      <span>{{ question.chapter || "未分类" }}</span>
                      <span v-if="question.knowledgePoint">
                        {{ question.knowledgePoint }}
                      </span>
                      <span
                        class="difficulty-tag"
                        :class="`difficulty-${question.difficulty}`"
                      >
                        {{ difficultyLabel(question.difficulty) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="answer-row">
                  <span class="answer-label">{{
                    question.type === "short-answer" ? "参考答案" : "正确答案"
                  }}</span>
                  <strong>{{ formatAnswer(question) }}</strong>
                  <span class="update-time"
                    >更新于 {{ question.updatedAt }}</span
                  >
                </div>
              </div>

              <div class="question-actions">
                <button
                  type="button"
                  class="icon-button"
                  title="编辑题目"
                  @click="editQuestion(question.id)"
                >
                  <AppIcon name="edit" />
                </button>

                <button
                  type="button"
                  class="icon-button danger"
                  title="删除题目"
                  @click="openDeleteDialog(question)"
                >
                  <AppIcon name="delete" />
                </button>
              </div>
            </article>
          </div>

          <div v-else class="empty-state">
            <span class="empty-icon">
              <AppIcon name="question-bank" />
            </span>
            <strong>没有找到符合条件的题目</strong>
            <p>调整章节或筛选条件，或新建一道可复用题目。</p>
          </div>

          <div v-if="filteredQuestions.length" class="pagination-row">
            <span class="pagination-summary">
              第 {{ currentPage }} / {{ totalPages }} 页，共
              {{ filteredQuestions.length }} 道题
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
            <h3>删除题目</h3>
            <p>删除后将不再出现在题目库中。</p>
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
          {{ pendingDelete?.stem }}
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
  </div>
</template>

<script>
import AppIcon from "../AppIcon.vue";
import AppToast from "../AppToast.vue";
import AppSelect from "../AppSelect.vue";
import { useQuestionStore } from "../../store/questionStore";
import {
  ALL_CHAPTERS,
  buildChapterItems,
  questionMatchesChapter,
} from "../../utils/questionChapters";

const PAGE_SIZE = 10;

export default {
  name: "QuestionLibraryPanel",

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

    courseId: {
      type: String,
      default: "",
    },
  },

  data() {
    return {
      pageSize: PAGE_SIZE,
      currentPage: 1,

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

      showDeleteDialog: false,
      pendingDelete: null,

      toastText: "",
      toastType: "success",
      toastTimer: null,
    };
  },

  computed: {
    questionStore() {
      return useQuestionStore();
    },

    bankScopeId() {
      return String(this.courseId || this.teachingClassId);
    },

    questions() {
      return this.questionStore.getQuestions(this.bankScopeId);
    },

    stats() {
      const chapters = new Set(
        this.questions.map((item) => item.chapter).filter(Boolean)
      );

      return {
        total: this.questions.length,
        single: this.questions.filter((item) => item.type === "single").length,
        multiple: this.questions.filter((item) => item.type === "multiple")
          .length,
        chapterCount: chapters.size,
      };
    },

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
        const matchesKeyword =
          !keyword ||
          String(question.stem || "")
            .toLowerCase()
            .includes(keyword) ||
          String(question.chapter || "")
            .toLowerCase()
            .includes(keyword) ||
          String(question.knowledgePoint || "")
            .toLowerCase()
            .includes(keyword);

        const matchesType =
          this.filters.type === "all" || question.type === this.filters.type;

        const matchesDifficulty =
          this.filters.difficulty === "all" ||
          question.difficulty === this.filters.difficulty;

        const matchesChapter = questionMatchesChapter(
          question,
          this.selectedChapter
        );

        return (
          matchesKeyword && matchesType && matchesDifficulty && matchesChapter
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

    "filters.difficulty"() {
      this.currentPage = 1;
    },

    selectedChapter() {
      this.currentPage = 1;
    },

    teachingClassId() {
      this.currentPage = 1;
      this.questionStore.ensureCourse(this.bankScopeId);
    },

    courseId() {
      this.currentPage = 1;
      this.questionStore.ensureCourse(this.bankScopeId);
    },
  },

  mounted() {
    this.questionStore.ensureCourse(this.bankScopeId);

    if (this.$route.query.saved === "1") {
      this.showToast("题目已保存");
      this.$router.replace({
        path: this.$route.path,
        query: { section: "library" },
      });
    }
  },

  beforeUnmount() {
    window.clearTimeout(this.toastTimer);
  },

  methods: {
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

    formatAnswer(question) {
      if (question.type === "judgment") {
        return question.answer?.[0] === "true" ? "正确" : "错误";
      }

      if (question.type === "short-answer") {
        return question.referenceAnswer || "未填写参考答案";
      }

      return (question.answer || []).join("、") || "—";
    },

    selectChapter(chapterKey) {
      this.selectedChapter = String(chapterKey || ALL_CHAPTERS);
    },

    goToPage(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) {
        return;
      }

      this.currentPage = page;
    },

    createQuestion() {
      this.$router.push({
        path: `/course/${this.teachingClassId}/questions/new`,
        query: { section: "library" },
      });
    },

    editQuestion(questionId) {
      this.$router.push({
        path: `/course/${this.teachingClassId}/questions/${String(
          questionId
        )}/edit`,
        query: { section: "library" },
      });
    },

    openDeleteDialog(question) {
      this.pendingDelete = question;
      this.showDeleteDialog = true;
    },

    closeDeleteDialog() {
      this.showDeleteDialog = false;
      this.pendingDelete = null;
    },

    confirmDelete() {
      if (!this.pendingDelete) {
        return;
      }

      const removed = this.questionStore.deleteQuestion(
        this.bankScopeId,
        this.pendingDelete.id
      );

      this.closeDeleteDialog();

      if (!removed) {
        this.showToast("题目删除失败", "error");
        return;
      }

      if (
        !this.chapterItems.some((item) => item.key === this.selectedChapter)
      ) {
        this.selectedChapter = ALL_CHAPTERS;
      }

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

      this.showToast("题目已删除");
    },

    showToast(text, type = "success") {
      this.toastType = type;
      this.toastText = text;
      window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.toastText = "";
      }, 1800);
    },
  },
};
</script>

<style scoped>
.question-library-panel {
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
.icon-button,
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

.library-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;
  margin-top: 22px;
  align-items: start;
}

.chapter-panel {
  padding: 11px;
  border: 1px solid #eceff2;
  border-radius: 16px;
  background: #fafafa;
}

.chapter-panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 8px 11px;
}

.chapter-panel-heading strong,
.chapter-panel-heading span {
  display: block;
}

.chapter-panel-heading strong {
  color: #111827;
  font-size: 15px;
}

.chapter-panel-heading > div > span {
  margin-top: 4px;
  color: #9aa1ab;
  font-size: 12px;
  line-height: 1.5;
}

.chapter-total {
  min-width: 28px;
  height: 28px;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border-radius: 999px;
  background: #f0f1f3;
  color: #5f6875;
  font-size: 12px;
  font-weight: 700;
}

.chapter-list {
  display: grid;
  gap: 5px;
}

.chapter-button {
  width: 100%;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px 8px 12px;
  border: 1px solid transparent;
  border-radius: 11px;
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
  font-size: 13.5px;
  font-weight: 650;
}

.chapter-count {
  min-width: 26px;
  height: 24px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 7px;
  border-radius: 999px;
  background: #f0f1f3;
  color: #8a93a0;
  font-size: 11.5px;
  font-weight: 700;
}

.chapter-button.active .chapter-count {
  background: #111827;
  color: #ffffff;
}

.library-main {
  min-width: 0;
}

.current-chapter-row {
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.current-chapter-row > div {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.current-chapter-label {
  color: #9aa1ab;
  font-size: 12.5px;
}

.current-chapter-row strong {
  color: #111827;
  font-size: 16px;
}

.filters-row {
  display: grid;
  grid-template-columns: minmax(280px, 1.7fr) repeat(2, minmax(155px, 0.72fr));
  gap: 10px;
  margin-top: 10px;
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

.question-list {
  display: grid;
  gap: 11px;
  margin-top: 19px;
}

.question-card {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) auto;
  gap: 17px;
  align-items: center;
  padding: 19px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  transition: 0.2s ease;
}

.question-card:hover {
  background: #ffffff;
  border-color: #e5e7eb;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.04);
}

.question-index {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid #ececec;
  border-radius: 14px;
  color: #111827;
  background: #ffffff;
  font-size: 14px;
  font-weight: 800;
}

.question-title-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.type-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 11px;
  color: #4b5563;
  background: #eeeeee;
  font-size: 18px;
}

.question-title-wrap {
  min-width: 0;
}

.question-title-wrap h4 {
  margin: 1px 0 0;
  color: #111827;
  font-size: 16px;
  line-height: 1.65;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 9px;
  color: #7f8793;
  font-size: 13px;
}

.meta-row > span:not(.difficulty-tag)::after {
  content: "·";
  margin-left: 8px;
  color: #d1d5db;
}

.difficulty-tag {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 3px 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1;
}

.difficulty-easy {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.difficulty-medium {
  color: #9a6700;
  background: #fffbeb;
  border-color: #fde68a;
}

.difficulty-hard {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.answer-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 14px;
  color: #667085;
  font-size: 13px;
}

.answer-label {
  color: #8f97a3;
}

.answer-row strong {
  min-width: 0;
  max-width: min(680px, 60vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
}

.update-time {
  margin-left: auto;
  color: #a3a8b1;
}

.question-actions {
  display: flex;
  gap: 7px;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #667085;
  background: transparent;
  font-size: 18px;
}

.icon-button:hover {
  color: #111827;
  background: #f3f4f6;
}

.icon-button.danger:hover {
  color: #b42318;
  background: #fff4f2;
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

  .question-card {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .question-actions {
    grid-column: 2;
    justify-content: flex-end;
  }

  .update-time {
    display: none;
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

@media (max-width: 980px) {
  .library-layout {
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
}

@media (max-width: 720px) {
  .filters-row {
    grid-template-columns: 1fr;
  }
}
</style>
