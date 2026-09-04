<template>
  <i class="iconfont app-icon" :class="iconClass" aria-hidden="true"></i>
</template>

<script>
const iconMap = {
  "eye-open": "icon-zhengkaiyanjing",
  "eye-off": "icon-bishangyanjing",
  search: "icon-sousuo",
  edit: "icon-bianji",
  scan: "icon-saoyisao",
  qrcode: "icon-erweima",
  plus: "icon-jiahao",
  "star-fill": "icon-xingxingshixin",
  star: "icon-xingxingkongxin",
  check: "icon-yunyingguanli",
  "arrow-right": "icon-xiangyoujiantou",
  logout: "icon-tuichu",
  history: "icon-lishijilu",
  refresh: "icon-shuaxin",
  user: "icon-wodexuesheng",
  "arrow-left": "icon-fanhui",
  "arrow-up": "icon-a-xiangshangjiantoushouqixianxing",
  "arrow-down": "icon-a-xiangxiajiantouzhankaixianxing",
  delete: "icon-shanchu",
};

export default {
  name: "AppIcon",

  props: {
    name: {
      type: String,
      required: true,
    },
  },

  computed: {
    iconClass() {
      return iconMap[this.name] || "";
    },
  },
};
</script>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  line-height: 1;
}
</style>
