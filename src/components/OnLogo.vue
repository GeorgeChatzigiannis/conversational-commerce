<template>
  <img :class="$style.logo" src="/on-logo.svg" alt="On Logo" :width="width" :height="height" />
</template>

<script setup lang="ts">
interface Props {
  width?: number | string
  height?: number | string
}

withDefaults(defineProps<Props>(), {
  width: 100,
  height: 'auto',
})
</script>

<style module src="./OnLogo.module.css"></style>
