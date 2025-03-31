<script setup lang="ts">
import defaultIcon from '@/assets/image/software-icon-default.png'
import AppUtil from '@/utils/app-util'
import RegeditUtil from '@/utils/regedit-util'
import type { InstalledSoftware } from '@/types/Software'

const props = defineProps<{
  soft?: InstalledSoftware,
  type: 'double column'| 'vertical'
}>()

const getLineClass = ()=>{
  if(props.type == 'double column'){
    return 'double'
  }else{
    return 'single'
  }
}
</script>

<template>
  <div class="soft" v-if="soft">
    <img class="soft__icon" alt="" :src="soft.base64Icon ? soft.base64Icon : defaultIcon" />
    <div class="soft__info">
      <div :class="getLineClass()">
        <div class="soft__info__item">
          <span class="soft__info__item__label">软件名称</span>
          <el-tooltip effect="dark" :content="soft.name" placement="top-start">
            <span class="soft__info__item__value">{{ soft.name }}</span>
          </el-tooltip>
        </div>
        <div class="soft__info__item">
          <span class="soft__info__item__label">发布者　</span>
          <el-tooltip effect="dark" :content="soft.publisher" placement="top-start">
            <span class="soft__info__item__value">{{ soft.publisher }}</span>
          </el-tooltip>
        </div>
      </div>
      <div :class="getLineClass()">
        <div class="soft__info__item">
          <span class="soft__info__item__label">安装位置</span>
          <el-tooltip effect="dark" :content="soft.installDir" placement="top-start">
            <span class="soft__info__item__value actionable" @click="AppUtil.openPath(soft.installDir)">{{
              soft.installDir
            }}</span>
          </el-tooltip>
        </div>
        <div class="soft__info__item">
          <span class="soft__info__item__label">卸载命令</span>
          <el-tooltip effect="dark" :content="soft.uninstallString" placement="top-start">
            <span class="soft__info__item__value">{{ soft.uninstallString }}</span>
          </el-tooltip>
        </div>
      </div>
      <div :class="getLineClass()">
        <div class="soft__info__item">
          <span class="soft__info__item__label">图标位置</span>
          <el-tooltip effect="dark" :content="soft.iconPath" placement="top-start">
            <span class="soft__info__item__value actionable" @click="AppUtil.openPath(soft.iconPath)">{{
                soft.iconPath
            }}</span>
          </el-tooltip>
        </div>
        <div class="soft__info__item">
          <div class="soft__info__item__label">注册表　</div>
          <el-tooltip effect="dark" :content="soft.regeditDir" placement="top-start">
            <span class="soft__info__item__value actionable" @click="RegeditUtil.openRegedit(soft.regeditDir)">{{
              soft.regeditDir
            }}</span>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/components/soft/software-info';
</style>
