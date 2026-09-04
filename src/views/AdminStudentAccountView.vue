<template>
  <div class="admin-page">
    <!-- 顶部 -->
    <header class="top-bar">
      <div>
        <div class="brand">智课云伴 · 管理端</div>

        <h1>学生账号管理</h1>

        <p>维护平台学生账号，支持单个创建和批量导入</p>
      </div>

      <div class="top-actions">
        <button class="nav-btn" @click="goCoursePage">
          <span> 课程空间 </span>
        </button>

        <button class="nav-btn active">
          <AppIcon name="user" />

          <span> 学生账号 </span>
        </button>

        <button class="logout-btn" @click="logout">
          <AppIcon name="logout" />

          <span> 退出登录 </span>
        </button>
      </div>
    </header>

    <!-- 统计 -->
    <section class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">学生账号总数</div>

        <div class="stat-value">
          {{ students.length }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">课程空间总数</div>

        <div class="stat-value">
          {{ classList.length }}
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-label">当前展示数量</div>

        <div class="stat-value">
          {{ filteredStudents.length }}
        </div>
      </div>
    </section>

    <!-- 学生账号 -->
    <section class="main-card">
      <div class="section-header">
        <div>
          <h2>学生账号列表</h2>

          <p>学号同时作为学生登录账号，初始密码统一为 123456</p>
        </div>

        <div class="header-actions">
          <!-- Excel 导入 -->
          <button
            class="secondary-btn panel-toggle-btn"
            @click="toggleExcelImportPanel"
          >
            <span> Excel 导入 </span>

            <AppIcon :name="showExcelImportPanel ? 'arrow-up' : 'arrow-down'" />
          </button>

          <!-- 新增学生 -->
          <button
            class="primary-btn panel-toggle-btn"
            @click="toggleCreatePanel"
          >
            <AppIcon name="plus" />

            <span> 新增学生 </span>

            <AppIcon :name="showCreatePanel ? 'arrow-up' : 'arrow-down'" />
          </button>
        </div>
      </div>

      <!-- 新增单个学生-->
      <div v-if="showCreatePanel" class="panel">
        <div class="panel-title">新增单个学生账号</div>

        <div class="form-grid">
          <!-- 学号 -->
          <label>
            <span> 学号 </span>

            <input
              v-model="form.studentNo"
              type="text"
              placeholder="例如：202405001"
            />
          </label>

          <!-- 姓名 -->
          <label>
            <span> 学生姓名 </span>

            <input v-model="form.name" type="text" placeholder="例如：张三" />
          </label>

          <!-- 年级 -->
          <label>
            <span> 年级 </span>

            <input
              v-model="form.grade"
              type="text"
              maxlength="4"
              placeholder="例如：2024"
            />
          </label>

          <!-- 是否加入课程班级 -->
          <label>
            <span>
              创建后加入课程班级
              <span class="optional-text"> （可选） </span>
            </span>

            <div class="select-wrap">
              <select v-model="form.autoJoin">
                <option :value="false">暂不加入课程班级</option>

                <option :value="true">创建后加入指定课程班级</option>
              </select>

              <AppIcon name="arrow-down" class="select-arrow" />
            </div>
          </label>

          <!-- 选择课程班级 -->
          <label v-if="form.autoJoin" class="class-select-label">
            <span> 选择课程班级 </span>

            <div class="select-wrap">
              <select v-model="form.classId">
                <option value="">请选择课程班级</option>

                <option
                  v-for="item in classList"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ getClassOptionText(item) }}
                </option>
              </select>

              <AppIcon name="arrow-down" class="select-arrow" />
            </div>
          </label>
        </div>

        <div class="form-actions">
          <button class="cancel-btn" @click="resetForm">清空</button>

          <button
            class="submit-btn"
            :disabled="creating"
            @click="createStudent"
          >
            {{ creating ? "创建中..." : "确认新增" }}
          </button>
        </div>
      </div>

      <!-- Excel 批量导入 -->
      <div v-if="showExcelImportPanel" class="panel">
        <div class="panel-title-row">
          <div>
            <div class="panel-title excel-panel-title">Excel 批量导入</div>

            <div class="panel-subtitle">
              请优先下载标准模板填写，避免表头或字段格式不一致。
            </div>
          </div>

          <button
            class="template-btn"
            type="button"
            @click="downloadExcelTemplate"
          >
            下载导入模板
          </button>
        </div>

        <div class="upload-box">
          <div class="file-input-row">
            <input
              ref="excelInput"
              class="excel-file-input"
              type="file"
              accept=".xls,.xlsx"
              @change="handleExcelChange"
            />
          </div>

          <div class="upload-tip important-tip">
            学号、姓名、年级必填；班级名称可选。
          </div>

          <div v-if="excelFile" class="selected-file">
            已选择：
            {{ excelFile.name }}
          </div>
        </div>

        <div class="form-actions">
          <button
            class="submit-btn"
            :disabled="excelImporting"
            @click="importByExcel"
          >
            {{ excelImporting ? "导入中..." : "确认导入 Excel" }}
          </button>
        </div>
      </div>

      <!-- 搜索= -->
      <div class="toolbar">
        <div class="search-box">
          <AppIcon name="search" class="search-icon" />

          <input
            v-model="keyword"
            class="search-input"
            type="text"
            placeholder="搜索学号、姓名或年级"
          />
        </div>

        <button class="refresh-btn" :disabled="loading" @click="loadPageData">
          <AppIcon name="refresh" />

          <span>
            {{ loading ? "刷新中..." : "刷新列表" }}
          </span>
        </button>
      </div>

      <!-- 列表 -->
      <div v-if="loading" class="empty-box">正在加载学生账号...</div>

      <div v-else-if="filteredStudents.length === 0" class="empty-box">
        暂无学生账号，或没有匹配的搜索结果
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>学号</th>

              <th>姓名</th>

              <th>年级</th>

              <th>登录账号</th>

              <th>账号状态</th>

              <th>操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="student in pagedStudents" :key="student.id">
              <td>
                {{ student.studentNo }}
              </td>

              <td>
                {{ student.realName }}
              </td>

              <td>
                {{ formatGrade(student.grade) }}
              </td>

              <td>
                {{ student.username }}
              </td>

              <td>
                <span
                  class="status-tag"
                  :class="{
                    'first-login': student.firstLogin,
                  }"
                >
                  {{ student.firstLogin ? "待修改密码" : "正常" }}
                </span>
              </td>

              <td>
                <div class="operation-buttons">
                  <button
                    class="reset-password-btn"
                    @click="openResetPasswordDialog(student)"
                  >
                    重置密码
                  </button>

                  <button class="danger-btn" @click="openDeleteDialog(student)">
                    <AppIcon name="delete" />

                    <span> 删除 </span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="!loading && filteredStudents.length > 0" class="pagination">
        <div class="total-text">共 {{ filteredStudents.length }} 人</div>

        <div class="page-actions">
          <button
            class="page-btn"
            :disabled="currentPage <= 1"
            @click="previousPage"
          >
            上一页
          </button>

          <span class="page-info">
            第 {{ currentPage }} / {{ totalPages }} 页
          </span>

          <button
            class="page-btn"
            :disabled="currentPage >= totalPages"
            @click="nextPage"
          >
            下一页
          </button>
        </div>
      </div>
    </section>

    <!-- 重置密码确认 -->
    <div
      v-if="resetPasswordTarget"
      class="dialog-mask"
      @click.self="closeResetPasswordDialog"
    >
      <div class="dialog-card">
        <h3>确认重置密码？</h3>

        <p>
          你正在重置
          <strong>
            {{ resetPasswordTarget.realName }}
          </strong>
          的登录密码。
        </p>

        <p>
          学号：
          <strong>
            {{ resetPasswordTarget.studentNo }}
          </strong>
        </p>

        <p class="dialog-tip neutral-tip">
          重置后密码将恢复为
          <strong>123456</strong>， 学生下次登录时需要重新修改密码。
        </p>

        <div class="dialog-actions">
          <button
            class="cancel-btn"
            :disabled="resettingPassword"
            @click="closeResetPasswordDialog"
          >
            取消
          </button>

          <button
            class="reset-confirm-btn"
            :disabled="resettingPassword"
            @click="confirmResetPassword"
          >
            {{ resettingPassword ? "重置中..." : "确认重置" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <div
      v-if="deleteTarget"
      class="dialog-mask"
      @click.self="closeDeleteDialog"
    >
      <div class="dialog-card">
        <h3>确认删除学生账号？</h3>

        <p>
          你正在删除
          <strong>
            {{ deleteTarget.realName }}
          </strong>
          ，学号为
          <strong>
            {{ deleteTarget.studentNo }}
          </strong>
          。
        </p>

        <p class="dialog-tip">
          删除后会同时移除该学生账号和相关数据，请谨慎操作。
        </p>

        <div class="dialog-actions">
          <button
            class="cancel-btn"
            :disabled="deleting"
            @click="closeDeleteDialog"
          >
            取消
          </button>

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
import * as XLSX from "xlsx";

import AppIcon from "../components/AppIcon.vue";
import { useAdminStore } from "../store/adminStore";

import {
  getAdminStudents,
  createAdminStudent,
  deleteAdminStudent,
  resetAdminStudentPassword,
  importAdminStudentsByExcel,
  getAdminClasses,
} from "../api/admin";

export default {
  components: {
    AppIcon,
  },

  data() {
    return {
      loading: false,
      creating: false,
      deleting: false,
      resettingPassword: false,

      excelImporting: false,

      students: [],
      classList: [],

      keyword: "",

      // 学生列表分页
      currentPage: 1,
      pageSize: 10,

      showCreatePanel: false,
      showExcelImportPanel: false,

      form: {
        studentNo: "",
        name: "",
        grade: "",
        autoJoin: false,
        classId: "",
      },

      excelFile: null,

      deleteTarget: null,

      resetPasswordTarget: null,
    };
  },

  computed: {
    filteredStudents() {
      const key = this.keyword.trim().toLowerCase();

      if (!key) {
        return this.students;
      }

      return this.students.filter((student) => {
        const studentNo = String(student.studentNo || "").toLowerCase();

        const username = String(student.username || "").toLowerCase();

        const realName = String(student.realName || "").toLowerCase();

        const grade = String(student.grade || "").toLowerCase();

        return (
          studentNo.includes(key) ||
          username.includes(key) ||
          realName.includes(key) ||
          grade.includes(key)
        );
      });
    },

    totalPages() {
      return Math.max(
        Math.ceil(this.filteredStudents.length / this.pageSize),
        1
      );
    },

    pagedStudents() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;

      return this.filteredStudents.slice(start, end);
    },
  },

  watch: {
    // 搜索条件变化后回到第一页
    keyword() {
      this.currentPage = 1;
    },

    // 删除或搜索后，如果当前页超过总页数，
    // 自动回到最后一个有效页
    totalPages(newValue) {
      if (this.currentPage > newValue) {
        this.currentPage = newValue;
      }
    },
  },

  async mounted() {
    await this.loadPageData();
  },

  methods: {
    // 页面数据

    async loadPageData() {
      this.loading = true;

      try {
        const [students, classes] = await Promise.all([
          getAdminStudents(),

          getAdminClasses().catch(() => []),
        ]);

        this.students = Array.isArray(students)
          ? students.map((item) => {
              const user = item.user || {};

              const username =
                item.username || user.username || item.studentNo || "";

              const studentNo = item.studentNo || user.studentNo || username;

              const realName =
                item.realName ||
                item.name ||
                user.realName ||
                user.name ||
                username;

              const grade = item.grade || user.grade || "";

              const firstLogin = item.firstLogin ?? user.firstLogin ?? false;

              return {
                id: item.id || user.id,

                studentNo,

                username,

                realName,

                grade,

                firstLogin: Boolean(firstLogin),

                role: item.role || user.role || "STUDENT",

                createdAt: item.createdAt || user.createdAt || "",
              };
            })
          : [];

        this.classList = Array.isArray(classes) ? classes : [];
      } catch (error) {
        console.error("加载学生账号失败：", error);

        alert(error.message || "加载学生账号失败");
      } finally {
        this.loading = false;
      }
    },

    // 面板开关

    toggleCreatePanel() {
      this.showCreatePanel = !this.showCreatePanel;
    },

    toggleExcelImportPanel() {
      this.showExcelImportPanel = !this.showExcelImportPanel;
    },

    // 单个新增学生
    validateForm() {
      const studentNo = this.form.studentNo.trim();

      const name = this.form.name.trim();

      const grade = this.form.grade.trim();

      if (!studentNo) {
        alert("请输入学号");

        return false;
      }

      if (!name) {
        alert("请输入学生姓名");

        return false;
      }

      if (!grade) {
        alert("请输入年级");

        return false;
      }

      if (!/^\d{4}$/.test(grade)) {
        alert("年级请填写4位数字，例如：2024");

        return false;
      }

      if (this.form.autoJoin && !this.form.classId) {
        alert("请选择创建后要加入的课程班级");

        return false;
      }

      return true;
    },

    async createStudent() {
      if (!this.validateForm()) {
        return;
      }

      this.creating = true;

      try {
        const data = {
          studentNo: this.form.studentNo.trim(),

          name: this.form.name.trim(),

          grade: this.form.grade.trim(),

          autoJoin: Boolean(this.form.autoJoin),
        };

        if (this.form.autoJoin) {
          data.classId = Number(this.form.classId);
        }

        console.log("准备创建学生：", data);

        const message = await createAdminStudent(data);

        alert(typeof message === "string" ? message : "学生账号创建成功");

        this.resetForm();

        this.showCreatePanel = false;

        await this.loadPageData();
      } catch (error) {
        console.error("新增学生账号失败：", error);

        alert(error.message || "新增学生账号失败");
      } finally {
        this.creating = false;
      }
    },

    resetForm() {
      this.form = {
        studentNo: "",
        name: "",
        grade: "",
        autoJoin: false,
        classId: "",
      };
    },

    getClassOptionText(item) {
      const courseName = item.courseName || item.name || "未命名课程";

      const className = item.className || item.name || "";

      if (className && className !== courseName) {
        return `${courseName} - ${className}`;
      }

      return courseName;
    },

    // Excel 导入

    downloadExcelTemplate() {
      const worksheet = XLSX.utils.aoa_to_sheet([
        ["学号", "姓名", "班级名称", "年级"],
      ]);

      worksheet["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 12 }];

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "学生导入模板");

      XLSX.writeFile(workbook, "智课云伴-学生账号导入模板.xlsx");
    },

    handleExcelChange(event) {
      const files = event.target.files;

      if (!files || files.length === 0) {
        this.excelFile = null;

        return;
      }

      const file = files[0];

      const fileName = String(file.name || "").toLowerCase();

      if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        alert("请选择 .xlsx 或 .xls 格式的 Excel 文件");

        this.excelFile = null;

        event.target.value = "";

        return;
      }

      this.excelFile = file;
    },

    async importByExcel() {
      if (!this.excelFile) {
        alert("请先选择 Excel 文件");

        return;
      }

      this.excelImporting = true;

      try {
        const message = await importAdminStudentsByExcel(this.excelFile);

        alert(typeof message === "string" ? message : "Excel 导入成功");

        this.excelFile = null;

        if (this.$refs.excelInput) {
          this.$refs.excelInput.value = "";
        }

        this.showExcelImportPanel = false;

        await this.loadPageData();
      } catch (error) {
        console.error("Excel 导入失败：", error);

        alert(error.message || "Excel 导入失败");
      } finally {
        this.excelImporting = false;
      }
    },

    // 重置密码

    openResetPasswordDialog(student) {
      this.resetPasswordTarget = student;
    },

    closeResetPasswordDialog() {
      if (this.resettingPassword) {
        return;
      }

      this.resetPasswordTarget = null;
    },

    async confirmResetPassword() {
      if (!this.resetPasswordTarget || this.resettingPassword) {
        return;
      }

      const userId = this.resetPasswordTarget.id;

      if (!userId) {
        alert("学生账号 ID 不正确");

        return;
      }

      this.resettingPassword = true;

      try {
        const message = await resetAdminStudentPassword(userId);

        this.resetPasswordTarget = null;

        alert(typeof message === "string" ? message : "密码已重置为 123456");

        await this.loadPageData();
      } catch (error) {
        console.error("重置学生密码失败：", error);

        alert(error.message || "重置学生密码失败");
      } finally {
        this.resettingPassword = false;
      }
    },

    // 删除学生
    openDeleteDialog(student) {
      this.deleteTarget = student;
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

      const deletedId = this.deleteTarget.id;

      this.deleting = true;

      try {
        const message = await deleteAdminStudent(deletedId);

        this.students = this.students.filter((student) => {
          return Number(student.id) !== Number(deletedId);
        });

        this.deleteTarget = null;

        alert(typeof message === "string" ? message : "学生账号删除成功");

        await this.loadPageData();
      } catch (error) {
        console.error("删除学生账号失败：", error);

        alert(error.message || "删除学生账号失败");
      } finally {
        this.deleting = false;
      }
    },

    // 学生列表分页

    previousPage() {
      if (this.currentPage <= 1) {
        return;
      }

      this.currentPage -= 1;
    },

    nextPage() {
      if (this.currentPage >= this.totalPages) {
        return;
      }

      this.currentPage += 1;
    },

    // 其他

    goCoursePage() {
      this.$router.push("/admin");
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

    formatGrade(value) {
      if (!value) {
        return "--";
      }

      const text = String(value);

      return text.endsWith("级") ? text : `${text}级`;
    },
  },
};
</script>

<style scoped>
.admin-page {
  min-height: 100vh;

  box-sizing: border-box;

  padding: 36px;

  background: #f5f6f8;
}

/* 顶部 */

.top-bar {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 28px;

  margin-bottom: 28px;
}

.brand {
  width: fit-content;

  margin-bottom: 14px;

  padding: 8px 14px;

  background: #ffffff;

  color: #6b7280;

  border-radius: 999px;

  font-size: 14px;
}

h1 {
  margin: 0;

  color: #111827;

  font-size: 34px;

  line-height: 1.25;
}

.top-bar p {
  margin: 12px 0 0;

  color: #6b7280;

  font-size: 15px;
}

.top-actions,
.header-actions {
  display: flex;

  flex-wrap: wrap;

  justify-content: flex-end;

  gap: 10px;
}

/* 按钮 */

.nav-btn,
.logout-btn,
.primary-btn,
.secondary-btn,
.cancel-btn,
.submit-btn,
.refresh-btn,
.danger-btn,
.danger-confirm-btn,
.reset-password-btn,
.reset-confirm-btn {
  border: none;

  cursor: pointer;

  font-weight: 700;
}

.nav-btn,
.logout-btn {
  height: 42px;

  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 8px;

  padding: 0 18px;

  background: #ffffff;
  color: #374151;

  border-radius: 12px;
}

.nav-btn.active {
  background: #111827;
  color: #ffffff;
}

.logout-btn {
  color: #dc2626;
}

/* 统计 */

.stat-grid {
  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 18px;

  margin-bottom: 24px;
}

.stat-card {
  padding: 24px;

  background: #ffffff;

  border-radius: 22px;

  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.05);
}

