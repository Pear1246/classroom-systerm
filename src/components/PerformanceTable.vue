<template>
  <div>
    <table>
      <thead>
        <tr>
          <th>姓名</th>
          <th>点名次数</th>
          <th>平均分</th>
          <th>总分</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="student in paginatedStudents" :key="student.id">
          <td>{{ student.name }}</td>

          <td>{{ student.count }}</td>

          <td>{{ student.average }}</td>

          <td>{{ student.score }}</td>
        </tr>
      </tbody>
    </table>

    <!-- 分页 -->

    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>

      <span> 第 {{ currentPage }} 页 </span>

      <button @click="nextPage" :disabled="currentPage === totalPages">
        下一页
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: ["students"],

  data() {
    return {
      currentPage: 1,

      pageSize: 5,
    };
  },

  computed: {
    totalPages() {
      return Math.ceil(this.students.length / this.pageSize);
    },

    paginatedStudents() {
      const start = (this.currentPage - 1) * this.pageSize;

      const end = start + this.pageSize;

      return this.students.slice(start, end);
    },
  },

  methods: {
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
  },
};
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

thead {
  background: #f7f7f7;
}

th {
  padding: 16px;
  text-align: center;
  color: #666;
  font-size: 15px;
  font-weight: 600;
}

td {
  padding: 18px 14px;
  text-align: center;
  border-top: 1px solid #f1f1f1;
  font-size: 15px;
}

tbody tr:hover {
  background: #fafafa;
}

.pagination {
  margin-top: 24px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.pagination button {
  background: #111;
  color: white;
  border: none;

  padding: 10px 18px;

  border-radius: 10px;

  cursor: pointer;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
