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

      <button @click="startRoll" :disabled="isRolling">
        {{ isRolling ? "点名中..." : "开始点名" }}
      </button>

      <div class="score-box" v-if="currentStudent && !isRolling">
        <span
          v-for="n in 5"
          :key="n"
          class="star"
          :class="{ active: n <= selectedScore }"
          @click="giveScore(n)"
        >
          ★
        </span>
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
import { useStudentStore } from "../store/studentStore";
import { useCourseStore } from "../store/courseStore";
import { useClassStore } from "../store/classStore";

export default {
  components: {
    RankTable,
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
          (item) => item.id === this.teachingClassId
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
        .sort((a, b) => b.score - a.score)
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
    }
  },

  methods: {
    syncCurrentClass() {
      if (!this.currentTeachingClass) return;

      this.courseStore.switchTeachingClass(this.currentTeachingClass.id);
      this.classStore.switchClass(this.currentTeachingClass.classId);
    },

    async startRoll() {
      if (this.isRolling) return;

      this.isRolling = true;
      this.selectedScore = 0;
      this.scoreTip = "";
      this.currentDrawRecordId = null;

      // 先用当前学生列表做一个点名动画
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
          }

          this.currentStudent = result.student;
          this.currentDrawRecordId = result.drawRecordId;
          this.isRolling = false;
        }, 800);
      } catch (error) {
        if (this.timer) {
          clearInterval(this.timer);
        }

        this.isRolling = false;

        alert("点名失败，请检查后端服务是否正常");
      }
    },

    async giveScore(score) {
      if (!this.currentStudent) return;

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

        // 评分成功后刷新学生表现和排行榜
        await this.studentStore.fetchPerformance(this.teachingClassId);
        await this.studentStore.fetchRanking(this.teachingClassId);
      } catch (error) {
        console.error("评分失败：", error);
        alert("评分提交失败，请检查后端服务是否正常");
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
  background: #fff;
  border-radius: 24px;
  padding: 30px;
  border: 1px solid #eee;
}

.card-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
}

.roll-card {
  min-height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.roll-status {
  color: #999;
  margin-bottom: 20px;
}

.name-box {
  font-size: 64px;
  font-weight: 700;
  margin-bottom: 40px;
}

button {
  border: none;
  background: #111827;
  color: white;
  padding: 14px 34px;
  border-radius: 14px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.score-box {
  margin-top: 24px;
}

.star {
  font-size: 36px;
  cursor: pointer;
  margin: 0 6px;
  color: #ddd;
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
</style>
