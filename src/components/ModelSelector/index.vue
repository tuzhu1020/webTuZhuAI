<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Select as ASelect } from 'ant-design-vue';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
  category?: string;
  responseTime?: string;
}

interface Props {
  modelValue?: string;
  models?: ModelOption[];
  loading?: boolean;
  size?: 'small' | 'middle' | 'large';
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'gpt-4o-mini-ca',
  models: () => [],
  loading: false,
  size: 'middle',
  placeholder: '选择模型',
});

const emit = defineEmits<Emits>();

const selectedModel = ref(props.modelValue);

watch(() => props.modelValue, (newVal) => {
  selectedModel.value = newVal;
});

const modelOptions = computed(() => {
  return props.models.map((model) => ({
    value: model.id,
    label: model.name,
    description: model.description,
    provider: model.provider,
    category: model.category,
    responseTime: model.responseTime,
  }));
});

const handleChange = (value: string) => {
  selectedModel.value = value;
  emit('update:modelValue', value);
  emit('change', value);
};

const filterOption = (input: string, option: any) => {
  const label = option.label?.toLowerCase() || '';
  const description = option.description?.toLowerCase() || '';
  const category = option.category?.toLowerCase() || '';
  const searchText = input.toLowerCase();
  return label.includes(searchText) || description.includes(searchText) || category.includes(searchText);
};
</script>

<template>
  <ASelect
    v-model:value="selectedModel"
    :options="modelOptions"
    :placeholder="placeholder"
    :size="size"
    :loading="loading"
    :filter-option="filterOption"
    show-search
    class="model-selector"
    @change="handleChange"
  >
    <template #option="{ value, label, description, provider, category, responseTime }">
      <div class="model-option">
        <div class="model-option-header">
          <span class="model-name">{{ label }}</span>
          <div class="model-tags">
            <span v-if="category" class="model-category">{{ category }}</span>
            <span v-if="responseTime" class="model-response-time">{{ responseTime }}</span>
          </div>
        </div>
        <div v-if="description" class="model-description">{{ description }}</div>
      </div>
    </template>
  </ASelect>
</template>

<style scoped>
.model-selector {
  min-width: 180px;
}

.model-option {
  padding: 4px 0;
}

.model-option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.model-name {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.model-tags {
  display: flex;
  gap: 4px;
  align-items: center;
}

.model-category {
  font-size: 11px;
  color: #1890ff;
  background: #e6f7ff;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

.model-response-time {
  font-size: 10px;
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

.model-description {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}
</style>
