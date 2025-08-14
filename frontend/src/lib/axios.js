import axios from "axios";


export const axiosInstance = axios.create({
  baseURL:"https://full-stack-chat-app-11.onrender.com/api",
  withCredentials:true,
})