<template>
  <RouterView v-if="isStandalonePage" />

  <div v-else-if="isFocusMode" class="focus-layout">
    <RouterView />
  </div>

  <div v-else class="layout">
    <div class="course-panel">
      <div class="top-row">
        <button class="back-btn" @click="goCourseHome">
          <AppIcon name="arrow-left" />

          <span> 退出课程空间 </span>
        </button>

        <div class="teacher-area">
          <span class="teacher-name">
            {{ teacherName }}
          </span>

          <button
            v-if="isCourseActive"
            type="button"
            class="end-course-btn"
            @click="openEndCourseDialog"
          >
            <AppIcon name="ended" />
            <span>结束课程</span>
          </button>
        </div>
      </div>

      <div class="course-info">
        <div class="course-title-row">
          <h1>
            {{ currentCourseTitle }}
          </h1>

          <span class="course-status-badge" :class="currentCourseStatusClass">
            {{ currentCourseStatusText }}
          </span>
        </div>

        <p>
          {{ currentClassName }}

          <span class="divider"> ｜ </span>

          {{ currentSemester }}

          <span class="divider"> ｜ </span>

          {{ currentDate }}

          <span class="divider"> ｜ </span>

          {{ currentLesson }}
        </p>
      </div>
    </div>

    <!-- 课程空间导航：根据课程生命周期只展示当前阶段可用模块 -->
    <div class="nav-bar">
      <RouterLink
        v-if="courseAccess.showSign"
        :to="`${courseBasePath}/sign`"
        class="nav-item"
      >
        课堂签到
      </RouterLink>

      <RouterLink
        v-if="courseAccess.showRoll"
        :to="`${courseBasePath}/roll`"
        class="nav-item"
      >
        随机点名
      </RouterLink>

      <RouterLink
        v-if="courseAccess.showPerformance"
        :to="`${courseBasePath}/performance`"
        class="nav-item"
      >
        课堂表现
      </RouterLink>

      <RouterLink
        v-if="courseAccess.showMaterials"
        :to="`${courseBasePath}/materials`"
        class="nav-item"
        :class="{ 'router-link-active': isKnowledgeBaseRoute }"
      >
        课程知识库
      </RouterLink>

      <RouterLink
        v-if="courseAccess.showQuestions"
        :to="`${courseBasePath}/questions`"
        class="nav-item"
        :class="{ 'router-link-active': isQuestionBankRoute }"
      >
        课程题库
      </RouterLink>

      <RouterLink
        v-if="courseAccess.showStudents"
        :to="`${courseBasePath}/students`"
        class="nav-item"
      >
        学生名单
      </RouterLink>

      <RouterLink
        v-if="courseAccess.showSignRecords"
        :to="`${courseBasePath}/sign-records`"
        class="nav-item"
      >
        签到记录
      </RouterLink>

      <RouterLink
        v-if="courseAccess.showSummary"
        :to="`${courseBasePath}/summary`"
        class="nav-item"
      >
        课程总结
      </RouterLink>
    </div>

    <div
      v-if="!isCourseActive"
      class="course-state-notice"
      :class="currentCourseStatusClass"
    >
      <span class="course-state-notice-icon">
        <AppIcon :name="isCourseUpcoming ? 'time' : 'ended'" />
      </span>

      <div>
        <strong>{{ courseStateNoticeTitle }}</strong>
        <span>{{ courseStateNoticeText }}</span>
      </div>
    </div>

    <div class="page-content">
      <RouterView />
    </div>
  </div>

  <div
    v-if="showEndCourseDialog"
    class="course-end-mask"
    @click.self="closeEndCourseDialog"
  >
    <section class="course-end-dialog" role="dialog" aria-modal="true">
      <div class="course-end-icon">
        <AppIcon name="ended" />
      </div>

      <h2>确认结束课程？</h2>
      <p class="course-end-target">
        {{ currentCourseTitle }} · {{ currentClassName }}
      </p>

      <div class="course-end-note">
        <p>结课后，该课程将标记为“已结课”，历史教学数据会继续保留。</p>
        <p>请确认本学期教学活动已经结束。当前不提供恢复为进行中状态的入口。</p>
      </div>

      <div class="course-end-actions">
        <button
          type="button"
          class="course-end-cancel"
          @click="closeEndCourseDialog"
        >
          取消
        </button>

        <button
          type="button"
          class="course-end-confirm"
          :disabled="endingCourse"
          @click="confirmEndCourse"
        >
          {{ endingCourse ? "处理中..." : "确认结束课程" }}
        </button>
      </div>
    </section>
  </div>
