<template>
  <div class="materials-page">
    <div class="materials-layout">
      <aside class="materials-sidebar">
        <div class="sidebar-heading">
          <div>
            <h3>知识导航</h3>
            <p>集中管理课程内容</p>
          </div>

          <div
            v-if="canManageMaterials"
            ref="createMenuWrap"
            class="create-menu-wrap"
          >
            <button
              class="sidebar-new-btn"
              @click="showCreateMenu = !showCreateMenu"
            >
              <AppIcon name="plus" />
              <span>新建</span>
            </button>

            <div v-if="showCreateMenu" class="create-menu">
              <button @click="createOnlineNote">
                <span class="create-option-icon">
                  <AppIcon name="document" />
                </span>

                <span>
                  <strong>在线笔记</strong>
                  <small>直接编写课程知识内容</small>
                </span>
              </button>

              <button @click="openUploadDialogFromMenu">
                <span class="create-option-icon">
                  <AppIcon name="upload" />
                </span>

                <span>
                  <strong>上传文件</strong>
                  <small>PDF、PPT、Word、图片等</small>
                </span>
              </button>
            </div>
          </div>
        </div>

        <button
          class="sidebar-home"
          :class="{ active: activeType === 'home' }"
          @click="showCourseHome"
        >
          <span class="nav-icon-box">
            <AppIcon name="home" />
          </span>

          <span class="nav-text">
            <strong>课程主页</strong>
            <small>概览与最近更新</small>
          </span>
        </button>

        <div
          v-for="category in materialData.categories"
          :key="category.id"
          class="category-block"
        >
          <button
            class="category-row"
            :class="{
              active:
                (activeType === 'category' || activeType === 'material') &&
                activeCategoryId === category.id,
            }"
            @click="selectCategory(category)"
          >
            <span class="nav-icon-box">
              <AppIcon name="folder" />
            </span>

            <span class="category-name">
              {{ category.name }}
            </span>

            <span class="category-count">
              {{ category.materials.length }}
            </span>

            <AppIcon
              :name="
                expandedCategoryId === category.id ? 'arrow-up' : 'arrow-down'
              "
              class="category-arrow"
            />
          </button>

          <div
            v-if="expandedCategoryId === category.id"
            class="material-subnav"
          >
            <button
              v-for="material in category.materials"
              :key="material.id"
              class="material-subnav-item"
              :class="{
                active:
                  activeType === 'material' && activeMaterialId === material.id,
              }"
              @click="openMaterial(category, material)"
            >
              <AppIcon :name="getMaterialIcon(material)" class="subnav-icon" />

              <span class="subnav-title">
                {{ material.title }}
              </span>
            </button>
          </div>
        </div>
      </aside>

      <main class="materials-content">
        <template v-if="activeType === 'home'">
          <section class="content-hero">
            <div class="hero-main">
              <span class="content-badge">课程知识库</span>
              <h3>{{ courseTitle }}</h3>
              <p v-if="className" class="course-class-name">
                {{ className }}
              </p>
              <p>{{ materialData.courseIntroduction }}</p>
            </div>

            <div class="hero-stat">
              <strong>{{ totalMaterials }}</strong>
              <span>项内容</span>
            </div>
          </section>

          <section class="summary-grid">
            <button
              v-for="category in materialData.categories"
              :key="category.id"
              class="summary-card"
              @click="openCategoryFromHome(category)"
            >
              <span class="summary-icon">
                <AppIcon name="folder" />
              </span>

              <span class="summary-info">
                <strong>{{ category.name }}</strong>
                <small>{{ category.description }}</small>
              </span>

              <span class="summary-count">
                {{ category.materials.length }}
              </span>

              <AppIcon name="arrow-right" />
            </button>
          </section>

          <section class="recent-section">
            <div class="section-title-row">
              <div>
                <h3>最近更新</h3>
                <p>快速查看最近整理的课程内容</p>
              </div>
            </div>

            <div class="recent-list">
              <button
                v-for="item in recentMaterials"
                :key="item.material.id"
                class="recent-item"
                @click="openMaterial(item.category, item.material)"
              >
                <span class="file-icon-box">
                  <AppIcon :name="getMaterialIcon(item.material)" />
                </span>

                <span class="recent-main">
                  <strong>{{ item.material.title }}</strong>
                  <small>
                    {{ item.category.name }}
                    <span> · {{ getMaterialTypeText(item.material) }} </span>
                  </small>
                </span>

                <span class="recent-time">
                  {{ item.material.updatedAt }}
                </span>

                <span
                  class="visibility-tag"
                  :class="{ private: !item.material.visibleToStudents }"
                >
                  <AppIcon
                    :name="
                      item.material.visibleToStudents ? 'eye-open' : 'eye-off'
                    "
                  />

                  {{ item.material.visibleToStudents ? "学生可见" : "仅教师" }}
                </span>
              </button>
            </div>
          </section>
        </template>

        <template v-else-if="activeType === 'category' && activeCategory">
          <section class="category-content-header">
            <div>
              <span class="content-badge">知识分类</span>
              <h3>{{ activeCategory.name }}</h3>
              <p>{{ activeCategory.description }}</p>
            </div>

            <div class="category-total">
              共 {{ activeCategory.materials.length }} 项
            </div>
          </section>

          <div class="material-card-list">
            <button
              v-for="material in pagedCategoryMaterials"
              :key="material.id"
              class="material-card"
              @click="openMaterial(activeCategory, material)"
            >
              <span class="file-icon-box large">
                <AppIcon :name="getMaterialIcon(material)" />
              </span>

              <span class="material-card-main">
                <span class="material-title-row">
                  <strong>{{ material.title }}</strong>

                  <span
                    v-if="material.materialKind === 'note'"
                    class="note-tag"
                  >
                    在线笔记
                  </span>

                  <span
                    class="visibility-tag"
                    :class="{ private: !material.visibleToStudents }"
                  >
                    <AppIcon
                      :name="
                        material.visibleToStudents ? 'eye-open' : 'eye-off'
                      "
                    />

                    {{ material.visibleToStudents ? "学生可见" : "仅教师" }}
                  </span>
                </span>

                <small>
                  {{ getMaterialTypeText(material) }}
                  <template v-if="material.size">
                    · {{ material.size }}
                  </template>
                  · 更新于 {{ material.updatedAt }}
                </small>

                <span class="material-desc">
                  {{ material.description }}
                </span>
              </span>

              <AppIcon name="arrow-right" class="card-arrow" />
            </button>
          </div>

          <div class="pagination">
            <span class="page-summary">
              第 {{ activeCategoryPage }} / {{ activeCategoryPageCount }} 页
            </span>

            <div class="page-actions">
              <button
                class="page-btn"
                :disabled="activeCategoryPage <= 1"
                @click="changePage(activeCategoryPage - 1)"
              >
                <AppIcon name="arrow-left" />
              </button>

              <button
                v-for="page in activeCategoryPageCount"
                :key="page"
                class="page-number"
                :class="{ active: page === activeCategoryPage }"
                @click="changePage(page)"
              >
                {{ page }}
              </button>

              <button
                class="page-btn"
                :disabled="activeCategoryPage >= activeCategoryPageCount"
                @click="changePage(activeCategoryPage + 1)"
              >
                <AppIcon name="arrow-right" />
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="activeType === 'material' && activeMaterial">
          <button
            class="content-back-btn"
            @click="showCategory(activeCategory)"
          >
            <AppIcon name="arrow-left" />
            <span>返回{{ activeCategory.name }}</span>
          </button>

          <section class="material-detail-header">
            <span class="file-icon-box detail">
              <AppIcon :name="getMaterialIcon(activeMaterial)" />
            </span>

            <div class="detail-title">
              <div class="detail-title-top">
                <span class="content-badge">
                  {{ activeCategory.name }}
                </span>

                <span
                  class="visibility-tag"
                  :class="{ private: !activeMaterial.visibleToStudents }"
                >
                  <AppIcon
                    :name="
                      activeMaterial.visibleToStudents ? 'eye-open' : 'eye-off'
                    "
                  />

                  {{ activeMaterial.visibleToStudents ? "学生可见" : "仅教师" }}
                </span>
              </div>

              <h3>{{ activeMaterial.title }}</h3>
              <p>{{ activeMaterial.fileName || "课程内容" }}</p>
            </div>
          </section>

          <section class="detail-meta-grid">
            <div class="meta-item">
              <span>内容类型</span>
              <strong>{{ getMaterialTypeText(activeMaterial) }}</strong>
            </div>

            <div class="meta-item">
              <span>文件大小</span>
              <strong>{{ activeMaterial.size || "—" }}</strong>
            </div>

            <div class="meta-item">
              <span>更新时间</span>
              <strong>{{ activeMaterial.updatedAt }}</strong>
            </div>

            <div class="meta-item">
              <span>访问范围</span>
              <strong>
                {{ activeMaterial.visibleToStudents ? "教师与学生" : "仅教师" }}
              </strong>
            </div>
          </section>

          <section class="detail-description">
            <h4>内容说明</h4>
            <p>{{ activeMaterial.description }}</p>
          </section>

          <section class="preview-section">
            <div class="preview-title-row">
              <h4>内容预览</h4>
              <span>{{ activeMaterial.fileName || activeMaterial.title }}</span>
            </div>

            <div
              v-if="
                activeMaterial.localUrl &&
                activeMaterial.materialKind === 'image'
              "
              class="image-preview"
            >
              <img :src="activeMaterial.localUrl" :alt="activeMaterial.title" />
            </div>

            <iframe
              v-else-if="
                activeMaterial.localUrl && activeMaterial.fileType === 'PDF'
              "
              class="pdf-preview"
              :src="activeMaterial.localUrl"
              title="资料预览"
            ></iframe>

            <div v-else class="preview-placeholder">
              <div class="preview-icon">
                <AppIcon :name="getMaterialIcon(activeMaterial)" />
              </div>
              <strong>{{
                activeMaterial.fileName || activeMaterial.title
              }}</strong>
            </div>
          </section>

          <div class="detail-actions">
            <button
              class="secondary-action"
              :disabled="!canPreviewActiveMaterial"
              @click="handlePreview"
            >
              <AppIcon name="file" />
              <span>在线查看</span>
            </button>

            <button
              class="primary-action"
              :disabled="!activeMaterial.localUrl"
              @click="handleDownload"
            >
              <AppIcon name="download" />
              <span>下载资料</span>
            </button>
          </div>
        </template>
      </main>
    </div>

    <div
      v-if="showUpload"
      class="dialog-mask"
      @click.self="handleUploadMaskClick"
    >
      <div class="upload-dialog">
        <div class="dialog-title-row">
          <div class="dialog-heading">
            <span class="dialog-heading-icon">
              <AppIcon name="upload" />
            </span>

            <div>
              <h3>上传文件</h3>
              <p>选择本地文件并完善资料信息</p>
            </div>
          </div>

          <button
            class="dialog-close"
            aria-label="关闭"
            :disabled="isUploading"
            @click="closeUploadDialog"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div class="upload-form">
          <label class="full-row">
            <span class="field-label">
              选择文件
              <span class="required-mark">*</span>
            </span>

            <input
              ref="fileInput"
              class="hidden-file-input"
              type="file"
              @change="handleFileChange"
            />

            <button
              type="button"
              class="file-picker"
              :class="{ selected: selectedFile }"
              @click="$refs.fileInput.click()"
            >
              <span class="file-picker-icon">
                <AppIcon :name="selectedFile ? 'document' : 'upload'" />
              </span>

              <span class="file-picker-copy">
                <strong>
                  {{ selectedFile ? selectedFile.name : "从电脑中选择资料" }}
                </strong>

                <small v-if="selectedFile">
                  {{ selectedFileType }} · {{ selectedFileSize }}
                </small>

                <small v-else> PDF、PPT、Word、图片及其他常用文件 </small>
              </span>

              <span class="file-picker-action">
                {{ selectedFile ? "重新选择" : "选择文件" }}
              </span>
            </button>
          </label>

          <label>
            <span class="field-label">
              资料名称
              <span class="required-mark">*</span>
            </span>

            <input
              v-model="uploadForm.title"
              type="text"
              placeholder="例如：第3章 栈和队列"
            />
          </label>

          <label>
            <span class="field-label">
              所属分类
              <span class="required-mark">*</span>
            </span>

            <AppSelect
              v-model="uploadForm.categoryId"
              :options="materialData.categories"
            />
          </label>

          <label class="full-row">
            <span class="field-label">资料说明</span>

            <textarea
              v-model="uploadForm.description"
              rows="4"
              placeholder="简单说明这份资料的用途"
            ></textarea>
          </label>

          <div class="visibility-option full-row">
            <span class="visibility-option-icon">
              <AppIcon
                :name="uploadForm.visibleToStudents ? 'eye-open' : 'eye-off'"
              />
            </span>

            <span class="checkbox-copy">
              <strong>对学生可见</strong>
              <small>
                {{
                  uploadForm.visibleToStudents
                    ? "学生可在课程知识库中查看"
                    : "仅教师可查看"
                }}
              </small>
            </span>

            <button
              type="button"
              class="switch"
              :class="{ active: uploadForm.visibleToStudents }"
              @click="
                uploadForm.visibleToStudents = !uploadForm.visibleToStudents
              "
            >
              <span></span>
            </button>
          </div>

          <p v-if="formError" class="form-error full-row">
            {{ formError }}
          </p>
        </div>

        <div class="dialog-actions">
          <button
            class="cancel-btn"
            :disabled="isUploading"
            @click="closeUploadDialog"
          >
            取消
          </button>

          <button
            class="save-btn"
            :disabled="isUploading"
            @click="uploadMaterial"
          >
            <AppIcon name="upload" />
            <span>{{ isUploading ? "上传中..." : "上传" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppIcon from "../components/AppIcon.vue";
import AppSelect from "../components/AppSelect.vue";

import { useCourseStore } from "../store/courseStore";
import { useCourseKnowledgeStore } from "../store/courseKnowledgeStore";
import { useCourseLifecycleStore } from "../store/courseLifecycleStore";
import { getCourseAccessPolicy } from "../utils/coursePermissions";

export default {
  name: "CourseMaterialsView",

  components: {
    AppIcon,
    AppSelect,
  },

  data() {
    return {
      activeType: "home",
      activeCategoryId: "",
      activeMaterialId: "",
      expandedCategoryId: "",

      pageSize: 8,
      categoryPageMap: {},

      showCreateMenu: false,
      showUpload: false,

      selectedFile: null,
      isUploading: false,
      formError: "",

      uploadForm: {
        title: "",
        categoryId: "",
        description: "",
        visibleToStudents: true,
      },
    };
  },

  computed: {
    courseStore() {
      return useCourseStore();
    },

    knowledgeStore() {
      return useCourseKnowledgeStore();
    },

    courseLifecycleStore() {
      return useCourseLifecycleStore();
    },

    teachingClassId() {
      return String(this.$route.params.teachingClassId || "");
    },

    materialData() {
      return (
        this.knowledgeStore.getCourseData(this.teachingClassId) || {
          courseIntroduction: "",
          categories: [],
        }
      );
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

    courseTitle() {
      return this.currentTeachingClass?.courseName || "当前课程";
    },

    className() {
      return this.currentTeachingClass?.className || "";
    },

    courseAccess() {
      const status = this.currentTeachingClass
        ? this.courseLifecycleStore.getStatus(this.currentTeachingClass)
        : "ACTIVE";

      return getCourseAccessPolicy(status);
    },

    canManageMaterials() {
      return this.courseAccess.canManageMaterials;
    },

    totalMaterials() {
      return this.materialData.categories.reduce((total, category) => {
        return total + category.materials.length;
      }, 0);
    },

    recentMaterials() {
      const items = [];

      this.materialData.categories.forEach((category) => {
        category.materials.forEach((material) => {
          items.push({
            category,
            material,
          });
        });
      });

      return items
        .sort((a, b) =>
          String(b.material.updatedAt).localeCompare(
            String(a.material.updatedAt)
          )
        )
        .slice(0, 4);
    },

    activeCategory() {
      return (
        this.materialData.categories.find(
          (category) => category.id === this.activeCategoryId
        ) || null
      );
    },

    activeMaterial() {
      if (!this.activeCategory) {
        return null;
      }

      return (
        this.activeCategory.materials.find(
          (material) => material.id === this.activeMaterialId
        ) || null
      );
    },

    activeCategoryPage() {
      if (!this.activeCategory) {
        return 1;
      }

      return this.categoryPageMap[this.activeCategory.id] || 1;
    },

    activeCategoryPageCount() {
      if (!this.activeCategory) {
        return 1;
      }

      return Math.max(
        1,
        Math.ceil(this.activeCategory.materials.length / this.pageSize)
      );
    },

    pagedCategoryMaterials() {
      if (!this.activeCategory) {
        return [];
      }

      const start = (this.activeCategoryPage - 1) * this.pageSize;

      return this.activeCategory.materials.slice(start, start + this.pageSize);
    },

    selectedFileType() {
      return this.selectedFile ? this.getFileTypeLabel(this.selectedFile) : "";
    },

    selectedFileSize() {
      return this.selectedFile
        ? this.formatFileSize(this.selectedFile.size)
        : "";
    },

    canPreviewActiveMaterial() {
      return Boolean(this.activeMaterial?.localUrl);
    },
  },

  async mounted() {
    if (!this.uploadForm.categoryId) {
      this.uploadForm.categoryId = this.materialData.categories[0]?.id || "";
    }

    document.addEventListener("pointerdown", this.handleCreateMenuOutsideClick);

    document.addEventListener("keydown", this.handleCreateMenuKeydown);

    try {
      await this.knowledgeStore.fetchKnowledgeBaseList(this.teachingClassId, {
        force: true,
      });
    } catch (error) {
      console.error("课程知识库真实列表加载失败：", error);
    }
  },

  beforeUnmount() {
    document.removeEventListener(
      "pointerdown",
      this.handleCreateMenuOutsideClick
    );

    document.removeEventListener("keydown", this.handleCreateMenuKeydown);
  },

  methods: {
    handleCreateMenuOutsideClick(event) {
      if (!this.showCreateMenu) {
        return;
      }

      const menuWrap = this.$refs.createMenuWrap;

      if (menuWrap && !menuWrap.contains(event.target)) {
        this.showCreateMenu = false;
      }
    },

    handleCreateMenuKeydown(event) {
      if (event.key === "Escape") {
        this.showCreateMenu = false;
      }
    },

    getMaterialIcon(material) {
      if (material?.materialKind === "note") {
        return "document";
      }

      if (material?.materialKind === "document") {
        return "document";
      }

      if (material?.materialKind === "image") {
        return "file";
      }

      return "file";
    },

    getMaterialTypeText(material) {
      if (material?.materialKind === "note") {
        return "在线笔记";
      }

      return material?.fileType || "资料";
    },

    showCourseHome() {
      this.activeType = "home";
      this.activeCategoryId = "";
      this.activeMaterialId = "";
      this.expandedCategoryId = "";
      this.showCreateMenu = false;
    },

    selectCategory(category) {
      const wasExpanded = this.expandedCategoryId === category.id;

      this.showCategory(category);
      this.expandedCategoryId = wasExpanded ? "" : category.id;
      this.showCreateMenu = false;
    },

    openCategoryFromHome(category) {
      this.showCategory(category);
      this.expandedCategoryId = category.id;
    },

    showCategory(category) {
      if (!category) {
        this.showCourseHome();
        return;
      }

      this.activeType = "category";
      this.activeCategoryId = category.id;
      this.activeMaterialId = "";

      if (!this.categoryPageMap[category.id]) {
        this.categoryPageMap = {
          ...this.categoryPageMap,
          [category.id]: 1,
        };
      }
    },

    openMaterial(category, material) {
      this.showCreateMenu = false;

      if (material.materialKind === "note") {
        // 在线笔记默认进入只读阅读模式。
        this.$router.push(
          `/course/${this.teachingClassId}/materials/note/${material.id}`
        );
        return;
      }

      // 文件资料使用独立详情路由，进入 Focus Mode。
      this.$router.push(
        `/course/${this.teachingClassId}/materials/file/${material.id}`
      );
    },

    changePage(page) {
      if (!this.activeCategory) {
        return;
      }

      const safePage = Math.min(
        Math.max(page, 1),
        this.activeCategoryPageCount
      );

      this.categoryPageMap = {
        ...this.categoryPageMap,
        [this.activeCategory.id]: safePage,
      };
    },

    createOnlineNote() {
      if (!this.canManageMaterials) return;

      this.showCreateMenu = false;
      this.$router.push(`/course/${this.teachingClassId}/materials/note/new`);
    },

    openUploadDialogFromMenu() {
      if (!this.canManageMaterials) return;

      this.showCreateMenu = false;
      this.openUploadDialog();
    },

    openUploadDialog() {
      if (!this.canManageMaterials) return;

      this.showUpload = true;
      this.formError = "";

      if (!this.uploadForm.categoryId) {
        this.uploadForm.categoryId = this.materialData.categories[0]?.id || "";
      }
    },

    closeUploadDialog() {
      if (this.isUploading) {
        return;
      }

      this.showUpload = false;
      this.resetUploadForm();
    },

    handleUploadMaskClick() {
      if (!this.isUploading) {
        this.closeUploadDialog();
      }
    },

    resetUploadForm() {
      this.selectedFile = null;
      this.formError = "";

      this.uploadForm = {
        title: "",
        categoryId: this.materialData.categories[0]?.id || "",
        description: "",
        visibleToStudents: true,
      };

      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = "";
      }
    },

    handleFileChange(event) {
      const file = event.target.files?.[0] || null;

      this.selectedFile = file;
      this.formError = "";

      if (!file) {
        return;
      }

      if (!this.uploadForm.title.trim()) {
        this.uploadForm.title = this.removeFileExtension(file.name);
      }
    },

    removeFileExtension(fileName) {
      const lastDotIndex = fileName.lastIndexOf(".");

      if (lastDotIndex <= 0) {
        return fileName;
      }

      return fileName.slice(0, lastDotIndex);
    },

    getFileTypeLabel(file) {
      const extension = this.getFileExtension(file.name);

      const map = {
        pdf: "PDF",
        ppt: "PPT",
        pptx: "PPTX",
        doc: "DOC",
        docx: "DOCX",
        xls: "XLS",
        xlsx: "XLSX",
        jpg: "JPG",
        jpeg: "JPEG",
        png: "PNG",
        gif: "GIF",
        webp: "WEBP",
        zip: "ZIP",
        rar: "RAR",
        txt: "TXT",
      };

      return map[extension] || extension.toUpperCase() || "FILE";
    },

    getFileExtension(fileName) {
      const parts = String(fileName).split(".");

      if (parts.length <= 1) {
        return "";
      }

      return parts.pop().toLowerCase();
    },

    getMaterialKindFromFile(file) {
      if (file.type?.startsWith("image/")) {
        return "image";
      }

      const extension = this.getFileExtension(file.name);

      if (["pdf", "doc", "docx", "txt"].includes(extension)) {
        return "document";
      }

      return "file";
    },

    formatFileSize(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 KB";
      }

      const units = ["B", "KB", "MB", "GB"];
      let size = bytes;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
      }

      const decimals = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;

      return `${size.toFixed(decimals)} ${units[unitIndex]}`;
    },

    async uploadMaterial() {
      if (!this.canManageMaterials || this.isUploading) {
        return;
      }

      const title = this.uploadForm.title.trim();

      if (!this.selectedFile) {
        this.formError = "请选择需要上传的文件。";
        return;
      }

      if (!title) {
        this.formError = "请输入资料名称。";
        return;
      }

      if (!this.uploadForm.categoryId) {
        this.formError = "请选择资料分类。";
        return;
      }

      this.formError = "";
      this.isUploading = true;

      try {
        const result = await this.knowledgeStore.uploadFileMaterial(
          this.teachingClassId,
          {
            title,
            categoryId: this.uploadForm.categoryId,
            description: this.uploadForm.description,
            visibleToStudents: this.uploadForm.visibleToStudents,
            file: this.selectedFile,
          }
        );

        if (!result) {
          this.formError = "上传失败，请检查资料信息后重试。";
          return;
        }

        const materialId = result.material.id;

        this.isUploading = false;
        this.showUpload = false;
        this.resetUploadForm();

        await this.$router.push(
          `/course/${this.teachingClassId}/materials/file/${materialId}`
        );
      } catch (error) {
        this.formError = error?.message || "文件上传失败，请稍后重试";

        console.error("上传课程知识库文件失败：", error);
      } finally {
        this.isUploading = false;
      }
    },

    getCurrentDateTime() {
      const now = new Date();
      const pad = (value) => String(value).padStart(2, "0");

      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    },

    handlePreview() {
      if (!this.activeMaterial?.localUrl) {
        return;
      }

      window.open(
        this.activeMaterial.localUrl,
        "_blank",
        "noopener,noreferrer"
      );
    },

    handleDownload() {
      if (!this.activeMaterial?.localUrl) {
        return;
      }

      const link = document.createElement("a");
      link.href = this.activeMaterial.localUrl;
      link.download = this.activeMaterial.fileName || this.activeMaterial.title;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  },
};
</script>

<style scoped>
.materials-page {
  min-width: 0;
}

.materials-layout {
  display: grid;
  grid-template-columns: 286px minmax(0, 1fr);
  gap: 20px;
  min-height: 650px;
}

.materials-sidebar,
.materials-content {
  background: #ffffff;
  border: 1px solid #eeeeee;
  border-radius: 20px;
}

.materials-sidebar {
  align-self: start;
  position: sticky;
  top: 24px;
  padding: 18px;
}

.sidebar-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 8px 16px;
}

