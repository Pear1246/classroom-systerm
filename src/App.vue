<template>
  <RouterView v-if="isStandalonePage" />

  <div v-else class="layout">
    <div class="course-panel">
      <div class="top-row">
        <button class="back-btn" @click="goCourseHome">
          <AppIcon name="arrow-left" />

          <span> 返回课程首页 </span>
        </button>

        <div class="teacher-area">
          <span>
            {{ teacherName }}
          </span>

          <span class="logout-btn" @click="logout">
            <AppIcon name="logout" />

            <span> 退出登录 </span>
          </span>
        </div>
      </div>

      <div class="course-info">
        <h1>
          {{ currentCourseTitle }}
        </h1>

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

    <!-- 课程空间导航 -->
    <div class="nav-bar">
      <RouterLink :to="`${courseBasePath}/sign`" class="nav-item">
        课堂签到
      </RouterLink>

      <RouterLink :to="`${courseBasePath}/roll`" class="nav-item">
        随机点名
      </RouterLink>

      <RouterLink :to="`${courseBasePath}/performance`" class="nav-item">
        课堂表现
      </RouterLink>

      <RouterLink :to="`${courseBasePath}/students`" class="nav-item">
        学生名单
      </RouterLink>

      <RouterLink :to="`${courseBasePath}/sign-records`" class="nav-item">
        签到记录
      </RouterLink>
    </div>

    <div class="page-content">
      <RouterView />
    </div>
  </div>
</template>

<script>
import { useCourseStore } from "./store/courseStore";
import { useClassStore } from "./store/classStore";
import { useTeacherStore } from "./store/teacherStore";

import AppIcon from "./components/AppIcon.vue";

export default {
  components: {
    AppIcon,
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

    teachingClassId() {
      return Number(this.$route.params.teachingClassId);
    },

    currentTeachingClass() {
      if (this.courseStore.currentTeachingClass) {
        return this.courseStore.currentTeachingClass;
      }

      return (
        this.courseStore.teachingClasses.find(
          (item) => Number(item.id) === this.teachingClassId
        ) || null
      );
    },

    courseBasePath() {
      return `/course/${this.teachingClassId}`;
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
      }
    },

    goCourseHome() {
      this.$router.push("/courses");
    },

    logout() {
      this.teacherStore.logout();

      localStorage.removeItem("isLogin");

      localStorage.removeItem("token");

      localStorage.removeItem("teacherId");

      localStorage.removeItem("teacherName");

      localStorage.removeItem("loginExpireTime");

      this.$router.push("/login");
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

.layout {
  min-height: 100vh;

  box-sizing: border-box;

  padding: 24px;
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

.logout-btn {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 8px;

  padding: 9px 14px;

  background: #111827;
  color: #ffffff;

  border-radius: 10px;

  cursor: pointer;

  user-select: none;
}

.course-info {
  text-align: center;
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

.page-content {
  min-height: 500px;
}
</style>
