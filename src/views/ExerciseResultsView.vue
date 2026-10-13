<template>
  <div class="results-page">
    <header class="results-header">
      <button type="button" class="back-button" @click="goBack">
        <AppIcon name="arrow-left" />
        <span>返回课程题库</span>
      </button>

      <div class="header-title-wrap">
        <div class="title-line">
          <h1>练习结果</h1>
          <span class="status-pill" :class="statusClass">{{
            statusLabel(exercise?.status)
          }}</span>
        </div>
        <p>{{ exercise?.name || "练习" }} · {{ className }}</p>
      </div>

      <button type="button" class="secondary-button" @click="openExercise">
        <AppIcon name="eye" />
        <span>查看练习</span>
      </button>
    </header>

    <main v-if="exercise" class="results-main">
      <section class="stats-grid">
        <article class="stat-card">
          <span>已提交</span>
          <strong
            >{{ submittedCount }} /
            {{ exercise.expectedCount || submissions.length }}</strong
          >
          <small>当前提交人数</small>
        </article>
        <article class="stat-card">
          <span>提交率</span>
          <strong>{{ submissionRate }}%</strong>
          <small>按发布时应交人数计算</small>
        </article>
        <article class="stat-card">
          <span>已完成批改</span>
          <strong>{{ fullyGradedCount }}</strong>
          <small>{{
            pendingGradingCount
              ? `${pendingGradingCount} 份待批改`
              : "暂无待批改"
          }}</small>
        </article>
        <article class="stat-card">
          <span>平均分</span>
          <strong>{{ averageScoreText }}</strong>
          <small>仅统计已完成批改的提交</small>
        </article>
      </section>

      <section class="content-card">
        <div class="section-heading">
          <div>
            <h2>学生提交</h2>
            <p>查看学生作答结果，并完成简答题人工评分。</p>
          </div>
        </div>

        <div class="filters-row">
          <label class="search-box">
            <AppIcon name="search" />
            <input
              v-model.trim="keyword"
              type="text"
              placeholder="搜索学生姓名或学号"
            />
          </label>
          <AppSelect v-model="submitFilter" :options="submitOptions" />
          <AppSelect v-model="gradingFilter" :options="gradingOptions" />
        </div>

        <div v-if="pagedRows.length" class="table-wrap">
          <table class="result-table">
            <thead>
              <tr>
                <th>学生</th>
                <th>提交状态</th>
                <th>提交时间</th>
                <th>客观题</th>
                <th>批改状态</th>
                <th>总分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pagedRows" :key="row.submission.id">
                <td>
                  <div class="student-cell">
                    <strong>{{ row.submission.studentName }}</strong>
                    <span>{{ row.submission.studentId }}</span>
                  </div>
                </td>
                <td>
                  <span
                    class="submit-pill"
                    :class="
                      row.submission.submitted ? 'submitted' : 'unsubmitted'
                    "
                  >
                    {{ row.submission.submitted ? "已提交" : "未提交" }}
                  </span>
                </td>
                <td>{{ row.submission.submittedAt || "—" }}</td>
                <td>
                  <span v-if="row.submission.submitted">
                    {{ row.result.objectiveScore }} /
                    {{ row.result.objectiveMaxScore }}
                  </span>
                  <span v-else>—</span>
                </td>
                <td>
                  <span v-if="!row.submission.submitted">—</span>
                  <span
                    v-else-if="!hasSubjectiveQuestions"
                    class="grading-pill done"
                    >无需批改</span
                  >
                  <span
                    v-else-if="row.result.fullyGraded"
                    class="grading-pill done"
                    >已完成</span
                  >
                  <span v-else class="grading-pill pending">待批改</span>
                </td>
                <td>
                  <strong
                    v-if="
                      row.submission.submitted && row.result.finalScore !== null
                    "
                    class="score-value"
                  >
                    {{ row.result.finalScore }} / {{ row.result.maxScore }}
                  </strong>
                  <span
                    v-else-if="row.submission.submitted"
                    class="pending-score"
                    >待批改</span
                  >
                  <span v-else>—</span>
                </td>
                <td>
                  <button
                    v-if="row.submission.submitted"
                    type="button"
                    class="action-button"
                    @click="openSubmissionAnswer(row.submission)"
                  >
                    <AppIcon name="eye" />
                    <span>查看作答</span>
                  </button>
                  <span v-else class="muted-text">暂无作答</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-state">
          <strong>没有找到符合条件的学生记录</strong>
          <p>可以调整搜索或筛选条件。</p>
        </div>

        <div v-if="filteredRows.length" class="pagination-row">
          <span
            >第 {{ currentPage }} / {{ totalPages }} 页，共
            {{ filteredRows.length }} 名学生</span
          >
          <div class="pagination-controls">
            <button
              type="button"
              :disabled="currentPage === 1"
              @click="currentPage -= 1"
            >
              上一页
            </button>
            <button
              type="button"
              :disabled="currentPage === totalPages"
              @click="currentPage += 1"
            >
              下一页
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import AppIcon from "../components/AppIcon.vue";
import AppSelect from "../components/AppSelect.vue";
import { useCourseStore } from "../store/courseStore";
import { useExerciseStore } from "../store/exerciseStore";
import { useExerciseSubmissionStore } from "../store/exerciseSubmissionStore";
import {
  calculateSubmissionResult,
  isSubjectiveQuestion,
} from "../utils/exerciseGrading";