.sidebar-heading h3,
.sidebar-heading p {
  margin: 0;
}

.sidebar-heading h3 {
  color: #111827;
  font-size: 16px;
}

.sidebar-heading p {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 12px;
}

.create-menu-wrap {
  position: relative;
}

.sidebar-new-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 11px;
  border: none;
  background: #111827;
  color: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.create-menu {
  width: 236px;
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 30;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 18px 40px rgba(17, 24, 39, 0.12);
}

.create-menu button {
  width: 100%;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
}

.create-menu button:hover {
  background: #f7f7f8;
}

.create-option-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #374151;
  border-radius: 10px;
}

.create-menu button > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.create-menu strong {
  color: #111827;
  font-size: 13px;
}

.create-menu small {
  color: #9ca3af;
  font-size: 10px;
}

.sidebar-home,
.category-row,
.material-subnav-item,
.summary-card,
.recent-item,
.material-card,
.content-back-btn {
  border: none;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.sidebar-home,
.category-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 12px;
  color: #4b5563;
}

.sidebar-home:hover,
.category-row:hover,
.material-subnav-item:hover {
  background: #f7f7f8;
}

.sidebar-home.active,
.category-row.active {
  background: #111827;
  color: #ffffff;
}

.nav-icon-box {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f3f4f6;
  border-radius: 9px;
  color: #6b7280;
}

