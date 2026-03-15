<template>
  <div class="storyboard-image">
    <!-- 头部 -->
    <div class="header">
      <div class="title">
        <div class="icon-wrapper">
          <i-pic :size="20" class="icon" />
        </div>
        <span>生成分镜图</span>
        <span v-if="data.length" class="count">{{ data.length }}</span>
      </div>
      <div v-if="canGenerate" class="actions">
        <button :disabled="!disableBtn" class="generate-btn" @click="modalShow = true">
          <i-optimize :size="18" />
          <span>生成分镜图</span>
        </button>
        <button :disabled="!disableBtn" class="generate-btn" style="margin-left: 10px" @click="toggleMultiDeleteMode">
          <span>{{ multiDeleteMode ? "取消多选" : "进入多选删除" }}</span>
        </button>
        <template v-if="multiDeleteMode">
          <button :disabled="!data.length" class="generate-btn" style="margin-left: 10px" @click="toggleSelectAll">
            {{ selectedStoryboardIds.length === data.length ? "取消全选" : "全选" }}
          </button>
          <button
            :disabled="selectedStoryboardIds.length === 0"
            class="generate-btn"
            style="margin-left: 10px"
            @click="deleteSelectedStoryboards">
            删除选中({{ selectedStoryboardIds.length }})
          </button>
        </template>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="content">
      <template v-if="data.length">
        <div class="image-grid">
          <div
            v-for="item in data"
            :key="item.id"
            class="image-card"
            :class="{ selected: multiDeleteMode && isStoryboardSelected(item.id) }"
            @click="handleCardClick(item)">
            <!-- 序号标签 -->
            <div class="shot-badge">
              <input
                v-if="multiDeleteMode"
                type="checkbox"
                :checked="isStoryboardSelected(item.id)"
                class="multi-checkbox"
                @click.stop="toggleStoryboardSelection(item.id)" />
              <span>片段{{ item.segmentId }}-{{ item.shotIndex }}镜头</span>
            </div>
            <!-- 删除分镜图 -->
            <div v-if="!multiDeleteMode" class="delStoryboards" @click.stop="delStoryboardsFn(item.id)">
              <i-delete :size="16" />
            </div>
            <!-- 封面区域 -->
            <div class="cover-wrapper">
              <el-image class="cover-image" :src="item.filePath" fit="cover">
                <template #placeholder>
                  <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                  </div>
                </template>
                <template #error>
                  <div class="error-placeholder">
                    <i-error-picture theme="outline" :size="28" fill="#ef4444" />
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>
              <!-- 悬浮操作层 -->
              <!-- <div class="hover-overlay">
                <div class="action-btn">
                  <i-edit :size="20" />
                  <span>编辑</span>
                </div>
              </div> -->
            </div>
            <!-- 信息区域 -->
            <div class="info-wrapper">
              <h4 v-if="item.name" class="card-title">{{ item.name }}</h4>
              <p class="card-desc">{{ item.prompt || "暂无描述" }}</p>
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i-pic :size="48" />
        </div>
        <p class="empty-title">暂无分镜图</p>
        <p class="empty-desc">点击上方按钮开始生成分镜图</p>
      </div>
    </div>

    <!-- 弹窗 -->
    <storyboardChat v-if="modalShow" v-model="modalShow" :scriptId="scriptId" :projectId="projectId" @save="$emit('save')" />
    <storyboardEditor ref="storyboardEditorRef" @save="handelrEditSave" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message, Modal } from "ant-design-vue";
import storyboardChat from "./storyboardImage/storyboardChat.vue";
import storyboardEditor from "@/components/storyboardEditor/index.vue";
import axios from "@/utils/axios";

interface Storyboard {
  id: number;
  name: string;
  intro: string;
  prompt: string;
  editPrompt?: string;
  otherImgs?: { id: number; filePath: string }[];
  selectedResultId?: number;
  filePath: string;
  duration: number;
  segmentId: number; // 片段ID
  shotIndex: number; // 镜头在片段内的序号
  generateImg: { id?: number; assetsId?: number; filePath: string }[];
}

const emit = defineEmits(["save"]);
const props = defineProps<{
  data: Storyboard[];
  projectId: number;
  scriptId: number | null;
  disableBtn: number | null;
  canGenerate: boolean;
}>();

const modalShow = ref(false);
const storyboardEditorRef = ref<InstanceType<typeof storyboardEditor> | null>(null);
const multiDeleteMode = ref(false);
const selectedStoryboardIds = ref<number[]>([]);

function handleCardClick(item: Storyboard) {
  if (multiDeleteMode.value) {
    toggleStoryboardSelection(item.id);
    return;
  }
  handleEdit(item);
}

function handleEdit(item: Storyboard) {
  storyboardEditorRef.value?.doFusionEdit({
    id: item.id,
    filePath: item.filePath,
    scriptId: props.scriptId ?? undefined,
    otherImgs: Array.isArray(item.otherImgs) ? item.otherImgs : [],
    prompt: item.prompt || "",
    intro: item.intro || "",
    generateImg: Array.isArray(item.generateImg) ? item.generateImg : [],
    editPrompt: item.editPrompt || "",
    selectedResultId: Number.isFinite(Number(item.selectedResultId)) ? Number(item.selectedResultId) : undefined,
  });
}

