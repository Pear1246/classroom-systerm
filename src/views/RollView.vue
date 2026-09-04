<template>
  <div class="main-content">
    <div class="roll-card">
      <div class="card-title">随机点名</div>

      <div class="roll-status">
        {{ isRolling ? "随机点名中..." : "等待开始点名" }}
      </div>

      <div class="name-box">
        {{ currentStudent ? currentStudent.name : "点击开始点名" }}
      </div>

      <button :disabled="isRolling" @click="startRoll">
        {{ isRolling ? "点名中..." : "开始点名" }}
      </button>

      <div v-if="currentStudent && !isRolling" class="score-box">
        <AppIcon
          v-for="n in 5"
          :key="n"
          :name="n <= selectedScore ? 'star-fill' : 'star'"
          class="star"
          :class="{
            active: n <= selectedScore,
          }"
          @click="giveScore(n)"
        />
      </div>

      <p v-if="scoreTip" class="score-tip">
        {{ scoreTip }}
      </p>
    </div>

    <div class="rank-card">
      <div class="card-title">排行榜 TOP5</div>

      <RankTable :students="topStudents" />
    </div>
  </div>
</template>

<script>
import RankTable from "../components/RankTable.vue";
import AppIcon from "../components/AppIcon.vue";

import { useStudentStore } from "../store/studentStore";
import { useCourseStore } from "../store/courseStore";
import { useClassStore } from "../store/classStore";

export default {
  components: {
    RankTable,
    AppIcon,
  },

  data() {
    return {
      currentStudent: null,
      currentDrawRecordId: null,
      isRolling: false,
      timer: null,
      selectedScore: 0,
      scoreTip: "",
    };
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
          (item) => Number(item.id) === this.teachingClassId
        ) || null
      );
    },

    currentClassId() {
      return this.teachingClassId;
    },

    filteredStudents() {
      return this.studentStore.students.filter((item) => {
        return !item.classId || Number(item.classId) === this.currentClassId;
      });
    },

    localTopStudents() {
      return [...this.filteredStudents]
        .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
        .slice(0, 5);
    },

    topStudents() {
      return this.studentStore.ranking.length > 0
        ? this.studentStore.ranking
        : this.localTopStudents;
    },
  },

  async mounted() {
    this.syncCurrentClass();

    await this.studentStore.fetchStudents(this.teachingClassId);

    await this.studentStore.fetchRanking(this.teachingClassId);
  },

  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);

      this.timer = null;
    }
  },

  methods: {
    syncCurrentClass() {
      if (!this.currentTeachingClass) {
        return;
      }

      this.courseStore.switchTeachingClass(this.currentTeachingClass.id);

      this.classStore.switchClass(this.currentTeachingClass.classId);
    },

    async startRoll() {
      if (this.isRolling) {
        return;
      }

      this.isRolling = true;
      this.selectedScore = 0;
      this.scoreTip = "";
      this.currentDrawRecordId = null;

      if (this.filteredStudents.length > 0) {
        this.timer = setInterval(() => {
          const randomIndex = Math.floor(
            Math.random() * this.filteredStudents.length
          );

          this.currentStudent = this.filteredStudents[randomIndex];
        }, 100);
      }

      try {
        const result = await this.studentStore.drawStudent(
          this.teachingClassId
        );

        setTimeout(() => {
          if (this.timer) {
            clearInterval(this.timer);

            this.timer = null;
          }

          this.currentStudent = result.student;

          this.currentDrawRecordId = result.drawRecordId;

          this.isRolling = false;

          if (result.isMock) {
            this.scoreTip = "当前为本地演示点名";
          }
        }, 800);
      } catch (error) {
        if (this.timer) {
          clearInterval(this.timer);

          this.timer = null;
        }

        this.isRolling = false;

        alert("点名失败，当前课程空间暂无学生数据");
      }
    },

    async giveScore(score) {
      if (!this.currentStudent) {
        return;
      }

      if (!this.currentDrawRecordId) {
        alert("当前点名记录不存在，无法评分");

        return;
      }

      try {
        await this.studentStore.submitDrawScore(
          this.currentDrawRecordId,
          score
        );

        this.selectedScore = score;

        this.scoreTip = "评分成功";

        this.studentStore.updateLocalScore(this.currentStudent.id, score);

        await this.studentStore.fetchPerformance(this.teachingClassId);

        await this.studentStore.fetchRanking(this.teachingClassId);
      } catch (error) {
        console.warn("后端评分失败，使用本地评分演示：", error);

        this.selectedScore = score;

        this.scoreTip = "后端评分失败，已使用本地演示数据评分";

        this.studentStore.updateLocalScore(this.currentStudent.id, score);
      }
    },
  },
};
</script>

<style scoped>
.main-content {
  display: grid;

  grid-template-columns: 7fr 3fr;

  gap: 24px;
}

.roll-card,
.rank-card {
  padding: 30px;

  background: #ffffff;

  border: 1px solid #eeeeee;
  border-radius: 24px;
}

.card-title {
  margin-bottom: 20px;

  font-size: 24px;
  font-weight: 700;
}

.roll-card {
  min-height: 500px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;
}

.roll-status {
  margin-bottom: 20px;

  color: #999999;
}

.name-box {
  margin-bottom: 40px;

  font-size: 64px;
  font-weight: 700;
}

button {
  padding: 14px 34px;

  background: #111827;
  color: #ffffff;

  border: none;
  border-radius: 14px;

  cursor: pointer;
}

button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}

.score-box {
  margin-top: 24px;
}

.star {
  margin: 0 6px;

  color: #dddddd;

  font-size: 36px;

  cursor: pointer;

  transition: 0.2s;
}

.star.active {
  color: #f7b500;
}

.star:hover {
  transform: scale(1.15);
}

.score-tip {
  margin-top: 14px;

  color: #16a34a;

  font-size: 14px;
}

@media (max-width: 900px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}
</style>