.sidebar-home.active .nav-icon-box,
.category-row.active .nav-icon-box {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.nav-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-text strong {
  color: inherit;
  font-size: 14px;
}

.nav-text small {
  color: #9ca3af;
  font-size: 11px;
}

.sidebar-home.active .nav-text small {
  color: #d1d5db;
}

.category-block {
  margin-top: 6px;
}

.category-name {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
}

.category-count {
  min-width: 24px;
  padding: 3px 6px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 999px;
  font-size: 11px;
  text-align: center;
}

.category-row.active .category-count {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.category-arrow {
  flex-shrink: 0;
  font-size: 12px;
}

.material-subnav {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 260px;
  overflow-y: auto;
  padding: 6px 4px 3px 42px;
}

.material-subnav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  color: #6b7280;
  border-radius: 10px;
}

.material-subnav-item.active {
  background: #f3f4f6;
  color: #111827;
  font-weight: 700;
}

.subnav-icon {
  flex-shrink: 0;
  font-size: 13px;
}

.subnav-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.materials-content {
  min-width: 0;
  padding: 30px;
}

.content-hero,
.category-content-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
  padding-bottom: 28px;
  border-bottom: 1px solid #eeeeee;
}

.hero-main {
  max-width: 760px;
}

.content-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.content-hero h3,
.category-content-header h3,
.material-detail-header h3 {
  margin: 12px 0 0;
  color: #111827;
  font-size: 30px;
}

