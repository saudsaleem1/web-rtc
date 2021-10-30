<template>
  <div class="CallerView">
    <!-- Render this Screen When Call SomeOne and Reciever not Accept Call Yet-->
    <div v-show="callAnswered == false">
      <v-card color="teal">
        <v-card-text>
          <h1 class="white--text text-center">Ringing....</h1>
        </v-card-text>
        <!-- <div class="d-flex justify-center">
          <img
            id="leftheader-side-image"
            src="this.imgSrc"
            alt="svg_image"
            height="55%"
            width="20%"
          />
        </div> -->
      </v-card>
      <!-- Render a UI in which caller waiting for acceptance of call -->
      <div class="d-flex justify-center">
        <v-btn
          fab
          dark
          color="red"
          @click="decline"
          :large="$vuetify.breakpoint.md || $vuetify.breakpoint.lg"
          :small="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
          class="ml-2 mt-10"
        >
          <v-icon> mdi-phone-hangup </v-icon>
        </v-btn>
      </div>
    </div>
    <!------------------------------------------------------------>

    <!-- This Screen Render When Reciever Accept the Call  -->
    <v-card v-show="callAnswered == true">
      <div>
        <!-- Video Tag -->
        <video
          id="remoteVideo"
          autoplay
          playsinline
          class="video-tag-style"
          width="100%"
        />
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
            <v-icon>{{
              toggleVideoIcon ? "mdi-video" : "mdi-video-off"
            }}</v-icon>
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
      </div>
      <video id="localVideo" autoplay playsinline />
    </v-card>
    <!------------------------------------------------------------>
  </div>
</template>
<script>
import { socket, id } from "@/plugins/socket.io.js";

export default {
  data() {
    return {
      id: id,
      rid: this.$route.params.userId,
      callAnswered: false,
      //imgSrc: require("@/assets/Images/Userpic.svg"),
      toggleVideoIcon: false,
      toggleMicrophoneIcon: false,
      remoteStream: null,
      remoteVideo: null,
      localVideo: null,
      localStream: null,
      peerConnection: null,
    };
  },
  methods: {
    async startCall() {
      this.peerConnection = new RTCPeerConnection({});
      //get local media streams
      const constraints = { video: true, audio: true };
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localVideo = document.querySelector("#localVideo");
      this.localVideo.srcObject = this.localStream;
      // set these local media streams to local peer-connection object
      this.localStream.getTracks().forEach((track) => {
        console.log(this.peerConnection.addTrack(track, this.localStream));
      });
      //create offer SDP
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      //and send this SDP offer to signalling server
      socket.emit("offer", { offer: offer, sid: this.id, rid: this.rid });
      console.log("Offer SDP generated");
    },

    //set remote description in caller peer-connection object
    async setRemoteDescriptionCaller(payload) {
      const remoteDesc = new RTCSessionDescription(payload.answer);
      await this.peerConnection.setRemoteDescription(remoteDesc);
      //this function create callee ICE candidates (ICE candidates have information of IP address, Port number
      // and transport layer protocol UDP or TCP)
      this.setIceCandidatesCaller();
    },

    setIceCandidatesCaller() {
      //icecandidate eventlistner listen and updates ICE credietials
      this.peerConnection.addEventListener("icecandidate", (event) => {
        console.log("below caller candiates");
        if (event.candidate) {
          //these ICE credeitials send to signalling server
          socket.emit("new-ice-candidateCaller", {
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
    this.startCall();

    //receive answer from callee(receiver)
    socket.on("answer", (payload) => {
      console.log("ans payload recev");
      this.callAnswered = true;
      //set remote stream coming from remote peer to local stream object
      this.setRemoteStream();
      this.setRemoteDescriptionCaller(payload);
    });

    //set callee(reciever) ICE candidates to caller peer-connection object
    socket.on("new-ice-candidateCallee", async (payload) => {
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

    //listen to ending of call
    socket.on("callEnded", () => {
      this.peerConnection.close();
      this.$router.push("/");
      document.location.reload();
    });
    //recieve all clients information about connection and disconnection
    socket.on("broadcast", (data) => {
      var filteredData = data.filter((index) => index.userid != this.id);
      this.remoteIds = filteredData;
      console.log(this.remoteIds);
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