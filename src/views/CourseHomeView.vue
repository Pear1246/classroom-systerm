<template>
  <div class="course-home">
    <div class="home-header">
      <div>
        <div class="small-title">课程空间</div>
        <h1>智课云伴</h1>
        <p>{{ teacherName }}，请选择要进入的课程空间</p>
      </div>

      <div class="header-actions">
        <button class="add-btn" @click="openAddModal">
          <AppIcon name="plus" />
          <span>新增课程</span>
        </button>

        <button class="logout-btn" @click="logout">
          <AppIcon name="logout" />
          <span>退出登录</span>
        </button>
      </div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <AppIcon name="search" class="search-icon" />

        <input
          v-model="keyword"
          type="text"
          placeholder="搜索课程名称、班级、课程号或学期"
        />
      </div>

      <div ref="semesterFilter" class="semester-filter">
        <button
          type="button"
          class="semester-filter-trigger"
          :class="{ open: semesterFilterOpen }"
          @click.stop="toggleSemesterFilter"
        >
          <span>{{ selectedSemester || "全部学期" }}</span>

          <AppIcon
            :name="semesterFilterOpen ? 'arrow-up' : 'arrow-down'"
            class="semester-filter-arrow"
          />
        </button>

        <div v-if="semesterFilterOpen" class="semester-filter-menu" @click.stop>
          <button
            type="button"
            class="semester-filter-option"
            :class="{ active: selectedSemester === '' }"
            @click="selectSemester('')"
          >
            <span>全部学期</span>

            <AppIcon
              v-if="selectedSemester === ''"
              name="check"
              class="option-check"
            />
          </button>

          <button
            v-for="item in semesterList"
            :key="item"
            type="button"
            class="semester-filter-option"
            :class="{ active: selectedSemester === item }"
            @click="selectSemester(item)"
          >
            <span>{{ item }}</span>

            <AppIcon
              v-if="selectedSemester === item"
              name="check"
              class="option-check"
            />
          </button>
        </div>
      </div>
    </div>

    <section class="section">
      <div class="section-title">
        <div>
          <h2>置顶课程</h2>
          <p>常用课程快速进入</p>
        </div>
      </div>

      <div v-if="pinnedCourses.length > 0" class="pinned-grid">
        <div
          v-for="item in pinnedCourses"
          :key="item.id"
          class="course-card"
          @click="enterCourse(item)"
        >
          <div class="card-top">
            <span class="tag">课程</span>

            <button class="pin-btn active" @click.stop="togglePinned(item)">
              <AppIcon name="star-fill" />
              <span>已置顶</span>
            </button>
          </div>

          <h3>{{ item.courseName }}</h3>

          <p class="class-name">
            {{ item.className }}
          </p>

          <div class="card-info">
            <span>{{ item.semester || "未设置学期" }}</span>
            <span>{{ item.teacherName || teacherName }}</span>
          </div>

          <div class="card-actions">
            <button class="text-btn" @click.stop="openEditModal(item)">
              <AppIcon name="edit" />
              <span>编辑</span>
            </button>

            <button
              class="danger-text-btn"
              @click.stop="openDeleteDialog(item)"
            >
              <AppIcon name="delete" />
              <span>删除</span>
            </button>
          </div>

          <div class="card-footer">
            <span>进入课程空间</span>

            <span class="arrow">
              <AppIcon name="arrow-right" />
            </span>
          </div>
        </div>
      </div>

      <div v-else class="empty-box small-empty">
        暂无置顶课程，可在下方课程列表中点击“置顶”
      </div>
    </section>

    <section class="section">
      <div class="section-title">
        <div>
          <h2>我的课程</h2>
          <p>按学期查看属于当前教师的课程空间</p>
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

          <button class="fold-btn" type="button">
            <AppIcon
              :name="expandedSemesters[semester] ? 'arrow-up' : 'arrow-down'"
            />
          </button>
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
              <div class="row-title">
                <h3>{{ item.courseName }}</h3>
              </div>

              <p>{{ item.className }}</p>

              <span>
                {{ item.teacherName || teacherName }}
                ｜
                {{ item.code || item.courseCode || "未填写课程号" }}
              </span>
            </div>

            <div class="row-actions">
              <button
                class="pin-row-btn"
                :class="{ active: item.isPinned }"
                @click.stop="togglePinned(item)"
              >
                <AppIcon :name="item.isPinned ? 'star-fill' : 'star'" />
                <span>{{ item.isPinned ? "已置顶" : "置顶" }}</span>
              </button>

              <button class="edit-btn" @click.stop="openEditModal(item)">
                <AppIcon name="edit" />
                <span>编辑</span>
              </button>

              <button class="delete-btn" @click.stop="openDeleteDialog(item)">
                <AppIcon name="delete" />
                <span>删除</span>
              </button>

              <button class="enter-btn">
                <span>进入课程</span>
                <AppIcon name="arrow-right" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="visibleSemesters.length === 0" class="empty-box">
        暂无属于当前教师的课程空间
      </div>
    </section>

    <div v-if="showAddModal" class="modal-mask" @click.self="closeAddModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>新增课程空间</h2>
            <p>创建后课程会写入后台数据库，管理员端也可以查看</p>
          </div>

          <button class="close-btn" @click="closeAddModal">×</button>
        </div>

        <form class="course-form" @submit.prevent="submitAddCourse">
          <div class="form-item">
            <label>课程名称 *</label>

            <input
              v-model="addForm.courseName"
              type="text"
              placeholder="例如：计算机网络"
            />
          </div>

          <div class="form-item">
            <label>班级名称 *</label>

            <input
              v-model="addForm.className"
              type="text"
              placeholder="例如：24计算机科学与技术2班"
            />
          </div>

          <div class="form-item">
            <label>学期</label>

            <AppSelect
              v-model="addForm.semester"
              :options="createSemesterOptions"
            />
          </div>

          <div class="form-item">
            <label>课程编号</label>

            <input
              v-model="addForm.courseCode"
              type="text"
              placeholder="例如：CN101"
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeAddModal">
              取消
            </button>

            <button type="submit" class="submit-btn" :disabled="creating">
              {{ creating ? "创建中..." : "确认新增" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal" class="modal-mask" @click.self="closeEditModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>编辑课程空间</h2>
            <p>修改当前课程的基本信息</p>
          </div>

          <button class="close-btn" @click="closeEditModal">×</button>
        </div>

        <form class="course-form" @submit.prevent="submitEditCourse">
          <div class="form-item">
            <label>课程名称 *</label>

            <input
              v-model="editForm.courseName"
              type="text"
              placeholder="课程名称"
            />
          </div>

          <div class="form-item">
            <label>班级名称 *</label>

            <input
              v-model="editForm.className"
              type="text"
              placeholder="班级名称"
            />
          </div>

          <div class="form-item">
            <label>学期</label>

            <AppSelect
              v-model="editForm.semester"
              :options="editSemesterOptions"
            />
          </div>

          <div class="form-item">
            <label>课程编号</label>

            <input
              v-model="editForm.courseCode"
              type="text"
              placeholder="课程编号"
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeEditModal">
              取消
            </button>

            <button type="submit" class="submit-btn" :disabled="updating">
              {{ updating ? "保存中..." : "保存修改" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="deleteTarget" class="modal-mask" @click.self="closeDeleteDialog">
      <div class="delete-dialog">
        <div class="danger-icon">!</div>

        <h2>确认删除课程空间？</h2>

        <p>
          你正在删除
          <strong>{{ deleteTarget.courseName }}</strong>
          -
          <strong>{{ deleteTarget.className }}</strong>
        </p>

        <div class="warning-box">
          删除后，该课程的签到记录、点名记录、学生记录以及课程本身都会被删除，
          <strong>且无法恢复。</strong>
        </div>

        <div class="modal-actions">
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

import { useCourseStore } from "../store/courseStore";
import { useClassStore } from "../store/classStore";
import { useTeacherStore } from "../store/teacherStore";

import {
  getCurrentSemester,
  getSemesterOptions,
  mergeSemesterOptions,
  sortSemesters,
  getClosestSemester,
} from "../utils/semester";

import {
  createTeacherClass,
  updateTeacherClass,
  deleteTeacherClass,
} from "../api/teacher";

export default {
  components: {
    AppIcon,
    AppSelect,
  },

  data() {
    return {
      keyword: "",
      selectedSemester: "",
      semesterFilterOpen: false,

      expandedSemesters: {},

      showAddModal: false,
      showEditModal: false,

      creating: false,
      updating: false,
      deleting: false,

      editTarget: null,
      deleteTarget: null,

      addForm: {
        courseName: "",
        className: "",
        semester: getCurrentSemester(),
        courseCode: "",
      },

      editForm: {
        courseName: "",
        className: "",
        semester: "",
        courseCode: "",
      },
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
      return this.teacherStore.teacher?.name || "教师";
    },

    currentTeacherId() {
      return this.teacherStore.teacher?.id || null;
    },

    allCourses() {
      if (!this.currentTeacherId) {
        return [];
      }

      return this.courseStore.getTeachingClassesByTeacher(
        this.currentTeacherId
      );
    },

    semesterList() {
      return sortSemesters(
        this.allCourses.map((item) => item.semester).filter(Boolean)
      );
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

    filteredCourses() {
      const keyword = this.keyword.trim().toLowerCase();

      return this.allCourses.filter((item) => {
        const courseName = String(item.courseName || "").toLowerCase();
        const className = String(item.className || "").toLowerCase();
        const semester = String(item.semester || "").toLowerCase();
        const code = String(item.code || item.courseCode || "").toLowerCase();

        const matchKeyword =
          !keyword ||
          courseName.includes(keyword) ||
          className.includes(keyword) ||
          semester.includes(keyword) ||
          code.includes(keyword);

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
        const semester = item.semester || "未设置学期";

        if (!result[semester]) {
          result[semester] = [];
        }

        result[semester].push(item);
      });

      return result;
    },

    visibleSemesters() {
      return sortSemesters(Object.keys(this.coursesBySemester));
    },
  },

  async mounted() {
    document.addEventListener("click", this.closeSemesterFilter);

    await this.reloadCourses();
    this.resetExpandedSemesters();
  },

  beforeUnmount() {
    document.removeEventListener("click", this.closeSemesterFilter);
  },

  watch: {
    visibleSemesters() {
      this.resetExpandedSemesters();
    },
  },

  methods: {
    toggleSemesterFilter() {
      this.semesterFilterOpen = !this.semesterFilterOpen;
    },

    closeSemesterFilter() {
      this.semesterFilterOpen = false;
    },

    selectSemester(semester) {
      this.selectedSemester = semester;
      this.semesterFilterOpen = false;
    },

    async reloadCourses() {
      if (!this.currentTeacherId) {
        return;
      }

      try {
        await this.courseStore.fetchTeachingClasses(this.currentTeacherId);
      } catch (error) {
        console.error("重新加载教师课程失败：", error);
        alert(error?.message || "加载课程空间失败，请稍后重试");
      }
    },

    resetExpandedSemesters() {
      const next = {};
      const oldMap = this.expandedSemesters || {};
      const hasOldState = Object.keys(oldMap).length > 0;
      const defaultSemester = getClosestSemester(this.visibleSemesters);

      this.visibleSemesters.forEach((semester) => {
        next[semester] = hasOldState
          ? Boolean(oldMap[semester])
          : semester === defaultSemester;
      });

      if (
        this.visibleSemesters.length > 0 &&
        !Object.values(next).some(Boolean)
      ) {
        next[defaultSemester] = true;
      }

      this.expandedSemesters = next;
    },

    enterCourse(item) {
      this.courseStore.switchTeachingClass(item.id);
      this.classStore.switchClass(item.classId || item.id);
      this.$router.push(`/course/${item.id}/roll`);
    },

    toggleSemester(semester) {
      this.expandedSemesters = {
        ...this.expandedSemesters,
        [semester]: !this.expandedSemesters[semester],
      };
    },

    togglePinned(item) {
      this.courseStore.toggleTeachingClassPinned(item.id);
    },

    openAddModal() {
      this.resetAddForm();
      this.showAddModal = true;
    },

    closeAddModal() {
      if (this.creating) {
        return;
      }

      this.showAddModal = false;
      this.resetAddForm();
    },

    resetAddForm() {
      this.addForm = {
        courseName: "",
        className: "",
        semester: getCurrentSemester(),
        courseCode: "",
      };
    },

    async submitAddCourse() {
      if (!this.addForm.courseName.trim()) {
        alert("请输入课程名称");
        return;
      }

      if (!this.addForm.className.trim()) {
        alert("请输入班级名称");
        return;
      }

      this.creating = true;

      try {
        await createTeacherClass({
          courseName: this.addForm.courseName.trim(),
          className: this.addForm.className.trim(),
          semester: this.addForm.semester.trim(),
          courseCode: this.addForm.courseCode.trim(),
        });

        alert("课程空间创建成功");

        this.showAddModal = false;
        this.resetAddForm();

        await this.reloadCourses();
      } catch (error) {
        console.error("教师创建课程失败：", error);
        alert(error?.message || "课程空间创建失败");
      } finally {
        this.creating = false;
      }
    },

    openEditModal(item) {
      this.editTarget = item;

      this.editForm = {
        courseName: item.courseName || "",
        className: item.className || "",
        semester: item.semester || "",
        courseCode: item.code || item.courseCode || "",
      };

      this.showEditModal = true;
    },

    closeEditModal() {
      if (this.updating) {
        return;
      }

      this.showEditModal = false;
      this.editTarget = null;

      this.editForm = {
        courseName: "",
        className: "",
        semester: "",
        courseCode: "",
      };
    },

    async submitEditCourse() {
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

      this.updating = true;

      try {
        await updateTeacherClass(this.editTarget.id, {
          courseName: this.editForm.courseName.trim(),
          className: this.editForm.className.trim(),
          semester: this.editForm.semester.trim(),
          courseCode: this.editForm.courseCode.trim(),
        });

        alert("课程修改成功");

        this.showEditModal = false;
        this.editTarget = null;

        await this.reloadCourses();
      } catch (error) {
        console.error("教师修改课程失败：", error);
        alert(error?.message || "课程修改失败");
      } finally {
        this.updating = false;
      }
    },

    openDeleteDialog(item) {
      this.deleteTarget = item;
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

      const targetId = this.deleteTarget.id;
      this.deleting = true;

      try {
        await deleteTeacherClass(targetId);

        alert("课程删除成功");

        this.deleteTarget = null;
        await this.reloadCourses();
      } catch (error) {
        console.error("教师删除课程失败：", error);
        alert(error?.message || "课程删除失败");
      } finally {
        this.deleting = false;
      }
    },

    logout() {
      this.teacherStore.logout();
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
  gap: 24px;
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
}

.home-header p {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 15px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-btn,
.logout-btn,
.text-btn,
.danger-text-btn,
.pin-btn,
.pin-row-btn,
.edit-btn,
.delete-btn,
.enter-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.add-btn,
.logout-btn {
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
}

.add-btn {
  background: #f3f4f6;
  color: #111827;
}

.add-btn:hover {
  background: #e5e7eb;
}

.logout-btn {
  background: #111827;
  color: #ffffff;
}

.toolbar {
  display: flex;
  gap: 14px;
  margin-bottom: 22px;
  align-items: flex-start;
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
  box-sizing: border-box;
}

.search-icon {
  color: #9ca3af;
  font-size: 22px;
  line-height: 1;
}

.search-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 15px;
  color: #111827;
  min-width: 0;
}

.semester-filter {
  position: relative;
  width: 220px;
  flex-shrink: 0;
}

.semester-filter-trigger {
  width: 100%;
  height: 48px;
  padding: 0 14px 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  color: #374151;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
}

.semester-filter-trigger:hover,
.semester-filter-trigger.open {
  border-color: #d1d5db;
}

.semester-filter-arrow {
  font-size: 20px;
  color: #111827;
  flex-shrink: 0;
}

.semester-filter-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 30;
  padding: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.12);
}

.semester-filter-option {
  width: 100%;
  min-height: 42px;
  padding: 9px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  text-align: left;
}

.semester-filter-option:hover {
  background: #f3f4f6;
}

.semester-filter-option.active {
  background: #f3f4f6;
  color: #111827;
  font-weight: 600;
}

.option-check {
  font-size: 17px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.course-card {
  min-height: 250px;
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
  transform: translateY(-3px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tag {
  padding: 5px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 13px;
}

.pin-btn,
.pin-row-btn {
  border: none;
  background: #f3f4f6;
  color: #4b5563;
  padding: 7px 11px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.pin-btn.active,
.pin-row-btn.active {
  background: #111827;
  color: #ffffff;
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
}

.card-info {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  color: #9ca3af;
  font-size: 14px;
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.text-btn,
.danger-text-btn {
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.text-btn {
  background: #f3f4f6;
  color: #374151;
}

.danger-text-btn {
  background: #fee2e2;
  color: #dc2626;
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
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.semester-block {
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 16px;
}

.semester-header {
  background: #fafafa;
  padding: 14px 14px 14px 22px;
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

.fold-btn {
  width: 42px;
  height: 42px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #111827;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.fold-btn:hover {
  background: #f3f4f6;
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
  flex-shrink: 0;
}

.row-info {
  flex: 1;
  min-width: 0;
}

.row-title {
  display: flex;
  align-items: center;
  gap: 10px;
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

.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-btn,
.delete-btn,
.enter-btn {
  border: none;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.edit-btn {
  background: #f3f4f6;
  color: #374151;
}

.delete-btn {
  background: #fee2e2;
  color: #dc2626;
}

.enter-btn {
  background: #111827;
  color: #ffffff;
}

.empty-box {
  text-align: center;
  color: #9ca3af;
  padding: 40px 0;
}

.small-empty {
  padding: 24px 0;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.modal-card,
.delete-dialog {
  width: 560px;
  max-width: calc(100vw - 40px);
  background: #ffffff;
  border-radius: 24px;
  padding: 28px;
  box-sizing: border-box;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.modal-header h2,
.delete-dialog h2 {
  margin: 0;
  color: #111827;
  font-size: 26px;
}

.modal-header p {
  margin: 8px 0 0;
  color: #9ca3af;
  font-size: 14px;
}

.close-btn {
  border: none;
  background: #f3f4f6;
  color: #111827;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 22px;
}

.course-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.form-item input {
  height: 46px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 0 14px;
  outline: none;
  font-size: 15px;
  color: #111827;
}

.form-item input:focus {
  border-color: #111827;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}

.cancel-btn,
.submit-btn,
.danger-confirm-btn {
  border: none;
  padding: 11px 20px;
  border-radius: 12px;
  cursor: pointer;
}

.cancel-btn {
  background: #f3f4f6;
  color: #111827;
}

.submit-btn {
  background: #111827;
  color: #ffffff;
}

.danger-confirm-btn {
  background: #dc2626;
  color: #ffffff;
}

.submit-btn:disabled,
.danger-confirm-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.danger-icon {
  width: 50px;
  height: 50px;
  border-radius: 999px;
  background: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 24px;
  margin-bottom: 18px;
}

.delete-dialog > p {
  color: #4b5563;
  line-height: 1.7;
}

.warning-box {
  margin-top: 18px;
  padding: 16px;
  background: #fef2f2;
  color: #991b1b;
  border-radius: 14px;
  line-height: 1.7;
  font-size: 14px;
}

@media (max-width: 1100px) {
  .pinned-grid {
    grid-template-columns: 1fr;
  }

  .course-row {
    align-items: flex-start;
  }

  .row-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}

@media (max-width: 800px) {
  .course-home {
    padding: 18px;
  }

  .home-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar {
    flex-direction: column;
  }

  .semester-filter {
    width: 100%;
  }

  .course-row {
    flex-direction: column;
  }

  .row-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
