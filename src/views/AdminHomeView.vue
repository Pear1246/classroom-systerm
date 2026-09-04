<template>
  <div class="admin-page">
    <header class="top-bar">
      <div>
        <div class="brand">智课云伴 · 管理端</div>

        <h1>课程空间管理</h1>

        <p>维护平台课程空间、授课教师与基础数据</p>
      </div>

      <div class="top-actions">
        <button class="nav-btn active">课程空间</button>

        <button class="nav-btn" @click="goStudentPage">
          <AppIcon name="user" />
          <span>学生账号</span>
        </button>

        <button class="logout-btn" @click="logout">
          <AppIcon name="logout" />
          <span>退出登录</span>
        </button>
      </div>
    </header>

    <section class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">课程空间总数</div>

        <div class="stat-value">
          {{ classList.length }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">学生账号总数</div>

        <div class="stat-value">
          {{ studentCount }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">平台教师数量</div>

        <div class="stat-value">
          {{ teachers.length }}
        </div>
      </div>
    </section>

    <section class="main-card">
      <div class="section-header">
        <div>
          <h2>课程空间列表</h2>
          <p>按学期折叠展示所有课程空间</p>
        </div>

        <button class="primary-btn" @click="toggleCreatePanel">
          <AppIcon :name="showCreatePanel ? 'arrow-up' : 'plus'" />
          <span>
            {{ showCreatePanel ? "收起表单" : "新建课程空间" }}
          </span>
        </button>
      </div>

      <div v-if="showCreatePanel" class="create-panel">
        <div class="panel-title">新建课程空间</div>

        <div class="form-grid">
          <label>
            <span>课程名称 *</span>

            <input
              v-model="form.courseName"
              type="text"
              placeholder="例如：数据结构"
            />
          </label>

          <label>
            <span>班级名称 *</span>

            <input
              v-model="form.name"
              type="text"
              placeholder="例如：24计算机科学与技术1班"
            />
          </label>

          <label>
            <span>课程编号</span>

            <input
              v-model="form.courseCode"
              type="text"
              placeholder="例如：DS101"
            />
          </label>

          <label>
            <span>学期</span>

            <AppSelect
              v-model="form.semester"
              :options="createSemesterOptions"
            />
          </label>

          <label>
            <span>授课教师 *</span>

            <AppSelect
              v-model="form.userId"
              :options="teacherOptions"
              placeholder="请选择授课教师"
            />
          </label>
        </div>

        <div class="form-actions">
          <button class="cancel-btn" @click="resetForm">清空</button>

          <button class="submit-btn" :disabled="creating" @click="createClass">
            {{ creating ? "创建中..." : "确认创建" }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="empty-box">正在加载课程空间...</div>

      <div v-else-if="classList.length === 0" class="empty-box">
        暂无课程空间，可点击右上角新建课程空间
      </div>

      <div v-else class="semester-list">
        <div
          v-for="group in groupedClassList"
          :key="group.semester"
          class="semester-block"
        >
          <div class="semester-header" @click="toggleSemester(group.semester)">
            <div>
              <div class="semester-title">
                {{ group.semester }}
              </div>

              <div class="semester-count">
                共 {{ group.courses.length }} 个课程空间
              </div>
            </div>

            <button type="button" class="semester-arrow-btn" tabindex="-1">
              <AppIcon
                :name="
                  isSemesterOpen(group.semester) ? 'arrow-up' : 'arrow-down'
                "
              />
            </button>
          </div>

          <div v-if="isSemesterOpen(group.semester)" class="course-list">
            <div
              v-for="course in group.courses"
              :key="course.id"
              class="course-card"
            >
              <div class="course-main">
                <div class="course-title-row">
                  <h3>
                    {{ course.courseName }}
                  </h3>

                  <span class="semester-tag">
                    {{ course.semester || "未设置学期" }}
                  </span>
                </div>

                <div class="course-info">
                  <span> 班级：{{ getClassName(course) }} </span>

                  <span> 课程编号：{{ course.courseCode || "未填写" }} </span>

                  <span>
                    授课教师：{{ course.teacherName || "未匹配教师" }}
                  </span>
                </div>

                <div class="course-time">
                  创建时间：{{ formatDate(course.createdAt) }}
                </div>
              </div>

              <div class="course-actions">
                <button class="edit-btn" @click="openEditDialog(course)">
                  <AppIcon name="edit" />
                  <span>编辑</span>
                </button>

                <button class="danger-btn" @click="openDeleteDialog(course)">
                  <AppIcon name="delete" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="editTarget" class="dialog-mask" @click.self="closeEditDialog">
      <div class="edit-dialog">
        <div class="dialog-title-row">
          <div>
            <h3>编辑课程空间</h3>

            <p>管理员可以修改课程信息以及更换授课教师</p>
          </div>

          <button class="close-btn" @click="closeEditDialog">×</button>
        </div>

        <div class="form-grid">
          <label>
            <span>课程名称 *</span>

            <input v-model="editForm.courseName" type="text" />
          </label>

          <label>
            <span>班级名称 *</span>

            <input v-model="editForm.className" type="text" />
          </label>

          <label>
            <span>课程编号</span>

            <input v-model="editForm.courseCode" type="text" />
          </label>

          <label>
            <span>学期</span>

            <AppSelect
              v-model="editForm.semester"
              :options="editSemesterOptions"
            />
          </label>

          <label>
            <span>授课教师 *</span>

            <AppSelect
              v-model="editForm.userId"
              :options="teacherOptions"
              placeholder="请选择授课教师"
            />
          </label>
        </div>

        <div class="form-actions">
          <button class="cancel-btn" @click="closeEditDialog">取消</button>

          <button class="submit-btn" :disabled="updating" @click="updateClass">
            {{ updating ? "保存中..." : "保存修改" }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="deleteTarget"
      class="dialog-mask"
      @click.self="closeDeleteDialog"
    >
      <div class="dialog-card">
        <div class="danger-icon">!</div>

        <h3>确认删除课程空间？</h3>

        <p>
          你正在删除
          <strong>
            {{ deleteTarget.courseName }}
          </strong>
          -
          <strong>
            {{ getClassName(deleteTarget) }}
          </strong>
        </p>

        <p class="dialog-tip">
          删除操作可能影响该课程已经产生的关联数据， 请确认无误后再继续。
        </p>

        <div class="dialog-actions">
          <button class="cancel-btn" @click="closeDeleteDialog">取消</button>

          <button
            class="danger-confirm-btn"
            :disabled="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? "删除中..." : "确认删除" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppIcon from "../components/AppIcon.vue";
import AppSelect from "../components/AppSelect.vue";

import { useAdminStore } from "../store/adminStore";

import {
  getCurrentSemester,
  getSemesterOptions,
  mergeSemesterOptions,
  sortSemesters,
  getClosestSemester,
} from "../utils/semester";

import {
  getAdminClasses,
  createAdminClass,
  updateAdminClass,
  deleteAdminClass,
  getAdminStudents,
} from "../api/admin";

export default {
  components: {
    AppIcon,
    AppSelect,
  },

  data() {
    return {
      loading: false,
      creating: false,
      updating: false,
      deleting: false,

      classList: [],
      teachers: [],
      studentCount: 0,

      showCreatePanel: false,

      form: {
        courseName: "",
        name: "",
        courseCode: "",
        semester: getCurrentSemester(),
        userId: "",
      },

      editTarget: null,

      editForm: {
        courseName: "",
        className: "",
        courseCode: "",
        semester: "",
        userId: "",
      },

      openSemesterMap: {},
      deleteTarget: null,
    };
  },

  computed: {
    teacherOptions() {
      return this.teachers.map((teacher) => ({
        label:
          teacher.name ||
          teacher.realName ||
          teacher.username ||
          `教师 ${teacher.id}`,
        value: teacher.id,
      }));
    },

    teacherMap() {
      const map = {};

      this.teachers.forEach((teacher) => {
        map[teacher.id] = teacher.name || teacher.realName || teacher.username;
      });

      return map;
    },

    createSemesterOptions() {
      return getSemesterOptions(5);
    },

    editSemesterOptions() {
      return mergeSemesterOptions(
        getSemesterOptions(5),
        this.editForm.semester ? [this.editForm.semester] : []
      );
    },

    groupedClassList() {
      const map = {};

      this.classList.forEach((course) => {
        const semester = course.semester || "未设置学期";

        if (!map[semester]) {
          map[semester] = [];
        }

        map[semester].push(course);
      });

      return sortSemesters(Object.keys(map)).map((semester) => {
        return {
          semester,
          courses: map[semester],
        };
      });
    },
  },

  async mounted() {
    await this.loadPageData();
  },

  methods: {
    async loadPageData() {
      this.loading = true;

      try {
        const adminStore = useAdminStore();

        await adminStore.fetchTeachers();

        this.teachers = adminStore.teachers;

        const [classes, students] = await Promise.all([
          getAdminClasses(),
          getAdminStudents().catch(() => []),
        ]);

        this.classList = Array.isArray(classes)
          ? classes.map((item) => {
              const teacherId = item.userId ?? item.teacherId;

              return {
                ...item,

                teacherName:
                  item.teacherName || this.teacherMap[teacherId] || "",
              };
            })
          : [];

        this.studentCount = Array.isArray(students) ? students.length : 0;

        this.initSemesterOpenState();
      } catch (error) {
        console.error("加载管理端课程数据失败：", error);

        alert(error?.message || "加载管理端课程数据失败");
      } finally {
        this.loading = false;
      }
    },

    getClassName(course) {
      return course.className || course.name || "未设置班级";
    },

    initSemesterOpenState() {
      const nextMap = {};
      const oldMap = this.openSemesterMap || {};

      const hasOldState = Object.keys(oldMap).length > 0;

      const semesters = this.groupedClassList.map((group) => group.semester);

      const defaultSemester = getClosestSemester(semesters);

      this.groupedClassList.forEach((group) => {
        nextMap[group.semester] = hasOldState
          ? Boolean(oldMap[group.semester])
          : group.semester === defaultSemester;
      });

      if (semesters.length > 0 && !Object.values(nextMap).some(Boolean)) {
        nextMap[defaultSemester] = true;
      }

      this.openSemesterMap = nextMap;
    },

    toggleSemester(semester) {
      this.openSemesterMap = {
        ...this.openSemesterMap,

        [semester]: !this.openSemesterMap[semester],
      };
    },

    isSemesterOpen(semester) {
      return !!this.openSemesterMap[semester];
    },

    toggleCreatePanel() {
      this.showCreatePanel = !this.showCreatePanel;

      if (!this.showCreatePanel) {
        this.resetForm();
      }
    },

    validateCreateForm() {
      if (!this.form.courseName.trim()) {
        alert("请输入课程名称");
        return false;
      }

      if (!this.form.name.trim()) {
        alert("请输入班级名称");
        return false;
      }

      if (!this.form.userId) {
        alert("请选择授课教师");
        return false;
      }

      return true;
    },

    async createClass() {
      if (!this.validateCreateForm()) {
        return;
      }

      this.creating = true;

      try {
        await createAdminClass({
          courseName: this.form.courseName.trim(),

          name: this.form.name.trim(),

          courseCode: this.form.courseCode.trim(),

          semester: this.form.semester.trim(),

          userId: Number(this.form.userId),
        });

        alert("课程空间创建成功");

        this.resetForm();
        this.showCreatePanel = false;

        await this.loadPageData();
      } catch (error) {
        console.error("创建课程空间失败：", error);

        alert(error?.message || "创建课程空间失败");
      } finally {
        this.creating = false;
      }
    },

    resetForm() {
      this.form = {
        courseName: "",
        name: "",
        courseCode: "",
        semester: getCurrentSemester(),
        userId: "",
      };
    },

    openEditDialog(course) {
      this.editTarget = course;

      this.editForm = {
        courseName: course.courseName || "",

        className: this.getClassName(course),

        courseCode: course.courseCode || "",

        semester: course.semester || "",

        userId: course.userId ?? course.teacherId ?? "",
      };
    },

    closeEditDialog() {
      if (this.updating) {
        return;
      }

      this.editTarget = null;

      this.editForm = {
        courseName: "",
        className: "",
        courseCode: "",
        semester: "",
        userId: "",
      };
    },

    async updateClass() {
      if (!this.editTarget) {
        return;
      }

      if (!this.editForm.courseName.trim()) {
        alert("请输入课程名称");
        return;
      }

      if (!this.editForm.className.trim()) {
        alert("请输入班级名称");
        return;
      }

      if (!this.editForm.userId) {
        alert("请选择授课教师");
        return;
      }

      this.updating = true;

      try {
        await updateAdminClass(this.editTarget.id, {
          courseName: this.editForm.courseName.trim(),

          className: this.editForm.className.trim(),

          semester: this.editForm.semester.trim(),

          courseCode: this.editForm.courseCode.trim(),

          userId: Number(this.editForm.userId),
        });

        alert("课程修改成功");

        this.closeEditDialog();

        await this.loadPageData();
      } catch (error) {
        console.error("修改课程空间失败：", error);

        alert(error?.message || "课程修改失败");
      } finally {
        this.updating = false;
      }
    },

    openDeleteDialog(course) {
      this.deleteTarget = course;
    },

    closeDeleteDialog() {
      if (this.deleting) {
        return;
      }

      this.deleteTarget = null;
    },

    async confirmDelete() {
      if (!this.deleteTarget) {
        return;
      }

      this.deleting = true;

      try {
        await deleteAdminClass(this.deleteTarget.id);

        alert("课程空间删除成功");

        this.deleteTarget = null;

        await this.loadPageData();
      } catch (error) {
        console.error("删除课程空间失败：", error);

        alert(error?.message || "删除课程空间失败");
      } finally {
        this.deleting = false;
      }
    },

    goStudentPage() {
      this.$router.push("/admin/students");
    },

    logout() {
      const adminStore = useAdminStore();

      adminStore.logout();

      this.$router.replace({
        path: "/login",

        query: {
          role: "admin",
        },
      });
    },

    formatDate(value) {
      if (!value) {
        return "暂无";
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return value;
      }

      const y = date.getFullYear();

      const m = String(date.getMonth() + 1).padStart(2, "0");

      const d = String(date.getDate()).padStart(2, "0");

      const h = String(date.getHours()).padStart(2, "0");

      const min = String(date.getMinutes()).padStart(2, "0");

      return `${y}-${m}-${d} ${h}:${min}`;
    },
  },
};
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 36px;
  box-sizing: border-box;
}

.top-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 28px;
}

.brand {
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: #ffffff;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 14px;
}

h1 {
  margin: 0;
  color: #111827;
  font-size: 34px;
}

.top-bar p {
  margin: 12px 0 0;
  color: #6b7280;
  font-size: 15px;
}

.top-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-btn,
.logout-btn,
.primary-btn,
.cancel-btn,
.submit-btn,
.edit-btn,
.danger-btn,
.danger-confirm-btn,
.close-btn {
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.nav-btn,
.logout-btn,
.primary-btn,
.edit-btn,
.danger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.nav-btn,
.logout-btn {
  height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  background: #ffffff;
  color: #374151;
}

.nav-btn.active {
  background: #111827;
  color: #ffffff;
}

.logout-btn {
  color: #dc2626;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 24px;
}

.stat-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.05);
}

.stat-label {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 12px;
}

.stat-value {
  color: #111827;
  font-size: 34px;
  font-weight: 800;
}

.main-card {
  background: #ffffff;
  border-radius: 26px;
  padding: 28px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  color: #111827;
  font-size: 24px;
}

.section-header p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.primary-btn {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  background: #111827;
  color: #ffffff;
  font-size: 14px;
}

.create-panel {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 24px;
  margin-bottom: 24px;
}

.panel-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

label span {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

input,
select {
  width: 100%;
  height: 46px;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #ffffff;
  padding: 0 14px;
  outline: none;
  color: #111827;
  font-size: 14px;
}

input:focus,
select:focus {
  border-color: #111827;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.cancel-btn,
.submit-btn,
.danger-confirm-btn {
  height: 42px;
  padding: 0 18px;
  border-radius: 12px;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.submit-btn {
  background: #111827;
  color: #ffffff;
}

.submit-btn:disabled,
.danger-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-box {
  padding: 42px 20px;
  text-align: center;
  color: #9ca3af;
}

.semester-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.semester-block {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
}

.semester-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 76px;
  padding: 14px 16px 14px 22px;
  background: #fafafa;
  cursor: pointer;
  box-sizing: border-box;
}

.semester-header:hover {
  background: #f7f7f8;
}

.semester-title {
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.semester-count {
  margin-top: 7px;
  color: #9ca3af;
  font-size: 14px;
}

.semester-arrow-btn {
  width: 42px;
  height: 42px;
  padding: 0;
  flex-shrink: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #111827;
  font-size: 22px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.semester-header:hover .semester-arrow-btn {
  background: #eeeeef;
}

.course-list {
  padding: 8px 18px 18px;
}

.course-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 8px;
  border-bottom: 1px solid #eeeeee;
}

.course-card:last-child {
  border-bottom: none;
}

.course-main {
  flex: 1;
  min-width: 0;
}

.course-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.course-title-row h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
}

.semester-tag {
  padding: 5px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
}

.course-info {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 10px;
  color: #4b5563;
  font-size: 14px;
}

.course-time {
  margin-top: 9px;
  color: #9ca3af;
  font-size: 13px;
}

.course-actions {
  display: flex;
  gap: 9px;
  flex-shrink: 0;
}

.edit-btn,
.danger-btn {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 11px;
}

.edit-btn {
  background: #f3f4f6;
  color: #374151;
}

.edit-btn:hover {
  background: #e5e7eb;
}

.danger-btn {
  background: #fef2f2;
  color: #dc2626;
}

.danger-btn:hover {
  background: #fee2e2;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  background: rgba(17, 24, 39, 0.45);
}

.edit-dialog,
.dialog-card {
  width: 620px;
  max-width: 100%;
  border-radius: 24px;
  background: #ffffff;
  padding: 28px;
  box-sizing: border-box;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.dialog-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
}

.dialog-title-row h3,
.dialog-card h3 {
  margin: 0;
  color: #111827;
  font-size: 24px;
}

.dialog-title-row p {
  margin: 8px 0 0;
  color: #9ca3af;
  font-size: 14px;
}

.close-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #f3f4f6;
  color: #111827;
  font-size: 22px;
}

.close-btn:hover {
  background: #e5e7eb;
}

.danger-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  border-radius: 50%;
  background: #fee2e2;
  color: #dc2626;
  font-size: 24px;
  font-weight: 900;
}

.dialog-card p {
  color: #4b5563;
  line-height: 1.7;
}

.dialog-tip {
  padding: 14px 16px;
  border-radius: 12px;
  background: #fef2f2;
  color: #991b1b !important;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.danger-confirm-btn {
  background: #dc2626;
  color: #ffffff;
}

@media (max-width: 900px) {
  .admin-page {
    padding: 20px;
  }

  .top-bar,
  .section-header {
    flex-direction: column;
  }

  .stat-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .course-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .course-actions {
    width: 100%;
  }
}
</style>
