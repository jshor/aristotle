<template>
  <div
    :class="{ 'tab--active': active }"
    @click="$emit('activate', id)"
    class="tab">
    <div class="tab__name">{{ name }}</div>
    <div
      class="tab__close"
      @click.stop="$emit('close')"
    />
  </div>
</template>

<script>
export default {
  name: 'Tab',
  props: {
    name: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss">
$color-bg-primary: #1D1E25;
$color-bg-secondary: #333641;
$color-bg-tertiary: #3D404B;
$color-bg-quaternary: #454857;

$color-primary: #fff;
$color-secondary: #9ca0b1;

$color-shadow: #000;

$border-width: 1px;
$scrollbar-width: 3px;

.tab {
  display: flex;
  max-width: 200px;
  padding: 0.5rem;
  background-color: $color-bg-quaternary;
  border-style: solid;
  border-color: $color-bg-tertiary;
  border-width: $border-width $border-width $border-width 0;
  color: $color-secondary;
  box-sizing: border-box;
        
  &:first-of-type {
    border-left: $border-width solid $color-bg-tertiary;
  }
  
  &__name, &__close {
    display: inline-block;
    justify-content: center;
    align-items: center;
  }
  
  &__close {
    display: flex;
    width: 1rem;
    padding-left: 0.5rem;
    
    &::before {
      display: none;
      content: '✖';
      transition: all 0.1s;
      cursor: pointer;
      font-weight: bold;
      line-height: 1rem;
    }
      
    &:hover {
      color: $color-primary;
    }
    
    &:active {
      color: $color-bg-quaternary;
    }
  }
  
  &--unsaved {
    .tab__close {
      &::before {
        display: none;
      }
      
      &::after {
        display: block;
        content: ' ';
        background-color: $color-primary;
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
    }
  }
  
  &--active {
    background-color: $color-bg-secondary;
    border-bottom-color: $color-bg-secondary;
    color: $color-primary;
    
    .tab__close::before {
      display: block;
    }
  }
  
  &:not(.tab--active) {
    cursor: pointer;  
  }
  
  &:hover {
    .tab__close {
      &::before {
        display: block;
      }

      &::after {
        display: none;
      }
    }
  }
  
  &__name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>