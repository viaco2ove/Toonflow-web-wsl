<template>
  <div class="voiceModelConfig">
    <t-button theme="primary" @click="addVoiceModel" class="addVoiceBtn">
      <template #icon>
        <i-plus theme="outline" size="16" fill="currentColor" />
      </template>
      添加语音模型
    </t-button>

    <div v-for="voice in voiceModels" :key="voice.id" class="voiceModelCard">
      <t-card hoverable @click="editVoiceModel(voice)" class="clickableCard">
        <template #header>
          <div class="voiceCardTitle">
            <div class="voiceIcon">
              <i-sound theme="filled" size="18" fill="var(--td-brand-color)" />
            </div>
            <div class="voiceInfo">
              <span class="voiceModelName">{{ voice.model }}</span>
              <t-tag :theme="getManufacturerTheme(voice.manufacturer)" variant="light" class="manufacturerTag">
                {{ getManufacturerName(voice.manufacturer) }}
              </t-tag>
            </div>
            <t-popconfirm content="确定要删除此语音模型吗？" @confirm="deleteVoiceModel(voice.id)">
              <t-button theme="danger" size="small" variant="outline" class="deleteBtnCorner" @click.stop>
                <template #icon>
                  <i-delete theme="outline" size="14" fill="currentColor" />
                </template>
              </t-button>
            </t-popconfirm>
          </div>
        </template>
        <div class="voiceCardContent">
          <div class="voiceDetailItem">
            <span class="detailLabel">Base URL:</span>
            <span class="detailValue">{{ voice.baseUrl || "默认" }}</span>
          </div>
          <div class="voiceDetailItem">
            <span class="detailLabel">创建时间:</span>
            <span class="detailValue">{{ formatTime(voice.createTime) }}</span>
          </div>
        </div>
      </t-card>
    </div>
  </div>

  <addModelDialog v-if="editDialogVisible" v-model="editDialogVisible" v-model:modelForm="editForm" @fetchModelList="loadVoiceModels" />
  <ModeListDialog :typeList="['voice']" v-model:modelShow="voiceModelDialogShow" state="选择语音模型" @fetchModelList="onVoiceModelDialogClose" />
</template>

<script setup lang="ts">
import addModelDialog from "../model/addModelDialog.vue";
import ModeListDialog from "../model/modeListDialog.vue";
import axios from "@/utils/axios";
import dayjs from "dayjs";

interface VoiceModelType {
  id: number;
  model: string;
  modelType: string;
  manufacturer: string;
  baseUrl: string;
  apiKey: string;
  createTime: number;
  type: string;
}

const voiceModels = ref<VoiceModelType[]>([]);
const editDialogVisible = ref(false);
const editForm = ref<VoiceModelType | undefined>(undefined);
const voiceModelDialogShow = ref(false);

function getManufacturerTheme(manufacturer: string): "primary" | "warning" | "success" | "danger" | "default" | undefined {
  const themes: Record<string, "primary" | "warning" | "success" | "danger" | "default"> = {
    ai_voice_tts: "primary",
    other: "default",
  };
  return themes[manufacturer] || "default";
}

function getManufacturerName(manufacturer: string): string {
  const names: Record<string, string> = {
    ai_voice_tts: "ai_voice_tts",
    other: "其他",
  };
  return names[manufacturer] || manufacturer;
}

function editVoiceModel(model: VoiceModelType) {
  editForm.value = { ...model };
  editDialogVisible.value = true;
}

async function deleteVoiceModel(id: number) {
  try {
    await axios.post("/setting/delModel", { id });
    window.$message.success("删除成功");
    loadVoiceModels();
  } catch (error) {
    window.$message.error("删除失败");
  }
}

function formatTime(timestamp: number): string {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm");
}

async function loadVoiceModels() {
  try {
    const res = await axios.post("/setting/getVoiceModelList", { type: "voice" });
    voiceModels.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("加载语音模型列表失败", error);
    voiceModels.value = [];
  }
}

function addVoiceModel() {
  voiceModelDialogShow.value = true;
}

function onVoiceModelDialogClose() {
  voiceModelDialogShow.value = false;
  loadVoiceModels();
}

onMounted(() => {
  loadVoiceModels();
});
</script>

<style lang="scss" scoped>
.voiceModelConfig {
  .addVoiceBtn {
    margin-bottom: 16px;
  }
}

.voiceModelCard {
  margin-bottom: 16px;

  .clickableCard {
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.3s ease;
    border: 1px solid var(--td-border-level-1-color);
    background: var(--td-bg-color-container);

    &:hover {
      box-shadow: 0 8px 24px rgba(var(--td-brand-color), 0.12);
      border-color: var(--td-brand-color);
    }
  }

  :deep(.t-card__header) {
    border-bottom: 1px solid var(--td-border-level-1-color);
    padding: 16px 20px;
  }

  :deep(.t-card__body) {
    padding: 20px;
  }

  .voiceCardTitle {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    width: 100%;

    .voiceIcon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--td-brand-color-1) 0%, var(--td-brand-color-2) 100%);
      border-radius: 8px;
      flex-shrink: 0;
    }

    .voiceInfo {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;

      .voiceModelName {
        font-size: 15px;
        font-weight: 600;
        color: var(--td-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .manufacturerTag {
        align-self: flex-start;
        margin: 0;
      }
    }

    .deleteBtnCorner {
      margin-left: auto;
      flex-shrink: 0;
    }
  }

  .voiceCardContent {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .voiceDetailItem {
      display: flex;
      align-items: center;
      gap: 8px;

      .detailLabel {
        font-size: 13px;
        color: var(--td-text-color-secondary);
        min-width: 70px;
      }

      .detailValue {
        font-size: 13px;
        color: var(--td-text-color-primary);
        word-break: break-all;
      }
    }
  }
}
</style>
