<template>
  <a-modal
    v-model:open="showModal"
    wrapClassName="noHeaderMargin"
    :footer="false"
    :width="640"
    dialogClass="customModal"
    :closable="false"
    :maskClosable="false">
    <template #title>
      <div class="ac jb titHeader" style="background: #f9faff; height: 60px; display: flex; width: 100%" v-if="formData">
        <div>
          <span style="font-weight: bold; font-size: 18px; margin-left: 24px">{{ formData.id ? "编辑" : "新建" }}{{ typeRecord[props.type] }}</span>
          <div style="margin-left: 24px">
            <span style="font-size: 14px">{{ formData.id ? "编辑" : "新建" }}元素信息和素材</span>
          </div>
        </div>
        <div class="closePoint" @click="editElementClose">
          <i-close theme="outline" size="18" fill="#9913FA" />
        </div>
      </div>
    </template>
    <div class="modelBody" style="max-height: 650px; overflow: auto" v-if="formData">
      <a-form ref="formRef" :model="formData" layout="vertical" style="margin-top: 14px">
        <!-- 名称 -->
        <a-form-item name="name" label="名称" required>
          <a-input v-model:value="formData.name" placeholder="例如：古代宫殿大殿" />
        </a-form-item>
        <!-- 主体描述 -->
        <a-form-item name="description" label="详情">
          <a-textarea v-model:value="formData.intro" placeholder="内容详情" :autoSize="{ minRows: 3, maxRows: 15 }" />
        </a-form-item>
        <a-form-item name="videoPrompt" label="视频提示词" v-if="props.type == 'storyboard'">
          <a-textarea v-model:value="formData.videoPrompt" placeholder="内容详情" :autoSize="{ minRows: 3, maxRows: 15 }" />
        </a-form-item>
        <!-- 备注 -->
        <a-form-item name="remark" label="备注">
          <a-input v-model:value="formData.remark" placeholder="添加备注信息..." />
        </a-form-item>
        <a-form-item v-if="props.type == 'storyboard'" name="duration" label="时长(单位：秒)">
          <a-input-number v-model:value="formData.duration" placeholder="时长" />
        </a-form-item>
        <template v-if="props.type == 'role'">
          <div class="voiceSection">
            <div class="sectionTitle">音色设置</div>
            <a-form-item label="语音模型">
              <div class="voiceRow">
                <a-select
                  v-model:value="voiceConfig.configId"
                  placeholder="选择语音模型配置"
                  class="voiceSelect"
                  @change="handleVoiceConfigChange">
                  <a-select-option v-for="item in voiceModels" :key="item.id" :value="item.id">
                    {{ item.model }} ({{ item.manufacturer }})
                  </a-select-option>
                </a-select>
                <a-button size="small" @click="fetchVoiceModels">刷新</a-button>
              </div>
            </a-form-item>
            <a-form-item label="模式">
              <a-radio-group v-model:value="voiceConfig.mode">
                <a-radio value="text">预设音色</a-radio>
                <a-radio value="clone">克隆音色</a-radio>
                <a-radio value="mix">混合音色</a-radio>
                <a-radio value="prompt_voice">提示词</a-radio>
              </a-radio-group>
            </a-form-item>

            <template v-if="voiceConfig.mode === 'text'">
              <a-form-item label="预设音色">
                <a-select v-model:value="voiceConfig.voiceId" placeholder="选择预设音色">
                  <a-select-option v-for="item in voicePresets" :key="item.voiceId" :value="item.voiceId">
                    {{ item.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </template>

            <template v-if="voiceConfig.mode === 'clone'">
              <a-form-item label="参考音频">
                <div class="voiceRow">
                  <input ref="voiceFileInput" type="file" accept="audio/*" class="hiddenFile" @change="handleVoiceFileChange" />
                  <a-button size="small" @click="triggerVoiceFile">选择音频</a-button>
                  <span class="voiceHint">{{ voiceConfig.referenceAudioName || "未选择" }}</span>
                </div>
              </a-form-item>
              <a-form-item label="参考文本">
                <a-input v-model:value="voiceConfig.referenceText" placeholder="参考音频对应文本(可选)" />
              </a-form-item>
            </template>

            <template v-if="voiceConfig.mode === 'mix'">
              <a-form-item label="混合音色">
                <div class="mixList">
                  <div v-for="(item, index) in voiceConfig.mixVoices" :key="`mix-${index}`" class="mixRow">
                    <a-select v-model:value="item.voiceId" placeholder="选择音色">
                      <a-select-option v-for="preset in voicePresets" :key="preset.voiceId" :value="preset.voiceId">
                        {{ preset.name }}
                      </a-select-option>
                    </a-select>
                    <a-input-number v-model:value="item.weight" :min="0.1" :max="1" :step="0.1" />
                    <a-button size="small" @click="removeMixVoice(index)" :disabled="voiceConfig.mixVoices.length <= 1">删除</a-button>
                  </div>
                  <a-button size="small" @click="addMixVoice" :disabled="voiceConfig.mixVoices.length >= 3">添加音色</a-button>
                </div>
              </a-form-item>
            </template>

            <template v-if="voiceConfig.mode === 'prompt_voice'">
              <a-form-item label="提示词">
                <div class="voiceRow">
                  <a-input v-model:value="voiceConfig.promptText" placeholder="例如：温柔 治愈 故事" />
                  <a-button size="small" @click="handleVoicePolish('热血少年')">AI润色</a-button>
                  <a-button size="small" @click="handleVoicePolish('沉稳成熟')">AI润色</a-button>
                  <a-button size="small" @click="handleVoicePolish('温柔治愈')">AI润色</a-button>
                </div>
              </a-form-item>
            </template>

            <a-form-item label="试听文本">
              <a-input v-model:value="voicePreviewText" placeholder="输入要试听的文本" />
            </a-form-item>
            <a-form-item>
              <div class="voiceRow">
                <a-button type="primary" :loading="voicePreviewLoading" @click="handleVoicePreview">试听</a-button>
                <a-button v-if="voicePreviewUrl" size="small" @click="downloadVoice">下载音色</a-button>
                <audio v-if="voicePreviewUrl" :src="voicePreviewUrl" controls class="voicePlayer" />
              </div>
            </a-form-item>
          </div>
        </template>
      </a-form>
      <div class="footerBtns">
        <a-button @click="editElementClose" shape="round">取消</a-button>
        <a-button type="primary" shape="round" @click="handleSave" style="margin-left: 15px">保存</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import axios from "@/utils/axios";
import store from "@/stores";
const { projectId } = storeToRefs(store());

import { message, type FormInstance } from "ant-design-vue";
const showModal = defineModel<boolean>({
  default: false,
});
const props = defineProps<{
  type: "role" | "scene" | "props" | "storyboard";
  data?: {
    id: number | null;
    imageUrl?: string;
    intro: string;
    name: string;
    prompt: string;
    remark: string;
    duration: number;
    videoPrompt: string;
    voiceConfig?: string | null;
  };
  scriptId?: number;
}>();
const mode = ref("新增");
watch(showModal, (val) => {
  if (val) {
    formData.value = props.data;
    if (props.type === "role") {
      initVoiceConfig();
      fetchVoiceModels();
    }
    if (formData.value?.id == -1) {
      mode.value = "新增";
    } else {
      mode.value = "编辑";
    }
  }
});
const formRef = ref<FormInstance | null>(null);
const formData = ref<{
  id: number | null;
  imageUrl?: string;
  intro: string;
  name: string;
  prompt: string;
  remark: string;
  duration: number;
  videoPrompt: string;
  voiceConfig?: string | null;
}>();
const typeRecord = {
  role: "角色",
  scene: "场景",
  props: "道具",
  storyboard: "分镜",
} as const;

type VoiceMode = "text" | "clone" | "mix" | "prompt_voice";
interface VoicePresetOption {
  voiceId: string;
  name: string;
}
interface VoiceMixItem {
  voiceId: string;
  weight: number;
}
interface VoiceConfigState {
  configId: number | null;
  mode: VoiceMode;
  voiceId: string;
  referenceAudioPath: string;
  referenceAudioName: string;
  referenceText: string;
  promptText: string;
  mixVoices: VoiceMixItem[];
}

const voiceModels = ref<{ id: number; model: string; manufacturer: string }[]>([]);
const voicePresets = ref<VoicePresetOption[]>([]);
const voiceConfig = reactive<VoiceConfigState>({
  configId: null,
  mode: "text",
  voiceId: "",
  referenceAudioPath: "",
  referenceAudioName: "",
  referenceText: "",
  promptText: "",
  mixVoices: [{ voiceId: "", weight: 0.7 }],
});
const voicePreviewText = ref("");
const voicePreviewUrl = ref("");
const voicePreviewLoading = ref(false);
const voicePolishLoading = ref(false);
const voiceFileInput = ref<HTMLInputElement | null>(null);
watch(
  () => voiceConfig.mode,
  () => {
    voicePreviewUrl.value = "";
  },
);

function resetVoiceState() {
  voiceConfig.configId = null;
  voiceConfig.mode = "text";
  voiceConfig.voiceId = "";
  voiceConfig.referenceAudioPath = "";
  voiceConfig.referenceAudioName = "";
  voiceConfig.referenceText = "";
  voiceConfig.promptText = "";
  voiceConfig.mixVoices = [{ voiceId: "", weight: 0.7 }];
  voicePreviewText.value = formData.value?.name ? `你好，我是${formData.value.name}` : "";
  voicePreviewUrl.value = "";
}

function initVoiceConfig() {
  resetVoiceState();
  const raw = formData.value?.voiceConfig;
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      voiceConfig.configId = Number(parsed.configId) || null;
      voiceConfig.mode = (parsed.mode as VoiceMode) || "text";
      voiceConfig.voiceId = parsed.voiceId || "";
      voiceConfig.referenceAudioPath = parsed.referenceAudioPath || "";
      voiceConfig.referenceAudioName = parsed.referenceAudioName || "";
      voiceConfig.referenceText = parsed.referenceText || "";
      voiceConfig.promptText = parsed.promptText || "";
      voiceConfig.mixVoices = Array.isArray(parsed.mixVoices) && parsed.mixVoices.length > 0 ? parsed.mixVoices : [{ voiceId: "", weight: 0.7 }];
      voicePreviewText.value = parsed.previewText || voicePreviewText.value;
    }
  } catch (err) {
    resetVoiceState();
  }
  if (voiceConfig.configId) {
    fetchVoicePresets();
  }
}