.content-hero p,
.category-content-header p {
  margin: 12px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.8;
}

.course-class-name {
  margin-top: 7px !important;
  color: #374151 !important;
  font-weight: 700;
}

.hero-stat {
  width: 116px;
  height: 94px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f7f7f8;
  border-radius: 18px;
}

.hero-stat strong {
  color: #111827;
  font-size: 30px;
}

.hero-stat span {
  margin-top: 2px;
  color: #9ca3af;
  font-size: 12px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.summary-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 18px;
  background: #fafafa;
  border: 1px solid #eeeeee;
  border-radius: 16px;
  transition: 0.2s;
}

.summary-card:hover {
  transform: translateY(-1px);
  background: #ffffff;
  box-shadow: 0 12px 26px rgba(17, 24, 39, 0.06);
}

.summary-icon,
.file-icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 12px;
}

.summary-icon {
  width: 42px;
  height: 42px;
}

.summary-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-info strong {
  color: #111827;
  font-size: 14px;
}

.summary-info small {
  overflow: hidden;
  color: #9ca3af;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-count {
  min-width: 28px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.recent-section {
  margin-top: 30px;
}

.section-title-row h3,
.section-title-row p {
  margin: 0;
}

.section-title-row h3 {
  color: #111827;
  font-size: 18px;
}

.section-title-row p {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 12px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.recent-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
}

.recent-item:hover {
  background: #fafafa;
  border-color: #eeeeee;
}

.file-icon-box {
  width: 38px;
  height: 38px;
}

.file-icon-box.large {
  width: 48px;
  height: 48px;
}

.file-icon-box.detail {
  width: 62px;
  height: 62px;
  font-size: 24px;
}

.recent-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.recent-main strong {
  overflow: hidden;
  color: #111827;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-main small,
.recent-time {
  color: #9ca3af;
  font-size: 11px;
}

.visibility-tag,
.note-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.visibility-tag {
  background: #ecfdf5;
  color: #047857;
}

.visibility-tag.private {
  background: #f3f4f6;
  color: #6b7280;
}

.note-tag {
  background: #eff6ff;
  color: #1d4ed8;
}

.category-total {
  padding: 8px 12px;
  background: #f7f7f8;
  color: #6b7280;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.material-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 520px;
  margin-top: 24px;
}

.material-card {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid #eeeeee;
  border-radius: 16px;
}

.material-card:hover {
  background: #fafafa;
}

.material-card-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.material-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.material-title-row strong {
  color: #111827;
  font-size: 14px;
}

.material-card-main small {
  color: #9ca3af;
  font-size: 11px;
}

.material-desc {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.6;
}

.card-arrow {
  color: #9ca3af;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #eeeeee;
}

.page-summary {
  color: #9ca3af;
  font-size: 12px;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-btn,
.page-number {
  min-width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #4b5563;
  border-radius: 9px;
  cursor: pointer;
}

.page-number.active {
  background: #111827;
  color: #ffffff;
  border-color: #111827;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.content-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 0;
  color: #6b7280;
  font-weight: 700;
}

.material-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 18px;
}

.detail-title {
  min-width: 0;
}

.detail-title-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.material-detail-header h3 {
  font-size: 28px;
}

.material-detail-header p {
  margin: 8px 0 0;
  color: #9ca3af;
  font-size: 13px;
}

.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 28px;
}

.meta-item {
  padding: 16px;
  background: #fafafa;
  border: 1px solid #eeeeee;
  border-radius: 14px;
}

.meta-item span,
.meta-item strong {
  display: block;
}

.meta-item span {
  color: #9ca3af;
  font-size: 11px;
}

.meta-item strong {
  margin-top: 7px;
  color: #374151;
  font-size: 13px;
}

.detail-description {
  margin-top: 24px;
  padding: 20px;
  background: #fafafa;
  border-radius: 16px;
}

.detail-description h4,
.detail-description p {
  margin: 0;
}

.detail-description p {
  margin-top: 9px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.8;
}

.preview-section {
  margin-top: 18px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fcfcfc;
}

.preview-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
  background: #ffffff;
  border-bottom: 1px solid #eeeeee;
}

