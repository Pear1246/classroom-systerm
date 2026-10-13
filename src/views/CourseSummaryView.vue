<template>
  <div class="summary-page">
    <div v-if="loading" class="state-card">正在整理课程数据...</div>

    <div v-else-if="errorMessage" class="state-card error-state">
      <strong>课程总结暂时无法生成</strong>
      <span>{{ errorMessage }}</span>
      <button type="button" class="retry-btn" @click="loadSummary">
        重新加载
      </button>
    </div>

    <template v-else-if="summary">
      <div v-if="partialWarning" class="partial-warning screen-only">
        <AppIcon name="time" />
        <span>{{ partialWarning }}</span>
      </div>

      <main ref="summaryReport" class="summary-report">
        <header class="report-header pdf-avoid-break">
          <div class="report-course">
            <span class="report-kicker">课程结课总结</span>
            <h1>{{ summary.course.courseName }}</h1>
            <p class="report-course-line">
              {{ summary.course.className }} · {{ summary.course.semester }}
            </p>

            <div class="report-inline-meta">
              <span
                >授课教师：<strong>{{
                  summary.course.teacherName
                }}</strong></span
              >
              <span class="meta-dot">·</span>
              <span
                >结课时间：<strong>{{ endedAtText }}</strong></span
              >
            </div>
          </div>

          <div class="action-buttons pdf-hidden">
            <button
              type="button"
              class="export-btn secondary"
              :disabled="loading || !summary"
              @click="handleExportPdf"
            >
              <AppIcon name="pdf" />
              <span>{{
                exportingPdf ? "正在生成..." : "导出课程总结 PDF"
              }}</span>
            </button>

            <button
              type="button"
              class="export-btn primary"
              :disabled="loading || !summary"
              @click="showExportDialog = true"
            >
              <AppIcon name="excel" />
              <span>导出数据明细</span>
            </button>
          </div>
        </header>

        <section class="overview-grid pdf-avoid-break">
          <article class="overview-card">
            <span>学生人数</span>
            <strong>{{ summary.studentCount }}</strong>
            <small>本教学班</small>
          </article>

          <article class="overview-card">
            <span>签到次数</span>
            <strong>{{ summary.attendance.activityCount }}</strong>
            <small>历史签到活动</small>
          </article>

          <article class="overview-card accent-green">
            <span>平均出勤率</span>
            <strong>{{ percent(summary.attendance.averageRate) }}%</strong>
            <small>按全部签到人次计算</small>
          </article>

          <article class="overview-card">
            <span>课堂互动次数</span>
            <strong>{{ summary.performance.interactionCount }}</strong>
            <small>点名及课堂表现记录</small>
          </article>

          <article class="overview-card">
            <span>已发布练习</span>
            <strong>{{ summary.exercise.publishedCount }}</strong>
            <small>{{ summary.exercise.questionCount }} 道练习题</small>
          </article>

          <article class="overview-card accent-blue">
            <span>平均练习完成率</span>
            <strong
              >{{ percent(summary.exercise.averageCompletionRate) }}%</strong
            >
            <small>按应提交人次计算</small>
          </article>
        </section>

        <section class="summary-section">
          <div class="pdf-section-lead">
            <div class="section-heading">
              <div>
                <span class="section-index">01</span>
                <h3>出勤情况</h3>
              </div>
              <span class="section-note"
                >共 {{ summary.attendance.activityCount }} 次签到</span
              >
            </div>

            <div class="split-card">
              <div class="rate-block">
                <div class="rate-value">
                  <strong
                    >{{ percent(summary.attendance.averageRate) }}%</strong
                  >
                  <span>平均出勤率</span>
                </div>

                <div class="progress-track">
                  <span :style="{ width: attendanceWidth }"></span>
                </div>

                <p>
                  累计签到 {{ summary.attendance.totalSigned }} 人次，应签到
                  {{ summary.attendance.totalExpected }} 人次。
                </p>
              </div>

              <div class="mini-stats">
                <div>
                  <span>签到活动</span>
                  <strong>{{ summary.attendance.activityCount }}</strong>
                </div>
                <div>
                  <span>累计签到</span>
                  <strong>{{ summary.attendance.totalSigned }}</strong>
                </div>
                <div>
                  <span>累计应签</span>
                  <strong>{{ summary.attendance.totalExpected }}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="summary-section">
          <div class="pdf-section-lead">
            <div class="section-heading">
              <div>
                <span class="section-index">02</span>
                <h3>课堂互动</h3>
              </div>
              <span class="section-note">课堂表现与随机点名记录</span>
            </div>

            <div class="metric-row">
              <div class="metric-item">
                <span>互动次数</span>
                <strong>{{ summary.performance.interactionCount }}</strong>
              </div>
              <div class="metric-item">
                <span>参与学生</span>
                <strong>{{ summary.performance.participantCount }}</strong>
              </div>
              <div class="metric-item">
                <span>平均表现分</span>
                <strong>{{
                  scoreText(summary.performance.averageScore)
                }}</strong>
              </div>
              <div class="metric-item">
                <span>学生参与率</span>
                <strong>{{ performanceParticipationRate }}%</strong>
              </div>
            </div>
          </div>
        </section>

        <section class="summary-section exercise-section pdf-new-page">
          <div class="pdf-section-lead">
            <div class="section-heading">
              <div>
                <span class="section-index">03</span>
                <h3>练习与学习</h3>
              </div>
              <span class="section-note">仅统计已发布练习</span>
            </div>

            <div class="exercise-summary">
              <div class="exercise-progress">
                <div class="rate-value compact">
                  <strong
                    >{{
                      percent(summary.exercise.averageCompletionRate)
                    }}%</strong
                  >
                  <span>平均练习完成率</span>
                </div>
                <div class="progress-track blue-track">
                  <span :style="{ width: exerciseCompletionWidth }"></span>
                </div>
                <p>
                  {{ summary.exercise.submittedTotal }} /
                  {{ summary.exercise.expectedTotal }} 人次已提交，{{
                    summary.exercise.fullyGradedSubmissionCount
                  }}
                  人次已完成批改。
                </p>
              </div>

              <div class="exercise-side-stats">
                <div>
                  <span>已结束练习</span>
                  <strong>{{ summary.exercise.endedCount }}</strong>
                </div>
                <div>
                  <span>题库题目</span>
                  <strong>{{ summary.questionBank.questionCount }}</strong>
                </div>
                <div>
                  <span>已批改平均分</span>
                  <strong>{{
                    nullableScoreText(summary.exercise.averageScore)
                  }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="table-wrap pdf-table-block">
            <table class="summary-table">
              <thead>
                <tr>
                  <th>练习名称</th>
                  <th>类型</th>
                  <th>题目</th>
                  <th>提交情况</th>
                  <th>提交率</th>
                  <th>平均分</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="summary.exercise.exercises.length === 0">
                  <td colspan="6" class="empty-cell">本课程暂无已发布练习</td>
                </tr>
                <tr
                  v-for="exercise in summary.exercise.exercises"
                  :key="exercise.id"
                >
                  <td class="name-cell">{{ exercise.name }}</td>
                  <td>{{ exerciseTypeText(exercise.type) }}</td>
                  <td>{{ exercise.questionCount }} 道</td>
                  <td>
                    {{ exercise.submittedCount }} / {{ exercise.expectedCount }}
                  </td>
                  <td>{{ percent(exercise.completionRate) }}%</td>
                  <td>{{ nullableScoreText(exercise.averageScore) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="summary-section">
          <div class="pdf-section-lead">
            <div class="section-heading">
              <div>
                <span class="section-index">04</span>
                <h3>课程知识库</h3>
              </div>
              <span class="section-note">课程资料建设情况</span>
            </div>

            <div class="knowledge-layout">
              <div class="knowledge-total">
                <span>资料总数</span>
                <strong>{{ summary.knowledge.totalCount }}</strong>
                <p>
                  {{ summary.knowledge.fileCount }} 个文件资料 ·
                  {{ summary.knowledge.noteCount }} 篇在线笔记
                </p>
              </div>

              <div class="category-list">
                <div
                  v-for="category in summary.knowledge.categories"
                  :key="category.id"
                  class="category-row"
                >
                  <div class="category-label">
                    <span>{{ category.name }}</span>
                    <strong>{{ category.count }}</strong>
                  </div>
                  <div class="category-track">
                    <span
                      :style="{ width: categoryWidth(category.count) }"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="summary-section">
          <div class="pdf-section-lead">
            <div class="section-heading">
              <div>
                <span class="section-index">05</span>
                <h3>章节覆盖</h3>
              </div>
              <span class="section-note">按已发布练习中的题目章节统计</span>
            </div>

            <div v-if="summary.chapters.length" class="chapter-area">
              <div class="chapter-count">
                <strong>{{ summary.chapters.length }}</strong>
                <span>个章节已有练习覆盖</span>
              </div>

              <div class="chapter-tags">
                <span v-for="chapter in summary.chapters" :key="chapter">
                  {{ chapter }}
                </span>
              </div>
            </div>

            <div v-else class="empty-block">当前练习尚未填写章节信息。</div>
          </div>
        </section>

        <footer class="report-footer pdf-avoid-break">
          <span>结课时间：{{ endedAtText }}</span>
          <span>总结生成时间：{{ summary.generatedAt }}</span>
        </footer>
      </main>
    </template>

    <CourseSummaryExportDialog
      v-if="showExportDialog"
      :selection="excelSelection"
      @close="showExportDialog = false"
      @confirm="handleExportExcel"
    />

    <AppToast :message="toast.message" :type="toast.type" />
  </div>
</template>

<script>
import AppIcon from "../components/AppIcon.vue";
import AppToast from "../components/AppToast.vue";
import CourseSummaryExportDialog from "../components/course-summary/CourseSummaryExportDialog.vue";
import { getSignActivities } from "../api/teacher";
import { getPerformance, getStudents } from "../api/student";
import { useCourseStore } from "../store/courseStore";
import { useCourseKnowledgeStore } from "../store/courseKnowledgeStore";
import { useCourseLifecycleStore } from "../store/courseLifecycleStore";
import { useExerciseStore } from "../store/exerciseStore";
import { useExerciseSubmissionStore } from "../store/exerciseSubmissionStore";
import { useQuestionStore } from "../store/questionStore";
import { useStudentStore } from "../store/studentStore";
import { useTeacherStore } from "../store/teacherStore";
import {
  buildCourseSummary,
  formatDateTime,
  formatPercent,
} from "../utils/courseSummary";
import {
  exportCourseSummaryExcel,
  exportCourseSummaryPdf,
} from "../utils/courseSummaryExport";

export default {
  name: "CourseSummaryView",

  components: {
    AppIcon,
    AppToast,
    CourseSummaryExportDialog,
  },

  data() {
    return {
      loading: true,
      summary: null,
      errorMessage: "",
      unavailableModules: [],
      showExportDialog: false,
      exportingPdf: false,
      excelSelection: {
        students: true,
        attendance: true,
        performance: true,
        exercises: true,
        resources: true,
      },
      toast: {
        message: "",
        type: "success",
      },
      toastTimer: null,
    };
  },

  computed: {
    courseStore() {
      return useCourseStore();
    },

    studentStore() {
      return useStudentStore();
    },

    teacherStore() {
      return useTeacherStore();
    },

    knowledgeStore() {
      return useCourseKnowledgeStore();
    },

    lifecycleStore() {
      return useCourseLifecycleStore();
    },

    exerciseStore() {
      return useExerciseStore();
    },

    submissionStore() {
      return useExerciseSubmissionStore();
    },

    questionStore() {
      return useQuestionStore();
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

    bankScopeId() {
      return String(
        this.currentTeachingClass?.courseId ||
          this.currentTeachingClass?.id ||
          ""
      );
    },

    partialWarning() {
      if (!this.unavailableModules.length) return "";
      return `以下数据暂时无法加载：${this.unavailableModules.join(
        "、"
      )}。其余统计仍可查看和导出。`;
    },

    endedAtText() {
      const endedAt = this.summary?.course?.endedAt;
      return endedAt ? formatDateTime(endedAt) : "未记录具体时间";
    },

    attendanceWidth() {
      return `${Math.min(
        100,
        Math.max(0, this.summary?.attendance?.averageRate || 0)
      )}%`;
    },

    exerciseCompletionWidth() {
      return `${Math.min(
        100,
        Math.max(0, this.summary?.exercise?.averageCompletionRate || 0)
      )}%`;
    },

    performanceParticipationRate() {
      const total = Number(this.summary?.studentCount || 0);
      const participants = Number(
        this.summary?.performance?.participantCount || 0
      );
      if (!total) return "0";
      return this.percent((participants / total) * 100);
    },

    maxKnowledgeCategoryCount() {
      return Math.max(
        1,
        ...(this.summary?.knowledge?.categories || []).map((item) =>
          Number(item.count || 0)
        )
      );
    },
  },

  mounted() {
    this.loadSummary();
  },

  beforeUnmount() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  },

  methods: {
    async ensureCurrentTeachingClass() {
      if (this.currentTeachingClass) return this.currentTeachingClass;

      const teacherId = this.teacherStore.teacher?.id;
      if (teacherId) {
        await this.courseStore.fetchTeachingClasses(teacherId);
      }

      return (
        this.courseStore.teachingClasses.find(
          (item) => String(item.id) === this.teachingClassId
        ) || null
      );
    },

    async loadAllSignRecords() {
      const size = 100;
      let page = 1;
      let total = 0;
      let records = [];

      do {
        const response = await getSignActivities({
          classId: this.teachingClassId,
          page,
          size,
        });

        const list = Array.isArray(response?.list) ? response.list : [];
        total = Number(response?.total || list.length);
        records = records.concat(list);

        if (!list.length || records.length >= total) break;
        page += 1;
      } while (page <= 50);

      return records;
    },

    // TEMP: 第一版先由前端聚合现有模块数据。正式接口接入后，
    // 这里应替换为后端 CourseSummary 聚合接口，避免拉取全部明细再计算。
    async loadSummary() {
      this.loading = true;
      this.errorMessage = "";
      this.unavailableModules = [];

      try {
        const teachingClass = await this.ensureCurrentTeachingClass();

        if (!teachingClass) {
          throw new Error("未找到当前课程空间，请返回课程首页后重新进入");
        }

        const lifecycle = this.lifecycleStore.getLifecycle(teachingClass);
        if (lifecycle.status !== "ENDED") {
          this.$router.replace(`/course/${this.teachingClassId}/materials`);
          return;
        }

        let students = [];
        let performanceStudents = [];
        let signRecords = [];
        let knowledgeData = this.knowledgeStore.getCourseData(
          this.teachingClassId
        );

        try {
          const studentResponse = await getStudents(this.teachingClassId);
          const studentList = Array.isArray(studentResponse)
            ? studentResponse
            : [];
          students = studentList.map((item) =>
            this.studentStore.formatStudent(
              item,
              this.teachingClassId,
              teachingClass.className
            )
          );
        } catch (error) {
          console.error("课程总结：学生名单加载失败", error);
          this.unavailableModules.push("学生名单");
        }

        try {
          const performanceResponse = await getPerformance(
            this.teachingClassId
          );
          const performanceList = Array.isArray(
            performanceResponse?.performances
          )
            ? performanceResponse.performances
            : [];
          performanceStudents = performanceList.map((item) =>
            this.studentStore.formatStudent(
              item,
              this.teachingClassId,
              teachingClass.className
            )
          );
        } catch (error) {
          console.error("课程总结：课堂表现加载失败", error);
          this.unavailableModules.push("课堂表现");
        }

        try {
          signRecords = await this.loadAllSignRecords();
        } catch (error) {
          console.error("课程总结：签到记录加载失败", error);
          this.unavailableModules.push("签到记录");
        }

        try {
          await this.knowledgeStore.fetchKnowledgeBaseList(
            this.teachingClassId,
            {
              force: true,
            }
          );
          knowledgeData = this.knowledgeStore.getCourseData(
            this.teachingClassId
          );
        } catch (error) {
          console.error("课程总结：知识库数据加载失败", error);
          this.unavailableModules.push("课程知识库");
        }

        const exercises = this.exerciseStore.getExercises(this.teachingClassId);
        const questions = this.questionStore.getQuestions(this.bankScopeId);

        this.summary = buildCourseSummary({
          teachingClass,
          lifecycle,
          students,
          performanceStudents,
          signRecords,
          knowledgeData,
          exercises,
          questions,
          getSubmissions: (exercise) =>
            this.submissionStore.getSubmissions(this.teachingClassId, exercise),
        });
      } catch (error) {
        console.error("生成课程总结失败：", error);
        this.summary = null;
        this.errorMessage = error?.message || "课程总结加载失败";
      } finally {
        this.loading = false;
      }
    },

    percent(value) {
      return formatPercent(value);
    },

    scoreText(value) {
      const number = Number(value || 0);
      return number ? number.toFixed(1).replace(/\.0$/, "") : "0";
    },

    nullableScoreText(value) {
      if (value === null || value === undefined || value === "") return "--";
      return Number(value).toFixed(1).replace(/\.0$/, "");
    },

    exerciseTypeText(type) {
      return type === "HOMEWORK" ? "课后作业" : "课堂练习";
    },

    categoryWidth(count) {
      const value = Number(count || 0);
      if (value <= 0) return "0%";
      const width = (value / this.maxKnowledgeCategoryCount) * 100;
      return `${Math.max(4, width)}%`;
    },

    showToast(message, type = "success") {
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toast = { message, type };
      this.toastTimer = setTimeout(() => {
        this.toast = { message: "", type: "success" };
      }, 2600);
    },

    async handleExportPdf() {
      if (!this.summary || this.exportingPdf) return;

      this.exportingPdf = true;

      try {
        await exportCourseSummaryPdf(this.$refs.summaryReport, this.summary);
        this.showToast("课程总结已生成");
      } catch (error) {
        console.error("导出课程总结 PDF 失败：", error);
        this.showToast(error?.message || "PDF 生成失败，请稍后重试", "error");
      } finally {
        this.exportingPdf = false;
      }
    },

    handleExportExcel(selection) {
      if (!this.summary) return;

      try {
        this.excelSelection = { ...selection };
        exportCourseSummaryExcel(this.summary, selection);
        this.showExportDialog = false;
        this.showToast("数据明细已导出");
      } catch (error) {
        console.error("导出课程数据 Excel 失败：", error);
        this.showToast(error?.message || "Excel 导出失败，请稍后重试", "error");
      }
    },
  },
};
</script>

<style scoped>
.summary-page {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 36px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.export-btn {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: 0.18s ease;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn.secondary {
  border: 1px solid #dfe3e8;
  background: #ffffff;
  color: #374151;
}

.export-btn.secondary:hover:not(:disabled) {
  border-color: #cfd5dc;
  background: #f8fafc;
}

.export-btn.primary {
  border: 1px solid #111827;
  background: #111827;
  color: #ffffff;
}

.export-btn.primary:hover:not(:disabled) {
  background: #242a34;
}

.state-card,
.partial-warning {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #ffffff;
}

.state-card {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 15px;
}

.error-state {
  flex-direction: column;
  gap: 8px;
  padding: 32px;
  text-align: center;
}

.error-state strong {
  color: #1f2937;
  font-size: 18px;
}

.retry-btn {
  margin-top: 8px;
  padding: 9px 14px;
  border: 1px solid #dfe3e8;
  border-radius: 10px;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  font-weight: 700;
}

.partial-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 12px 15px;
  border-color: #f3dfb8;
  background: #fffaf1;
  color: #82510d;
  font-size: 13px;
  line-height: 1.55;
}

.summary-report {
  border: 1px solid #e6e8eb;
  border-radius: 22px;
  background: #ffffff;
  overflow: hidden;
}

.report-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 30px;
  padding: 32px 34px 28px;
  border-bottom: 1px solid #eceef1;
}

.report-course {
  min-width: 0;
  flex: 1;
}

.report-kicker {
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.report-header h1 {
  margin: 8px 0 0;
  color: #111827;
  font-size: 30px;
  line-height: 1.25;
}

.report-course-line {
  margin: 8px 0 0;
  color: #68717e;
  font-size: 15px;
}

.report-inline-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: #7a8491;
  font-size: 13.5px;
  line-height: 1.6;
}

.report-inline-meta strong {
  color: #27313e;
  font-weight: 700;
}

.meta-dot {
  color: #c2c7cd;
}

.overview-card span,
.metric-item span,
.knowledge-total > span,
.rate-value span {
  color: #7a8491;
  font-size: 12.5px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  padding: 22px 34px 26px;
  border-bottom: 1px solid #eceef1;
  background: #fbfbfc;
}

.overview-card {
  min-width: 0;
  padding: 17px 16px;
  border: 1px solid #e7e9ec;
  border-radius: 16px;
  background: #ffffff;
}

.overview-card strong {
  display: block;
  margin-top: 7px;
  color: #111827;
  font-size: 30px;
  line-height: 1.12;
}

.overview-card small {
  display: block;
  margin-top: 7px;
  color: #9aa1ab;
  font-size: 11.5px;
}

.overview-card.accent-green {
  border-color: #cfe8d7;
  background: #f7fcf8;
}

.overview-card.accent-green strong {
  color: #287a45;
}

.overview-card.accent-blue {
  border-color: #d7e4f5;
  background: #f7faff;
}

.overview-card.accent-blue strong {
  color: #356aaf;
}

.summary-section {
  padding: 28px 34px;
  border-bottom: 1px solid #eceef1;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.section-heading > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-index {
  min-width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #f1f3f5;
  color: #697381;
  font-size: 16px;
  font-weight: 800;
}

.section-heading h3 {
  margin: 0;
  color: #18202b;
  font-size: 21px;
}

.section-note {
  color: #7d8793;
  font-size: 14px;
  font-weight: 650;
}

.split-card,
.exercise-summary,
.knowledge-layout {
  display: grid;
  gap: 24px;
  padding: 20px;
  border: 1px solid #e8eaed;
  border-radius: 17px;
  background: #fbfbfc;
}

.split-card {
  grid-template-columns: minmax(0, 1.3fr) minmax(360px, 0.7fr);
}

.rate-block,
.exercise-progress {
  padding: 4px 2px;
}

.rate-value {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.rate-value strong {
  color: #287a45;
  font-size: 42px;
  line-height: 1.05;
}

.rate-value.compact strong {
  color: #356aaf;
}

.progress-track,
.category-track {
  overflow: hidden;
  border-radius: 999px;
  background: #e8ece9;
}

.progress-track {
  height: 9px;
  margin-top: 16px;
}

.progress-track span,
.category-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #5b9a70;
}

.blue-track {
  background: #e6edf7;
}

.blue-track span {
  background: #5a7faf;
}

.rate-block p,
.exercise-progress p {
  margin: 12px 0 0;
  color: #697381;
  font-size: 13px;
  line-height: 1.7;
}

.mini-stats,
.exercise-side-stats,
.metric-row {
  display: grid;
  gap: 12px;
}

.mini-stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.mini-stats > div,
.exercise-side-stats > div,
.metric-item {
  display: grid;
  align-content: center;
  gap: 6px;
  min-height: 82px;
  padding: 13px 14px;
  border: 1px solid #e8eaed;
  border-radius: 14px;
  background: #ffffff;
}

.mini-stats span,
.exercise-side-stats span {
  color: #7d8793;
  font-size: 13.5px;
}

.mini-stats strong,
.exercise-side-stats strong,
.metric-item strong {
  color: #1f2937;
  font-size: 28px;
  line-height: 1.08;
}

.metric-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-item {
  min-height: 104px;
  padding: 18px;
  background: #fbfbfc;
}

.metric-item span {
  font-size: 13.5px;
}

.exercise-summary {
  grid-template-columns: minmax(0, 1.2fr) minmax(390px, 0.8fr);
  margin-bottom: 16px;
}

.exercise-side-stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e8eaed;
  border-radius: 15px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.summary-table th,
.summary-table td {
  padding: 13px 15px;
  border-bottom: 1px solid #edf0f2;
  color: #4b5563;
  font-size: 13px;
  text-align: center;
}

.summary-table th {
  background: #f8f9fa;
  color: #67707d;
  font-size: 12.5px;
  font-weight: 700;
}

.summary-table tbody tr:last-child td {
  border-bottom: 0;
}

.summary-table .name-cell {
  color: #1f2937;
  font-weight: 650;
  text-align: left;
}

.empty-cell,
.empty-block {
  color: #9098a3;
  text-align: center;
}

.knowledge-layout {
  grid-template-columns: minmax(230px, 0.36fr) minmax(0, 0.64fr);
}

.knowledge-total {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 12px;
}

.knowledge-total strong {
  margin-top: 4px;
  color: #111827;
  font-size: 40px;
}

.knowledge-total p {
  margin: 8px 0 0;
  color: #737d89;
  font-size: 13px;
  line-height: 1.65;
}

.category-list {
  display: grid;
  gap: 13px;
}

.category-row {
  display: grid;
  gap: 7px;
}

.category-label {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  color: #5d6672;
  font-size: 12.5px;
}

.category-label strong {
  color: #303946;
}

.category-track {
  height: 7px;
  background: #e9ecef;
}

.category-track span {
  background: #8b96a5;
}

.chapter-area {
  display: flex;
  align-items: flex-start;
  gap: 28px;
  padding: 20px;
  border: 1px solid #e8eaed;
  border-radius: 17px;
  background: #fbfbfc;
}

.chapter-count {
  min-width: 145px;
  display: grid;
  gap: 4px;
}

.chapter-count strong {
  color: #111827;
  font-size: 34px;
}

.chapter-count span {
  color: #737d89;
  font-size: 12.5px;
}

.chapter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  padding-top: 5px;
}

.chapter-tags span {
  padding: 7px 11px;
  border: 1px solid #dde1e6;
  border-radius: 999px;
  background: #ffffff;
  color: #4b5563;
  font-size: 12.5px;
}

.empty-block {
  padding: 28px;
  border: 1px dashed #d9dde2;
  border-radius: 15px;
  background: #fbfbfc;
  font-size: 13px;
}

.report-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 34px;
  background: #fafbfc;
  color: #8a93a0;
  font-size: 11.5px;
}

.pdf-section-lead,
.pdf-avoid-break {
  break-inside: avoid;
  page-break-inside: avoid;
}

.summary-table thead {
  display: table-header-group;
}

.summary-table tr,
.summary-table th,
.summary-table td {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* PDF uses an off-screen cloned report. The live page never changes while exporting. */
.summary-report.pdf-export-layout {
  width: 760px !important;
  max-width: 760px !important;
  border: 0;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
}

.summary-report.pdf-export-layout .report-header {
  display: block;
  padding: 22px 24px 18px;
}

.summary-report.pdf-export-layout .report-header h1 {
  font-size: 26px;
}

.summary-report.pdf-export-layout .report-course-line {
  font-size: 14px;
}

.summary-report.pdf-export-layout .report-inline-meta {
  margin-top: 12px;
  font-size: 12.5px;
}

.summary-report.pdf-export-layout .overview-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 16px 24px 18px;
}

.summary-report.pdf-export-layout .overview-card {
  padding: 13px 14px;
}

.summary-report.pdf-export-layout .overview-card strong {
  font-size: 27px;
}

.summary-report.pdf-export-layout .summary-section {
  padding: 20px 24px;
}

.summary-report.pdf-export-layout .section-heading {
  align-items: flex-start;
  margin-bottom: 13px;
}

.summary-report.pdf-export-layout .section-index {
  min-width: 34px;
  height: 34px;
  font-size: 15px;
}

.summary-report.pdf-export-layout .section-heading h3 {
  font-size: 20px;
}

.summary-report.pdf-export-layout .section-note {
  max-width: 250px;
  font-size: 12px;
  line-height: 1.5;
  text-align: right;
}

.summary-report.pdf-export-layout .split-card,
.summary-report.pdf-export-layout .exercise-summary,
.summary-report.pdf-export-layout .knowledge-layout {
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 15px;
}

.summary-report.pdf-export-layout .metric-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-report.pdf-export-layout .metric-item {
  min-height: 82px;
  padding: 13px 14px;
}

.summary-report.pdf-export-layout .metric-item strong,
.summary-report.pdf-export-layout .mini-stats strong,
.summary-report.pdf-export-layout .exercise-side-stats strong {
  font-size: 25px;
}

.summary-report.pdf-export-layout .mini-stats,
.summary-report.pdf-export-layout .exercise-side-stats {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-report.pdf-export-layout .mini-stats > div,
.summary-report.pdf-export-layout .exercise-side-stats > div {
  min-height: 76px;
  padding: 11px 13px;
}

.summary-report.pdf-export-layout .rate-value strong {
  font-size: 38px;
}

.summary-report.pdf-export-layout .table-wrap {
  overflow: visible;
}

.summary-report.pdf-export-layout .summary-table {
  min-width: 0;
  table-layout: fixed;
}

.summary-report.pdf-export-layout .summary-table th,
.summary-report.pdf-export-layout .summary-table td {
  padding: 9px 8px;
  font-size: 11px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.summary-report.pdf-export-layout .summary-table th {
  font-size: 10.5px;
}

.summary-report.pdf-export-layout .summary-table th:first-child,
.summary-report.pdf-export-layout .summary-table td:first-child {
  width: 31%;
}

.summary-report.pdf-export-layout .knowledge-layout {
  grid-template-columns: 1fr;
}

.summary-report.pdf-export-layout .knowledge-total {
  padding: 4px 2px 8px;
}

.summary-report.pdf-export-layout .chapter-area {
  flex-direction: column;
  gap: 14px;
  padding: 15px;
}

.summary-report.pdf-export-layout .chapter-count {
  min-width: 0;
}

.summary-report.pdf-export-layout .report-footer {
  padding: 14px 24px;
  font-size: 10.5px;
}

.summary-report.pdf-export-layout .pdf-new-page {
  break-before: page;
  page-break-before: always;
}

.summary-report.pdf-export-layout .pdf-table-page {
  break-inside: avoid;
  page-break-inside: avoid;
}

.summary-report.pdf-export-layout .pdf-table-page + .pdf-table-page {
  break-before: page;
  page-break-before: always;
  margin-top: 0;
}

@media (max-width: 1180px) {
  .overview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .split-card,
  .exercise-summary,
  .knowledge-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .report-header,
  .report-footer,
  .chapter-area {
    align-items: stretch;
    flex-direction: column;
  }

  .action-buttons {
    justify-content: flex-start;
  }

  .overview-grid,
  .metric-row,
  .mini-stats,
  .exercise-side-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-header,
  .overview-grid,
  .summary-section {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media print {
  .screen-only {
    display: none !important;
  }

  .summary-report {
    border: 0;
    border-radius: 0;
  }
}
</style>