async function fetchVoiceModels() {
  try {
    const res = await axios.post("/setting/getVoiceModelList", { type: "voice" });
    voiceModels.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    voiceModels.value = [];
  }
}

function handleVoiceConfigChange() {
  voicePresets.value = [];
  voiceConfig.voiceId = "";
  voiceConfig.mixVoices = [{ voiceId: "", weight: 0.7 }];
  fetchVoicePresets();
}

async function fetchVoicePresets() {
  if (!voiceConfig.configId) return;
  try {
    const res = await axios.post("/voice/getVoices", { configId: voiceConfig.configId });
    const data = res.data || [];
    const list = Array.isArray(data?.voices) ? data.voices : Array.isArray(data) ? data : [];
    voicePresets.value = list.map((item: any) => {
      if (typeof item === "string") {
        return { voiceId: item, name: item };
      }
      const voiceId = item.voice_id || item.voiceId || item.id || item.key || "";
      const name = item.name || item.label || item.voice_name || voiceId || "默认音色";
      return { voiceId: String(voiceId), name: String(name) };
    });
    if (!voiceConfig.voiceId && voicePresets.value.length > 0) {
      voiceConfig.voiceId = voicePresets.value[0].voiceId;
    }
    if (voiceConfig.mixVoices.length === 0 && voicePresets.value.length > 0) {
      voiceConfig.mixVoices = [{ voiceId: voicePresets.value[0].voiceId, weight: 0.7 }];
    }
  } catch (err) {
    voicePresets.value = [];
  }
}