.preview-title-row h4,
.preview-title-row span {
  margin: 0;
}

.preview-title-row span {
  overflow: hidden;
  color: #9ca3af;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-placeholder {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  text-align: center;
}

.preview-placeholder strong {
  margin-top: 14px;
  color: #4b5563;
  font-size: 13px;
}

.preview-icon {
  width: 58px;
  height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 14px;
  font-size: 24px;
}

.pdf-preview {
  width: 100%;
  height: 520px;
  border: 0;
  background: #ffffff;
}

.image-preview {
  display: flex;
  justify-content: center;
  padding: 22px;
}

.image-preview img {
  max-width: 100%;
  max-height: 560px;
  object-fit: contain;
  border-radius: 10px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.secondary-action,
.primary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 16px;
  border-radius: 11px;
  cursor: pointer;
  font-weight: 700;
}

.secondary-action {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.primary-action {
  border: none;
  background: #111827;
  color: #ffffff;
}

.secondary-action:disabled,
.primary-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.42);
}

.upload-dialog {
  width: min(660px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 26px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.2);
}

.dialog-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.dialog-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-heading-icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f3f4f6;
  color: #374151;
  border-radius: 11px;
}

.dialog-title-row h3,
.dialog-title-row p {
  margin: 0;
}

.dialog-title-row h3 {
  color: #111827;
  font-size: 22px;
}

