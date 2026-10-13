import { defineStore } from "pinia";

export const useClassStore = defineStore("class", {
  state: () => ({
    currentClassId: null,
  }),

  actions: {
    switchClass(id) {
      this.currentClassId = id ?? null;
    },
  },
});