</template>

<script>
import { useCourseStore } from "./store/courseStore";
import { useClassStore } from "./store/classStore";
import { useTeacherStore } from "./store/teacherStore";
import { useCourseLifecycleStore } from "./store/courseLifecycleStore";
import { useExerciseStore } from "./store/exerciseStore";
import {
  getCourseAccessPolicy,
  getCourseDefaultPath,
  isCourseSectionAllowed,
} from "./utils/coursePermissions";

import AppIcon from "./components/AppIcon.vue";

export default {
  components: {
    AppIcon,
  },

  data() {
    return {
      showEndCourseDialog: false,
      endingCourse: false,
    };
  },

  computed: {
    courseStore() {
      return useCourseStore();
    },

    classStore() {
      return useClassStore();
    },

    teacherStore() {
      return useTeacherStore();
    },

    courseLifecycleStore() {
      return useCourseLifecycleStore();
    },

    exerciseStore() {
      return useExerciseStore();
    },

    isLoginPage() {
      return this.$route.path === "/login";
    },

    isCourseHomePage() {
      return this.$route.path === "/courses";
    },

    isAdminPage() {
      return this.$route.path.startsWith("/admin");
    },

    isStandalonePage() {
      return this.isLoginPage || this.isCourseHomePage || this.isAdminPage;
    },

    isFocusMode() {
      return this.$route.meta.focusMode === true;
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

    currentCourseStatus() {
      if (!this.currentTeachingClass) {
        return "ACTIVE";
      }

      return this.courseLifecycleStore.getStatus(this.currentTeachingClass);
    },

    currentCourseStatusText() {
      if (this.currentCourseStatus === "UPCOMING") return "未开始";
      if (this.currentCourseStatus === "ENDED") return "已结课";
      return "进行中";
    },

    currentCourseStatusClass() {
      if (this.currentCourseStatus === "UPCOMING") return "upcoming";
      if (this.currentCourseStatus === "ENDED") return "ended";
      return "active";
    },

    courseAccess() {
      return getCourseAccessPolicy(this.currentCourseStatus);
    },

    isCourseUpcoming() {
      return this.currentCourseStatus === "UPCOMING";
    },

    isCourseActive() {
      return this.currentCourseStatus === "ACTIVE";
    },

    isCourseEnded() {
      return this.currentCourseStatus === "ENDED";
    },

    courseStateNoticeTitle() {
      return this.isCourseUpcoming ? "课程尚未开始" : "课程已结课";
    },

    courseStateNoticeText() {
      if (this.isCourseUpcoming) {
        return "你可以提前准备课程资料、题库和练习草稿，课程开始后即可开展课堂教学。";
      }

      return "你仍可以查看历史数据、完成练习批改，并继续整理课程资料和题目。";
    },

    courseBasePath() {
      return `/course/${this.teachingClassId}`;
    },

    isKnowledgeBaseRoute() {
      return this.$route.path.startsWith(`${this.courseBasePath}/materials`);
    },

    isQuestionBankRoute() {
      return this.$route.path.startsWith(`${this.courseBasePath}/questions`);
    },

    currentCourseTitle() {
      return this.currentTeachingClass
        ? this.currentTeachingClass.courseName
        : "未选择课程";
    },

    currentClassName() {
      return this.currentTeachingClass
        ? this.currentTeachingClass.className
        : "请返回课程首页选择班级";
    },

    currentSemester() {
      return this.currentTeachingClass
        ? this.currentTeachingClass.semester
        : "";
    },

    teacherName() {
      return this.teacherStore.teacher?.name || "张老师";
    },

    currentDate() {
      const now = new Date();

      return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    },

    currentLesson() {
      const now = new Date();

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const lessons = [
        {
          num: 1,
          start: 8 * 60 + 30,
          end: 9 * 60 + 15,
        },

        {
          num: 2,
          start: 9 * 60 + 25,
          end: 10 * 60 + 10,
        },

        {
          num: 3,
          start: 10 * 60 + 30,
          end: 11 * 60 + 15,
        },

        {
          num: 4,
          start: 11 * 60 + 25,
          end: 12 * 60 + 10,
        },

        {
          num: 5,
          start: 14 * 60 + 30,
          end: 15 * 60 + 15,
        },

        {
          num: 6,
          start: 15 * 60 + 25,
          end: 16 * 60 + 10,
        },

        {
          num: 7,
          start: 16 * 60 + 30,
          end: 17 * 60 + 15,
        },

        {
          num: 8,
          start: 17 * 60 + 25,
          end: 18 * 60 + 10,
        },

        {
          num: 9,
          start: 19 * 60 + 30,
          end: 20 * 60 + 15,
        },

        {
          num: 10,
          start: 20 * 60 + 25,
          end: 21 * 60 + 10,
        },
      ];

      const lesson = lessons.find((item) => {
        return currentMinutes >= item.start && currentMinutes <= item.end;
      });

      return lesson ? `当前第${lesson.num}节课` : "当前非上课时间";
    },
  },

  watch: {
    "$route.params.teachingClassId"() {
      this.restoreTeachingClassFromRoute();
    },

    "$route.fullPath"() {
      this.$nextTick(() => this.ensureCurrentRouteAllowed());
    },

    currentCourseStatus() {
      this.$nextTick(() => this.ensureCurrentRouteAllowed());
    },
  },

  mounted() {
    this.restoreTeachingClassFromRoute();
  },

  methods: {
    async restoreTeachingClassFromRoute() {
      if (!this.teachingClassId) {
        return;
      }

      let target = this.courseStore.switchTeachingClass(this.teachingClassId);

      if (!target) {
        const teacherId = this.teacherStore.teacher?.id;

        if (!teacherId) {
          return;
        }

        await this.courseStore.fetchTeachingClasses(teacherId);

        target = this.courseStore.switchTeachingClass(this.teachingClassId);
      }

      if (target) {
        this.classStore.switchClass(target.classId || target.id);
        this.$nextTick(() => this.ensureCurrentRouteAllowed());
      }
    },

    getCurrentCourseSection() {
      const prefix = `${this.courseBasePath}/`;

      if (!this.$route.path.startsWith(prefix)) {
        return "";
      }

      return this.$route.path.slice(prefix.length).split("/")[0] || "";
    },

    ensureCurrentRouteAllowed() {
      if (!this.currentTeachingClass || !this.teachingClassId) {
        return;
      }

      const section = this.getCurrentCourseSection();

      if (!section) {
        return;
      }

      if (!isCourseSectionAllowed(this.currentCourseStatus, section)) {
        const target = getCourseDefaultPath(
          this.teachingClassId,
          this.currentCourseStatus
        );

        if (this.$route.path !== target) {
          this.$router.replace(target);
        }
        return;
      }

      const path = this.$route.path;

      if (this.isCourseEnded) {
        const noteEditMatch = path.match(
          new RegExp(`^${this.courseBasePath}/materials/note/([^/]+)/edit$`)
        );

        if (noteEditMatch) {
          this.$router.replace(
            `${this.courseBasePath}/materials/note/${noteEditMatch[1]}`
          );
          return;
        }

        if (path === `${this.courseBasePath}/materials/note/new`) {
          this.$router.replace(`${this.courseBasePath}/materials`);
          return;
        }

        if (path === `${this.courseBasePath}/questions/exercises/new`) {
          this.$router.replace(`${this.courseBasePath}/questions`);
          return;
        }
      }

      if (
        this.isCourseUpcoming &&
        path.includes(`${this.courseBasePath}/questions/exercises/`) &&
        path.includes("/results")
      ) {
        this.$router.replace(`${this.courseBasePath}/questions`);
      }
    },

    openEndCourseDialog() {
      if (!this.currentTeachingClass || !this.isCourseActive) {
        return;
      }

      this.showEndCourseDialog = true;
    },

    closeEndCourseDialog() {
      if (this.endingCourse) {
        return;
      }

      this.showEndCourseDialog = false;
    },

    async confirmEndCourse() {
      if (!this.currentTeachingClass || !this.isCourseActive) {
        this.showEndCourseDialog = false;
        return;
      }

      this.endingCourse = true;

      try {
        this.courseLifecycleStore.endCourse(this.currentTeachingClass.id);
        this.exerciseStore.endActiveExercises(this.currentTeachingClass.id);
        this.showEndCourseDialog = false;
        this.$nextTick(() => this.ensureCurrentRouteAllowed());
      } finally {
        this.endingCourse = false;
      }
    },

    goCourseHome() {
      this.$router.push("/courses");
    },
  },
};
</script>

<style>
body {
  margin: 0;

  background: #f5f6f8;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
}

#app {
  width: 100%;
  max-width: none;

  margin: 0;
}

