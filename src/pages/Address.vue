<template>
  <q-page class='row items-center justify-evenly'>
    <div v-if='accounts.length > 0'>
      <div class='column justify-around'>
        <div class='row justify-between q-pa-md'>
          <q-input
            type='text'
            style='width: 500px'
            v-model='address'
            label='new address:'
          ></q-input>
        </div>
        <q-btn
          @click='newAddress'
          label='New Address'
          size='md'
          class='q-ma-lg'
        ></q-btn>
      </div>

      <div class='column'>
        <div class='q-pa-sm' style='width: 500px'>
          <q-input v-model='result' type='textarea' filled label='Verify Result:' />
        </div>
        <q-btn @click='verify' label='Verify' class='q-ma-lg'></q-btn>
      </div>
    </div>

    <div v-else>
      Welcome using Wallet Connect v2 for ChainBow Wallet. <br />
      <a href='http://chainbow.io'>http://chainbow.io</a>
      <q-btn @click='connect(DAPP)'>Connect Wallet</q-btn>
    </div>
  </q-page>
</template>

<script lang='ts'>
import { Notify } from 'quasar';
import { defineComponent, reactive, toRefs, onMounted } from 'vue';
import useWallet from '../hooks/useWallet';
import { DAPP } from '../hooks/utils';

export default defineComponent({
  name: 'AddressVerify',
  components: {},
  setup() {
    const wc = useWallet();
    const data = reactive({
      address: '',
      result: ''
    });

    const newAddress = async () => {
      try {
        const address = await wc.getNewAddress();
        console.info('[页面签名数据]', address);
        if (address) {
          data.address = address;
        } else {
          data.address = '';
        }

      } catch (error: any) {
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
      }

    };

    const verify = async () => {
      await wc
        .verifyAddress(data.address)
        .then((result: boolean | null) => {
          if (result) {
            data.result = String(result);
          } else {
            data.result = 'false';
          }
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
      newAddress,
      verify
    };
  }
});
</script>
