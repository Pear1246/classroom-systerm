<template>
  <div class="page-content">
    <div class="sign-card">
      <!-- 未开始签到 -->
      <template v-if="!signActivityId">
        <div class="sign-empty">
          <div class="sign-empty-info">
            <div class="card-title sign-title">课堂签到</div>

            <div class="sign-desc">
              发起签到后，系统将生成动态二维码供学生扫码签到
            </div>

            <div v-if="signError" class="sign-error">
              {{ signError }}
            </div>
          </div>

          <button
            class="sign-btn"
            :disabled="isStartingSign"
            @click="startSign"
          >
            {{ isStartingSign ? "发起中..." : "发起签到" }}
          </button>
        </div>
      </template>

      <!-- 签到进行中 -->
      <template v-else>
        <div class="sign-active">
          <div class="sign-active-header">
            <div>
              <div class="card-title sign-title">课堂签到</div>

              <div class="sign-status">
                <span class="status-dot"></span>
                签到进行中
              </div>
            </div>

            <button
              class="sign-btn danger"
              :disabled="isEndingSign"
              @click="confirmEndSign"
            >
              {{ isEndingSign ? "结束中..." : "结束签到" }}
            </button>
          </div>

          <div v-if="signError" class="sign-error">
            {{ signError }}
          </div>

          <div class="sign-live-layout">
            <!-- 左侧二维码 -->
            <div class="qr-section">
              <div v-if="signQrUrl" class="qr-card">
                <img :src="signQrUrl" alt="签到二维码" class="sign-qr" />
              </div>

              <div v-else class="qr-placeholder">
                <div class="qr-placeholder-title">正在准备签到二维码</div>

                <div class="qr-placeholder-desc">请稍候...</div>
              </div>

              <div class="qr-tip">请学生使用智课云伴小程序扫码签到</div>

              <div class="qr-countdown">
                二维码将在
                {{ qrRefreshSeconds }}
                秒后自动刷新
              </div>
            </div>

            <!-- 右侧实时签到 -->
            <div class="live-panel">
              <div class="live-summary">
                <div class="summary-main">
                  <span class="summary-number">
                    {{ signStatistics.signedCount }}
                  </span>

                  <span class="summary-divider"> / </span>

                  <span class="summary-total">
                    {{ signStatistics.totalStudents }}
                  </span>
                </div>

                <div class="summary-label">已签到 / 应到</div>
              </div>

              <div class="summary-cards">
                <div class="summary-card">
                  <div class="summary-card-number">
                    {{ signStatistics.signedCount }}
                  </div>

                  <div class="summary-card-label">已签到</div>
                </div>

                <div class="summary-card">
                  <div class="summary-card-number">
                    {{ signStatistics.unsignedCount }}
                  </div>

                  <div class="summary-card-label">未签到</div>
                </div>

                <div class="summary-card">
                  <div class="summary-card-number">{{ signRate }}%</div>

                  <div class="summary-card-label">签到率</div>
                </div>
              </div>

              <div class="recent-header">
                <span> 最近签到 </span>

                <span class="refresh-note"> 每5秒自动更新 </span>
              </div>

              <div v-if="recentSignRecords.length > 0" class="recent-list">
                <div
                  v-for="record in recentSignRecords"
                  :key="record.id"
                  class="recent-item"
                >
                  <div class="student-info">
                    <div class="student-name">
                      {{ record.studentName }}
                    </div>

                    <div class="student-no">
                      {{ record.studentNo }}
                    </div>
                  </div>

                  <div class="sign-time">
                    {{ formatSignTime(record.signTime) }}
                  </div>
                </div>
              </div>

              <div v-else class="recent-empty">暂时还没有学生签到</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 结束签到确认弹窗 -->
    <div v-if="showEndConfirm" class="modal-mask" @click.self="closeEndConfirm">
      <div class="confirm-dialog">
        <div class="confirm-title">结束本次签到？</div>

        <div class="confirm-desc">
          结束后当前二维码将失效，学生将无法继续签到。
        </div>

        <div class="confirm-actions">
          <button
            class="confirm-btn cancel"
            :disabled="isEndingSign"
            @click="closeEndConfirm"
          >
            取消
          </button>

          <button
            class="confirm-btn confirm-danger"
            :disabled="isEndingSign"
            @click="endCurrentSign"
          >
            {{ isEndingSign ? "结束中..." : "确认结束" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  startSignActivity,
  getSignActivityQr,
  endSignActivity,
  getSignActivityStatistics,
} from "../api/teacher";

export default {
  data() {
    return {
      signActivityId: null,
      signQrUrl: "",

      signStatistics: {
        totalStudents: 0,
        signedCount: 0,
        unsignedCount: 0,
        recentRecords: [],
      },

      // 二维码每 25 秒刷新
      qrRefreshSeconds: 25,

      // 定时器
      statisticsTimer: null,
      qrCountdownTimer: null,

      // 状态
      isStartingSign: false,
      isLoadingQr: false,
      isLoadingStatistics: false,
      isEndingSign: false,

      signError: "",

      showEndConfirm: false,
    };
  },

  computed: {
    teachingClassId() {
      return Number(this.$route.params.teachingClassId);
    },

    signStorageKey() {
      return `sign_activity_${this.teachingClassId}`;
    },

    recentSignRecords() {
      return Array.isArray(this.signStatistics.recentRecords)
        ? this.signStatistics.recentRecords
        : [];
    },

    signRate() {
      const total = Number(this.signStatistics.totalStudents || 0);

      const signed = Number(this.signStatistics.signedCount || 0);

      if (!total) {
        return 0;
      }

      return Math.round((signed / total) * 100);
    },
  },

  async mounted() {
    this.restoreSignActivity();

    // 页面刷新后恢复正在进行的签到
    if (this.signActivityId) {
      await this.loadSignQr();
      await this.loadSignStatistics();

      if (this.signActivityId) {
        this.startSignTimers();
      }
    }
  },

  beforeUnmount() {
    this.stopSignTimers();
    this.clearQrUrl();
  },

  methods: {
    // 保存签到活动

    saveSignActivity(activityId) {
      this.signActivityId = Number(activityId);

      sessionStorage.setItem(this.signStorageKey, String(activityId));
    },

    restoreSignActivity() {
      const saved = sessionStorage.getItem(this.signStorageKey);

      if (!saved) {
        return;
      }

      const activityId = Number(saved);

      if (!Number.isNaN(activityId) && activityId > 0) {
        this.signActivityId = activityId;

        console.log("已恢复签到 activityId =", activityId);
      }
    },

    clearSignActivity() {
      sessionStorage.removeItem(this.signStorageKey);

      this.signActivityId = null;

      this.resetSignStatistics();
      this.stopSignTimers();
      this.clearQrUrl();
    },

    clearQrUrl() {
      if (this.signQrUrl) {
        URL.revokeObjectURL(this.signQrUrl);

        this.signQrUrl = "";
      }
    },

    resetSignStatistics() {
      this.signStatistics = {
        totalStudents: 0,
        signedCount: 0,
        unsignedCount: 0,
        recentRecords: [],
      };
    },

    // 定时器

    startSignTimers() {
      this.stopSignTimers();

      this.qrRefreshSeconds = 25;

      // 每5秒刷新实时签到数据
      this.statisticsTimer = setInterval(() => {
        this.loadSignStatistics();
      }, 5000);

      // 每25秒自动刷新二维码
      this.qrCountdownTimer = setInterval(async () => {
        this.qrRefreshSeconds -= 1;

        if (this.qrRefreshSeconds <= 0) {
          this.qrRefreshSeconds = 25;

          await this.loadSignQr();
        }
      }, 1000);
    },

    stopSignTimers() {
      if (this.statisticsTimer) {
        clearInterval(this.statisticsTimer);

        this.statisticsTimer = null;
      }

      if (this.qrCountdownTimer) {
        clearInterval(this.qrCountdownTimer);

        this.qrCountdownTimer = null;
      }

      this.qrRefreshSeconds = 25;
    },

    // 发起签到

    async startSign() {
      if (this.isStartingSign || this.signActivityId) {
        return;
      }

      if (!this.teachingClassId) {
        this.signError = "当前课程空间信息异常，无法发起签到";

        return;
      }

      this.isStartingSign = true;
      this.signError = "";

      try {
        console.log("准备发起签到，classId =", this.teachingClassId);

        const res = await startSignActivity(this.teachingClassId);

        console.log("发起签到接口返回：", res);

        const activityId = Number(res?.id);

        if (!activityId) {
          throw new Error("后端未返回签到活动 ID");
        }

        this.saveSignActivity(activityId);

        console.log("当前签到 activityId =", activityId);

        // 第一次加载
        await this.loadSignQr();
        await this.loadSignStatistics();

        if (this.signActivityId) {
          this.startSignTimers();
        }
      } catch (error) {
        console.error("发起签到失败：", error);

        this.signError =
          error?.response?.data?.message || error?.message || "发起签到失败";
      } finally {
        this.isStartingSign = false;
      }
    },

    // 二维码

    async loadSignQr() {
      if (!this.signActivityId || this.isLoadingQr) {
        return;
      }

      this.isLoadingQr = true;
      this.signError = "";

      try {
        console.log("准备获取签到二维码，activityId =", this.signActivityId);

        const blob = await getSignActivityQr(this.signActivityId);

        console.log("签到二维码接口返回：", blob);

        console.log("二维码 MIME：", blob?.type);

        console.log("二维码大小：", blob?.size);

        if (!(blob instanceof Blob)) {
          throw new Error("二维码接口未返回有效图片");
        }

        this.clearQrUrl();

        this.signQrUrl = URL.createObjectURL(blob);

        this.qrRefreshSeconds = 25;
      } catch (error) {
        console.error("获取签到二维码失败：", error);

        this.signError =
          error?.response?.data?.message || error?.message || "获取二维码失败";
      } finally {
        this.isLoadingQr = false;
      }
    },

    // 实时签到统计

    async loadSignStatistics() {
      if (!this.signActivityId || this.isLoadingStatistics) {
        return;
      }

      this.isLoadingStatistics = true;

      try {
        const res = await getSignActivityStatistics(this.signActivityId);

        console.log("实时签到统计：", res);

        this.signStatistics = {
          totalStudents: Number(res?.totalStudents || 0),

          signedCount: Number(res?.signedCount || 0),

          unsignedCount: Number(res?.unsignedCount || 0),

          recentRecords: Array.isArray(res?.recentRecords)
            ? res.recentRecords
            : [],
        };

        // status = 1 表示正在进行
        if (res?.status !== undefined && Number(res.status) !== 1) {
          this.clearSignActivity();
        }
      } catch (error) {
        console.error("获取签到实时统计失败：", error);
      } finally {
        this.isLoadingStatistics = false;
      }
    },

    formatSignTime(value) {
      if (!value) {
        return "--";
      }

      const text = String(value);

      const match = text.match(/(\d{2}:\d{2}:\d{2})/);

      if (match) {
        return match[1];
      }

      return text;
    },

    // 结束签到

    confirmEndSign() {
      if (!this.signActivityId) {
        return;
      }

      this.showEndConfirm = true;
    },

    closeEndConfirm() {
      if (this.isEndingSign) {
        return;
      }

      this.showEndConfirm = false;
    },

    async endCurrentSign() {
      if (!this.signActivityId || this.isEndingSign) {
        return;
      }

      this.isEndingSign = true;
      this.signError = "";

      const activityId = this.signActivityId;

      try {
        console.log("准备结束签到，activityId =", activityId);

        const res = await endSignActivity(activityId);

        console.log("结束签到接口返回：", res);

        this.showEndConfirm = false;

        this.clearSignActivity();
      } catch (error) {
        console.error("结束签到失败：", error);

        this.signError =
          error?.response?.data?.message || error?.message || "结束签到失败";

        this.showEndConfirm = false;
      } finally {
        this.isEndingSign = false;
      }
    },
  },
};
</script>

<style scoped>
.page-content {
  width: 100%;
}

.sign-card {
  padding: 30px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 24px;
}

.card-title {
  font-size: 24px;
  font-weight: 700;
}

.sign-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.sign-empty-info {
  min-width: 0;
}

.sign-title {
  margin-bottom: 8px;
}

.sign-desc {
  color: #888888;
  font-size: 14px;
}

.sign-error {
  margin-top: 12px;

  color: #dc2626;

  font-size: 14px;
}

.sign-active {
  width: 100%;
}

.sign-active-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 30px;
}