.layout,
.focus-layout {
  min-height: 100vh;

  box-sizing: border-box;

  padding: 24px;
}

.focus-layout {
  background: #f5f6f8;
}

.course-panel {
  margin-bottom: 20px;

  padding: 28px 32px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 24px;
}

.top-row {
  display: flex;

  align-items: center;
  justify-content: space-between;

  margin-bottom: 24px;
}

.back-btn {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 8px;

  padding: 10px 16px;

  background: #f3f4f6;
  color: #111827;

  border: none;
  border-radius: 12px;

  cursor: pointer;

  font-size: 14px;
}

.back-btn:hover {
  background: #e5e7eb;
}

.teacher-area {
  display: flex;

  align-items: center;

  gap: 12px;

  color: #374151;

  font-size: 14px;
}

.teacher-name {
  padding: 8px 12px;

  background: #f3f4f6;

  border-radius: 999px;

  font-weight: 600;
}

.course-info {
  text-align: center;
}

.course-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.course-info h1 {
  margin: 0;

  color: #111827;

  font-size: 36px;
}

.course-info p {
  margin: 12px 0 0;

  color: #6b7280;

  font-size: 15px;
}

.course-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  box-sizing: border-box;
}

.course-status-badge.upcoming {
  border-color: #f5d9a8;
  background: #fff9ed;
  color: #a15c08;
}

