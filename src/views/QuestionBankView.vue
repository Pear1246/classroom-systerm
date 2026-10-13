<template>
  <div class="question-bank-page">
    <nav class="section-tabs" aria-label="课程题库二级导航">
      <button
        type="button"
        class="section-tab"
        :class="{ active: activeSection === 'exercises' }"
        @click="switchSection('exercises')"
      >
        <span>练习管理</span>
      </button>

      <button
        type="button"
        class="section-tab"
        :class="{ active: activeSection === 'library' }"
        @click="switchSection('library')"
      >
        <span>题目库</span>
      </button>
    </nav>

    <ExerciseManagementPanel
      v-if="activeSection === 'exercises'"
      :teaching-class-id="teachingClassId"
      :course-status="courseStatus"
    />

    <QuestionLibraryPanel
      v-else
      :teaching-class-id="teachingClassId"
      :course-id="courseId"
    />
  </div>
</template>

<script>
import ExerciseManagementPanel from "../components/question-bank/ExerciseManagementPanel.vue";
import QuestionLibraryPanel from "../components/question-bank/QuestionLibraryPanel.vue";
import { useCourseStore } from "../store/courseStore";
import { useCourseLifecycleStore } from "../store/courseLifecycleStore";

export default {
  name: "QuestionBankView",

  components: {
    ExerciseManagementPanel,
    QuestionLibraryPanel,
  },

  data() {
    return {
      activeSection:
        this.$route.query.section === "library" ? "library" : "exercises",
    };
  },

  computed: {
    courseStore() {
      return useCourseStore();
    },

    courseLifecycleStore() {
      return useCourseLifecycleStore();
    },

    teachingClassId() {
      return String(this.$route.params.teachingClassId || "");
    },

    currentTeachingClass() {
      const current = this.courseStore.currentTeachingClass;

      if (current && String(current.id) === this.teachingClassId) {
        return current;
      }

      return (
        this.courseStore.teachingClasses.find(
          (item) => String(item.id) === this.teachingClassId
        ) || null
      );
    },

    courseId() {
      return String(
        this.currentTeachingClass?.courseId || this.teachingClassId
      );
    },

    courseStatus() {
      return this.currentTeachingClass
        ? this.courseLifecycleStore.getStatus(this.currentTeachingClass)
        : "ACTIVE";
    },
  },

  watch: {
    "$route.query.section"(value) {
      this.activeSection = value === "library" ? "library" : "exercises";
    },
  },

  methods: {
    switchSection(section) {
      if (this.activeSection === section) {
        return;
      }

      this.activeSection = section;

      this.$router.replace({
        path: this.$route.path,
        query: section === "library" ? { section: "library" } : {},
      });
    },
  },
};
</script>

<style scoped>
.question-bank-page {
  display: grid;
  gap: 18px;
}

.section-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  padding: 4px;
  background: #f3f4f6;
  border: 1px solid #eceef1;
  border-radius: 13px;
}

.section-tab {
  min-width: 118px;
  height: 42px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  transition: 0.18s ease;
}

.section-tab:hover {
  color: #111827;
}

.section-tab.active {
  color: #111827;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

@media (max-width: 720px) {
  .section-tabs {
    width: 100%;
  }

  .section-tab {
    flex: 1;
  }
}
</style>