const PAGE_SIZE = 10;

export default {
  name: "ExerciseResultsView",
  components: { AppIcon, AppSelect },
  data() {
    return {
      keyword: "",
      submitFilter: "all",
      gradingFilter: "all",
      submitOptions: [
        { label: "全部提交状态", value: "all" },
        { label: "已提交", value: "submitted" },
        { label: "未提交", value: "unsubmitted" },
      ],
      gradingOptions: [
        { label: "全部批改状态", value: "all" },
        { label: "待批改", value: "pending" },
        { label: "已完成", value: "done" },
      ],
      currentPage: 1,
    };
  },
  computed: {
    courseStore() {
      return useCourseStore();
    },
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
    exercise() {
      return this.exerciseStore.getExercise(
        this.teachingClassId,
        this.exerciseId
      );
    },
    currentTeachingClass() {
      return (
        this.courseStore.teachingClasses.find(
          (item) => String(item.id) === this.teachingClassId
        ) ||
        this.courseStore.currentTeachingClass ||
        null
      );
    },
    className() {
      return this.currentTeachingClass?.className || "当前教学班";
    },
    submissions() {
      return this.exercise
        ? this.submissionStore.getSubmissions(
            this.teachingClassId,
            this.exercise
          )
        : [];
    },
    rows() {
      return this.submissions.map((submission) => ({
        submission,
        result: submission.submitted
          ? calculateSubmissionResult(this.exercise, submission)
          : {
              objectiveScore: 0,
              objectiveMaxScore: 0,
              finalScore: null,
              maxScore: 0,
              fullyGraded: false,
              pendingSubjectiveCount: 0,
            },
      }));
    },
    hasSubjectiveQuestions() {
      return (this.exercise?.questions || []).some((question) =>
        isSubjectiveQuestion(question)
      );
    },
    submittedRows() {
      return this.rows.filter((row) => row.submission.submitted);
    },
    submittedCount() {
      return this.submittedRows.length;
    },
    submissionRate() {
      const expected = Number(
        this.exercise?.expectedCount || this.submissions.length || 0
      );
      return expected ? Math.round((this.submittedCount / expected) * 100) : 0;
    },
    fullyGradedCount() {
      return this.submittedRows.filter((row) => row.result.fullyGraded).length;
    },
    pendingGradingCount() {
      return this.submittedRows.filter((row) => !row.result.fullyGraded).length;
    },
    averageScoreText() {
      const graded = this.submittedRows.filter(
        (row) => row.result.finalScore !== null
      );
      if (!graded.length) return "—";
      const total = graded.reduce(
        (sum, row) => sum + Number(row.result.finalScore || 0),
        0
      );
      const maxScore = graded[0]?.result.maxScore || 0;
      return `${(total / graded.length).toFixed(1)} / ${maxScore}`;
    },
    filteredRows() {
      const keyword = this.keyword.toLowerCase();
      return this.rows.filter((row) => {
        const submission = row.submission;
        const matchesKeyword =
          !keyword ||
          submission.studentName.toLowerCase().includes(keyword) ||
          submission.studentId.toLowerCase().includes(keyword);
        const matchesSubmit =
          this.submitFilter === "all" ||
          (this.submitFilter === "submitted" && submission.submitted) ||
          (this.submitFilter === "unsubmitted" && !submission.submitted);
        const matchesGrading =
          this.gradingFilter === "all" ||
          (submission.submitted &&
            ((this.gradingFilter === "pending" && !row.result.fullyGraded) ||
              (this.gradingFilter === "done" && row.result.fullyGraded)));
        return matchesKeyword && matchesSubmit && matchesGrading;
      });
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredRows.length / PAGE_SIZE));
    },
    pagedRows() {
      const start = (this.currentPage - 1) * PAGE_SIZE;
      return this.filteredRows.slice(start, start + PAGE_SIZE);
    },
    statusClass() {
      return `status-${String(this.exercise?.status || "DRAFT").toLowerCase()}`;
    },
  },
  watch: {
    keyword() {
      this.currentPage = 1;
    },
    submitFilter() {
      this.currentPage = 1;
    },
    gradingFilter() {
      this.currentPage = 1;
    },
  },
  mounted() {
    this.exerciseStore.ensureTeachingClass(this.teachingClassId);
    if (!this.exercise || this.exercise.status === "DRAFT") {
      this.$router.replace(`/course/${this.teachingClassId}/questions`);
    }
  },
  methods: {
    statusLabel(status) {
      return (
        { ACTIVE: "进行中", ENDED: "已结束", DRAFT: "草稿" }[status] || "练习"
      );
    },
    goBack() {
      this.$router.push(`/course/${this.teachingClassId}/questions`);
    },
    openExercise() {
      this.$router.push(
        `/course/${this.teachingClassId}/questions/exercises/${this.exerciseId}/edit`
      );
    },
    openSubmissionAnswer(submission) {
      if (!submission?.submitted) return;
      this.$router.push(
        `/course/${this.teachingClassId}/questions/exercises/${
          this.exerciseId
        }/results/${String(submission.studentId)}`
      );
    },
  },
};
</script>

