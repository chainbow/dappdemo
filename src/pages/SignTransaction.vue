<template>
  <q-page class="row items-center justify-evenly">
    <div v-if="account">
      <div class="column justify-around">
        <div class="row justify-between q-pa-md">
          <q-input
            type="text"
            style="width: 500px"
            v-model="prevTxId"
            label="prevTxId:"
          ></q-input>
        </div>
        <div class="row justify-between q-pa-md">
          <q-input
            type="text"
            style="width: 500px"
            v-model="outputIndex"
            label="outputIndex:"
          ></q-input>
        </div>
        <q-btn
          @click="fetchTx"
          label="Fetch Utxo"
          size="md"
          class="q-ma-lg"
        ></q-btn>
        <div class="q-pa-sm" style="width: 500px">
          <q-input
            v-model="lockingScriptHex"
            type="textarea"
            filled
            label="Locking Script Hex:"
          />
        </div>
        <div class="row justify-between q-pa-md">
          <q-input
            type="text"
            style="width: 500px"
            v-model="address"
            label="address:"
          ></q-input>
        </div>

        <div class="row justify-between q-pa-md">
          <q-input
            type="text"
            v-model="toAddress"
            style="width: 500px"
            label="To Address:"
          ></q-input>
        </div>
        <div class="row justify-between q-pa-md">
          <q-input
            type="number"
            v-model="outputSatoshis"
            style="width: 500px"
            label="Amount:"
          ></q-input>
        </div>
        <q-btn
          @click="signTransaction"
          label="Sign"
          size="md"
          class="q-ma-lg"
        ></q-btn>
      </div>

      <div class="column">
        <div class="q-pa-sm" style="width: 500px">
          <pre v-html="JSON.stringify(transaction, null, 2)"></pre>
        </div>
        <q-btn
          @click="sendTransaction"
          label="Charge and Send"
          class="q-ma-lg"
        ></q-btn>
      </div>

      <div class="column">
        <div class="q-pa-sm" style="width: 500px">
          <q-input
            v-model="rawTx"
            type="textarea"
            filled
            label="Raw Transaction:"
          />
        </div>
        <q-btn
          @click="sendRawTransaction"
          label="Send Raw Transaction"
          class="q-ma-lg"
        ></q-btn>
      </div>
    </div>

    <div v-else>
      Welcome using Wallet Connect v2 for BSV Wallet. <br />
      <a href="http://chainbow.io">http://chainbow.io</a>
      <q-btn @click="connect(DAPP)">Connect Wallet</q-btn>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Notify } from 'quasar';

import { defineComponent, reactive, toRefs, watch, onMounted } from 'vue';
import useWallet from '../hooks/useWallet';
import { DAPP } from '../hooks/utils';
import {
  ISignTransaction,
  ITransaction,
  ISignTransactionResult,
} from 'src/hooks/useWalletTypes';
import { api } from 'src/boot/axios';
import bsv from 'bsv';

export default defineComponent({
  name: 'SignTransaction',
  setup() {
    const wc = useWallet();
    const data = reactive({
      prevTxId: '',
      outputIndex: 0,
      lockingScriptHex: '',
      satoshis: 0,
      address: '',
      rawTx: '',
      toAddress: '',
      outputSatoshis: 0,
      error: '',
      transaction: {},
    });

    watch(
      () => wc.account?.value?.address,
      (address) => {
        if (address) {
          data.toAddress = address;
        }
      }
    );

    const fetchTx = async () => {
      await api
        .get(
          `https://api.whatsonchain.com/v1/bsv/main/tx/hash/${data.prevTxId}`
        )
        .then((res: any) => {
          console.log(res.data);
          const result = res.data.vout[data.outputIndex];
          data.lockingScriptHex = result.scriptPubKey.hex;
          data.satoshis = Math.round(result.value * 10 ** 8 + Number.EPSILON); //convert bsv to satoshi
          data.address = result.scriptPubKey.addresses[0];
        });
    };

    const signTransaction = async () => {
      const script = bsv.Script.buildPublicKeyHashOut(data.toAddress);
      const transaction: ITransaction = {
        inputs: [
          {
            prevTxId: data.prevTxId,
            outputIndex: data.outputIndex,
            satoshis: data.satoshis,
            lockingScript: data.lockingScriptHex,
          },
        ],
        outputs: [
          {
            to: script.toHex(),
            format: 'script',
            amount: String(data.outputSatoshis),
          },
        ],
      };
      const request: ISignTransaction = {
        transaction,
        signRequests: [
          {
            inputIndex: 0,
            address: data.address,
            sigtype: bsv.crypto.Signature.SIGHASH_ANYONECANPAY | bsv.crypto.Signature.SIGHASH_ALL | bsv.crypto.Signature.SIGHASH_FORKID
          },
        ],
      };
      console.log(data, request);
      await wc
        .signTransaction(request)
        .then((result: ISignTransactionResult) => {
          if (result.error) {
            data.error = result.error;
          }
          console.log(result);

          const tx = new bsv.Transaction();
          if (transaction.inputs) {
            for (let i = 0; i < result.signatures.length; i++) {
              const sig = result.signatures[i];
              const input = transaction.inputs[sig.inputIndex];
              const script = new bsv.Script('');
              script.add(Buffer.from(sig.signature, 'hex'));
              script.add(new bsv.PublicKey(sig.pubkey).toBuffer());
              input.unlockingScript = script.toHex();
            }
            for (const input of transaction.inputs) {
              if (input.lockingScript && input.unlockingScript) {
                tx.addInput(
                  new bsv.Transaction.Input({
                    prevTxId: input.prevTxId,
                    outputIndex: input.outputIndex,
                    script: bsv.Script.fromHex(input.unlockingScript),
                  }),
                  bsv.Script.fromHex(input.lockingScript),
                  input.satoshis
                );
              }
            }
          }
          for (const output of transaction.outputs) {
            const script = bsv.Script.fromHex(output.to);
            tx.addOutput(
              new bsv.Transaction.Output({
                script,
                satoshis: output.amount,
              })
            );
          }
          data.rawTx = tx.uncheckedSerialize();
          data.transaction = transaction;
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
    };

    const sendTransaction = async () => {
      await wc
        .sendTransaction(data.transaction as ITransaction)
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
    };

    const sendRawTransaction = async () => {
      await wc
        .sendRawTransaction([data.rawTx])
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
    };

    onMounted(() => {
      if (wc.account?.value?.address) {
        data.address = wc.account.value.address;
      }
    });

    return {
      ...wc,
      ...toRefs(data),
      DAPP,
      fetchTx,
      signTransaction,
      sendTransaction,
      sendRawTransaction,
    };
  },
});
</script>
