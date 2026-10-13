import * as XLSX from "xlsx";
import { formatDateTime, formatPercent } from "./courseSummary";

function safeFileName(value) {
  return String(value || "课程")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function scoreText(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return number.toFixed(1).replace(/\.0$/, "");
}

function percentText(value) {
  return `${formatPercent(value)}%`;
}

function statusText(status) {
  if (status === "ACTIVE") return "进行中";
  if (status === "DRAFT") return "草稿";
  return "已结束";
}

function typeText(type) {
  return type === "HOMEWORK" ? "课后作业" : "课堂练习";
}

function addSheet(workbook, name, rows) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
  return sheet;
}

function autoWidth(sheet, rows, maxWidth = 32) {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  sheet["!cols"] = Array.from({ length: columnCount }, (_, colIndex) => {
    const width = rows.reduce((max, row) => {
      const value = row[colIndex];
      const length = String(value ?? "").length;
      return Math.max(max, Math.min(length + 2, maxWidth));
    }, 10);

    return { wch: width };
  });
}

export function buildCourseSummaryFileName(summary, extension) {
  const course = summary?.course || {};
  return `${safeFileName(course.courseName)}_${safeFileName(
    course.className
  )}_${safeFileName(course.semester)}_课程总结.${extension}`;
}

function sectionTitle(index, title, note = "") {
  return `
    <div class="pdf-section-title">
      <div class="pdf-section-title-main">
        <span class="pdf-section-index">${escapeHtml(index)}</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${note ? `<p class="pdf-section-note">${escapeHtml(note)}</p>` : ""}
    </div>
  `;
}

function overviewCard(label, value, helper, accent = "") {
  return `
    <div class="pdf-overview-card ${accent}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(helper)}</small>
    </div>
  `;
}

