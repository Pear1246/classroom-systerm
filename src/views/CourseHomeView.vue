<template>
  <div class="course-home">
    <div class="home-header">
      <div>
        <div class="small-title">课程空间</div>
        <h1>智课云伴</h1>
        <p>{{ teacherName }}，请选择要进入的课程空间</p>
      </div>

      <button class="logout-btn" @click="logout">退出登录</button>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon">⌕</span>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索课程名称、班级或学期"
        />
      </div>

      <select v-model="selectedSemester">
        <option value="">全部学期</option>
        <option v-for="item in semesterList" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </div>

    <section v-if="pinnedCourses.length > 0" class="section">
      <div class="section-title">
        <div>
          <h2>置顶课程</h2>
          <p>常用课程快速进入</p>
        </div>
      </div>

      <div class="pinned-grid">
        <div
          v-for="item in pinnedCourses"
          :key="item.id"
          class="course-card"
          @click="enterCourse(item)"
        >
          <div class="card-top">
            <span class="tag">课程</span>
            <span class="code">{{ item.code }}</span>
          </div>

          <h3>{{ item.courseName }}</h3>

          <p class="class-name">{{ item.className }}</p>

          <div class="card-info">
            <span>{{ item.semester }}</span>
            <span>{{ item.studentCount }}人</span>
          </div>

          <div class="card-footer">
            <span>进入课程空间</span>
            <span class="arrow">→</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-title">
        <div>
          <h2>我的课程</h2>
          <p>按学期查看课程空间</p>
        </div>
      </div>

      <div
        v-for="semester in visibleSemesters"
        :key="semester"
        class="semester-block"
      >
        <div class="semester-header" @click="toggleSemester(semester)">
          <div>
            <strong>{{ semester }}</strong>
            <span>共 {{ coursesBySemester[semester].length }} 门课程</span>
          </div>

          <span class="fold-icon">
            {{ expandedSemesters[semester] ? "⌃" : "⌄" }}
          </span>
        </div>

        <div v-show="expandedSemesters[semester]" class="course-list">
          <div
            v-for="item in coursesBySemester[semester]"
            :key="item.id"
            class="course-row"
            @click="enterCourse(item)"
          >
            <div class="row-icon">
              <span>课</span>
            </div>

            <div class="row-info">
              <h3>{{ item.courseName }}</h3>
              <p>{{ item.className }}</p>
              <span>{{ item.studentCount }}人 ｜ {{ item.code }}</span>
            </div>

            <button class="enter-btn">进入课程</button>
          </div>
        </div>
      </div>

      <div v-if="visibleSemesters.length === 0" class="empty-box">
        暂无匹配课程
      </div>
    </section>
  </div>
</template>

<script>
import { useCourseStore } from "../store/courseStore";
import { useClassStore } from "../store/classStore";
import { useTeacherStore } from "../store/teacherStore";

