<template>
  <q-page class="row items-center justify-evenly">
    <div v-if="account">
      {{ account }}
    </div>
    <div v-else>
      Welcome using Wallet Connect v2 for BSV Wallet. <br />
      <a href="http://chainbow.io">http://chainbow.io</a>
      <q-btn @click="connect(DAPP)">Connect Wallet</q-btn>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import useWallet from '../hooks/useWallet';
import { DAPP } from '../hooks/utils';

export default defineComponent({
  name: 'PageIndex',
  components: {},
  setup() {
    const wc = useWallet();

    return {
      ...wc,
      DAPP
    };
  },
});
</script>
