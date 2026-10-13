<template>
  <i
    v-if="iconClass"
    class="app-icon iconfont"
    :class="iconClass"
    :style="iconStyle"
    aria-hidden="true"
  ></i>
</template>

<script>
const iconMap = {
  save: "icon-baocun",
  close: "icon-guanbi",
  upload: "icon-shangchuan",
  folder: "icon-wenjianjia",
  download: "icon-xiazai",
  external: "icon-waibulianjie",
  home: "icon-xy2_kechengzhuye",
  document: "icon-gongwen",
  file: "icon-putongwenjian",
  eye: "icon-zhengkaiyanjing",
  "eye-open": "icon-zhengkaiyanjing",
  "eye-off": "icon-bishangyanjing",
  search: "icon-sousuo",
  edit: "icon-bianji",
  scan: "icon-saoyisao",
  qrcode: "icon-erweima",
  plus: "icon-jiahao",
  star: "icon-xingxingkongxin",
  "star-fill": "icon-xingxingshixin",
  check: "icon-yunyingguanli",
  "check-circle": "icon-check-circle",
  "arrow-right": "icon-xiangyoujiantou",
  logout: "icon-tuichu",
  history: "icon-lishijilu",
  refresh: "icon-shuaxin",
  time: "icon-time",
  copy: "icon-copy",
  user: "icon-wodexuesheng",
  "arrow-left": "icon-fanhui",
  "arrow-up": "icon-a-xiangshangjiantoushouqixianxing",
  "arrow-down": "icon-a-xiangxiajiantouzhankaixianxing",
  delete: "icon-shanchu",

  // 课程题库
  "question-bank": "icon-kaoshi",
  "single-choice": "icon-danxuantitubiao",
  "multiple-choice": "icon-duoxuantitubiao",
  judgment: "icon-panduantitubiao",
  "short-answer": "icon-jiandati",
  drag: "icon-tuozhuaishunxu",
  ended: "icon-jieshu",
  "data-analysis": "icon-data-analysis",
  pdf: "icon-pdf",
  excel: "icon-Excel",
};

export default {
  name: "AppIcon",

  props: {
    name: {
      type: String,
      required: true,
    },

    size: {
      type: [String, Number],
      default: "",
    },

    color: {
      type: String,
      default: "",
    },
  },

  computed: {
    iconClass() {
      return iconMap[this.name] || "";
    },

    iconStyle() {
      const style = {};

      if (this.size !== "") {
        style.fontSize =
          typeof this.size === "number" ? `${this.size}px` : this.size;
      }

      if (this.color) {
        style.color = this.color;
      }

      return style;
    },
  },
};
</script>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 1em;
  height: 1em;

  font-size: inherit;
  font-style: normal;
  font-weight: normal;
  line-height: 1;

  color: inherit;

  flex: 0 0 auto;
}
</style>
