<template>
  <!-- Render Users who is connected to Server-->
  <v-card height="780" width="256">
    <v-navigation-drawer permanent>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title"> Online Users </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <!-- Render Id's of Connected Users -->
        <v-list-item v-for="item in remoteIds" :key="item.userid">
          <v-list-item-content>
            <v-list-item-title>{{ item.userid }} </v-list-item-title>
          </v-list-item-content>
          <v-list-item-icon>
            <!-- Call icon Button -->
            <v-btn
              x-small
              fab
              depressed
              :to="{ name: 'CallerView', params: { userId: item.userid } }"
              dark
              color="teal"
            >
              <v-icon>mdi-phone</v-icon>
            </v-btn>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { socket, id } from "@/plugins/socket.io.js";

export default {
  name: "Home",

  data() {
    return {
      id: id,
      remoteIds: [],
    };
  },

  mounted() {
    //recieve all clients information
    socket.on("broadcast", (data) => {
      var filteredData = data.filter((index) => index.userid != this.id);
      this.remoteIds = filteredData;
      console.log(this.remoteIds);
    });

    //receive offer from caller
    socket.on("offer", (payload) => {
      this.$router.push({
        name: "RecieverView",
        params: { callerData: payload },
      });
    });
  },
};
</script>