.course-status-badge.active {
  border-color: #cfe9d7;
  background: #f0f9f3;
  color: #287a45;
}

.course-status-badge.ended {
  border-color: #cddff8;
  background: #f2f7fd;
  color: #356aaf;
}

.end-course-btn {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  transition: 0.18s ease;
}

.end-course-btn:hover {
  border-color: #fecaca;
  background: #fff7f7;
  color: #b42335;
}

.course-end-mask {
  position: fixed;
  inset: 0;
  z-index: 2400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(2px);
}

.course-end-dialog {
  width: min(500px, 100%);
  box-sizing: border-box;
  padding: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18);
  text-align: left;
}

.course-end-icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  background: #fff3f3;
  color: #b42335;
  font-size: 23px;
}

.course-end-dialog h2 {
  margin: 18px 0 0;
  color: #111827;
  font-size: 22px;
}

.course-end-target {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.6;
}

.course-end-note {
  margin-top: 20px;
  padding: 15px 16px;
  border: 1px solid #eceff3;
  border-radius: 14px;
  background: #fafafa;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.75;
}

.course-end-note p {
  margin: 0;
}

.course-end-note p + p {
  margin-top: 6px;
}

.course-end-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.course-end-cancel,
.course-end-confirm {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}

.course-end-cancel {
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
}

.course-end-cancel:hover {
  background: #f7f7f8;
}

.course-end-confirm {
  border: 1px solid #b42335;
  background: #b42335;
  color: #ffffff;
}

.course-end-confirm:hover {
  background: #9f1f31;
}

.course-end-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  margin: 0 6px;

  color: #d1d5db;
}

/* Tab */

.nav-bar {
  display: flex;

  gap: 12px;

  margin-bottom: 20px;

  padding: 12px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 18px;
}

.nav-item {
  padding: 12px 20px;

  color: #374151;

  border-radius: 12px;

  text-decoration: none;

  font-weight: 600;

  transition: 0.2s;
}

.nav-item:hover {
  background: #f3f4f6;
}

.nav-item.router-link-active {
  background: #111827;
  color: #ffffff;
}

.course-state-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 18px;
  padding: 14px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  color: #4b5563;
}

.course-state-notice.upcoming {
  border-color: #f3dfb8;
  background: #fffaf1;
}

.course-state-notice.ended {
  border-color: #d7e4f5;
  background: #f6f9fd;
}

.course-state-notice-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.78);
  font-size: 18px;
}

.course-state-notice > div {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.course-state-notice strong {
  color: #1f2937;
  font-size: 15px;
}

.course-state-notice span:not(.course-state-notice-icon) {
  font-size: 14px;
  line-height: 1.6;
}

.page-content {
  min-height: 500px;
}
</style>
