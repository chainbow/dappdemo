import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'Home', path: '', component: () => import('pages/Index.vue') },
      { name: 'SendTransaction', path: 'send-transaction', component: () => import('src/pages/SendTransaction.vue') },
      {
        name: 'SendToken',
        path: 'send-token',
        component: () => import('pages/SendToken.vue'),
      },
      {
        name: 'SignMessage',
        path: 'sign-message',
        component: () => import('pages/SignMessage.vue'),
      },
      {
        name: 'SignTransaction',
        path: 'sign-transaction',
        component: () => import('pages/SignTransaction.vue'),
      },
      {
        name: 'SendRawTransaction',
        path: 'send-raw-transaction',
        component: () => import('pages/SendRawTransaction.vue'),
      },
      {
        name: 'Address',
        path: 'address',
        component: () => import('pages/Address.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
