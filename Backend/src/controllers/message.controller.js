import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export  const getUsersForSidebar = async (req, res) => {
     try {
        const loggedInUserId = req.user._id
        const fiteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password -__v")
        res.status(200).json(fiteredUsers)
     } catch (error) {
        console.log("Error in getUsersForSidebar controller", error.message);
        res.status(500).json({message:"Internal server error"});
     }
}

export const getMessages = async (req, res) => {
    try {
        const { id : userToChatId} = req.params
        const senderId = req.user._id

        const messages = await Message.find({
            $or:[
                {senderId:senderId, receiverId:userToChatId},
                {senderId:userToChatId, receiverId:senderId}
            ]
        })
        res.status(200).json(messages)
    } catch (error) {
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({message:"Internal server error"});
        
    }
}

export const sendMessage = async (req,res) => {
    try {
        const {text,image } = req.body
        const { id: userToChatId } = req.params
        const senderId = req.user._id

        let imageUrl ;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        const newMessage = new Message({
            senderId,
            receiverId: userToChatId,
            text,
            image: imageUrl
        })

        await newMessage.save()

        //todo: real time functionality with the help of socket.io

        res.status(200).json(newMessage)
    } catch (error) {
        console.log("Error in sendMessage controller", error.message)
        res.status(500).json({message:"Internal server error"});
        
    }
}