function addMixVoice() {
  if (voiceConfig.mixVoices.length >= 3) return;
  voiceConfig.mixVoices.push({ voiceId: "", weight: 0.3 });
}

function removeMixVoice(index: number) {
  if (voiceConfig.mixVoices.length <= 1) return;
  voiceConfig.mixVoices.splice(index, 1);
}

function triggerVoiceFile() {
  voiceFileInput.value?.click();
}

async function handleVoiceFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const base64Data = String(reader.result || "");
      const res = await axios.post("/voice/uploadAudio", {
        base64Data,
        fileName: file.name,
        projectId: projectId.value,
      });
      voiceConfig.referenceAudioPath = res.data?.filePath || "";
      voiceConfig.referenceAudioName = file.name;
    } catch (err: unknown) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      if (voiceFileInput.value) voiceFileInput.value.value = "";
    }
  };
  reader.readAsDataURL(file);
}

async function handleVoicePreview() {
  if (!voiceConfig.configId) {
    message.warning("请选择语音模型");
    return;
  }
  if (!voicePreviewText.value.trim()) {
    message.warning("请输入试听文本");
    return;
  }
  if (voiceConfig.mode === "clone" && !voiceConfig.referenceAudioPath) {
    message.warning("请先上传参考音频");
    return;
  }
  if (voiceConfig.mode === "mix" && !voiceConfig.mixVoices.some((item) => item.voiceId)) {
    message.warning("请至少选择一个音色");
    return;
  }
  if (voiceConfig.mode === "prompt_voice" && !voiceConfig.promptText) {
    message.warning("请输入提示词");
    return;
  }
  voicePreviewLoading.value = true;
  try {
    const payload: Record<string, any> = {
      configId: voiceConfig.configId,
      text: voicePreviewText.value.trim(),
      mode: voiceConfig.mode,
    };
    if (voiceConfig.mode === "text") {
      payload.voiceId = voiceConfig.voiceId;
    } else if (voiceConfig.mode === "clone") {
      payload.referenceAudioPath = voiceConfig.referenceAudioPath;
      payload.referenceText = voiceConfig.referenceText;
    } else if (voiceConfig.mode === "mix") {
      payload.mixVoices = voiceConfig.mixVoices.filter((item) => item.voiceId);
    } else if (voiceConfig.mode === "prompt_voice") {
      payload.promptText = voiceConfig.promptText;
    }
    const res = await axios.post("/voice/preview", payload);
    voicePreviewUrl.value = res.data?.audioUrl || "";
  } catch (err: unknown) {
    if (err instanceof Error) message.error(err.message);
  } finally {
    voicePreviewLoading.value = false;
  }
}

