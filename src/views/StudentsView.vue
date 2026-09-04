<template>
  <StudentTable :students="studentStore.students" />
</template>

<script>
import StudentTable from "../components/StudentTable.vue";
import { useStudentStore } from "../store/studentStore";
import { useCourseStore } from "../store/courseStore";
import { useClassStore } from "../store/classStore";

export default {
  components: {
    StudentTable,
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
  },

  async mounted() {
    if (this.currentTeachingClass) {
      this.courseStore.switchTeachingClass(this.currentTeachingClass.id);
      this.classStore.switchClass(this.currentTeachingClass.classId);
    }

    await this.studentStore.fetchStudents(this.teachingClassId);
  },
};
</script>
