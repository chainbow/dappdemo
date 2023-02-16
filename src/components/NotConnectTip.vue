<template>
    <div class="flex column items-center">
      Welcome using Wallet Connect v2 for BSV Wallet. <br />
      <a href="http://chainbow.io">http://chainbow.io</a>
      <q-btn @click="connect(DAPP)">Connect Wallet</q-btn>
    </div>
</template>

<script lang="ts">
import useWallet from 'src/hooks/useWallet';
import { defineComponent } from 'vue';
import { DAPP } from '../hooks/utils';

export default defineComponent({
  name: 'NotConnectTip',
  setup() {
    const wc = useWallet();

    return {
      ...wc,
      DAPP,
    };
  },
});
</script>
