const mongoose2 = require('mongoose');


const messageSchema = new mongoose2.Schema({
senderId: { type: mongoose2.Schema.Types.ObjectId, ref: 'User', required: true },
receiverId: { type: mongoose2.Schema.Types.ObjectId, ref: 'User'},
text: { type: String, required: true },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose2.model('Message', messageSchema);