function metricCard(label, value) {
  return `
    <div class="pdf-metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function exerciseRowsHtml(exercises) {
  if (!exercises.length) {
    return `
      <tr>
        <td colspan="6" class="pdf-empty-cell">本课程暂无已发布练习</td>
      </tr>
    `;
  }

  return exercises
    .map(
      (exercise) => `
        <tr>
          <td class="pdf-name-cell">${escapeHtml(
            exercise.name || "未命名练习"
          )}</td>
          <td>${escapeHtml(typeText(exercise.type))}</td>
          <td>${escapeHtml(`${exercise.questionCount || 0} 道`)}</td>
          <td>${escapeHtml(
            `${exercise.submittedCount || 0} / ${exercise.expectedCount || 0}`
          )}</td>
          <td>${escapeHtml(percentText(exercise.completionRate || 0))}</td>
          <td>${escapeHtml(scoreText(exercise.averageScore))}</td>
        </tr>
      `
    )
    .join("");
}

function exerciseTableHtml(exercises, continuation = false) {
  return `
    <div class="pdf-table-block">
      ${
        continuation
          ? `<div class="pdf-table-caption">练习明细（续）</div>`
          : ""
      }
      <table class="pdf-summary-table">
        <colgroup>
          <col style="width:30%" />
          <col style="width:14%" />
          <col style="width:10%" />
          <col style="width:18%" />
          <col style="width:14%" />
          <col style="width:14%" />
        </colgroup>
        <thead>
          <tr>
            <th>练习名称</th>
            <th>类型</th>
            <th>题目</th>
            <th>提交情况</th>
            <th>提交率</th>
            <th>平均分</th>
          </tr>
        </thead>
        <tbody>${exerciseRowsHtml(exercises)}</tbody>
      </table>
    </div>
  `;
}

function knowledgeHtml(summary) {
  const categories = Array.isArray(summary?.knowledge?.categories)
    ? summary.knowledge.categories
    : [];
  const maxCount = Math.max(
    1,
    ...categories.map((item) => Number(item.count || 0))
  );

  const rows = categories.length
    ? categories
        .map((category) => {
          const count = Number(category.count || 0);
          const width = count > 0 ? Math.max(4, (count / maxCount) * 100) : 0;
          return `
            <div class="pdf-category-row">
              <div class="pdf-category-label">
                <span>${escapeHtml(category.name || "未分类")}</span>
                <strong>${escapeHtml(count)}</strong>
              </div>
              <div class="pdf-category-track"><span style="width:${width}%"></span></div>
            </div>
          `;
        })
        .join("")
    : `<div class="pdf-empty-line">暂无课程资料分类数据</div>`;

  return `
    ${sectionTitle("04", "课程知识库", "课程资料建设情况")}
    <div class="pdf-knowledge-card">
      <div class="pdf-knowledge-total">
        <span>资料总数</span>
        <strong>${escapeHtml(summary?.knowledge?.totalCount || 0)}</strong>
        <p>${escapeHtml(
          summary?.knowledge?.fileCount || 0
        )} 个文件资料 · ${escapeHtml(
    summary?.knowledge?.noteCount || 0
  )} 篇在线笔记</p>
      </div>
      <div class="pdf-category-list">${rows}</div>
    </div>
  `;
}

function chaptersHtml(summary) {
  const chapters = Array.isArray(summary?.chapters) ? summary.chapters : [];
  const body = chapters.length
    ? `
      <div class="pdf-chapter-card">
        <div class="pdf-chapter-count">
          <strong>${escapeHtml(chapters.length)}</strong>
          <span>个章节已有练习覆盖</span>
        </div>
        <div class="pdf-chapter-tags">
          ${chapters
            .map((chapter) => `<span>${escapeHtml(chapter)}</span>`)
            .join("")}
        </div>
      </div>
    `
    : `<div class="pdf-empty-panel">当前练习尚未填写章节信息。</div>`;

  return `
    ${sectionTitle("05", "章节覆盖", "按已发布练习中的题目章节统计")}
    ${body}
  `;
}

function pageShell(content, { compact = false } = {}) {
  return `
    <section class="pdf-report-page ${compact ? "is-compact" : ""}">
      ${content}
    </section>
  `;
}

function buildPdfReportHtml(summary) {
  const course = summary?.course || {};
  const attendance = summary?.attendance || {};
  const performance = summary?.performance || {};
  const exercise = summary?.exercise || {};
  const exercises = Array.isArray(exercise.exercises) ? exercise.exercises : [];
  const studentCount = Number(summary?.studentCount || 0);
  const participantCount = Number(performance.participantCount || 0);
  const participationRate =
    studentCount > 0 ? (participantCount / studentCount) * 100 : 0;
  const endedAtText = course.endedAt
    ? formatDateTime(course.endedAt)
    : "未记录具体时间";

  // PDF 使用独立的 A4 报告分页，不再依赖 html2pdf 对一整张长页面自动切页。
  // 首页尽量放满：课程信息 + 总览 + 出勤 + 课堂互动。
  const page1 = pageShell(
    `
    <header class="pdf-report-header">
      <span class="pdf-report-kicker">课程结课总结</span>
      <h1>${escapeHtml(course.courseName || "未设置课程")}</h1>
      <p>${escapeHtml(course.className || "未命名班级")} · ${escapeHtml(
      course.semester || "未设置学期"
    )}</p>
      <div class="pdf-report-meta">
        <span>授课教师：<strong>${escapeHtml(
          course.teacherName || "教师"
        )}</strong></span>
        <span>结课时间：<strong>${escapeHtml(endedAtText)}</strong></span>
      </div>
    </header>

    <div class="pdf-overview-grid">
      ${overviewCard("学生人数", studentCount, "本教学班")}
      ${overviewCard("签到次数", attendance.activityCount || 0, "历史签到活动")}
      ${overviewCard(
        "平均出勤率",
        percentText(attendance.averageRate || 0),
        "按全部签到人次计算",
        "is-green"
      )}
      ${overviewCard(
        "课堂互动次数",
        performance.interactionCount || 0,
        "点名及课堂表现记录"
      )}
      ${overviewCard(
        "已发布练习",
        exercise.publishedCount || 0,
        `${exercise.questionCount || 0} 道练习题`
      )}
      ${overviewCard(
        "平均练习完成率",
        percentText(exercise.averageCompletionRate || 0),
        "按应提交人次计算",
        "is-blue"
      )}
    </div>

    <div class="pdf-section-block">
      ${sectionTitle(
        "01",
        "出勤情况",
        `共 ${attendance.activityCount || 0} 次签到`
      )}
      <div class="pdf-rate-panel is-green-panel">
        <div class="pdf-rate-main">
          <div><strong>${escapeHtml(
            percentText(attendance.averageRate || 0)
          )}</strong><span>平均出勤率</span></div>
          <div class="pdf-progress"><span style="width:${Math.min(
            100,
            Math.max(0, Number(attendance.averageRate || 0))
          )}%"></span></div>
          <p>累计签到 ${escapeHtml(
            attendance.totalSigned || 0
          )} 人次，应签到 ${escapeHtml(
      attendance.totalExpected || 0
    )} 人次。</p>
        </div>
        <div class="pdf-metric-grid three-cols">
          ${metricCard("签到活动", attendance.activityCount || 0)}
          ${metricCard("累计签到", attendance.totalSigned || 0)}
          ${metricCard("累计应签", attendance.totalExpected || 0)}
        </div>
      </div>
    </div>

    <div class="pdf-section-divider"></div>

    <div class="pdf-section-block">
      ${sectionTitle("02", "课堂互动", "课堂表现与随机点名记录")}
      <div class="pdf-metric-grid two-cols pdf-interaction-grid">
        ${metricCard("互动次数", performance.interactionCount || 0)}
        ${metricCard("参与学生", participantCount)}
        ${metricCard("平均表现分", scoreText(performance.averageScore || 0))}
        ${metricCard("学生参与率", percentText(participationRate))}
      </div>
    </div>
  `,
    { compact: true }
  );

  // 第一张练习页包含练习概览和最多 8 行明细，保证字号不因内容过长被整体压缩。
  const firstExerciseChunk = exercises.slice(0, 8);
  const remainingExercises = exercises.slice(8);
  const continuationChunks = [];
  for (let index = 0; index < remainingExercises.length; index += 12) {
    continuationChunks.push(remainingExercises.slice(index, index + 12));
  }

  const exercisePage = pageShell(
    `
    <div class="pdf-page-running-title">${escapeHtml(
      course.courseName || "课程"
    )} · 课程总结</div>
    <div class="pdf-section-block">
      ${sectionTitle("03", "练习与学习", "仅统计已发布练习")}
      <div class="pdf-exercise-overview">
        <div class="pdf-rate-main is-blue-rate">
          <div><strong>${escapeHtml(
            percentText(exercise.averageCompletionRate || 0)
          )}</strong><span>平均练习完成率</span></div>
          <div class="pdf-progress is-blue"><span style="width:${Math.min(
            100,
            Math.max(0, Number(exercise.averageCompletionRate || 0))
          )}%"></span></div>
          <p>${escapeHtml(exercise.submittedTotal || 0)} / ${escapeHtml(
      exercise.expectedTotal || 0
    )} 人次已提交，${escapeHtml(
      exercise.fullyGradedSubmissionCount || 0
    )} 人次已完成批改。</p>
        </div>
        <div class="pdf-metric-grid three-cols">
          ${metricCard("已结束练习", exercise.endedCount || 0)}
          ${metricCard("题库题目", summary?.questionBank?.questionCount || 0)}
          ${metricCard("已批改平均分", scoreText(exercise.averageScore))}
        </div>
      </div>
      ${exerciseTableHtml(firstExerciseChunk, false)}
    </div>
  `,
    { compact: true }
  );

  const continuationPages = continuationChunks.map((chunk) =>
    pageShell(
      `
      <div class="pdf-page-running-title">${escapeHtml(
        course.courseName || "课程"
      )} · 课程总结</div>
      <div class="pdf-section-block pdf-continuation-block">
        ${exerciseTableHtml(chunk, true)}
      </div>
    `,
      { compact: true }
    )
  );

  // 如果最后只剩少量练习，把知识库和章节覆盖接在同一页，减少无意义的大块空白。
  // 否则单独生成结尾页，避免任何内容被缩小或裁切。
  const tailExerciseCount = continuationChunks.length
    ? continuationChunks[continuationChunks.length - 1].length
    : firstExerciseChunk.length;
  const canMergeFinal = exercises.length > 0 && tailExerciseCount <= 4;

  let finalPages = [];
  if (canMergeFinal) {
    if (continuationPages.length > 0) {
      const lastIndex = continuationPages.length - 1;
      const lastChunk = continuationChunks[lastIndex];
      continuationPages[lastIndex] = pageShell(
        `
        <div class="pdf-page-running-title">${escapeHtml(
          course.courseName || "课程"
        )} · 课程总结</div>
        <div class="pdf-section-block pdf-continuation-block">
          ${exerciseTableHtml(lastChunk, true)}
        </div>
        <div class="pdf-section-divider"></div>
        ${knowledgeHtml(summary)}
        <div class="pdf-section-divider"></div>
        ${chaptersHtml(summary)}
        <footer class="pdf-report-footer">
          <span>结课时间：${escapeHtml(endedAtText)}</span>
          <span>总结生成时间：${escapeHtml(summary?.generatedAt || "--")}</span>
        </footer>
      `,
        { compact: true }
      );
    } else if (firstExerciseChunk.length <= 4) {
      // 少量练习时把结尾模块直接并入练习页。
      finalPages = [
        pageShell(
          `
        <div class="pdf-page-running-title">${escapeHtml(
          course.courseName || "课程"
        )} · 课程总结</div>
        <div class="pdf-section-block">
          ${sectionTitle("03", "练习与学习", "仅统计已发布练习")}
          <div class="pdf-exercise-overview">
            <div class="pdf-rate-main is-blue-rate">
              <div><strong>${escapeHtml(
                percentText(exercise.averageCompletionRate || 0)
              )}</strong><span>平均练习完成率</span></div>
              <div class="pdf-progress is-blue"><span style="width:${Math.min(
                100,
                Math.max(0, Number(exercise.averageCompletionRate || 0))
              )}%"></span></div>
              <p>${escapeHtml(exercise.submittedTotal || 0)} / ${escapeHtml(
            exercise.expectedTotal || 0
          )} 人次已提交，${escapeHtml(
            exercise.fullyGradedSubmissionCount || 0
          )} 人次已完成批改。</p>
            </div>
            <div class="pdf-metric-grid three-cols">
              ${metricCard("已结束练习", exercise.endedCount || 0)}
              ${metricCard(
                "题库题目",
                summary?.questionBank?.questionCount || 0
              )}
              ${metricCard("已批改平均分", scoreText(exercise.averageScore))}
            </div>
          </div>
          ${exerciseTableHtml(firstExerciseChunk, false)}
        </div>
        <div class="pdf-section-divider"></div>
        ${knowledgeHtml(summary)}
        <div class="pdf-section-divider"></div>
        ${chaptersHtml(summary)}
        <footer class="pdf-report-footer">
          <span>结课时间：${escapeHtml(endedAtText)}</span>
          <span>总结生成时间：${escapeHtml(summary?.generatedAt || "--")}</span>
        </footer>
      `,
          { compact: true }
        ),
      ];
    }
  }

  if (!canMergeFinal || exercises.length === 0) {
    finalPages = [
      pageShell(
        `
      <div class="pdf-page-running-title">${escapeHtml(
        course.courseName || "课程"
      )} · 课程总结</div>
      ${knowledgeHtml(summary)}
      <div class="pdf-section-divider"></div>
      ${chaptersHtml(summary)}
      <footer class="pdf-report-footer">
        <span>结课时间：${escapeHtml(endedAtText)}</span>
        <span>总结生成时间：${escapeHtml(summary?.generatedAt || "--")}</span>
      </footer>
    `,
        { compact: true }
      ),
    ];
  }

  // 少量练习被合并到结尾页时，不再重复前面的 exercisePage。
  const includeExercisePage = !(
    canMergeFinal &&
    continuationPages.length === 0 &&
    firstExerciseChunk.length <= 4
  );

  return [
    page1,
    ...(includeExercisePage ? [exercisePage] : []),
    ...continuationPages,
    ...finalPages,
  ].join("");
}

function createPdfReportStage(summary) {
  const stage = document.createElement("div");
  stage.setAttribute("aria-hidden", "true");
  stage.className = "course-summary-pdf-stage";

  Object.assign(stage.style, {
    position: "absolute",
    left: "-100000px",
    top: "0",
    width: "720px",
    background: "#ffffff",
    pointerEvents: "none",
  });

  const style = document.createElement("style");
  style.textContent = `
    .course-summary-pdf-stage,
    .course-summary-pdf-stage * {
      box-sizing: border-box;
      min-width: 0;
    }

    .course-summary-pdf-stage {
      color: #172033;
      font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", Arial, sans-serif;
      line-height: 1.55;
    }

    .pdf-report-page {
      width: 720px;
      padding: 34px 34px 30px;
      background: #ffffff;
      overflow: visible;
    }

    .pdf-report-page.is-compact {
      padding-top: 28px;
    }

    .pdf-page-running-title {
      margin: 0 0 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #edf0f3;
      color: #7a8494;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    .pdf-report-header {
      padding: 2px 0 22px;
    }

    .pdf-report-kicker {
      display: block;
      margin-bottom: 8px;
      color: #7b8493;
      font-size: 13px;
      font-weight: 700;
    }

    .pdf-report-header h1 {
      margin: 0;
      color: #101828;
      font-size: 28px;
      line-height: 1.25;
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .pdf-report-header > p {
      margin: 7px 0 10px;
      color: #667085;
      font-size: 13px;
      overflow-wrap: anywhere;
    }

    .pdf-report-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 22px;
      color: #667085;
      font-size: 12px;
    }

    .pdf-report-meta strong {
      color: #344054;
      font-weight: 700;
    }

    .pdf-overview-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      padding: 14px;
      margin-bottom: 22px;
      border: 1px solid #edf0f3;
      border-radius: 16px;
      background: #fafbfc;
    }

    .pdf-overview-card {
      min-height: 92px;
      padding: 14px;
      border: 1px solid #e8ebef;
      border-radius: 13px;
      background: #ffffff;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-overview-card span,
    .pdf-metric-card span,
    .pdf-knowledge-total > span {
      display: block;
      color: #7a8494;
      font-size: 12px;
    }

    .pdf-overview-card strong {
      display: block;
      margin: 6px 0 2px;
      color: #111827;
      font-size: 25px;
      line-height: 1.1;
      font-weight: 800;
    }

    .pdf-overview-card small {
      color: #98a2b3;
      font-size: 10px;
    }

    .pdf-overview-card.is-green {
      background: #f5fbf7;
    }

    .pdf-overview-card.is-green strong,
    .is-green-panel .pdf-rate-main strong {
      color: #16865a;
    }

    .pdf-overview-card.is-blue {
      background: #f5f8fd;
    }

    .pdf-overview-card.is-blue strong,
    .is-blue-rate strong {
      color: #306da8;
    }

    .pdf-section-block {
      width: 100%;
      margin-top: 2px;
    }

    .pdf-section-title {
      display: block;
      width: 100%;
      margin-bottom: 14px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .pdf-section-title-main {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pdf-section-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 32px;
      border-radius: 10px;
      background: #f1f3f5;
      color: #5e6878;
      font-size: 17px;
      line-height: 1;
      font-weight: 800;
      flex: 0 0 auto;
    }

    .pdf-section-title h2 {
      margin: 0;
      color: #172033;
      font-size: 21px;
      line-height: 1.2;
      font-weight: 800;
    }

    .pdf-section-note {
      margin: 6px 0 0 48px;
      max-width: calc(100% - 48px);
      color: #8a94a3;
      font-size: 11px;
      line-height: 1.5;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .pdf-section-divider {
      margin: 22px 0;
      border-top: 1px solid #edf0f3;
    }

    .pdf-rate-panel,
    .pdf-exercise-overview,
    .pdf-knowledge-card,
    .pdf-chapter-card,
    .pdf-empty-panel {
      width: 100%;
      padding: 16px;
      border: 1px solid #e8ebef;
      border-radius: 15px;
      background: #fbfcfd;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-rate-main > div:first-child {
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
    }

    .pdf-rate-main strong {
      color: #16865a;
      font-size: 34px;
      line-height: 1;
      font-weight: 800;
    }

    .pdf-rate-main span {
      color: #7a8494;
      font-size: 12px;
    }

    .pdf-rate-main p,
    .pdf-knowledge-total p {
      margin: 10px 0 0;
      color: #667085;
      font-size: 11px;
      overflow-wrap: anywhere;
    }

    .pdf-progress {
      height: 7px;
      margin-top: 12px;
      overflow: hidden;
      border-radius: 999px;
      background: #e8f0eb;
    }

    .pdf-progress span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: #3e8c69;
    }

    .pdf-progress.is-blue {
      background: #e6edf5;
    }

    .pdf-progress.is-blue span {
      background: #4b78a5;
    }

    .pdf-metric-grid {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }

    .pdf-metric-grid.three-cols {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .pdf-metric-grid.two-cols {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .pdf-interaction-grid {
      margin-top: 0;
    }

    .pdf-metric-card {
      min-height: 72px;
      padding: 13px 14px;
      border: 1px solid #e8ebef;
      border-radius: 12px;
      background: #ffffff;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-metric-card strong {
      display: block;
      margin-top: 5px;
      color: #172033;
      font-size: 24px;
      line-height: 1.15;
      font-weight: 800;
      overflow-wrap: anywhere;
    }

    .pdf-table-block {
      width: 100%;
      margin-top: 16px;
      overflow: hidden;
    }

    .pdf-table-caption {
      margin-bottom: 8px;
      color: #586273;
      font-size: 13px;
      font-weight: 700;
    }

    .pdf-summary-table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 10px;
    }

    .pdf-summary-table th,
    .pdf-summary-table td {
      padding: 7px 6px;
      border-bottom: 1px solid #edf0f3;
      color: #667085;
      text-align: center;
      vertical-align: middle;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .pdf-summary-table th {
      background: #f7f8fa;
      color: #5d6675;
      font-weight: 700;
    }

    .pdf-summary-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-summary-table .pdf-name-cell {
      color: #344054;
      text-align: left;
      font-weight: 700;
    }

    .pdf-empty-cell {
      padding: 18px !important;
      color: #98a2b3 !important;
      text-align: center !important;
    }

    .pdf-continuation-block {
      margin-top: 0;
    }

    .pdf-knowledge-card {
      display: grid;
      grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.3fr);
      gap: 18px;
    }

    .pdf-knowledge-total strong {
      display: block;
      margin-top: 6px;
      color: #172033;
      font-size: 31px;
      line-height: 1;
      font-weight: 800;
    }

    .pdf-category-list {
      min-width: 0;
    }

    .pdf-category-row + .pdf-category-row {
      margin-top: 9px;
    }

    .pdf-category-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 4px;
      color: #667085;
      font-size: 11px;
    }

    .pdf-category-label span {
      overflow-wrap: anywhere;
    }

    .pdf-category-label strong {
      flex: 0 0 auto;
      color: #344054;
    }

    .pdf-category-track {
      height: 6px;
      overflow: hidden;
      border-radius: 999px;
      background: #edf0f2;
    }

    .pdf-category-track span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: #98a4b4;
    }

    .pdf-chapter-count {
      display: flex;
      align-items: baseline;
      gap: 9px;
      flex-wrap: wrap;
    }

    .pdf-chapter-count strong {
      color: #172033;
      font-size: 31px;
      line-height: 1;
      font-weight: 800;
    }

    .pdf-chapter-count span {
      color: #667085;
      font-size: 12px;
    }

    .pdf-chapter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 15px;
    }

    .pdf-chapter-tags span {
      max-width: 100%;
      padding: 7px 10px;
      border: 1px solid #e4e7ec;
      border-radius: 999px;
      background: #ffffff;
      color: #4f5968;
      font-size: 10px;
      overflow-wrap: anywhere;
    }

    .pdf-empty-panel,
    .pdf-empty-line {
      color: #98a2b3;
      font-size: 11px;
    }

    .pdf-report-footer {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3px;
      width: 100%;
      margin-top: 22px;
      padding: 12px 0 0;
      border-top: 1px solid #edf0f3;
      color: #98a2b3;
      font-size: 10px;
      white-space: normal;
      overflow-wrap: anywhere;
    }
  `;

  const report = document.createElement("div");
  report.className = "pdf-report-root";
  report.style.width = "720px";
  report.innerHTML = buildPdfReportHtml(summary);

  stage.appendChild(style);
  stage.appendChild(report);
  document.body.appendChild(stage);

  return { stage, report };
}

export async function exportCourseSummaryPdf(_element, summary) {
  if (!summary) {
    throw new Error("课程总结内容尚未准备完成");
  }

  // 逐页截图、逐页写入 PDF：彻底避免 html2pdf 对整张长 DOM 自动切页时
  // 出现的上一页/下一页内容互相“串页”、顶部被裁切和右侧溢出问题。
  const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const JsPDF = jsPdfModule.jsPDF || jsPdfModule.default?.jsPDF;
  if (!JsPDF) {
    throw new Error("PDF 组件加载失败，请刷新页面后重试");
  }

  const filename = buildCourseSummaryFileName(summary, "pdf");
  const { stage, report } = createPdfReportStage(summary);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    const pages = Array.from(report.querySelectorAll(".pdf-report-page"));
    if (!pages.length) {
      throw new Error("课程总结报告内容为空");
    }

    const pdf = new JsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 10;
    const marginY = 9;
    const safeWidth = pageWidth - marginX * 2;
    const safeHeight = pageHeight - marginY * 2;

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 900,
        logging: false,
      });

      const imageData = canvas.toDataURL("image/jpeg", 0.98);
      let imageWidth = safeWidth;
      let imageHeight = (canvas.height * imageWidth) / canvas.width;

      // 正常情况下每个报告页都按 A4 安全高度设计。若个别极端数据导致
      // 页面略高，则只对这一页等比缩小，保证“完整显示”优先于裁切。
      if (imageHeight > safeHeight) {
        const scale = safeHeight / imageHeight;
        imageWidth *= scale;
        imageHeight = safeHeight;
      }

      const x = (pageWidth - imageWidth) / 2;
      const y = marginY;

      if (index > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.addImage(
        imageData,
        "JPEG",
        x,
        y,
        imageWidth,
        imageHeight,
        undefined,
        "FAST"
      );
    }

    pdf.save(filename);
  } finally {
    stage.remove();
  }
}

export function exportCourseSummaryExcel(summary, selection) {
  const workbook = XLSX.utils.book_new();
  const course = summary?.course || {};
  const selected = selection || {};

  const overviewRows = [
    ["课程概览"],
    ["课程名称", course.courseName],
    ["班级", course.className],
    ["学期", course.semester],
    ["教师", course.teacherName],
    ["结课时间", course.endedAt ? formatDateTime(course.endedAt) : "未记录"],
    ["总结生成时间", summary.generatedAt],
    [],
    ["学生人数", summary.studentCount],
    ["签到次数", summary.attendance.activityCount],
    ["平均出勤率", `${formatPercent(summary.attendance.averageRate)}%`],
    ["课堂互动次数", summary.performance.interactionCount],
    ["已发布练习数", summary.exercise.publishedCount],
    [
      "平均练习完成率",
      `${formatPercent(summary.exercise.averageCompletionRate)}%`,
    ],
    ["课程资料总数", summary.knowledge.totalCount],
    ["练习覆盖章节数", summary.chapters.length],
  ];
  const overviewSheet = addSheet(workbook, "课程概览", overviewRows);
  autoWidth(overviewSheet, overviewRows, 36);

  if (selected.students) {
    const rows = [
      ["学号", "姓名", "班级"],
      ...summary.students.map((student) => [
        student.studentNo || student.id || "",
        student.name || "",
        student.className || course.className || "",
      ]),
    ];
    const sheet = addSheet(workbook, "学生名单", rows);
    autoWidth(sheet, rows);
  }

  if (selected.attendance) {
    const rows = [
      [
        "签到开始时间",
        "签到结束时间",
        "已签到人数",
        "应签到人数",
        "签到率",
        "状态",
      ],
      ...summary.signRecords.map((record) => {
        const expected = Number(record?.totalStudents || 0);
        const signed = Number(record?.signedCount || 0);
        const rate = expected > 0 ? (signed / expected) * 100 : 0;
        return [
          formatDateTime(record?.startTime),
          record?.endTime ? formatDateTime(record.endTime) : "--",
          signed,
          expected,
          `${formatPercent(rate)}%`,
          Number(record?.status) === 1 ? "进行中" : "已结束",
        ];
      }),
    ];
    const sheet = addSheet(workbook, "签到数据", rows);
    autoWidth(sheet, rows);
  }

  if (selected.performance) {
    const rows = [
      ["学号", "姓名", "互动次数", "累计表现分", "平均表现分"],
      ...summary.performanceStudents.map((student) => [
        student.studentNo || student.id || "",
        student.name || "",
        Number(student.totalCalled ?? student.count ?? 0),
        Number(student.totalScore ?? student.score ?? 0),
        Number(student.avgScore ?? student.average ?? 0),
      ]),
    ];
    const sheet = addSheet(workbook, "课堂表现", rows);
    autoWidth(sheet, rows);
  }

  if (selected.exercises) {
    const exerciseRows = [
      [
        "练习名称",
        "类型",
        "状态",
        "题目数",
        "已提交",
        "应提交",
        "提交率",
        "已完成批改",
        "平均分",
      ],
      ...summary.exercise.exercises.map((exercise) => [
        exercise.name,
        typeText(exercise.type),
        statusText(exercise.status),
        exercise.questionCount,
        exercise.submittedCount,
        exercise.expectedCount,
        `${formatPercent(exercise.completionRate)}%`,
        exercise.gradedCount,
        exercise.averageScore === null
          ? "--"
          : Number(exercise.averageScore.toFixed(1)),
      ]),
    ];
    const exerciseSheet = addSheet(workbook, "练习情况", exerciseRows);
    autoWidth(exerciseSheet, exerciseRows, 36);

    const scoreRows = [
      [
        "练习名称",
        "学生",
        "学号/学生ID",
        "提交状态",
        "提交时间",
        "批改状态",
        "最终得分",
        "满分",
      ],
      ...summary.exercise.scoreRows.map((row) => [
        row.exerciseName,
        row.studentName || "",
        row.studentId,
        row.submitted ? "已提交" : "未提交",
        row.submittedAt ? formatDateTime(row.submittedAt) : "--",
        row.submitted ? (row.fullyGraded ? "已完成" : "待批改") : "--",
        row.finalScore === null ? "--" : row.finalScore,
        row.maxScore,
      ]),
    ];
    const scoreSheet = addSheet(workbook, "练习成绩", scoreRows);
    autoWidth(scoreSheet, scoreRows, 36);
  }

  if (selected.resources) {
    const rows = [
      ["分类", "资料名称", "类型", "文件名", "更新时间", "学生可见"],
    ];

    summary.knowledge.categories.forEach((category) => {
      category.materials.forEach((material) => {
        rows.push([
          category.name,
          material.title || "",
          material.materialKind === "note"
            ? "在线笔记"
            : material.fileType || "文件",
          material.fileName || "",
          material.updatedAt || "",
          material.visibleToStudents === false ? "否" : "是",
        ]);
      });
    });

    const sheet = addSheet(workbook, "课程资源", rows);
    autoWidth(sheet, rows, 40);
  }

  const fileName = buildCourseSummaryFileName(summary, "xlsx");
  XLSX.writeFile(workbook, fileName);
}