function handelrEditSave(data: any) {
  axios.post("/storyboard/saveStoryboard", data).then(() => {
    emit("save");
  });
}
function delStoryboardsFn(id: number) {
  Modal.confirm({
    title: "确认删除",
    content: `确定要删除分镜图吗？`,
    okText: "删除",
    cancelText: "取消",
    okButtonProps: { danger: true },
    onOk: async () => {
      axios.post("/storyboard/delStoryboard", { id }).then(() => {
        emit("save");
        message.success("删除成功");
      });
    },
  });
}

function toggleMultiDeleteMode() {
  multiDeleteMode.value = !multiDeleteMode.value;
  if (!multiDeleteMode.value) {
    selectedStoryboardIds.value = [];
  }
}

function toggleSelectAll() {
  if (!multiDeleteMode.value) return;
  const allIds = props.data.map((item) => item.id);
  selectedStoryboardIds.value = selectedStoryboardIds.value.length === allIds.length ? [] : allIds;
}

function isStoryboardSelected(id: number) {
  return selectedStoryboardIds.value.includes(id);
}

function toggleStoryboardSelection(id: number) {
  const idx = selectedStoryboardIds.value.indexOf(id);
  if (idx === -1) {
    selectedStoryboardIds.value.push(id);
  } else {
    selectedStoryboardIds.value.splice(idx, 1);
  }
}

function deleteSelectedStoryboards() {
  if (selectedStoryboardIds.value.length === 0) {
    message.warning("请先选择要删除的分镜");
    return;
  }
  Modal.confirm({
    title: "确认删除",
    content: `将删除选中的 ${selectedStoryboardIds.value.length} 条分镜，是否继续？`,
    okText: "确定",
    cancelText: "取消",
    onOk: async () => {
      const ids = [...selectedStoryboardIds.value];
      try {
        const res = await axios.post("/storyboard/delStoryboard", { ids });
        const deletedCount = Number(res?.data?.deletedCount) || ids.length;
        message.success(`删除成功：${deletedCount} 条`);
      } catch (error: any) {
        message.error(error?.message || "批量删除失败");
        return;
      }
      selectedStoryboardIds.value = [];
      multiDeleteMode.value = false;
      emit("save");
    },
  });
}
</script>

<style lang="scss" scoped>
.storyboard-image {
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #eff6ff 100%);
    border-radius: 16px;
    border: 1px solid rgba(147, 51, 234, 0.1);

    .title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 16px;
      color: #1f2937;

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #9333ea, #7c3aed);
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);

        .icon {
          color: #fff;
        }
      }

      .count {
        padding: 2px 10px;
        background: rgba(147, 51, 234, 0.1);
        color: #9333ea;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
      }
    }

    .actions {
      display: flex;
      align-items: center;
    }

    .generate-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #9333ea, #7c3aed);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px rgba(147, 51, 234, 0.35);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(147, 51, 234, 0.45);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        background: #d1d5db;
        box-shadow: none;
        cursor: not-allowed;
      }
    }
  }

  .content {
    margin-top: 24px;

    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

      .image-card {
      position: relative;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid #f3f4f6;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        border-color: rgba(147, 51, 234, 0.2);

        .delStoryboards {
          opacity: 1;
        }

        .hover-overlay {
          opacity: 1;
        }

        .cover-image {
          transform: scale(1.05);
        }
      }

      &.selected {
        border-color: #9333ea;
        box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2);
      }

      .shot-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 10;
        padding: 4px 12px;
        background: linear-gradient(135deg, #9333ea, #7c3aed);
        color: #fff;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(147, 51, 234, 0.4);
        display: inline-flex;
        align-items: center;
        gap: 8px;

        .multi-checkbox {
          margin: 0;
          cursor: pointer;
        }
      }
      .delStoryboards {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 10;
        padding: 4px 12px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: #fff;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .cover-wrapper {
        position: relative;
        width: 100%;
        height: 180px;
        overflow: hidden;
        background: linear-gradient(135deg, #f9fafb, #f3f4f6);

        .cover-image {
          width: 100%;
          height: 100%;
          transition: transform 0.4s ease;

          :deep(img) {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .loading-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);

          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e5e7eb;
            border-top-color: #9333ea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
        }

        .error-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 100%;
          background: #fef2f2;

          span {
            font-size: 13px;
            color: #ef4444;
          }
        }

        .hover-overlay {
          position: absolute;
          inset: 0;
          z-index: 9999999999;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(2px);

          .action-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.95);
            color: #9333ea;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            transition: transform 0.2s ease;

            &:hover {
              transform: scale(1.05);
            }
          }
        }
      }

      .info-wrapper {
        padding: 16px;

        .card-title {
          margin: 0 0 8px;
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-desc {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: linear-gradient(135deg, #fafafa, #f5f5f5);
      border-radius: 16px;
      border: 2px dashed #e5e7eb;

      .empty-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9333ea;
        margin-bottom: 20px;
      }

      .empty-title {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 600;
        color: #374151;
      }

      .empty-desc {
        margin: 0;
        font-size: 14px;
        color: #9ca3af;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
