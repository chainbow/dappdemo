<template>
  <q-page class='row items-center justify-evenly'>
    <div v-if='account'>
      <div class='column justify-around'>
        <div class='q-pa-sm' style='width: 500px'>
          <q-input v-model='message' type='textarea' filled label='Message:' />
        </div>

        <div class='row justify-between q-pa-md'>
          <q-input
            type='text'
            style='width: 500px'
            v-model='address'
            label='address:'
          ></q-input>
        </div>
        <q-btn @click='send' label='Send' size='md' class='q-ma-lg'></q-btn>
      </div>

      <div class='column'>
        <div class='q-pa-sm' style='width: 500px'>
          <q-input v-model='sig' type='textarea' filled label='Signature:' />
        </div>
        <q-btn @click='verify' label='Verify' class='q-ma-lg'></q-btn>
      </div>
    </div>

    <div v-else>
      <NotConnectTip />
    </div>
  </q-page>
</template>

<script lang='ts'>
import { Dialog, Notify } from 'quasar';
import { defineComponent, reactive, toRefs, watch, onMounted } from 'vue';
import useWallet from '../hooks/useWallet';
import { DAPP } from '../hooks/utils';
import Message from 'bsv/message';
import { IMessageResult } from 'src/hooks/useWalletTypes';
import NotConnectTip from 'src/components/NotConnectTip.vue';

export default defineComponent({
  name: 'SignMessage',
   components: {
    NotConnectTip,
  },
  setup() {
    const wc = useWallet();
    const data = reactive({
      address: '',
      message: 'Hello World',
      sig: ''
    });

    watch(
      () => wc.accounts?.value,
      (accounts) => {
        if (accounts.length>0) {
          data.address = accounts[0].address;
        }
      }
    );

    const send = async () => {
      console.log(data);
      if (data.address && data.message) {
        await wc
          .signMessage({
            address: data.address,
            message: data.message
          })
          .then((result: IMessageResult | undefined) => {
            if (result && result.error) {
              data.sig = result.error;
            } else if (result && result.signature) {
              data.sig = result.signature;
            }
            console.log(result);
          })
          .catch((error) => {
            if (typeof error === 'string' && error.includes('timeout')) {
              Notify.create({
                color: 'negative',
                message: 'Please Open Wallet',
                position: 'top'
              });
            } else {
              Notify.create({
                color: 'negative',
                message: error.message,
                position: 'top'
              });
            }
          });
      }
    };

    const verify = () => {
      try {
        const result = Message.verify(data.message, data.address, data.sig);
        console.log('verify result', result);
        Dialog.create({
          message: result ? 'Success' : 'Fail'
        });
      } catch (e: any) {
        Dialog.create({
          message: e.message
        });
      }
    };

    onMounted(() => {
      if (wc.accounts.value[0]) {
        data.address = wc.accounts.value[0].address
      }
    });

    return {
      ...wc,
      ...toRefs(data),
      DAPP,
      send,
      verify
    };
  }
});
</script>
