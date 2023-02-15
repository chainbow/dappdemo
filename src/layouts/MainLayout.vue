<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Wallect Connect to BSV Wallet </q-toolbar-title>

        <div v-if="account">
          {{ account.username }}({{
            account.balances ? account.balances["Satoshi"].balance : ""
          }}Satoshi)
          <q-btn
            flat
            class="text-black"
            icon="logout"
            @click="disconnect"
          ></q-btn>
        </div>

        <q-btn color="secondary" @click="connect" v-else>Connect Wallect</q-btn>



        <q-btn  color="primary" :label="currentChainId">
          <q-menu>
            <q-list style="min-width: 100px">
              <q-item clickable @click="setChain('bsv:livenet')" v-close-popup>
                <q-item-section >BSV Livenet</q-item-section>
              </q-item>
              <q-item clickable @click="setChain('bsv:testnet')" v-close-popup>
                <q-item-section>BSV Testnet</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable @click="setChain('rxd:livenet')" v-close-popup>
                <q-item-section>RXD Livenet</q-item-section>
              </q-item>
              <q-item clickable @click="setChain('rxd:testnet')" v-close-popup>
                <q-item-section>RXD Testnet</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Wallet Connect </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          @click="go"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import EssentialLink from 'components/EssentialLink.vue';
import { useRoute } from 'vue-router';

const linksList = [
  {
    title: 'Home',
    caption: '',
    icon: 'home',
    link: 'Home',
  },
  {
    title: 'Send Transaction',
    caption: 'Send satoshi to address',
    icon: 'school',
    link: 'SendTransaction',
  },
  {
    title: 'Sign Message',
    caption: 'Sign any message by public key',
    icon: 'code',
    link: 'SignMessage',
  },
  {
    title: 'Sign Transaction',
    caption: 'Sign Transaction the broadcast',
    icon: 'record_voice_over',
    link: 'SignTransaction',
  },
  {
    title: 'Send raw transaction',
    caption: 'Send raw transaction',
    icon: 'podcasts',
    link: 'SendRawTransaction',
  },
  {
    title: 'Address',
    caption: 'New Address and verify',
    icon: 'currency_bitcoin',
    link: 'Address',
  },
];

import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import useWallet from '../hooks/useWallet';

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink,
  },

  setup() {
    const route = useRoute();
    const wc = useWallet();

    const leftDrawerOpen = ref(false);

    const router = useRouter();

    const go = async (linkName: string) => {
      console.log(linkName);
      await router.push({ name: linkName });
    };

    const connect = async () => {
      console.log('connect');
      await wc.connect();
    };

    const setChain =async (chainId:string) => {
      wc.currentChainId.value = chainId
    }

    // wc.wallet.value = route.query.wallet?.toString();

    return {
      ...wc,
      setChain,
      essentialLinks: linksList,
      leftDrawerOpen,
      go,
      connect,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },
});
</script>
