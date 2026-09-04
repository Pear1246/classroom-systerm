<template>
  <div class="sign-records-page">
    <!-- 日期筛选 -->
    <div class="filter-card">
      <div class="filter-item">
        <label> 开始日期 </label>

        <input v-model="startDate" type="date" />
      </div>

      <div class="filter-item">
        <label> 结束日期 </label>

        <input v-model="endDate" type="date" />
      </div>

      <div class="filter-actions">
        <button class="search-btn" :disabled="loading" @click="handleSearch">
          查询
        </button>

        <button class="reset-btn" :disabled="loading" @click="handleReset">
          重置
        </button>
      </div>
    </div>

    <!-- 历史签到列表 -->
    <div class="records-card">
      <div v-if="loading" class="state-box">正在加载签到记录...</div>

      <div v-else-if="errorMessage" class="state-box error">
        {{ errorMessage }}

        <button class="retry-btn" @click="loadRecords">重新加载</button>
      </div>

      <div v-else-if="records.length === 0" class="state-box">暂无签到记录</div>

      <template v-else>
        <div class="table-wrapper">
          <table class="records-table">
            <thead>
              <tr>
                <th>签到时间</th>

                <th>签到情况</th>

                <th>签到率</th>

                <th>状态</th>

                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="record in records" :key="record.id">
                <td>
                  <div class="time-main">
                    {{ formatDateTime(record.startTime) }}
                  </div>

                  <div v-if="record.endTime" class="time-secondary">
                    结束：
                    {{ formatDateTime(record.endTime) }}
                  </div>
                </td>

                <td>
                  <span class="count-main">
                    {{ Number(record.signedCount || 0) }}
                  </span>

                  <span class="count-divider"> / </span>

                  <span>
                    {{ Number(record.totalStudents || 0) }}
                  </span>
                </td>

                <td>{{ getSignRate(record) }}%</td>

                <td>
                  <span
                    class="status-tag"
                    :class="getStatusClass(record.status)"
                  >
                    {{ getStatusText(record.status) }}
                  </span>
                </td>

                <td>
                  <button class="detail-btn" @click="openDetail(record.id)">
                    查看详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <div class="total-text">共 {{ total }} 条签到记录</div>

          <div class="page-actions">
            <button
              class="page-btn"
              :disabled="loading || page <= 1"
              @click="previousPage"
            >
              上一页
            </button>

            <span class="page-info"> 第 {{ page }} / {{ totalPages }} 页 </span>

            <button
              class="page-btn"
              :disabled="loading || page >= totalPages"
              @click="nextPage"
            >
              下一页
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { getSignActivities } from "../api/teacher";

