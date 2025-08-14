import { create } from "zustand"; 
import toast from "react-hot-toast"; 
import { axiosInstance } from '../lib/axios'; 
import { useAuthStore } from "./useAuthStore";  

export const useChatStore = create((set, get) => ({   
  messages: [],   
  selectedUser: null,   
  isUsersLoading: false,   
  isMessagesLoading: false,
  typingStatus: {},
  
  getUsers: async () => {     
    set({ isUsersLoading: true });     
    try {       
      const res = await axiosInstance.get("/messages/users");       
      set({ users: res.data });     
    } catch (error) {       
      toast.error(error.response?.data?.message || "Failed to load users");     
    } finally {       
      set({ isUsersLoading: false });     
    }   
  },   
  
  getMessages: async (userId) => {      
    set({ isMessagesLoading: true });     
    try {       
      const res = await axiosInstance.get(`/messages/${userId}`);       
      set({ messages: res.data });     
    } catch (error) {       
      toast.error(error.response?.data?.message || "Failed to load messages");     
    } finally {       
      set({ isMessagesLoading: false });     
    }   
  },   
  
  sendMessages: async (messageData) => {     
    const { selectedUser } = get();     
    try {       
      // Optimistic update - add a temporary message to the UI first
      const tempMessage = {
        _id: Date.now().toString(), // Temporary ID
        senderId: useAuthStore.getState().authUser._id,
        receiverId: selectedUser._id,
        text: messageData.text || "",
        image: messageData.image || null,
        createdAt: new Date().toISOString(),
        pending: true // Mark as pending
      };
      
      set((state) => ({ 
        messages: [...state.messages, tempMessage] 
      }));
      
      // Actually send to server
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      
      // Replace temp message with real one from server
      set((state) => ({ 
        messages: state.messages.map(msg => 
          msg._id === tempMessage._id ? res.data : msg
        )
      }));
    } catch (error) {       
      // Show error and remove the pending message
      toast.error(error.response?.data?.message || "Failed to send message");
      set((state) => ({
        messages: state.messages.filter(msg => !msg.pending)
      }));
    }   
  },   
  
  setTypingStatus: (userId, isTyping) => {
    set((state) => ({
      typingStatus: {
        ...state.typingStatus,
        [userId]: isTyping
      }
    }));
  },
  
  subscribeToMessages: () => {     
    const { selectedUser } = get();     
    const socket = useAuthStore.getState().socket;     
    
    if (!selectedUser || !socket) return;     
    
    // Listen for new messages
    socket.on("newMessage", (newMessage) => {       
      const { messages } = get();       
      if (newMessage.senderId !== selectedUser._id && newMessage.receiverId !== selectedUser._id) return;       
      
      const messageExists = messages.some((msg) => msg._id === newMessage._id);       
      
      if (!messageExists) {         
        set({ messages: [...messages, newMessage] });       
      }     
    });
    
    // Listen for typing indicators
    socket.on("userTyping", ({ userId }) => {
      if (userId === selectedUser._id) {
        get().setTypingStatus(userId, true);
      }
    });
    
    socket.on("userStoppedTyping", ({ userId }) => {
      if (userId === selectedUser._id) {
        get().setTypingStatus(userId, false);
      }
    });
  },   
  
  unsubscribeFromMessages: () => {     
    const socket = useAuthStore.getState().socket;     
    if (!socket) return;
    
    socket.off("newMessage");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
  },   
  
  setSelectedUser: (selectedUser) => set({ selectedUser }), 
}));