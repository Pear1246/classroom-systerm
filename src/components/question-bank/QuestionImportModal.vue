<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <section class="import-modal" role="dialog" aria-modal="true">
      <header class="modal-header">
        <div>
          <h2>批量导入题目</h2>
          <p>使用 Excel 模板批量整理题目，确认无误后再加入当前练习。</p>
        </div>

        <button
          type="button"
          class="icon-close"
          aria-label="关闭"
          @click="$emit('close')"
        >
          <AppIcon name="close" />
        </button>
      </header>

      <div class="modal-body">
        <section class="import-actions-card">
          <div class="template-copy">
            <span class="action-icon">
              <AppIcon name="download" />
            </span>
            <div>
              <strong>先下载题目模板</strong>
              <p>模板内已经包含单选、多选、判断和简答题示例及填写说明。</p>
            </div>
          </div>

          <a
            class="secondary-button download-button"
            :href="templateUrl"
            download="题目批量导入模板.xlsx"
          >
            <AppIcon name="download" />
            <span>下载 Excel 模板</span>
          </a>
        </section>

        <label
          class="upload-zone"
          :class="{ loading: parsing }"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInput"
            class="file-input"
            type="file"
            accept=".xlsx"
            :disabled="parsing"
            @change="handleFileChange"
          />

          <span class="upload-icon">
            <AppIcon name="upload" />
          </span>
          <strong>{{
            parsing ? "正在解析 Excel…" : "选择或拖入 .xlsx 文件"
          }}</strong>
          <p>{{ fileName || "仅支持系统模板格式的 Excel 文件" }}</p>
          <span class="upload-button">{{
            fileName ? "重新选择" : "选择文件"
          }}</span>
        </label>

        <div v-if="fileError" class="file-error">
          {{ fileError }}
        </div>

        <template v-if="parsed">
          <section class="summary-grid">
            <article class="summary-card">
              <span>识别题目</span>
              <strong>{{ parsed.items.length }}</strong>
            </article>
            <article class="summary-card success">
              <span>可导入</span>
              <strong>{{ parsed.validItems.length }}</strong>
            </article>
            <article
              class="summary-card"
              :class="{ danger: parsed.errorItems.length }"
            >
              <span>错误行</span>
              <strong>{{ parsed.errorItems.length }}</strong>
            </article>
            <article
              class="summary-card"
              :class="{ warning: exceedsRemainingScore }"
            >
              <span>导入分值</span>
              <strong>{{ parsed.totalScore }}</strong>
            </article>
          </section>

          <div v-if="exceedsRemainingScore" class="score-warning">
            当前练习还可加入 {{ remainingScore }} 分，本次有效题目共
            {{ parsed.totalScore }} 分。请调整 Excel 中的题目分值后重新上传。
          </div>

          <div v-if="parsed.errorItems.length" class="validation-notice">
            <strong>发现 {{ parsed.errorItems.length }} 行需要修改</strong>
            <p>
              请根据下方提示修改 Excel 后重新上传；存在错误行时不会执行导入。
            </p>
          </div>

          <div v-if="parsed.items.length" class="preview-section">
            <div class="preview-heading">
              <div>
                <h3>导入预览</h3>
                <p>Excel 行号与原文件保持一致，方便快速定位问题。</p>
              </div>
            </div>

            <div class="preview-table-wrap">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th>行号</th>
                    <th>题型</th>
                    <th class="stem-column">题干</th>
                    <th>章节</th>
                    <th>分值</th>
                    <th>校验</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in parsed.items"
                    :key="item.excelRowNumber"
                    :class="{ 'error-row': item.errors.length }"
                  >
                    <td>{{ item.excelRowNumber }}</td>
                    <td>{{ typeLabel(item.question.type) }}</td>
                    <td class="stem-cell">{{ item.question.stem || "—" }}</td>
                    <td>{{ item.question.chapter || "未分类" }}</td>
                    <td>{{ item.question.score || "—" }} 分</td>
                    <td>
                      <span v-if="!item.errors.length" class="valid-tag"
                        >可导入</span
                      >
                      <div v-else class="error-messages">
                        <span v-for="message in item.errors" :key="message">
                          {{ message }}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else class="empty-preview">
            <AppIcon name="file" />
            <strong>没有读取到题目</strong>
            <p>请确认模板中至少填写一行题目数据。</p>
          </div>

          <label v-if="parsed.validItems.length" class="save-bank-option">
            <input v-model="saveToBank" type="checkbox" />
            <span>
              <strong>导入题目同时保存到题目库</strong>
              <small>不勾选时，导入的题目只属于当前练习。</small>
            </span>
          </label>
        </template>
      </div>

      <footer class="modal-footer">
        <span class="footer-summary">
          <template v-if="parsed && parsed.items.length">
            本次 {{ parsed.validItems.length }} 道可导入 ·
            {{ parsed.totalScore }} 分
          </template>
          <template v-else>请选择填写完成的 Excel 文件</template>
        </span>

        <div class="footer-actions">
          <button
            type="button"
            class="secondary-button"
            @click="$emit('close')"
          >
            取消
          </button>
          <button
            type="button"
            class="primary-button"
            :disabled="!canConfirm"
            @click="confirmImport"
          >
            <AppIcon name="upload" />
            <span>加入练习</span>
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script>
import AppIcon from "../AppIcon.vue";
import {
  importedQuestionTypeLabel,
  parseQuestionWorkbook,
} from "../../utils/questionExcelImport";