export default {
  data() {
    return {
      startDate: "",
      endDate: "",

      records: [],

      page: 1,
      size: 20,
      total: 0,

      loading: false,
      errorMessage: "",
    };
  },

  computed: {
    teachingClassId() {
      return Number(this.$route.params.teachingClassId);
    },

    totalPages() {
      const pages = Math.ceil(this.total / this.size);

      return Math.max(pages, 1);
    },
  },

  mounted() {
    this.loadRecords();
  },

  methods: {
    async loadRecords() {
      if (!this.teachingClassId) {
        this.errorMessage = "当前课程空间信息异常";

        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        console.log("准备获取历史签到记录：", {
          classId: this.teachingClassId,

          startDate: this.startDate,

          endDate: this.endDate,

          page: this.page,

          size: this.size,
        });

        const res = await getSignActivities({
          classId: this.teachingClassId,

          startDate: this.startDate,

          endDate: this.endDate,

          page: this.page,

          size: this.size,
        });

        console.log("历史签到接口返回：", res);

        this.records = Array.isArray(res?.list) ? res.list : [];

        this.total = Number(res?.total || 0);

        if (res?.page) {
          this.page = Number(res.page);
        }

        if (res?.size) {
          this.size = Number(res.size);
        }
      } catch (error) {
        console.error("获取历史签到记录失败：", error);

        this.records = [];
        this.total = 0;

        this.errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "获取签到记录失败";
      } finally {
        this.loading = false;
      }
    },

    openDetail(activityId) {
      this.$router.push(
        `/course/${this.teachingClassId}/sign-records/${activityId}`
      );
    },

    handleSearch() {
      if (this.startDate && this.endDate && this.startDate > this.endDate) {
        this.errorMessage = "开始日期不能晚于结束日期";

        return;
      }

      this.page = 1;

      this.loadRecords();
    },

    handleReset() {
      this.startDate = "";
      this.endDate = "";
      this.page = 1;

      this.loadRecords();
    },

    previousPage() {
      if (this.page <= 1) {
        return;
      }

      this.page -= 1;

      this.loadRecords();
    },

    nextPage() {
      if (this.page >= this.totalPages) {
        return;
      }

      this.page += 1;

      this.loadRecords();
    },

    getSignRate(record) {
      const total = Number(record.totalStudents || 0);

      const signed = Number(record.signedCount || 0);

      if (!total) {
        return 0;
      }

      const rate = (signed / total) * 100;

      return Number.isInteger(rate) ? rate : rate.toFixed(1);
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

    formatDateTime(value) {
      if (!value) {
        return "--";
      }

      const text = String(value);

      const normalMatch = text.match(
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
      );

      if (normalMatch) {
        const [, year, month, day, hour, minute] = normalMatch;

        return `${year}-${month}-${day} ${hour}:${minute}`;
      }

      return text;
    },
  },
};
</script>

<style scoped>
.sign-records-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 日期筛选 */

.filter-card {
  display: flex;
  align-items: flex-end;
  gap: 18px;

  padding: 20px 26px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 20px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  color: #6b7280;

  font-size: 13px;
  font-weight: 600;
}

.filter-item input {
  width: 180px;

  box-sizing: border-box;

  padding: 11px 12px;

  background: #ffffff;
  color: #111827;

  border: 1px solid #d1d5db;
  border-radius: 10px;

  outline: none;

  font-size: 14px;
}

.filter-item input:focus {
  border-color: #111827;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.search-btn,
.reset-btn {
  padding: 11px 22px;

  border: none;
  border-radius: 10px;

  cursor: pointer;

  font-size: 14px;
}

.search-btn {
  background: #111827;
  color: #ffffff;
}

.reset-btn {
  background: #f3f4f6;
  color: #374151;
}

/* 表格 */

.records-card {
  overflow: hidden;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 24px;
}

.table-wrapper {
  overflow-x: auto;
}

.records-table {
  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;
}

.records-table th {
  padding: 17px 20px;

  background: #f9fafb;

  color: #6b7280;

  border-bottom: 1px solid #eeeeee;

  font-size: 13px;
  font-weight: 600;

  text-align: center;
}

.records-table td {
  padding: 19px 20px;

  color: #374151;

  border-bottom: 1px solid #f0f0f0;

  font-size: 14px;

  text-align: center;
  vertical-align: middle;
}

.records-table tbody tr:last-child td {
  border-bottom: none;
}

.records-table tbody tr:hover {
  background: #fafafa;
}

.time-main {
  color: #111827;
  font-weight: 600;
}

.time-secondary {
  margin-top: 5px;

  color: #9ca3af;

  font-size: 12px;
}

.count-main {
  color: #111827;

  font-size: 17px;
  font-weight: 700;
}

.count-divider {
  margin: 0 4px;
  color: #d1d5db;
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

/* 查看详情 */

.detail-btn {
  padding: 8px 16px;

  background: #111827;
  color: #ffffff;

  border: none;
  border-radius: 9px;

  cursor: pointer;

  transition: 0.2s;
}

.detail-btn:hover {
  opacity: 0.85;
}

/* 空状态 */

.state-box {
  min-height: 260px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 16px;

  color: #9ca3af;

  font-size: 14px;
}

.state-box.error {
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

/* 分页 */

.pagination {
  display: flex;

  align-items: center;
  justify-content: space-between;

  padding: 18px 24px;

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

@media (max-width: 800px) {
  .filter-card {
    flex-wrap: wrap;
  }

  .filter-item {
    flex: 1;

    min-width: 180px;
  }

  .filter-item input {
    width: 100%;
  }

  .pagination {
    flex-direction: column;

    gap: 15px;
  }
}
</style>
