<template>
  <div class="crepe-editor-shell">
    <Milkdown />
  </div>
</template>

<script>
import { defineComponent, onBeforeUnmount } from "vue";
import { Crepe } from "@milkdown/crepe";
import { Milkdown, useEditor } from "@milkdown/vue";
import { editorSmartExitPlugin } from "../plugins/editorSmartExit";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

const TOP_BAR_LABELS = [
  "加粗",
  "斜体",
  "删除线",
  "行内代码",
  "无序列表",
  "有序列表",
  "任务列表",
  "链接",
  "表格",
  "代码块",
  "数学公式",
  "引用",
  "分割线",
];

const TOP_BAR_LABELS_WITH_IMAGE = [
  "加粗",
  "斜体",
  "删除线",
  "行内代码",
  "无序列表",
  "有序列表",
  "任务列表",
  "链接",
  "图片",
  "表格",
  "代码块",
  "数学公式",
  "引用",
  "分割线",
];

function getVisibleTopBarControls(root) {
  if (!root) {
    return [];
  }

  const rootRect = root.getBoundingClientRect();

  const controls = Array.from(
    root.querySelectorAll("button, [role='button']")
  ).filter((element) => {
    const rect = element.getBoundingClientRect();

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= rootRect.top - 4 &&
      rect.top <= rootRect.top + 86
    );
  });

  // 只保留最外层可交互元素，避免一个按钮内部还有 role="button"
  // 时被重复统计。
  return controls.filter((element) => {
    return !controls.some(
      (other) => other !== element && other.contains(element)
    );
  });
}

function markTopBarChineseTooltips(root) {
  const controls = getVisibleTopBarControls(root).sort((a, b) => {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();

    if (Math.abs(aRect.top - bRect.top) > 6) {
      return aRect.top - bRect.top;
    }

    return aRect.left - bRect.left;
  });

  if (controls.length <= 1) {
    return;
  }

  // Crepe TopBar 的第一个交互控件是“正文 / 标题”选择器，
  // 它本身已有可见中文，因此不需要再做 tooltip。
  const actionControls = controls.slice(1);

  // 当前我们关闭了 ImageBlock，所以通常是 13 个图标。
  // 如果某个 Crepe 版本仍然保留图片入口，则自动使用含“图片”的映射。
  const labels =
    actionControls.length >= TOP_BAR_LABELS_WITH_IMAGE.length
      ? TOP_BAR_LABELS_WITH_IMAGE
      : TOP_BAR_LABELS;

  actionControls.forEach((control, index) => {
    const label = labels[index];

    if (!label) {
      return;
    }

    control.dataset.zhTooltip = label;
    control.setAttribute("aria-label", label);
  });
}

function createChineseTooltipElement() {
  const tooltip = document.createElement("div");

  tooltip.setAttribute("role", "tooltip");

  Object.assign(tooltip.style, {
    position: "fixed",
    zIndex: "99999",
    left: "0",
    top: "0",
    padding: "6px 9px",
    background: "#111827",
    color: "#ffffff",
    borderRadius: "7px",
    fontSize: "12px",
    lineHeight: "1.2",
    fontWeight: "600",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    opacity: "0",
    visibility: "hidden",
    transform: "translate(-50%, 0)",
    transition: "opacity 120ms ease",
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.16)",
  });

  document.body.appendChild(tooltip);

  return tooltip;
}