export default {
  data() {
    return {
      keyword: "",
      selectedSemester: "",
      expandedSemesters: {},
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

    teacherName() {
      return this.teacherStore.teacher?.name || "张老师";
    },

    allCourses() {
      return this.courseStore.teachingClasses;
    },

    semesterList() {
      return [...new Set(this.allCourses.map((item) => item.semester))];
    },

    filteredCourses() {
      const keyword = this.keyword.trim();

      return this.allCourses.filter((item) => {
        const matchKeyword =
          !keyword ||
          item.courseName.includes(keyword) ||
          item.className.includes(keyword) ||
          item.semester.includes(keyword) ||
          item.code.includes(keyword);

        const matchSemester =
          !this.selectedSemester || item.semester === this.selectedSemester;

        return matchKeyword && matchSemester;
      });
    },

    pinnedCourses() {
      return this.filteredCourses.filter((item) => item.isPinned);
    },

    coursesBySemester() {
      const result = {};

      this.filteredCourses.forEach((item) => {
        if (!result[item.semester]) {
          result[item.semester] = [];
        }

        result[item.semester].push(item);
      });

      return result;
    },

    visibleSemesters() {
      return Object.keys(this.coursesBySemester);
    },
  },

  async mounted() {
    if (this.teacherStore.teacher?.id) {
      await this.courseStore.fetchTeachingClasses(this.teacherStore.teacher.id);
    }

    this.expandedSemesters = {};

    this.semesterList.forEach((semester, index) => {
      this.expandedSemesters[semester] = index === 0;
    });
  },

  methods: {
    enterCourse(item) {
      this.courseStore.switchTeachingClass(item.id);
      this.classStore.switchClass(item.classId);

      this.$router.push(`/course/${item.id}/roll`);
    },

    toggleSemester(semester) {
      this.expandedSemesters[semester] = !this.expandedSemesters[semester];
    },

    logout() {
      this.teacherStore.logout();

      localStorage.removeItem("isLogin");
      localStorage.removeItem("loginExpireTime");

      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.course-home {
  min-height: 100vh;
  padding: 32px;
  background: #f5f6f8;
  box-sizing: border-box;
}

.home-header {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  padding: 30px 34px;
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.small-title {
  display: inline-block;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 13px;
}

.home-header h1 {
  margin: 0;
  font-size: 36px;
  color: #111827;
  letter-spacing: 1px;
}

.home-header p {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 15px;
}

.logout-btn {
  border: none;
  background: #111827;
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: #000000;
}

.toolbar {
  display: flex;
  gap: 14px;
  margin-bottom: 22px;
}

.search-box {
  flex: 1;
  height: 48px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
}

.search-icon {
  color: #9ca3af;
  font-size: 22px;
}

.search-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 15px;
  color: #111827;
}

.search-box input::placeholder {
  color: #9ca3af;
}

.toolbar select {
  width: 220px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  padding: 0 14px;
  font-size: 15px;
  color: #374151;
  outline: none;
}

.section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  padding: 28px;
  margin-bottom: 22px;
}

.section-title {
  margin-bottom: 20px;
}

.section-title h2 {
  margin: 0;
  font-size: 26px;
  color: #111827;
}

.section-title p {
  margin: 8px 0 0;
  color: #9ca3af;
  font-size: 14px;
}

.pinned-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.course-card {
  min-height: 210px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #ffffff;
  padding: 22px;
  box-sizing: border-box;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22px;
}

.tag {
  padding: 5px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 13px;
}

.code {
  color: #9ca3af;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.course-card h3 {
  margin: 0 0 10px;
  color: #111827;
  font-size: 22px;
}

.class-name {
  margin: 0;
  color: #4b5563;
  font-size: 15px;
  line-height: 1.6;
}

.card-info {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
  color: #9ca3af;
  font-size: 14px;
}

.card-footer {
  margin-top: auto;
  padding-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #111827;
  font-weight: 600;
}

.arrow {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.semester-block {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 16px;
  background: #ffffff;
}

.semester-header {
  background: #fafafa;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.semester-header strong {
  font-size: 20px;
  color: #111827;
}

.semester-header span {
  margin-left: 12px;
  color: #9ca3af;
  font-size: 14px;
}

.fold-icon {
  font-size: 26px;
  color: #111827;
}

.course-list {
  padding: 6px 18px 18px;
}

.course-row {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.course-row:last-child {
  border-bottom: none;
}

.row-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #f3f4f6;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.row-info {
  flex: 1;
}

.row-info h3 {
  margin: 0 0 8px;
  font-size: 21px;
  color: #111827;
}

.row-info p {
  margin: 0 0 8px;
  color: #4b5563;
}

.row-info span {
  color: #9ca3af;
  font-size: 14px;
}

.enter-btn {
  border: none;
  background: #111827;
  color: white;
  padding: 10px 18px;
  border-radius: 12px;
  cursor: pointer;
}

.enter-btn:hover {
  background: #000000;
}

.empty-box {
  text-align: center;
  color: #9ca3af;
  padding: 40px 0;
}

@media (max-width: 1000px) {
  .pinned-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
  }

  .toolbar select {
    width: 100%;
    height: 48px;
  }

  .course-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .enter-btn {
    width: 100%;
  }
}
</style>
