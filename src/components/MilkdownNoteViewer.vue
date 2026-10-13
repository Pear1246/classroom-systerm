<template>
  <div class="milkdown-viewer-shell">
    <Milkdown />
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { Crepe } from "@milkdown/crepe";
import { Milkdown, useEditor } from "@milkdown/vue";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

export default defineComponent({
  name: "MilkdownNoteViewer",

  components: {
    Milkdown,
  },

  props: {
    content: {
      type: String,
      default: "",
    },
  },

  setup(props) {
    useEditor((root) => {
      const crepe = new Crepe({
        root,
        defaultValue: props.content,

        features: {
          [Crepe.Feature.TopBar]: false,
          [Crepe.Feature.Toolbar]: false,
          [Crepe.Feature.BlockEdit]: false,
          [Crepe.Feature.Placeholder]: false,
          [Crepe.Feature.ImageBlock]: false,
          [Crepe.Feature.LinkTooltip]: false,
          [Crepe.Feature.Cursor]: false,

          // 阅读模式仍然保留这些内容的正常渲染能力。
          [Crepe.Feature.CodeMirror]: true,
          [Crepe.Feature.Table]: true,
          [Crepe.Feature.Latex]: true,
          [Crepe.Feature.ListItem]: true,
        },

        featureConfigs: {
          [Crepe.Feature.CodeMirror]: {
            searchPlaceholder: "搜索编程语言",
            noResultText: "没有匹配的编程语言",
            copyText: "复制",
          },
        },
      });

      // Crepe 官方提供的只读模式。
      crepe.setReadonly(true);

      return crepe;
    });

    return {};
  },
});
</script>

<style scoped>
.milkdown-viewer-shell {
  min-height: 420px;
  background: #ffffff;
}

.milkdown-viewer-shell :deep(.milkdown) {
  min-height: 420px;
}

.milkdown-viewer-shell :deep(.ProseMirror) {
  min-height: 360px;
  padding: 8px 0 34px;
  outline: none;
  cursor: default;
}

.milkdown-viewer-shell :deep(.ProseMirror > *:first-child) {
  margin-top: 0;
}
</style>