export default defineComponent({
  name: "MilkdownNoteEditor",

  components: {
    Milkdown,
  },

  props: {
    modelValue: {
      type: String,
      default: "",
    },
  },

  emits: ["update:modelValue"],

  setup(props, { emit }) {
    let controlObserver = null;
    let tooltipElement = null;
    let editorRoot = null;

    const hideChineseTooltip = () => {
      if (!tooltipElement) {
        return;
      }

      tooltipElement.style.opacity = "0";
      tooltipElement.style.visibility = "hidden";
    };

    const showChineseTooltip = (target) => {
      const label = target?.dataset?.zhTooltip;

      if (!label) {
        return;
      }

      if (!tooltipElement) {
        tooltipElement = createChineseTooltipElement();
      }

      tooltipElement.textContent = label;
      tooltipElement.style.visibility = "hidden";
      tooltipElement.style.opacity = "0";

      const rect = target.getBoundingClientRect();

      requestAnimationFrame(() => {
        if (!tooltipElement) {
          return;
        }

        const tooltipRect = tooltipElement.getBoundingClientRect();

        let left = rect.left + rect.width / 2;
        const minLeft = tooltipRect.width / 2 + 8;
        const maxLeft = window.innerWidth - tooltipRect.width / 2 - 8;

        left = Math.min(Math.max(left, minLeft), maxLeft);

        tooltipElement.style.left = `${left}px`;
        tooltipElement.style.top = `${rect.bottom + 8}px`;
        tooltipElement.style.visibility = "visible";
        tooltipElement.style.opacity = "1";
      });
    };

    const handleEditorPointerOver = (event) => {
      const target = event.target.closest?.("[data-zh-tooltip]");

      if (!target || !editorRoot?.contains(target)) {
        return;
      }

      showChineseTooltip(target);
    };

    const handleEditorPointerOut = (event) => {
      const target = event.target.closest?.("[data-zh-tooltip]");

      if (!target) {
        return;
      }

      if (event.relatedTarget && target.contains(event.relatedTarget)) {
        return;
      }

      hideChineseTooltip();
    };

    const handleEditorFocusIn = (event) => {
      const target = event.target.closest?.("[data-zh-tooltip]");

      if (target && editorRoot?.contains(target)) {
        showChineseTooltip(target);
      }
    };

    const handleEditorFocusOut = () => {
      hideChineseTooltip();
    };

    useEditor((root) => {
      editorRoot = root;
      const crepe = new Crepe({
        root,
        defaultValue: props.modelValue,

        features: {
          [Crepe.Feature.TopBar]: true,
          [Crepe.Feature.CodeMirror]: true,
          [Crepe.Feature.BlockEdit]: true,
          [Crepe.Feature.ListItem]: true,
          [Crepe.Feature.Toolbar]: true,
          [Crepe.Feature.ImageBlock]: false,
        },

        featureConfigs: {
          [Crepe.Feature.TopBar]: {
            headingOptions: [
              {
                label: "正文",
                level: null,
              },
              {
                label: "一级标题",
                level: 1,
              },
              {
                label: "二级标题",
                level: 2,
              },
              {
                label: "三级标题",
                level: 3,
              },
              {
                label: "四级标题",
                level: 4,
              },
            ],
          },

          [Crepe.Feature.Toolbar]: {
            boldLabel: "加粗",
            italicLabel: "斜体",
            strikethroughLabel: "删除线",
            codeLabel: "行内代码",
            linkLabel: "链接",
            latexLabel: "数学公式",
          },

          [Crepe.Feature.BlockEdit]: {
            textGroup: {
              label: "文本",
              text: {
                label: "正文",
              },
              h1: {
                label: "一级标题",
              },
              h2: {
                label: "二级标题",
              },
              h3: {
                label: "三级标题",
              },
              h4: {
                label: "四级标题",
              },
              h5: null,
              h6: null,
              quote: {
                label: "引用",
              },
              divider: {
                label: "分割线",
              },
            },

            listGroup: {
              label: "列表",
              bulletList: {
                label: "无序列表",
              },
              orderedList: {
                label: "有序列表",
              },
              taskList: {
                label: "任务列表",
              },
            },

            advancedGroup: {
              label: "插入",
              image: null,
              codeBlock: {
                label: "代码块",
              },
              table: {
                label: "表格",
              },
              math: {
                label: "数学公式",
              },
            },
          },

          [Crepe.Feature.CodeMirror]: {
            searchPlaceholder: "搜索编程语言",
            noResultText: "没有匹配的编程语言",
            copyText: "复制",
          },

          [Crepe.Feature.Placeholder]: {
            text: "开始编写课程笔记，或输入 / 插入内容",
            mode: "block",
          },
        },
      });

      // 在 Crepe 的基础上补一层适合教师使用的键盘体验：空列表项 / 空引用块再次按 Enter 或 Backspace 时，直接退出到普通正文。
      crepe.editor.use(editorSmartExitPlugin);

      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown, previousMarkdown) => {
          if (markdown !== previousMarkdown) {
            emit("update:modelValue", markdown);
          }
        });
      });

      // Crepe 当前对固定 TopBar 暂未提供与浮动 Toolbar 相同的
      // label 本地化配置。因此这里不再依赖浏览器 title，
      // 而是给顶部图标绑定我们自己的中文 tooltip。
      const refreshTopBarTooltips = () => {
        markTopBarChineseTooltips(root);
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(refreshTopBarTooltips);
      });

      controlObserver = new MutationObserver(() => {
        requestAnimationFrame(refreshTopBarTooltips);
      });

      controlObserver.observe(root, {
        childList: true,
        subtree: true,
      });

      root.addEventListener("pointerover", handleEditorPointerOver);

      root.addEventListener("pointerout", handleEditorPointerOut);

      root.addEventListener("focusin", handleEditorFocusIn);

      root.addEventListener("focusout", handleEditorFocusOut);

      return crepe;
    });

    onBeforeUnmount(() => {
      controlObserver?.disconnect();

      if (editorRoot) {
        editorRoot.removeEventListener("pointerover", handleEditorPointerOver);

        editorRoot.removeEventListener("pointerout", handleEditorPointerOut);

        editorRoot.removeEventListener("focusin", handleEditorFocusIn);

        editorRoot.removeEventListener("focusout", handleEditorFocusOut);
      }

      tooltipElement?.remove();
      tooltipElement = null;
      editorRoot = null;
    });

    return {};
  },
});
</script>

<style scoped>
.crepe-editor-shell {
  min-height: 620px;
  overflow: hidden;
  background: #ffffff;
  border-radius: 0 0 18px 18px;
}

.crepe-editor-shell :deep(.milkdown) {
  min-height: 620px;
}

.crepe-editor-shell :deep(.ProseMirror) {
  min-height: 540px;
}
</style>
