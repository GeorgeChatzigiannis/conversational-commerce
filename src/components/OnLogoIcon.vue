<template>
  <img :class="$style.logo" src="/on-icon.svg" alt="On Icon" :width="size" :height="size" />
</template>

<script setup lang="ts">
interface Props {
  size?: number | string
}

withDefaults(defineProps<Props>(), {
  size: 24,
})
</script>

<style module>
.logo {
  display: inline-flex;
  vertical-align: middle;
  object-fit: contain;
}
</style>