<style scoped>
.results-page {
  min-height: 100%;
  background: #f7f7f8;
  color: #111827;
}
.results-header {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 220px;
  align-items: center;
  gap: 20px;
  padding: 20px 32px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
}
.back-button,
.secondary-button,
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  border: 1px solid #dfe3e8;
  border-radius: 11px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
}
.back-button {
  justify-self: start;
  padding: 0 15px;
  border-radius: 999px;
}
.secondary-button {
  justify-self: end;
  padding: 0 15px;
}
.header-title-wrap {
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
  font-size: 23px;
}
.header-title-wrap p {
  margin: 5px 0 0;
  color: #7b8492;
  font-size: 14px;
}
.status-pill {
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.status-active {
  color: #047857;
  background: #ecfdf5;
  border: 1px solid #c7f0df;
}
.status-ended {
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #cfe0ff;
}
.status-draft {
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.results-main {
  width: min(1480px, calc(100% - 56px));
  margin: 24px auto 40px;
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
  background: #fff;
  border: 1px solid #e8eaed;
}
.stat-card {
  padding: 20px;
  border-radius: 17px;
}
.stat-card span {
  color: #7b8492;
  font-size: 14px;
}
.stat-card strong {
  display: block;
  margin-top: 8px;
  color: #111827;
  font-size: 25px;
}
.stat-card small {
  display: block;
  margin-top: 6px;
  color: #9aa1aa;
  font-size: 12px;
}
.content-card {
  padding: 26px;
  border-radius: 20px;
}
.section-heading {
  display: flex;
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
.filters-row {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 190px 190px;
  gap: 12px;
  margin-top: 20px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 0 13px;
  border: 1px solid #dfe3e8;
  border-radius: 11px;
  color: #7b8492;
}
.search-box input {
  width: 100%;
  border: 0;
  outline: none;
  font-size: 14px;
  color: #1f2937;
}
.table-wrap {
  margin-top: 18px;
  overflow-x: auto;
  border: 1px solid #eceef0;
  border-radius: 15px;
}
.result-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 970px;
}
th,
td {
  padding: 15px 14px;
  border-bottom: 1px solid #eef0f2;
  text-align: center;
  font-size: 14px;
}
th {
  background: #fafafa;
  color: #68707c;
  font-weight: 600;
}
td {
  color: #374151;
}
tbody tr:last-child td {
  border-bottom: 0;
}
.student-cell {
  text-align: left;
}
.student-cell strong,
.student-cell span {
  display: block;
}
.student-cell strong {
  color: #111827;
}
.student-cell span {
  margin-top: 4px;
  color: #9aa1aa;
  font-size: 12px;
}
.submit-pill,
.grading-pill {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.submit-pill.submitted,
.grading-pill.done {
  color: #047857;
  background: #ecfdf5;
}
.submit-pill.unsubmitted {
  color: #6b7280;
  background: #f3f4f6;
}
.grading-pill.pending {
  color: #9a6700;
  background: #fff7db;
}
.score-value {
  color: #111827;
}
.pending-score {
  color: #9a6700;
}
.action-button {
  min-height: 34px;
  padding: 0 11px;
}
.muted-text {
  color: #a1a7b0;
  font-size: 13px;
}
.empty-state {
  padding: 52px 20px;
  text-align: center;
  color: #6b7280;
}
.empty-state strong {
  display: block;
  color: #374151;
  font-size: 15px;
}
.empty-state p {
  margin: 7px 0 0;
  font-size: 13px;
}
.pagination-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
  color: #7b8492;
  font-size: 13px;
}
.pagination-controls {
  display: flex;
  gap: 8px;
}
.pagination-controls button {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #dfe3e8;
  border-radius: 9px;
  background: #fff;
  color: #4b5563;
  cursor: pointer;
}
.pagination-controls button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
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
@media (max-width: 760px) {
  .results-header {
    grid-template-columns: 1fr;
    padding: 16px;
  }
  .back-button,
  .secondary-button {
    justify-self: stretch;
  }
  .header-title-wrap {
    order: -1;
  }
  .results-main {
    width: min(100% - 24px, 1480px);
  }
  .stats-grid,
  .filters-row {
    grid-template-columns: 1fr;
  }
  .search-box {
    grid-column: auto;
  }
  .pagination-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
