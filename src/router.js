import Vue from "vue";
import VueRouter from "vue-router";

import Home from "@/views/Home.vue";


Vue.use(VueRouter);


const routes = [

{

path: "/",

name: "Home",

component: Home,

},

{

path: "/CallerView/:userId",

name: "CallerView",

component: () =>

import(/* webpackChunkName: "CallerView" */ "@/views/CallerView.vue"),

},

{

path: "/RecieverView/:callerData",

name: "RecieverView",

component: () =>

import(/* webpackChunkName: "RecieverView" */ "@/views/RecieverView.vue"),

},

];

const router = new VueRouter({

mode: "history",

base: process.env.BASE_URL,

routes,

});

export default router;