<template>
  <div class="rank-list">
    <div
      class="rank-item"
      v-for="(student, index) in students"
      :key="student.id"
    >
      <div class="rank-left">
        <div class="rank-number" :class="{ top: index === 0 }">
          {{ index + 1 }}
        </div>

        <div class="student-info">
          <div class="student-name">
            {{ student.name }}
          </div>

          <div class="student-class">
            {{ student.class }}
          </div>
        </div>
      </div>

      <div class="student-score">
        {{ student.score }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["students"],
};
</script>

<style scoped>
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rank-item {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 16px 18px;

  border-radius: 16px;

  background: #fafafa;

  transition: 0.2s;
}

.rank-item:hover {
  transform: translateY(-2px);
  background: #f2f2f2;
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rank-number {
  width: 34px;
  height: 34px;

  border-radius: 50%;

  background: #eaeaea;

  display: flex;
  justify-content: center;
  align-items: center;

  font-weight: 700;
}

.rank-number.top {
  background: #111;
  color: white;
}

.student-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.student-class {
  color: #888;
  font-size: 13px;
}

.student-score {
  font-size: 24px;
  font-weight: 700;
}
</style>
