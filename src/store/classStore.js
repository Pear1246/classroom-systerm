import { defineStore } from "pinia";

export const useClassStore = defineStore("class", {
  state: () => ({
    currentClassId: null,

    classes: [
      {
        id: 1,
        courseId: 1,
        className: "24计算机科学与技术1班",
      },
      {
        id: 2,
        courseId: 2,
        className: "24软件工程1班",
      },
      {
        id: 3,
        courseId: 4,
        className: "23计算机科学与技术1班",
      },
      {
        id: 4,
        courseId: 3,
        className: "24人工智能1班",
      },
    ],
  }),

  actions: {
    switchClass(id) {
      this.currentClassId = Number(id);
    },
  },
});
