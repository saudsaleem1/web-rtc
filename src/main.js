import Vue from "vue";
import App from "./App.vue";
import router from "./router";
//import store from "./store";
import vuetify from "./plugins/vuetify";
//global stylesheet
import "./assets/css/style.css";
Vue.config.productionTip = true;
new Vue({
  router,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
