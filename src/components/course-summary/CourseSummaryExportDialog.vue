<template>
  <div class="export-mask" @click.self="$emit('close')">
    <section class="export-dialog" role="dialog" aria-modal="true">
      <div class="export-header">
        <div>
          <h3>导出课程数据</h3>
          <p>选择需要包含在 Excel 数据明细中的内容。</p>
        </div>

        <button type="button" class="icon-close" @click="$emit('close')">
          <AppIcon name="close" />
        </button>
      </div>

      <div class="export-body">
        <div class="export-toolbar">
          <strong>导出内容</strong>
          <button type="button" class="text-action" @click="toggleAll">
            {{ allOptionalSelected ? "取消全选" : "全选" }}
          </button>
        </div>

        <label class="export-option fixed-option">
          <span class="checkbox-shell checked disabled">
            <span class="checkbox-mark">✓</span>
          </span>

          <span class="option-copy">
            <strong>课程概览</strong>
            <small>课程基本信息和核心统计，固定包含</small>
          </span>
        </label>

        <label v-for="item in options" :key="item.key" class="export-option">
          <input
            v-model="localSelection[item.key]"
            class="native-checkbox"
            type="checkbox"
          />

          <span
            class="checkbox-shell"
            :class="{ checked: localSelection[item.key] }"
          >
            <span v-if="localSelection[item.key]" class="checkbox-mark">✓</span>
          </span>

          <span class="option-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </label>
      </div>

      <div class="export-footer">
        <span class="selected-hint">
          将生成 {{ selectedSheetCount }} 个数据工作表
        </span>

        <div class="footer-actions">
          <button type="button" class="cancel-btn" @click="$emit('close')">
            取消
          </button>

          <button type="button" class="confirm-btn" @click="confirmExport">
            <AppIcon name="excel" />
            <span>导出 Excel</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import AppIcon from "../AppIcon.vue";

const EXPORT_OPTIONS = [
  {
    key: "students",
    label: "学生名单",
    description: "学号、姓名和班级信息",
  },
  {
    key: "attendance",
    label: "签到数据",
    description: "每次签到时间、人数和签到率",
  },
  {
    key: "performance",
    label: "课堂表现",
    description: "学生课堂互动次数和表现分",
  },
  {
    key: "exercises",
    label: "练习与成绩",
    description: "练习完成情况、批改进度和学生成绩",
  },
  {
    key: "resources",
    label: "课程资源",
    description: "文件资料、在线笔记和资源分类",
  },
];

export default {
  name: "CourseSummaryExportDialog",

  components: {
    AppIcon,
  },

  props: {
    selection: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ["close", "confirm"],

  data() {
    return {
      options: EXPORT_OPTIONS,
      localSelection: {
        students: this.selection.students !== false,
        attendance: this.selection.attendance !== false,
        performance: this.selection.performance !== false,
        exercises: this.selection.exercises !== false,
        resources: this.selection.resources !== false,
      },
    };
  },

  computed: {
    allOptionalSelected() {
      return this.options.every((item) => this.localSelection[item.key]);
    },

    selectedSheetCount() {
      let count = 1;
      this.options.forEach((item) => {
        if (this.localSelection[item.key]) {
          count += item.key === "exercises" ? 2 : 1;
        }
      });
      return count;
    },
  },

  methods: {
    toggleAll() {
      const nextValue = !this.allOptionalSelected;
      this.options.forEach((item) => {
        this.localSelection[item.key] = nextValue;
      });
    },

    confirmExport() {
      this.$emit("confirm", { ...this.localSelection });
    },
  },
};
</script>

<style scoped>
.export-mask {
  position: fixed;
  inset: 0;
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.38);
  box-sizing: border-box;
}

.export-dialog {
  width: min(620px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  background: #ffffff;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
}

.export-header,
.export-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
}

.export-header {
  border-bottom: 1px solid #eef0f2;
}

.export-header h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
}

.export-header p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.icon-close {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  background: #f5f6f8;
  color: #4b5563;
  cursor: pointer;
  font-size: 16px;
}

.export-body {
  padding: 18px 24px 8px;
}

.export-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.export-toolbar strong {
  color: #1f2937;
  font-size: 15px;
}

.text-action {
  border: 0;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px 4px;
  border-bottom: 1px solid #f0f1f3;
  cursor: pointer;
}

.fixed-option {
  cursor: default;
}

.native-checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-shell {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #cfd4dc;
  border-radius: 6px;
  background: #ffffff;
  box-sizing: border-box;
  color: #ffffff;
}

.checkbox-shell.checked {
  border-color: #111827;
  background: #111827;
}

.checkbox-shell.disabled {
  opacity: 0.55;
}

.checkbox-mark {
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.option-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.option-copy strong {
  color: #1f2937;
  font-size: 14px;
}

.option-copy small {
  color: #7b8491;
  font-size: 12.5px;
  line-height: 1.5;
}

.export-footer {
  border-top: 1px solid #eef0f2;
}

.selected-hint {
  color: #7b8491;
  font-size: 13px;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn,
.confirm-btn {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.cancel-btn {
  border: 1px solid #e2e5e9;
  background: #ffffff;
  color: #4b5563;
}

.confirm-btn {
  border: 1px solid #111827;
  background: #111827;
  color: #ffffff;
}

@media (max-width: 640px) {
  .export-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .footer-actions {
    justify-content: flex-end;
  }
}
</style>