.stat-label {
  margin-bottom: 12px;

  color: #6b7280;

  font-size: 14px;
}

.stat-value {
  color: #111827;

  font-size: 34px;
  font-weight: 800;
}

/* 主体 */

.main-card {
  padding: 28px;

  background: #ffffff;

  border-radius: 26px;

  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
}

.section-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 24px;

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

.primary-btn,
.secondary-btn,
.refresh-btn {
  min-height: 42px;

  padding: 0 18px;

  border-radius: 12px;
}

.primary-btn {
  background: #111827;
  color: #ffffff;
}

.secondary-btn,
.refresh-btn {
  background: #f3f4f6;
  color: #374151;
}

.panel-toggle-btn,
.refresh-btn,
.danger-btn {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  gap: 8px;
}

/* 展开面板 */

.panel {
  margin-bottom: 24px;

  padding: 24px;

  background: #f9fafb;

  border: 1px solid #e5e7eb;
  border-radius: 22px;
}

.panel-title {
  margin-bottom: 18px;

  color: #111827;

  font-size: 18px;
  font-weight: 800;
}

.form-grid {
  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 18px;
}

.class-select-label {
  grid-column: span 2;
}

label > span {
  display: block;

  margin-bottom: 8px;

  color: #374151;

  font-size: 14px;
  font-weight: 700;
}