.dialog-title-row p {
  margin-top: 5px;
  color: #9ca3af;
  font-size: 12px;
}

.dialog-close {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 10px;
  cursor: pointer;
}

.upload-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.upload-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  color: #374151;
  font-size: 13px;
  font-weight: 700;
}

.required-mark {
  margin-left: 2px;
  color: #dc2626;
}

.upload-form input[type="text"],
.upload-form select,
.upload-form textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  font: inherit;
}

.hidden-file-input {
  display: none;
}

.file-picker {
  width: 100%;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px dashed #cbd5e1;
  background: #fafafa;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
}

.file-picker-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 11px;
}

.file-picker-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-picker-copy strong {
  overflow: hidden;
  color: #111827;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-picker-copy small {
  color: #9ca3af;
  font-size: 11px;
}

.file-picker-action {
  color: #374151;
  font-size: 12px;
  font-weight: 700;
}

.full-row {
  grid-column: 1 / -1;
}

.visibility-option {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: #f9fafb;
  border-radius: 12px;
}

.visibility-option-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #4b5563;
  border-radius: 10px;
}

.checkbox-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.checkbox-copy strong {
  color: #374151;
  font-size: 13px;
}

.checkbox-copy small {
  color: #9ca3af;
  font-size: 11px;
}

.switch {
  width: 44px;
  height: 24px;
  position: relative;
  padding: 0;
  border: none;
  background: #d1d5db;
  border-radius: 999px;
  cursor: pointer;
  transition: 0.2s;
}

.switch span {
  width: 18px;
  height: 18px;
  position: absolute;
  top: 3px;
  left: 3px;
  background: #ffffff;
  border-radius: 50%;
  transition: 0.2s;
}

.switch.active {
  background: #111827;
}

.switch.active span {
  transform: translateX(20px);
}

.form-error {
  margin: -4px 0 0;
  color: #dc2626;
  font-size: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.cancel-btn,
.save-btn {
  padding: 11px 18px;
  border-radius: 11px;
  cursor: pointer;
  font-weight: 700;
}

.cancel-btn {
  background: #ffffff;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: #111827;
  color: #ffffff;
}

@media (max-width: 1100px) {
  .materials-layout {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .detail-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recent-item {
    grid-template-columns: 38px minmax(0, 1fr) auto;
  }

  .recent-time {
    display: none;
  }
}

@media (max-width: 820px) {
  .materials-layout {
    grid-template-columns: 1fr;
  }

  .materials-sidebar {
    position: static;
  }

  .detail-meta-grid,
  .upload-form {
    grid-template-columns: 1fr;
  }

  .full-row {
    grid-column: auto;
  }

  .recent-item {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .recent-time,
  .recent-item .visibility-tag {
    display: none;
  }

  .pagination {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