async function handleVoicePolish(style: string) {
  if (voicePolishLoading.value) return;
  const input = voiceConfig.promptText?.trim() || formData.value?.name || "";
  if (!input) {
    message.warning("请先输入提示词或角色名称");
    return;
  }
  voicePolishLoading.value = true;
  try {
    const res = await axios.post("/voice/polishPrompt", { text: input, style });
    if (res.data?.prompt) {
      voiceConfig.promptText = res.data.prompt;
    }
  } catch (err: unknown) {
    if (err instanceof Error) message.error(err.message);
  } finally {
    voicePolishLoading.value = false;
  }
}

function downloadVoice() {
  if (!voicePreviewUrl.value) return;
  const link = document.createElement("a");
  link.href = voicePreviewUrl.value;
  link.download = `voice-${Date.now()}.wav`;
  link.click();
}

function getVoiceConfigPayload() {
  if (!voiceConfig.configId) return null;
  return JSON.stringify({
    configId: voiceConfig.configId,
    mode: voiceConfig.mode,
    voiceId: voiceConfig.voiceId,
    referenceAudioPath: voiceConfig.referenceAudioPath,
    referenceAudioName: voiceConfig.referenceAudioName,
    referenceText: voiceConfig.referenceText,
    promptText: voiceConfig.promptText,
    mixVoices: voiceConfig.mixVoices,
    previewText: voicePreviewText.value,
  });
}
function editElementClose() {
  showModal.value = false;
}
const emits = defineEmits(["update"]);
// 保存校验
function handleSave() {
  formRef.value?.validate().then(async () => {
    try {
      if (!formData.value) return;
  if (formData.value.id) {
        const res = await axios.post("/assets/updateAssets", {
          id: formData.value.id,
          name: formData.value.name,
          intro: formData.value.intro ?? "",
          type: typeRecord[props.type],
          remark: formData.value.remark == null ? "" : formData.value.remark,
          prompt: formData.value.prompt ?? "",
          videoPrompt: formData.value.videoPrompt ?? "",
          duration: Number(formData.value.duration),
          voiceConfig: props.type === "role" ? getVoiceConfigPayload() : undefined,
        });
      } else {
        const res = await axios.post("/assets/addAssets", {
          projectId: projectId.value,
          name: formData.value.name,
          intro: formData.value.intro,
          type: typeRecord[props.type],
          remark: formData.value.remark == null ? "" : formData.value.remark,
          prompt: "",
          videoPrompt: formData.value.videoPrompt ?? "",
          scriptId: props.type != "storyboard" ? undefined : Number(props.scriptId),
          duration: formData.value.duration,
          voiceConfig: props.type === "role" ? getVoiceConfigPayload() : undefined,
        });
      }

      emits("update");
      showModal.value = false;
      message.success("保存成功");
    } catch (e: unknown) {
      if (e instanceof Error) message.error(e.message);
    }
  });
}
</script>