const templateUrl = new URL(
  "../../assets/templates/question-import-template.xlsx",
  import.meta.url
).href;

export default {
  name: "QuestionImportModal",

  components: {
    AppIcon,
  },

  props: {
    currentScore: {
      type: Number,
      default: 0,
    },
  },

  emits: ["close", "confirm"],

  data() {
    return {
      templateUrl,
      parsing: false,
      fileName: "",
      fileError: "",
      parsed: null,
      saveToBank: false,
    };
  },

  computed: {
    remainingScore() {
      return Math.max(0, 100 - Number(this.currentScore || 0));
    },

    exceedsRemainingScore() {
      return Boolean(
        this.parsed && this.parsed.totalScore > this.remainingScore
      );
    },

    canConfirm() {
      return Boolean(
        this.parsed &&
          this.parsed.validItems.length &&
          !this.parsed.errorItems.length &&
          !this.exceedsRemainingScore &&
          !this.parsing
      );
    },
  },

  methods: {
    async handleFile(file) {
      if (!file) return;

      const extension = String(file.name || "").toLowerCase();
      if (!extension.endsWith(".xlsx")) {
        this.fileName = file.name || "";
        this.parsed = null;
        this.fileError = "请选择 .xlsx 格式的 Excel 文件。";
        return;
      }

      this.parsing = true;
      this.fileName = file.name || "";
      this.fileError = "";
      this.parsed = null;

      try {
        this.parsed = await parseQuestionWorkbook(file);
      } catch (error) {
        console.error("题目 Excel 解析失败：", error);
        this.fileError =
          error?.message || "Excel 文件解析失败，请检查文件格式后重新上传。";
      } finally {
        this.parsing = false;
      }
    },

    handleFileChange(event) {
      const [file] = event.target.files || [];
      this.handleFile(file);
      event.target.value = "";
    },

    handleDrop(event) {
      if (this.parsing) return;
      const [file] = event.dataTransfer.files || [];
      this.handleFile(file);
    },

    confirmImport() {
      if (!this.canConfirm) return;

      this.$emit("confirm", {
        questions: this.parsed.validItems.map((item) => item.question),
        saveToBank: this.saveToBank,
      });
    },

    typeLabel(type) {
      return importedQuestionTypeLabel(type);
    },
  },
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(4px);
}

.import-modal {
  display: flex;
  flex-direction: column;
  width: min(1120px, calc(100vw - 48px));
  max-height: min(860px, calc(100vh - 48px));
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
}

.modal-header,
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 26px;
}

.modal-header {
  border-bottom: 1px solid #eef0f3;
}

.modal-header h2,
.preview-heading h3 {
  margin: 0;
  color: #111827;
}

.modal-header h2 {
  font-size: 21px;
}

.modal-header p,
.preview-heading p,
.import-actions-card p,
.upload-zone p,
.validation-notice p,
.empty-preview p {
  margin: 6px 0 0;
  color: #7b8494;
  font-size: 14px;
  line-height: 1.6;
}

.icon-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  color: #536071;
  background: transparent;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
}

.icon-close:hover {
  color: #111827;
  background: #f5f6f8;
}

.modal-body {
  overflow-y: auto;
  padding: 24px 26px;
}

.import-actions-card,
.save-bank-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 18px;
  border: 1px solid #e7e9ed;
  border-radius: 16px;
  background: #fafafa;
}

.template-copy {
  display: flex;
  align-items: center;
  gap: 14px;
}

.template-copy strong,
.save-bank-option strong {
  display: block;
  color: #1f2937;
  font-size: 15px;
}

.action-icon,
.upload-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.action-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #f0f2f5;
  color: #344054;
  font-size: 19px;
}

