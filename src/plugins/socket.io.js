import io from "socket.io-client";
export const id = Date.now();
//export const socket = io("http://176.9.105.5:2000/", {
export const socket = io("localhost:2000/", {
  query: { id: id },
});