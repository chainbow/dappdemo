<template>
  <q-page class="row items-center justify-evenly">
    <div class="column items-center" v-if="account">
      <div v-if="error">{{ error }}</div>
      <q-input
        type="textarea"
        :v-model="txRaw"
        label="Tx Raw Hex:"
        autofocus
        autogrow
        filled
      ></q-input>
      <q-btn @click="send" label="Send"></q-btn>
    </div>
    <div v-else>
      <NotConnectTip />
    </div>
  </q-page>
</template>

<script lang="ts">
import { Notify } from 'quasar';

import { defineComponent, reactive, toRefs } from 'vue';
import useWallet from '../hooks/useWallet';
import { DAPP } from '../hooks/utils';
import NotConnectTip from 'src/components/NotConnectTip.vue';

export default defineComponent({
  name: 'SendRawTransaction',
  components: {
    NotConnectTip,
  },
  setup() {
    const wc = useWallet();
    const data = reactive({
      error: '',
      txRaw: '',
    });

    const send = async () => {
      const res = await wc
        .sendRawTransaction([data.txRaw])
        .then((result) => {
          console.log(result);
          Notify.create({
            color: 'info',
            message: JSON.stringify(result),
            position: 'top',
          });
        })
        .catch((error) => {
          data.error = error.message;
          if (typeof error === 'string' && error.includes('timeout')) {
            Notify.create({
              color: 'negative',
              message: 'Please Open Wallet',
              position: 'top',
            });
          } else {
            Notify.create({
              color: 'negative',
              message: error.message,
              position: 'top',
            });
          }
        });
      console.log(res);
    };

    return {
      ...wc,
      DAPP,
      ...toRefs(data),
      send,
    };
  },
});
</script>