.optional-text {
  display: inline;

  color: #9ca3af;

  font-weight: 400;
}

input,
select,
textarea {
  width: 100%;

  box-sizing: border-box;

  background: #ffffff;
  color: #111827;

  border: 1px solid #d1d5db;
  border-radius: 12px;

  outline: none;

  font-size: 14px;
}

input,
select {
  height: 44px;

  padding: 0 12px;
}

textarea {
  min-height: 150px;

  padding: 14px;

  resize: vertical;

  line-height: 1.7;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #111827;
}

/* 自定义 Select 图标 */

.select-wrap {
  position: relative;

  width: 100%;
}

.select-wrap select {
  padding-right: 42px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  cursor: pointer;
}

.select-arrow {
  position: absolute;

  top: 50%;
  right: 14px;

  color: #6b7280;

  transform: translateY(-50%);

  pointer-events: none;

  font-size: 14px;
}

.form-tip,
.upload-tip {
  margin-top: 14px;

  color: #6b7280;

  font-size: 13px;

  line-height: 1.7;
}

.form-actions {
  display: flex;

  justify-content: flex-end;

  gap: 12px;

  margin-top: 22px;
}

.cancel-btn,
.submit-btn {
  height: 42px;

  padding: 0 18px;

  border-radius: 12px;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
}

