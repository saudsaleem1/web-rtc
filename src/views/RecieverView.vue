<template>
  <div class="RecieverCall">
    <!-- Render Screen When someone Calling You but not accept call yet -->
    <div v-show="AttendCallAction == false">
      <v-card color="teal">
        <v-card-text>
          <h1 class="white--text text-center">Someone Calling</h1>
        </v-card-text>
        <!-- <div class="d-flex justify-center">
          <img
            id="leftheader-side-image"
            :src="this.imgSrc"
            alt="svg_image"
            height="55%"
            width="20%"
          />
        </div> -->
      </v-card>
      <!-- Buttons -->
      <div class="d-flex justify-center mt-10">
        <!-- Accept Call Button-->
        <v-btn
          fab
          dark
          color="teal"
          :large="$vuetify.breakpoint.md || $vuetify.breakpoint.lg"
          :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
          class="ml-2"
          @click="ansCall(payload)"
        >
          <v-icon> mdi-phone </v-icon>
        </v-btn>
        <!-- Decline Call Button -->
        <v-btn
          fab
          dark
          color="red"
          @click="decline"
          :large="$vuetify.breakpoint.md || $vuetify.breakpoint.lg"
          :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
          class="ml-2"
        >
          <v-icon> mdi-phone-hangup </v-icon>
        </v-btn>
      </div>
    </div>
    <!-------------------------------------------->

    <!--Render screen When you Accept Call-->
    <v-card v-show="AttendCallAction == true">
      <div>
        <!-- Video Tag -->
        <video
          id="remoteVideo"
          autoplay
          class="video-tag-style"
          playsinline
          width="100%"
        />
      </div>
      <!-- Buttons -->
      <div
        class="d-flex justify-center icons-style"
        :class="
          $vuetify.breakpoint.md || $vuetify.breakpoint.lg
            ? 'margintop-icons-lg-screen'
            : 'margintop-icons-sm-screen'
        "
      >
        <!-- On off Video Access to Reciever(Button) -->
        <v-btn
          :large="$vuetify.breakpoint.md || $vuetify.breakpoint.lg"
          :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
          @click="
            (toggleVideoIcon = !toggleVideoIcon),
              toggleTrack(localStream, 'video')
          "
          dark
          color="teal"
          fab
        >
          <v-icon>{{ toggleVideoIcon ? "mdi-video" : "mdi-video-off" }}</v-icon>
        </v-btn>
        <!-- hangup Phone(Button) -->
        <v-btn
          fab
          dark
          color="red"
          @click="hangup"
          :large="$vuetify.breakpoint.md || $vuetify.breakpoint.lg"
          :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
          class="ml-2"
        >
          <v-icon> mdi-phone-hangup </v-icon>
        </v-btn>
        <!-- Mute and Unmute the call(Button)-->
        <v-btn
          fab
          :large="$vuetify.breakpoint.md || $vuetify.breakpoint.lg"
          :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
          class="ml-2"
          dark
          color="teal"
          @click="
            (toggleMicrophoneIcon = !toggleMicrophoneIcon),
              toggleTrack(localStream, 'audio')
          "
        >
          <v-icon>{{
            toggleMicrophoneIcon ? "mdi-microphone" : "mdi-microphone-off"
          }}</v-icon>
        </v-btn>
      </div>
      <video id="localVideo" autoplay playsinline />
    </v-card>
    <!--------------------------------------------->
  </div>
</template>

<script>
import { socket, id } from "@/plugins/socket.io.js";

export default {
  data() {
    return {
      id: id,
      rid: this.$route.params.callerData.sid.toString(),
      payload: this.$route.params.callerData,
      AttendCallAction: false,
      toggleVideoIcon: false,
      toggleMicrophoneIcon: false,
      remoteStream: null,
      remoteVideo: null,
      localVideo: null,
      localStream: null,
     // imgSrc: require("@/assets/Images/Userpic.svg"),
      peerConnection: null,
    };
  },
  methods: {
    //answer incoming call and accept remote offer SDP and send create answer SDP and send to signalling server
    async ansCall(payload) {
      this.AttendCallAction = !this.AttendCallAction;
      //create peer connection instance for callee
      this.peerConnection = new RTCPeerConnection({});
      //set remote stream coming from remote peer to local stream object
      this.setRemoteStream();
      //get local media streams
      const constraints = { video: true, audio: true };
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      //local video
      this.localVideo = document.querySelector("#localVideo");
      this.localVideo.srcObject = this.localStream;
      //and set these steams to local peer-connection object
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
      //set remote description with remote offer SDP
      this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(payload.offer)
      );
      //create answer SDP
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // send this answer SDP to signalling server
      socket.emit("answer", { answer: answer, sid: this.id, rid: this.rid });
      console.log(
        "answer SDP is generated and send to signalling server",
        this.rid
      );

      //this function create callee ICE candidates (ICE candidates have information of IP address, Port number
      // and transport layer protocol UDP or TCP)
      this.setIceCandidatesCallee();
    },

    setIceCandidatesCallee() {
      //icecandidate eventlistner listen and updates ICE credietials
      this.peerConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
          //   console.log("sending candiates");
          socket.emit("new-ice-candidateCallee", {
            "new-ice-candidate": event.candidate,
            sid: this.id,
            rid: this.rid,
          });
        }
      });
    },

    //set remote streams to local media stream object
    setRemoteStream() {
      console.log(this.peerConnection);
      //create local media stream object and set remote stream to this newly created object
      this.remoteStream = new MediaStream();
      this.remoteVideo = document.querySelector("#remoteVideo");
      this.remoteVideo.srcObject = this.remoteStream;
      //add event listner track to listen and add remote tracks to mediaStream obj
      this.peerConnection.addEventListener("track", async (event) => {
        this.remoteStream.addTrack(event.track, this.remoteStream);
      });
    },
    toggleTrack(stream, type) {
      stream.getTracks().forEach((track) => {
        if (track.kind === type) {
          track.enabled = !track.enabled;
        }
      });
    },
    //END CALL
    hangup() {
      this.remoteStream = null;
      this.peerConnection.close();
      this.peerConnection = null;
      //send signal to other peer about ending of call
      socket.emit("callEnded", { rid: this.rid });
      this.$router.push("/");
      document.location.reload();
    },
    decline() {
      //send signal to other peer about declining of call
      socket.emit("callEnded", { rid: this.rid });
      this.$router.push("/");
    },
  },

  mounted() {
    //set caller ICE candidates to callee peer-connection object
    socket.on("new-ice-candidateCaller", async (payload) => {
      if (payload["new-ice-candidate"]) {
        try {
          await this.peerConnection.addIceCandidate(
            payload["new-ice-candidate"]
          );
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });
    socket.on("callEnded", () => {
      this.peerConnection.close();
      this.$router.push("/");
      document.location.reload();
    });
  },
};
</script>
<style scoped>
#localVideo {
  width: 15%;
  height: 100vh;
  position: absolute;
  left: 1000px;
  top: 295px;
  /* bottom: 2%; */
  z-index: 9998;
}
</style>