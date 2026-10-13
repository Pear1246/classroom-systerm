<template>
  <div class="feedback-mask" role="presentation">
    <section
      class="feedback-dialog"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <header class="feedback-header">
        <div>
          <h3 :id="titleId">{{ title }}</h3>
          <p v-if="description">{{ description }}</p>
        </div>

        <button
          type="button"
          class="feedback-close"
          aria-label="关闭提示"
          @click="$emit('confirm')"
        >
          <AppIcon name="close" />
        </button>
      </header>

      <div class="feedback-content">
        <ul v-if="normalizedMessages.length > 1">
          <li v-for="message in normalizedMessages" :key="message">
            {{ message }}
          </li>
        </ul>
        <p v-else>{{ normalizedMessages[0] }}</p>
      </div>

      <footer class="feedback-actions">
        <button type="button" class="confirm-button" @click="$emit('confirm')">
          {{ confirmText }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script>
import AppIcon from "./AppIcon.vue";

export default {
  name: "AppFeedbackDialog",

  components: {
    AppIcon,
  },

  props: {
    title: {
      type: String,
      default: "请完善信息",
    },

    description: {
      type: String,
      default: "",
    },

    messages: {
      type: [String, Array],
      default: "请检查当前内容后再继续。",
    },

    confirmText: {
      type: String,
      default: "我知道了",
    },
  },

  emits: ["confirm"],

  computed: {
    titleId() {
      return "feedback-dialog-title";
    },

    normalizedMessages() {
      const list = Array.isArray(this.messages)
        ? this.messages
        : [this.messages];
      return list.map((item) => String(item || "").trim()).filter(Boolean);
    },
  },
};
</script>

<style scoped>
.feedback-mask {
  position: fixed;
  inset: 0;
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.32);
  backdrop-filter: blur(2px);
}

.feedback-dialog {
  width: min(470px, 100%);
  padding: 23px;
  box-sizing: border-box;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 24px 72px rgba(15, 23, 42, 0.18);
}

.feedback-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.feedback-header h3 {
  margin: 0;
  color: #111827;
  font-size: 19px;
  line-height: 1.4;
}

.feedback-header p {
  margin: 7px 0 0;
  color: #7b8492;
  font-size: 14px;
  line-height: 1.65;
}

.feedback-close {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #67717f;
  cursor: pointer;
  font-size: 18px;
}

.feedback-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.feedback-content {
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid #fde2e5;
  border-radius: 13px;
  background: #fff8f8;
  color: #9f2940;
  font-size: 14px;
  line-height: 1.7;
}

.feedback-content p,
.feedback-content ul {
  margin: 0;
}

.feedback-content ul {
  padding-left: 20px;
}

.feedback-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.confirm-button {
  min-width: 96px;
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid #111827;
  border-radius: 11px;
  background: #111827;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
}

.confirm-button:hover {
  background: #1f2937;
}
</style>
