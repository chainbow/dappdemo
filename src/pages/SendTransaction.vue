<template>
  <q-page class="row items-center justify-evenly">
    <div v-if="account">
      <q-input type="text" v-model="toAddress" label="To:"></q-input>
      <q-select v-model="format" :options="options" label="Format" />
      <q-input type="number" v-model="amount" label="Amount:"></q-input>
      <q-btn @click="send" label="Send"></q-btn>
    </div>
    <div v-else>
      Welcome using Wallet Connect v2 for BSV Wallet. <br />
      <a href="http://chainbow.io">http://chainbow.io</a>
      <q-btn @click="connect(DAPP)">Connect Wallet</q-btn>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from 'vue';
import useWallet from '../hooks/useWallet';
import { DAPP } from '../hooks/utils';
import { Notify } from 'quasar';

export default defineComponent({
  name: 'SendTransaction',
  components: {},
  setup() {
    const wc = useWallet();
    const data = reactive({
      options: [
        {
          label: 'Address',
          value: 'address',
        },
        {
          label: 'Paymail',
          value: 'paymail',
        },
        {
          label: 'Script',
          value: 'script',
        },
      ],
      format: undefined,
      toAddress: 'lilong@chainbow.io',
      amount: 0,
    });

    //send transaction to script
    // to: 76a914d214f20ff09916d84665e5a1af160f482aa9fc4288ac
    // format: script
    // amount: 312
    // https://whatsonchain.com/tx/3b9cd48feaeece0eb1b36ac01039d24cb73ca660d399a799655b84a44891d31f

    const send = async () => {
      console.log(data);
      if (data.toAddress && data.amount) {
        await wc
          .sendTransaction({
            outputs: [
              {
                to: data.toAddress,
                format: data.format
                  ? (data.format as any).value.toString()
                  : undefined,
                amount: data.amount.toString(),
              },
            ],
          })
          .then((result) => {
            console.log(result);
            Notify.create({
              color: 'info',
              message: JSON.stringify(result),
              position: 'top',
            });
          })
          .catch((error) => {
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
      }
    };

    return {
      ...wc,
      ...toRefs(data),
      DAPP,
      send,
    };
  },
});
</script>