.secondary-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
  text-decoration: none;
}

.secondary-button {
  color: #344054;
  background: #fff;
  border: 1px solid #dfe3e8;
}

.secondary-button:hover {
  border-color: #c5cad2;
  background: #f8f9fa;
}

.primary-button {
  color: #fff;
  background: #111827;
  border: 1px solid #111827;
}

.primary-button:disabled {
  color: #9ca3af;
  background: #eef0f3;
  border-color: #eef0f3;
  cursor: not-allowed;
}

.download-button {
  flex: 0 0 auto;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 184px;
  margin-top: 18px;
  padding: 26px;
  text-align: center;
  border: 1.5px dashed #cfd5dd;
  border-radius: 18px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.upload-zone:hover {
  border-color: #9ca3af;
  background: #fbfbfc;
}

.upload-zone.loading {
  cursor: wait;
}

.file-input {
  display: none;
}

.upload-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  border-radius: 15px;
  background: #f3f4f6;
  color: #273244;
  font-size: 23px;
}

.upload-zone strong {
  color: #1f2937;
  font-size: 16px;
}

.upload-button {
  margin-top: 14px;
  padding: 7px 13px;
  color: #344054;
  background: #f3f4f6;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 650;
}

.file-error,
.score-warning,
.validation-notice {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.file-error,
.validation-notice {
  color: #a43d3d;
  background: #fff7f7;
  border: 1px solid #f1cccc;
}

.score-warning {
  color: #8a5c00;
  background: #fffaf0;
  border: 1px solid #f1dfb2;
}

.validation-notice strong {
  display: block;
  color: #8d3030;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.summary-card {
  padding: 15px 16px;
  border: 1px solid #e8eaee;
  border-radius: 14px;
  background: #fff;
}

.summary-card span {
  display: block;
  color: #7b8494;
  font-size: 13px;
}

.summary-card strong {
  display: block;
  margin-top: 5px;
  color: #172033;
  font-size: 22px;
}

.summary-card.success strong {
  color: #138a60;
}

.summary-card.danger strong {
  color: #c04a4a;
}

.summary-card.warning strong {
  color: #9a690b;
}

.preview-section {
  margin-top: 20px;
}

.preview-heading {
  margin-bottom: 12px;
}

.preview-heading h3 {
  font-size: 17px;
}

.preview-table-wrap {
  overflow: auto;
  max-height: 330px;
  border: 1px solid #e8eaee;
  border-radius: 16px;
}

.preview-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  table-layout: fixed;
}

.preview-table th,
.preview-table td {
  padding: 13px 12px;
  border-bottom: 1px solid #eef0f3;
  color: #4b5565;
  font-size: 13px;
  text-align: center;
  vertical-align: top;
}

.preview-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  color: #687385;
  font-weight: 650;
  background: #fafafa;
}

.preview-table tr:last-child td {
  border-bottom: 0;
}

.preview-table .stem-column {
  width: 34%;
}

.preview-table .stem-cell {
  color: #1f2937;
  text-align: left;
  line-height: 1.55;
}

.preview-table .error-row {
  background: #fffafa;
}

.valid-tag {
  display: inline-flex;
  padding: 4px 9px;
  color: #0e7b55;
  background: #eaf8f2;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 650;
}

.error-messages {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #b04444;
  text-align: left;
  line-height: 1.45;
}

.empty-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  padding: 32px;
  color: #7b8494;
  text-align: center;
  border: 1px dashed #d9dde3;
  border-radius: 16px;
}

.empty-preview > .app-icon {
  margin-bottom: 10px;
  font-size: 26px;
}

.empty-preview strong {
  color: #374151;
}

.save-bank-option {
  justify-content: flex-start;
  margin-top: 18px;
  cursor: pointer;
}

.save-bank-option input {
  width: 18px;
  height: 18px;
  accent-color: #111827;
}

.save-bank-option span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.save-bank-option small {
  color: #7b8494;
  font-size: 13px;
}

.modal-footer {
  flex: 0 0 auto;
  border-top: 1px solid #eef0f3;
  background: #fff;
}

.footer-summary {
  color: #7b8494;
  font-size: 13px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 760px) {
  .modal-mask {
    padding: 10px;
  }

  .import-modal {
    width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    border-radius: 18px;
  }

  .modal-header,
  .modal-footer,
  .modal-body {
    padding-left: 18px;
    padding-right: 18px;
  }

  .import-actions-card,
  .modal-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .download-button,
  .footer-actions,
  .footer-actions > button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