.sign-status {
  display: inline-flex;

  align-items: center;

  gap: 8px;

  color: #16a34a;

  font-size: 14px;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;

  background: #22c55e;

  border-radius: 50%;

  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

/* 二维码 + 实时签到 */

.sign-live-layout {
  display: grid;

  grid-template-columns:
    minmax(390px, 1fr)
    minmax(360px, 0.95fr);

  gap: 42px;

  align-items: stretch;

  margin-top: 28px;
}

.qr-section {
  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  min-width: 0;
}

.qr-card {
  padding: 18px;

  background: #ffffff;

  border: 1px solid #e5e7eb;
  border-radius: 24px;

  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.sign-qr {
  display: block;

  width: 360px;
  height: 360px;

  object-fit: contain;
}

.qr-placeholder {
  width: 360px;
  height: 360px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  background: #f9fafb;

  border: 1px dashed #d1d5db;
  border-radius: 24px;
}

.qr-placeholder-title {
  color: #374151;

  font-size: 18px;
  font-weight: 600;
}

.qr-placeholder-desc {
  margin-top: 10px;

  color: #9ca3af;

  font-size: 14px;
}

.qr-tip {
  margin-top: 16px;

  color: #6b7280;

  font-size: 14px;
}

.qr-countdown {
  margin-top: 7px;

  color: #9ca3af;

  font-size: 13px;
}

/* 实时签到 */

.live-panel {
  min-height: 438px;

  box-sizing: border-box;

  padding: 26px;

  background: #f9fafb;

  border: 1px solid #eeeeee;
  border-radius: 22px;
}

.live-summary {
  padding-bottom: 22px;

  text-align: center;

  border-bottom: 1px solid #e5e7eb;
}

.summary-main {
  display: flex;

  align-items: baseline;
  justify-content: center;

  gap: 8px;
}

.summary-number {
  color: #111827;

  font-size: 52px;
  font-weight: 750;

  line-height: 1;
}

.summary-divider,
.summary-total {
  color: #9ca3af;

  font-size: 24px;
  font-weight: 600;
}

.summary-label {
  margin-top: 8px;

  color: #6b7280;

  font-size: 14px;
}

.summary-cards {
  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 12px;

  margin-top: 18px;
}

.summary-card {
  padding: 14px 8px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 14px;

  text-align: center;
}

.summary-card-number {
  color: #111827;

  font-size: 20px;
  font-weight: 700;
}

.summary-card-label {
  margin-top: 4px;

  color: #9ca3af;

  font-size: 12px;
}

.recent-header {
  display: flex;

  align-items: center;
  justify-content: space-between;

  margin-top: 24px;
  margin-bottom: 10px;

  color: #374151;

  font-size: 15px;
  font-weight: 700;
}

.refresh-note {
  color: #9ca3af;

  font-size: 12px;
  font-weight: 400;
}

.recent-list {
  display: flex;
  flex-direction: column;

  max-height: 220px;

  overflow-y: auto;
}

.recent-item {
  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 16px;

  padding: 12px 2px;

  border-bottom: 1px solid #eeeeee;
}

.recent-item:last-child {
  border-bottom: none;
}

.student-info {
  min-width: 0;
}

.student-name {
  color: #111827;

  font-size: 14px;
  font-weight: 600;
}

.student-no {
  margin-top: 3px;

  color: #9ca3af;

  font-size: 12px;
}

.sign-time {
  flex-shrink: 0;

  color: #6b7280;

  font-size: 13px;
}

.recent-empty {
  padding: 42px 0;

  color: #9ca3af;

  font-size: 14px;

  text-align: center;
}

/* 按钮 */

button {
  padding: 14px 34px;

  background: #111827;
  color: #ffffff;

  border: none;
  border-radius: 14px;

  cursor: pointer;
}

button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.sign-btn.danger {
  background: #ef4444;
}

/* 弹窗 */

.modal-mask {
  position: fixed;

  inset: 0;

  z-index: 999;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: 24px;

  background: rgba(15, 23, 42, 0.42);
}

.confirm-dialog {
  width: 420px;
  max-width: 100%;

  padding: 30px;

  background: #ffffff;

  border-radius: 24px;

  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
}

.confirm-title {
  color: #111827;

  font-size: 22px;
  font-weight: 700;
}

.confirm-desc {
  margin-top: 14px;

  color: #6b7280;

  font-size: 14px;

  line-height: 1.7;
}

.confirm-actions {
  display: flex;

  justify-content: flex-end;

  gap: 12px;

  margin-top: 28px;
}

.confirm-btn {
  padding: 12px 24px;
}

.confirm-btn.cancel {
  background: #f3f4f6;
  color: #111827;
}

.confirm-btn.confirm-danger {
  background: #ef4444;
  color: #ffffff;
}

@media (max-width: 1000px) {
  .sign-live-layout {
    grid-template-columns: 1fr;
  }

  .sign-qr,
  .qr-placeholder {
    width: 320px;
    height: 320px;
  }
}
</style>
