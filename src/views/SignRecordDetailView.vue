<template>
  <div class="detail-page">
    <!-- 返回 -->
    <button class="back-button" @click="goBack">← 返回签到记录</button>

    <!-- 加载中 -->
    <div v-if="loading" class="state-card">正在加载签到详情...</div>

    <!-- 错误 -->
    <div v-else-if="errorMessage" class="state-card error">
      <div>
        {{ errorMessage }}
      </div>

      <button class="retry-btn" @click="loadDetail">重新加载</button>
    </div>

    <template v-else-if="detail">
      <!-- 本次签到时间 + 状态 -->
      <div class="detail-header-card">
        <div class="time-status-layout">
          <div class="time-info">
            <div class="time-item">
              <span class="time-label"> 开始时间 </span>

              <span class="time-value">
                {{ formatDateTime(detail.startTime) }}
              </span>
            </div>

            <div class="time-item">
              <span class="time-label"> 结束时间 </span>

              <span class="time-value">
                {{ detail.endTime ? formatDateTime(detail.endTime) : "进行中" }}
              </span>
            </div>
          </div>

          <span class="status-tag" :class="getStatusClass(detail.status)">
            {{ getStatusText(detail.status) }}
          </span>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-number">
            {{ totalStudents }}
          </div>

          <div class="summary-label">应到人数</div>
        </div>

        <div class="summary-card">
          <div class="summary-number">
            {{ signedCount }}
          </div>

          <div class="summary-label">已签到</div>
        </div>

        <div class="summary-card">
          <div class="summary-number">
            {{ unsignedCount }}
          </div>

          <div class="summary-label">未签到</div>
        </div>

        <div class="summary-card">
          <div class="summary-number">{{ signRate }}%</div>

          <div class="summary-label">签到率</div>
        </div>
      </div>

      <!-- 已签到 / 未签到 -->
      <div class="student-card">
        <div class="student-tabs">
          <button
            class="student-tab"
            :class="{
              active: activeStudentTab === 'signed',
            }"
            @click="switchStudentTab('signed')"
          >
            已签到
            {{ signedStudents.length }}
          </button>

          <button
            class="student-tab"
            :class="{
              active: activeStudentTab === 'unsigned',
            }"
            @click="switchStudentTab('unsigned')"
          >
            未签到
            {{ unsignedStudents.length }}
          </button>
        </div>

        <!-- 已签到名单 -->
        <template v-if="activeStudentTab === 'signed'">
          <div v-if="signedStudents.length === 0" class="empty-students">
            暂无已签到学生
          </div>

          <template v-else>
            <div class="table-wrapper">
              <table class="student-table">
                <thead>
                  <tr>
                    <th>姓名</th>

                    <th>学号</th>

                    <th>签到时间</th>

                    <th>签到方式</th>

                    <th>备注</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="student in pagedSignedStudents"
                    :key="`${student.studentId}-${student.signTime}`"
                  >
                    <td>
                      {{ student.studentName || "--" }}
                    </td>

                    <td>
                      {{ student.studentNo || "--" }}
                    </td>

                    <td>
                      {{ formatDateTime(student.signTime) }}
                    </td>

                    <td>
                      <span
                        class="source-tag"
                        :class="getSourceClass(student.source)"
                      >
                        {{ getSourceText(student.source) }}
                      </span>
                    </td>

                    <td>
                      <span class="remark-text" :title="student.remark || ''">
                        {{ student.remark || "--" }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 已签到分页 -->
            <div class="pagination">
              <div class="total-text">
                共
                {{ signedStudents.length }}
                人
              </div>

              <div class="page-actions">
                <button
                  class="page-btn"
                  :disabled="signedPage <= 1"
                  @click="signedPage -= 1"
                >
                  上一页
                </button>

                <span class="page-info">
                  第
                  {{ signedPage }}
                  /
                  {{ signedTotalPages }}
                  页
                </span>

                <button
                  class="page-btn"
                  :disabled="signedPage >= signedTotalPages"
                  @click="signedPage += 1"
                >
                  下一页
                </button>
              </div>
            </div>
          </template>
        </template>

        <!-- 未签到名单 -->
        <template v-else>
          <div v-if="unsignedStudents.length === 0" class="empty-students">
            当前没有未签到学生
          </div>

          <template v-else>
            <div class="table-wrapper">
              <table class="student-table">
                <thead>
                  <tr>
                    <th>姓名</th>

                    <th>学号</th>

                    <th>状态</th>

                    <th>操作</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="student in pagedUnsignedStudents"
                    :key="student.studentId"
                  >
                    <td>
                      {{ student.studentName || "--" }}
                    </td>

                    <td>
                      {{ student.studentNo || "--" }}
                    </td>

                    <td>
                      <span class="unsigned-tag"> 未签到 </span>
                    </td>

                    <td>
                      <button
                        class="makeup-btn"
                        @click="openMakeupDialog(student)"
                      >
                        补签
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 未签到分页 -->
            <div class="pagination">
              <div class="total-text">
                共
                {{ unsignedStudents.length }}
                人
              </div>

              <div class="page-actions">
                <button
                  class="page-btn"
                  :disabled="unsignedPage <= 1"
                  @click="unsignedPage -= 1"
                >
                  上一页
                </button>

                <span class="page-info">
                  第
                  {{ unsignedPage }}
                  /
                  {{ unsignedTotalPages }}
                  页
                </span>

                <button
                  class="page-btn"
                  :disabled="unsignedPage >= unsignedTotalPages"
                  @click="unsignedPage += 1"
                >
                  下一页
                </button>
              </div>
            </div>
          </template>
        </template>
      </div>
    </template>

    <!--  补签确认弹窗 -->
    <div
      v-if="showMakeupDialog"
      class="modal-mask"
      @click.self="closeMakeupDialog"
    >
      <div class="makeup-dialog">
        <div class="dialog-title">确认补签？</div>

        <div class="dialog-desc">
          确定为
          <strong>
            {{ selectedStudent?.studentName }}
          </strong>
          补签本次签到？
        </div>

        <div class="dialog-student-info">
          学号：
          {{ selectedStudent?.studentNo || "--" }}
        </div>

        <label class="remark-label">
          补签备注

          <span> （选填） </span>
        </label>

        <textarea
          v-model="makeupRemark"
          class="remark-input"
          maxlength="100"
          placeholder="例如：学生设备异常"
        ></textarea>

        <div class="remark-count">
          {{ makeupRemark.length }}
          / 100
        </div>

        <div v-if="makeupError" class="makeup-error">
          {{ makeupError }}
        </div>

        <div class="dialog-actions">
          <button
            class="cancel-btn"
            :disabled="isMakingUp"
            @click="closeMakeupDialog"
          >
            取消
          </button>

          <button
            class="confirm-btn"
            :disabled="isMakingUp"
            @click="submitMakeup"
          >
            {{ isMakingUp ? "补签中..." : "确认补签" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getSignActivityDetail, makeupSignActivity } from "../api/teacher";

export default {
  data() {
    return {
      detail: null,

      loading: false,
      errorMessage: "",

      // 当前名单 Tab
      activeStudentTab: "signed",

      // 分页

      signedPage: 1,

      unsignedPage: 1,

      // 补签
      showMakeupDialog: false,

      selectedStudent: null,

      makeupRemark: "",

      makeupError: "",

      isMakingUp: false,
    };
  },

  computed: {
    teachingClassId() {
      return Number(this.$route.params.teachingClassId);
    },

    activityId() {
      return Number(this.$route.params.activityId);
    },

    signedStudents() {
      return Array.isArray(this.detail?.signedStudents)
        ? this.detail.signedStudents
        : [];
    },

    unsignedStudents() {
      return Array.isArray(this.detail?.unsignedStudents)
        ? this.detail.unsignedStudents
        : [];
    },

    totalStudents() {
      return Number(this.detail?.totalStudents || 0);
    },

    signedCount() {
      return Number(this.detail?.signedCount || 0);
    },

    unsignedCount() {
      return Number(this.detail?.unsignedCount || 0);
    },

    signRate() {
      if (!this.totalStudents) {
        return 0;
      }

      const rate = (this.signedCount / this.totalStudents) * 100;

      return Number.isInteger(rate) ? rate : rate.toFixed(1);
    },

    // 已签到分页

    signedTotalPages() {
      return Math.max(Math.ceil(this.signedStudents.length / this.pageSize), 1);
    },

    pagedSignedStudents() {
      const start = (this.signedPage - 1) * this.pageSize;

      const end = start + this.pageSize;

      return this.signedStudents.slice(start, end);
    },

    // 未签到分页

    unsignedTotalPages() {
      return Math.max(
        Math.ceil(this.unsignedStudents.length / this.pageSize),
        1
      );
    },

    pagedUnsignedStudents() {
      const start = (this.unsignedPage - 1) * this.pageSize;

      const end = start + this.pageSize;

      return this.unsignedStudents.slice(start, end);
    },
  },

  watch: {
    /* 如果补签以后未签到人数减少，当前页可能已经超过总页数 */
    unsignedTotalPages(newValue) {
      if (this.unsignedPage > newValue) {
        this.unsignedPage = newValue;
      }
    },

    signedTotalPages(newValue) {
      if (this.signedPage > newValue) {
        this.signedPage = newValue;
      }
    },
  },

  mounted() {
    this.loadDetail();
  },

  methods: {
    async loadDetail() {
      if (!this.activityId) {
        this.errorMessage = "签到活动 ID 不正确";

        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        console.log("准备获取签到详情，activityId =", this.activityId);

        const res = await getSignActivityDetail(this.activityId);

        console.log("签到详情接口返回：", res);

        this.detail = res;
      } catch (error) {
        console.error("获取签到详情失败：", error);

        this.detail = null;

        this.errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "获取签到详情失败";
      } finally {
        this.loading = false;
      }
    },

    goBack() {
      this.$router.push(`/course/${this.teachingClassId}/sign-records`);
    },

    switchStudentTab(tab) {
      this.activeStudentTab = tab;
    },

    openMakeupDialog(student) {
      this.selectedStudent = student;

      this.makeupRemark = "";

      this.makeupError = "";

      this.showMakeupDialog = true;
    },

    closeMakeupDialog() {
      if (this.isMakingUp) {
        return;
      }

      this.showMakeupDialog = false;

      this.selectedStudent = null;

      this.makeupRemark = "";

      this.makeupError = "";
    },

    async submitMakeup() {
      if (!this.selectedStudent || this.isMakingUp) {
        return;
      }

      const studentId = Number(this.selectedStudent.studentId);

      if (!studentId) {
        this.makeupError = "学生 ID 不正确，无法补签";

        return;
      }

      this.isMakingUp = true;
      this.makeupError = "";

      try {
        console.log("准备教师补签：", {
          activityId: this.activityId,

          studentId,

          remark: this.makeupRemark.trim(),
        });

        const res = await makeupSignActivity({
          activityId: this.activityId,

          studentId,

          remark: this.makeupRemark.trim(),
        });

        console.log("教师补签接口返回：", res);

        /* 补签成功以后，直接关闭弹窗。 */
        this.showMakeupDialog = false;

        this.selectedStudent = null;

        this.makeupRemark = "";

        this.makeupError = "";

        /* 重新请求最新详情 */
        await this.loadDetail();

        /*
         * 自动进入已签到第一页，
         * 可以马上看到补签后的名单。
         */
        this.activeStudentTab = "signed";

        this.signedPage = 1;
      } catch (error) {
        console.error("教师补签失败：", error);

        this.makeupError =
          error?.response?.data?.message || error?.message || "补签失败";
      } finally {
        this.isMakingUp = false;
      }
    },

    getStatusText(status) {
      const value = Number(status);

      if (value === 1) {
        return "进行中";
      }

      if (value === 2) {
        return "已结束";
      }

      return "未知";
    },

    getStatusClass(status) {
      const value = Number(status);

      if (value === 1) {
        return "active";
      }

      if (value === 2) {
        return "ended";
      }

      return "unknown";
    },

    getSourceText(source) {
      const value = String(source || "").toUpperCase();

      if (value === "QR") {
        return "扫码签到";
      }

      if (value === "MANUAL") {
        return "教师补签";
      }

      return source || "--";
    },

    getSourceClass(source) {
      const value = String(source || "").toUpperCase();

      if (value === "MANUAL") {
        return "manual";
      }

      return "qr";
    },

    formatDateTime(value) {
      if (!value) {
        return "--";
      }

      const text = String(value);

      const normalMatch = text.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
      );

      if (normalMatch) {
        const [, year, month, day, hour, minute, second] = normalMatch;

        return `${year}-${month}-${day} ${hour}:${minute}${
          second ? `:${second}` : ""
        }`;
      }

      return text;
    },
  },
};
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 返回签到记录 */

.back-button {
  width: fit-content;

  padding: 10px 15px;

  background: #ffffff;
  color: #374151;

  border: 1px solid #e5e7eb;
  border-radius: 10px;

  cursor: pointer;

  font-size: 14px;
}

.back-button:hover {
  background: #f9fafb;
}

/* 时间 + 状态 */

.detail-header-card {
  padding: 24px 30px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 22px;
}

.time-status-layout {
  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 30px;
}

.time-info {
  display: flex;

  align-items: center;

  gap: 46px;
}

.time-item {
  display: flex;

  align-items: center;

  gap: 10px;

  font-size: 14px;
}

.time-label {
  color: #9ca3af;
}

.time-value {
  color: #374151;

  font-weight: 500;
}

/* 状态 */

.status-tag {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  min-width: 58px;

  padding: 6px 10px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 600;
}

.status-tag.active {
  background: #ecfdf3;
  color: #16a34a;
}

.status-tag.ended {
  background: #f3f4f6;
  color: #6b7280;
}

.status-tag.unknown {
  background: #fef3c7;
  color: #92400e;
}

/* 统计卡片 */

.summary-grid {
  display: grid;

  grid-template-columns: repeat(4, 1fr);

  gap: 16px;
}

.summary-card {
  padding: 24px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 18px;

  text-align: center;
}

.summary-number {
  color: #111827;

  font-size: 30px;
  font-weight: 700;
}

.summary-label {
  margin-top: 6px;

  color: #9ca3af;

  font-size: 13px;
}

/* 学生名单 */

.student-card {
  overflow: hidden;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 22px;
}

.student-tabs {
  display: flex;

  gap: 8px;

  padding: 14px 18px;

  border-bottom: 1px solid #eeeeee;
}

.student-tab {
  padding: 10px 18px;

  background: transparent;
  color: #6b7280;

  border: none;
  border-radius: 10px;

  cursor: pointer;

  font-size: 14px;
  font-weight: 600;
}

.student-tab:hover {
  background: #f9fafb;
}

.student-tab.active {
  background: #111827;
  color: #ffffff;
}

.table-wrapper {
  overflow-x: auto;
}

.student-table {
  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;
}

.student-table th {
  padding: 16px 18px;

  background: #f9fafb;

  color: #6b7280;

  border-bottom: 1px solid #eeeeee;

  font-size: 13px;

  text-align: center;
}

.student-table td {
  padding: 18px;

  color: #374151;

  border-bottom: 1px solid #f0f0f0;

  font-size: 14px;

  text-align: center;
  vertical-align: middle;
}

.student-table tbody tr:last-child td {
  border-bottom: none;
}

.student-table tbody tr:hover {
  background: #fafafa;
}

/* 签到来源 */

.source-tag,
.unsigned-tag {
  display: inline-flex;

  align-items: center;
  justify-content: center;

  padding: 6px 10px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 600;
}

.source-tag.qr {
  background: #eff6ff;
  color: #2563eb;
}

.source-tag.manual {
  background: #fff7ed;
  color: #ea580c;
}

.unsigned-tag {
  background: #fef2f2;
  color: #dc2626;
}

.remark-text {
  display: block;

  overflow: hidden;

  color: #6b7280;

  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 补签 */

.makeup-btn {
  padding: 8px 16px;

  background: #111827;
  color: #ffffff;

  border: none;
  border-radius: 9px;

  cursor: pointer;
}

.makeup-btn:hover {
  opacity: 0.85;
}

/* 分页 */

.pagination {
  display: flex;

  align-items: center;
  justify-content: space-between;

  padding: 17px 22px;

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
  padding: 8px 14px;

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

/* 空状态 */

.empty-students {
  padding: 70px 20px;

  color: #9ca3af;

  text-align: center;

  font-size: 14px;
}

.state-card {
  min-height: 260px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 15px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 22px;

  color: #9ca3af;
}

.state-card.error {
  color: #dc2626;
}

.retry-btn {
  padding: 9px 16px;

  background: #111827;
  color: #ffffff;

  border: none;
  border-radius: 9px;

  cursor: pointer;
}

/* 补签弹窗 */

.modal-mask {
  position: fixed;

  inset: 0;

  z-index: 1000;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: 24px;

  background: rgba(15, 23, 42, 0.42);
}

.makeup-dialog {
  width: 430px;
  max-width: 100%;

  box-sizing: border-box;

  padding: 28px;

  background: #ffffff;

  border-radius: 22px;

  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
}

.dialog-title {
  color: #111827;

  font-size: 22px;
  font-weight: 700;
}

.dialog-desc {
  margin-top: 14px;

  color: #4b5563;

  font-size: 14px;

  line-height: 1.7;
}

.dialog-student-info {
  margin-top: 6px;

  color: #9ca3af;

  font-size: 13px;
}

.remark-label {
  display: block;

  margin-top: 22px;

  color: #374151;

  font-size: 14px;
  font-weight: 600;
}

.remark-label span {
  color: #9ca3af;

  font-weight: 400;
}

.remark-input {
  width: 100%;
  height: 90px;

  box-sizing: border-box;

  margin-top: 8px;

  padding: 12px 14px;

  resize: none;

  background: #ffffff;
  color: #111827;

  border: 1px solid #d1d5db;
  border-radius: 11px;

  outline: none;

  font-family: inherit;
  font-size: 14px;

  line-height: 1.6;
}

.remark-input:focus {
  border-color: #111827;
}

.remark-count {
  margin-top: 5px;

  color: #9ca3af;

  font-size: 12px;

  text-align: right;
}

.makeup-error {
  margin-top: 10px;

  color: #dc2626;

  font-size: 13px;
}

.dialog-actions {
  display: flex;

  justify-content: flex-end;

  gap: 10px;

  margin-top: 24px;
}

.cancel-btn,
.confirm-btn {
  padding: 11px 20px;

  border: none;
  border-radius: 10px;

  cursor: pointer;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.confirm-btn {
  background: #111827;
  color: #ffffff;
}

.cancel-btn:disabled,
.confirm-btn:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

/* 响应式 */

@media (max-width: 850px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .time-status-layout {
    align-items: flex-start;
  }

  .time-info {
    flex-direction: column;

    align-items: flex-start;

    gap: 10px;
  }

  .pagination {
    flex-direction: column;

    gap: 12px;
  }
}
</style>
