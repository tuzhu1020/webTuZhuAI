import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  model: string;
  description?: string;
  maxTokens?: number;
  category?: string;
  responseTime?: string;
  ownedBy?: string;
}

export const useModelStore = defineStore('model', () => {
  const currentModel = ref<string>('gpt-4o-mini-ca');
  const availableModels = ref<AIModel[]>([]);
  const modelsLoading = ref<boolean>(false);

  const setCurrentModel = (modelId: string) => {
    currentModel.value = modelId;
    localStorage.setItem('selected-ai-model', modelId);
  };

  const setAvailableModels = (models: AIModel[]) => {
    availableModels.value = models;
  };

  const setModelsLoading = (loading: boolean) => {
    modelsLoading.value = loading;
  };

  const getCurrentModelConfig = (): AIModel | undefined => {
    return availableModels.value.find((m) => m.id === currentModel.value);
  };

  const initCurrentModel = () => {
    const savedModel = localStorage.getItem('selected-ai-model');
    if (savedModel) {
      currentModel.value = savedModel;
    }
  };

  return {
    currentModel,
    availableModels,
    modelsLoading,
    setCurrentModel,
    setAvailableModels,
    setModelsLoading,
    getCurrentModelConfig,
    initCurrentModel,
  };
});
