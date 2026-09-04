<template>
  <PerformanceTable :students="displayStudents" />
</template>

<script>
import PerformanceTable from "../components/PerformanceTable.vue";
import { useStudentStore } from "../store/studentStore";
import { useCourseStore } from "../store/courseStore";
import { useClassStore } from "../store/classStore";

export default {
  components: {
    PerformanceTable,
  },

  computed: {
    studentStore() {
      return useStudentStore();
    },

    courseStore() {
      return useCourseStore();
    },

    classStore() {
      return useClassStore();
    },

    teachingClassId() {
      return Number(this.$route.params.teachingClassId);
    },

    currentTeachingClass() {
      return (
        this.courseStore.teachingClasses.find(
          (item) => item.id === this.teachingClassId
        ) || null
      );
    },

    displayStudents() {
      return this.studentStore.performances.length > 0
        ? this.studentStore.performances
        : this.studentStore.students;
    },
  },

  async mounted() {
    if (this.currentTeachingClass) {
      this.courseStore.switchTeachingClass(this.currentTeachingClass.id);
      this.classStore.switchClass(this.currentTeachingClass.classId);
    }

    await this.studentStore.fetchPerformance(this.teachingClassId);

    if (this.studentStore.performances.length === 0) {
      await this.studentStore.fetchStudents(this.teachingClassId);
    }
  },
};
</script>
