<template>
  <div ref="selectRoot" class="app-select">
    <button
      type="button"
      class="select-trigger"
      :class="{ open: isOpen }"
      @click.stop="toggle"
    >
      <span class="select-value" :class="{ placeholder: !modelValue }">
        {{ selectedLabel }}
      </span>

      <AppIcon
        :name="isOpen ? 'arrow-up' : 'arrow-down'"
        class="select-arrow"
      />
    </button>

    <div v-if="isOpen" class="select-menu" @click.stop>
      <button
        v-if="placeholder"
        type="button"
        class="select-option"
        :class="{ active: !modelValue }"
        @click="selectValue('')"
      >
        <span>{{ placeholder }}</span>

        <AppIcon v-if="!modelValue" name="check" class="check-icon" />
      </button>

      <button
        v-for="option in normalizedOptions"
        :key="String(option.value)"
        type="button"
        class="select-option"
        :class="{
          active: String(modelValue) === String(option.value),
        }"
        @click="selectValue(option.value)"
      >
        <span>{{ option.label }}</span>

        <AppIcon
          v-if="String(modelValue) === String(option.value)"
          name="check"
          class="check-icon"
        />
      </button>
    </div>
  </div>
</template>

<script>
import AppIcon from "./AppIcon.vue";

export default {
  name: "AppSelect",

  components: {
    AppIcon,
  },

  props: {
    modelValue: {
      type: [String, Number],
      default: "",
    },

    options: {
      type: Array,
      default: () => [],
    },

    placeholder: {
      type: String,
      default: "",
    },
  },

  emits: ["update:modelValue"],

  data() {
    return {
      isOpen: false,
    };
  },

  computed: {
    normalizedOptions() {
      return this.options.map((option) => {
        if (typeof option === "string" || typeof option === "number") {
          return {
            label: String(option),
            value: option,
          };
        }

        return {
          label: option.label ?? option.name ?? String(option.value ?? ""),

          value: option.value ?? option.id ?? "",
        };
      });
    },

    selectedLabel() {
      const selected = this.normalizedOptions.find(
        (option) => String(option.value) === String(this.modelValue)
      );

      if (selected) {
        return selected.label;
      }

      return this.placeholder || "请选择";
    },
  },

  mounted() {
    document.addEventListener("click", this.close);
  },

  beforeUnmount() {
    document.removeEventListener("click", this.close);
  },

  methods: {
    toggle() {
      this.isOpen = !this.isOpen;
    },

    close() {
      this.isOpen = false;
    },

    selectValue(value) {
      this.$emit("update:modelValue", value);
      this.isOpen = false;
    },
  },
};
</script>

<style scoped>
.app-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  width: 100%;
  height: 46px;
  padding: 0 12px 0 14px;
  box-sizing: border-box;

  border: 1px solid #d1d5db;
  border-radius: 12px;

  background: #ffffff;
  color: #111827;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  font-size: 14px;
  text-align: left;
}

.select-trigger:hover {
  border-color: #9ca3af;
}

.select-trigger.open {
  border-color: #111827;
}

.select-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-value.placeholder {
  color: #9ca3af;
}

.select-arrow {
  flex-shrink: 0;
  color: #111827;
  font-size: 19px;
}

.select-menu {
  position: absolute;
  top: calc(100% + 7px);
  left: 0;
  right: 0;

  z-index: 150;

  max-height: 240px;
  overflow-y: auto;

  padding: 6px;

  border: 1px solid #e5e7eb;
  border-radius: 12px;

  background: #ffffff;

  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.12);
}

.select-option {
  width: 100%;
  min-height: 40px;

  padding: 8px 10px;

  border: none;
  border-radius: 9px;

  background: transparent;
  color: #374151;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  font-size: 14px;
  text-align: left;
}

.select-option:hover {
  background: #f3f4f6;
}

.select-option.active {
  background: #f3f4f6;
  color: #111827;
  font-weight: 600;
}

.check-icon {
  flex-shrink: 0;
  font-size: 16px;
}
</style>