.submit-btn {
  background: #111827;
  color: #ffffff;
}

.submit-btn:disabled,
.refresh-btn:disabled,
.danger-confirm-btn:disabled,
.reset-confirm-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.7;

  cursor: not-allowed;
}

/* Excel */

.panel-title-row {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 20px;

  margin-bottom: 18px;
}

.excel-panel-title {
  margin-bottom: 6px;
}

.panel-subtitle {
  color: #6b7280;

  font-size: 13px;

  line-height: 1.6;
}

.template-btn {
  flex-shrink: 0;

  height: 40px;

  padding: 0 16px;

  background: #ffffff;
  color: #111827;

  border: 1px solid #d1d5db;
  border-radius: 11px;

  cursor: pointer;

  font-weight: 700;
}

.template-btn:hover {
  background: #f9fafb;
}

.upload-box {
  padding: 22px;

  background: #ffffff;

  border: 1px dashed #d1d5db;
  border-radius: 18px;
}

.file-input-row {
  display: flex;

  align-items: center;

  min-height: 44px;
}

.excel-file-input {
  width: auto;
  max-width: 100%;

  height: auto;

  padding: 0;

  border: none;
  border-radius: 0;

  background: transparent;

  color: #374151;

  line-height: 1;

  cursor: pointer;
}