<style lang="scss" scoped>
.modelBody {
  padding: 0 24px;
  .typeSelectBox {
    display: flex;
    gap: 16px;
    .typeCard {
      flex: 1;
      text-align: center;
      background: #fff;
      border: 2px solid #dfdfee;
      border-radius: 14px;
      cursor: pointer;
      padding: 14px 0 10px 0;
      transition: all 0.18s;
      user-select: none;
      .active {
        border-color: #a874e8;
        background: #f7f1fe;
      }
      .tabSub {
        color: #795eb3;
        font-size: 13px;
        margin-top: 4px;
      }
      .tabMain {
        font-weight: 600;
        font-size: 17px;
        color: #8d37c9;
      }
      &:not(.active) .tabMain {
        color: #222;
      }
      &:not(.active) .tabSub {
        color: #444;
      }
    }
  }
  .elementPictureRow {
    display: flex;
    align-items: center;
    gap: 18px;
    .picturePreview {
      width: 132px;
      height: 132px;
      border: 1.5px dashed #dbdde7;
      border-radius: 14px;
      background: #f6f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      .elementImg {
        width: 130px;
        height: 130px;
        object-fit: cover;
        border-radius: 12px;
      }
    }
    .uploadSide {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-left: 12px;
      .ant-btn {
        background: #f7f8fa;
        border: 1px solid #dbdde7;
        border-radius: 8px;
        color: #333;
      }
      .tipTxt {
        color: #669;
        font-size: 13px;
        margin-top: 6px;
      }
    }
  }
  .footerBtns {
    margin-top: 25px;
    margin-bottom: 25px;
    display: flex;
    justify-content: flex-end;
  }
  .voiceSection {
    margin-top: 12px;
    padding: 12px 14px;
    border: 1px solid #eef0f6;
    border-radius: 12px;
    background: #fafbff;
    .sectionTitle {
      font-weight: 600;
      color: #5b3aa8;
      margin-bottom: 12px;
    }
    .voiceRow {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .voiceRow :deep(.ant-btn) {
      white-space: nowrap;
    }
    .voiceSelect {
      min-width: 240px;
      flex: 1;
    }
    .voiceHint {
      font-size: 12px;
      color: #666;
    }
    .mixList {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .mixRow {
      display: grid;
      grid-template-columns: 1fr 120px 70px;
      gap: 10px;
      align-items: center;
    }
    .voicePlayer {
      max-width: 260px;
    }
    .hiddenFile {
      display: none;
    }
  }
}
.titHeader {
  .closePoint {
    cursor: pointer;
    margin-right: 24px;
  }
}
</style>
