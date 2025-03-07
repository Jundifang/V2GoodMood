import {createStore} from 'vuex'

export default createStore({
    state: {
        imageData: null
    },
    mutations: {
        setImageData(state, data) {
            state.imageData = data
        },
        CLEAR_IMAGE_DATA(state) {
            state.imageData = null; // 重置 imageData 为 null
        }
    }
}) 