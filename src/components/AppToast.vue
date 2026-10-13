<template>
  <transition name="app-toast">
    <div
      v-if="message"
      class="app-toast"
      :class="`app-toast--${type}`"
      :role="type === 'error' ? 'alert' : 'status'"
      aria-live="polite"
    >
      <AppIcon :name="iconName" size="17" />
      <span>{{ message }}</span>
    </div>
  </transition>
</template>

<script>
import AppIcon from "./AppIcon.vue";

export default {
  name: "AppToast",

  components: {
    AppIcon,
  },

  props: {
    message: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      default: "success",
      validator: (value) => ["success", "error", "info"].includes(value),
    },
  },

  computed: {
    iconName() {
      if (this.type === "error") return "close";
      if (this.type === "info") return "check-circle";
      return "check-circle";
    },
  },
};
</script>

<style scoped>
.app-toast {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 760;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: min(440px, calc(100vw - 40px));
  min-height: 40px;
  padding: 0 15px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.45;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.1);
}

.app-toast--success {
  border-color: #b8e5d2;
  background: #ecfdf5;
  color: #047857;
}

.app-toast--error {
  border-color: #f0c3bf;
  background: #fff1f0;
  color: #b42318;
}

.app-toast--info {
  border-color: #dfe3e8;
  background: #f8fafc;
  color: #475467;
}

.app-toast-enter-active,
.app-toast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 720px) {
  .app-toast {
    right: 18px;
    bottom: 18px;
    left: 18px;
    justify-content: center;
    max-width: none;
  }
}
</style>