.excel-file-input::file-selector-button {
  height: 38px;

  margin-right: 12px;

  padding: 0 16px;

  background: #f3f4f6;
  color: #374151;

  border: 1px solid #d1d5db;
  border-radius: 10px;

  cursor: pointer;

  font-weight: 700;
}

.excel-file-input::file-selector-button:hover {
  background: #e5e7eb;
}

.important-tip {
  width: fit-content;

  margin-top: 14px;

  padding: 8px 12px;

  background: #fff7ed;
  color: #c2410c;

  border: 1px solid #fed7aa;
  border-radius: 10px;

  font-weight: 700;
}

.selected-file {
  margin-top: 12px;

  color: #374151;

  font-size: 13px;
  font-weight: 600;
}

/* 搜索 */

.toolbar {
  display: flex;

  align-items: center;

  gap: 12px;

  margin-bottom: 18px;
}

.search-box {
  position: relative;

  flex: 1;
}

.search-icon {
  position: absolute;

  top: 50%;
  left: 14px;

  z-index: 1;

  color: #9ca3af;

  transform: translateY(-50%);

  pointer-events: none;
}

.search-input {
  padding-left: 40px;
}

/* 空状态 */

.empty-box {
  padding: 48px 0;

  color: #9ca3af;

  font-size: 15px;

  text-align: center;
}

