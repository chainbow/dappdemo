<template>
  <q-page class="row items-center justify-evenly">
    <div v-if="accounts.length > 0">
      {{ accounts[0] }}
    </div>
    <div class="flex column items-center" v-else>
      <NotConnectTip />
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import useWallet from '../hooks/useWallet';
import { DAPP } from '../hooks/utils';
import NotConnectTip from 'src/components/NotConnectTip.vue';

export default defineComponent({
  name: 'PageIndex',
    components: {
    NotConnectTip,
  },
  setup() {
    const wc = useWallet();

    return {
      ...wc,
      DAPP
    };
  },
});
</script>
