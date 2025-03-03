import {reactive, ref} from "vue";
import {io} from "socket.io-client";
import {ElMessage} from "element-plus";

// export const state = reactive({
//     connected: false,
//     fooEvents: [],
//     barEvents: [],
//
//     userName: '',
//     user_probability: null,
//     userAge: null,
//     userGender: '',
//     maskStatus: null,
//
//     emotionResult: null,
//     emotionPic: '',
//     analysis_context: ""
// });

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === "production" ? undefined : "http://localhost:5000";
const socket = io(URL);

socket.on("connect", () => {
    // state.connected = true;
    console.log('Connected to server');

});

socket.on("disconnect", () => {
    // state.connected = false;
    console.log('Disconnected to server');
});
export default socket;