/* 学生表格 */

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;
}

thead {
  background: #f9fafb;
}

th,
td {
  padding: 16px 12px;

  border-bottom: 1px solid #e5e7eb;

  font-size: 14px;

  text-align: center;
  vertical-align: middle;
}

th {
  color: #6b7280;

  font-weight: 800;
}

td {
  color: #111827;
}

tbody tr:hover {
  background: #fafafa;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* 账号状态 */

.status-tag {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  min-width: 64px;
  height: 28px;

  padding: 0 10px;

  background: #ecfdf3;
  color: #16a34a;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 700;
}

.status-tag.first-login {
  background: #fff7ed;
  color: #ea580c;
}

/* 表格操作 */

.operation-buttons {
  display: flex;

  align-items: center;
  justify-content: center;

  gap: 8px;
}

.reset-password-btn {
  height: 34px;

  padding: 0 14px;

  background: #f3f4f6;
  color: #374151;

  border-radius: 10px;
}

.reset-password-btn:hover {
  background: #e5e7eb;
}

.danger-btn {
  height: 34px;

  padding: 0 14px;

  background: #fee2e2;
  color: #dc2626;

  border-radius: 10px;
}

/* 分页 */

.pagination {
  display: flex;

  align-items: center;
  justify-content: space-between;

  margin-top: 18px;

  padding-top: 18px;

  border-top: 1px solid #eeeeee;
}

.total-text {
  color: #9ca3af;

  font-size: 13px;
}

.page-actions {
  display: flex;

  align-items: center;

  gap: 12px;
}

.page-btn {
  height: 36px;

  padding: 0 14px;

  background: #ffffff;
  color: #374151;

  border: 1px solid #d1d5db;
  border-radius: 9px;

  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.page-btn:disabled {
  opacity: 0.45;

  cursor: not-allowed;
}

.page-info {
  min-width: 90px;

  color: #6b7280;

  font-size: 13px;

  text-align: center;
}

/*  弹窗 */

.dialog-mask {
  position: fixed;

  inset: 0;

  z-index: 99;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: 24px;

  background: rgba(17, 24, 39, 0.45);
}

.dialog-card {
  width: 430px;
  max-width: 100%;

  box-sizing: border-box;

  padding: 28px;

  background: #ffffff;

  border-radius: 24px;

  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
}

.dialog-card h3 {
  margin: 0 0 14px;

  color: #111827;

  font-size: 22px;
}

.dialog-card p {
  margin: 0 0 10px;

  color: #4b5563;

  line-height: 1.7;
}

.dialog-tip {
  color: #dc2626 !important;

  font-size: 14px;
}

.neutral-tip {
  color: #6b7280 !important;
}

.dialog-actions {
  display: flex;

  justify-content: flex-end;

  gap: 12px;

  margin-top: 24px;
}

.danger-confirm-btn,
.reset-confirm-btn {
  height: 42px;

  padding: 0 18px;

  border-radius: 12px;
}

.danger-confirm-btn {
  background: #dc2626;
  color: #ffffff;
}

.reset-confirm-btn {
  background: #111827;
  color: #ffffff;
}

/* 响应式 */

@media (max-width: 900px) {
  .top-bar,
  .section-header,
  .toolbar {
    flex-direction: column;

    align-items: stretch;
  }

  .stat-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .class-select-label {
    grid-column: span 1;
  }

  .header-actions,
  .top-actions {
    justify-content: flex-start;
  }

  .operation-buttons {
    flex-direction: column;
  }

  .panel-title-row {
    flex-direction: column;
  }

  .template-btn {
    width: 100%;
  }

  .pagination {
    flex-direction: column;

    gap: 12px;
  }
}
</style>
