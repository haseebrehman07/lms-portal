import React, { useState, useEffect, useRef } from 'react';
import { Search, Info, MoreVertical, Paperclip, Smile, Send, X, Reply, Download, Users, Image as ImageIcon, LogOut, Edit2, UserPlus, Trash2 } from 'lucide-react';
import Pusher from 'pusher-js';
import chatService from '../../api/chatService';

const ChatArea = ({ groupId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: Group Info States
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [members, setMembers] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("Group Conversation"); // Default placeholder
  const [inviteInput, setInviteInput] = useState('');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChatData = async () => {
      setIsLoading(true);
      try {
        const msgRes = await chatService.getMessages(groupId);
        setMessages(msgRes.data);
        
        // Fetch members if backend endpoint exists
        try {
          const memberRes = await chatService.getGroupMembers(groupId);
          setMembers(memberRes.data);
        } catch (e) {
          console.log("Member endpoint not ready yet");
        }
      } catch (error) {
        console.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (groupId) fetchChatData();

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    });
    
    const channel = pusher.subscribe(`group-${groupId}`);
    channel.bind('new-message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const payload = { 
      content: inputMessage,
      parent_id: replyingTo ? replyingTo.id : null 
    };

    try {
      await chatService.sendMessage(groupId, payload);
      setInputMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to send message");
    }
  };

  // NEW: Feature Actions
  const handleExportChat = () => {
    const textData = messages.map(m => 
      `[${new Date(m.created_at).toLocaleString()}] ${m.sender_name || 'User'}: ${m.content}`
    ).join('\n');
    
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chat_Export_${new Date().toLocaleDateString()}.txt`;
    a.click();
  };

  const handleAddMember = async () => {
    if(!inviteInput.trim()) return;
    const identifiers = inviteInput.split(',').map(i => i.trim()).filter(i => i);
    const emails = identifiers.filter(i => i.includes('@'));
    const studentIds = identifiers.filter(i => !i.includes('@'));
    
    try {
      await chatService.inviteMembers(groupId, emails, studentIds);
      alert("Invites sent successfully!");
      setInviteInput('');
    } catch (error) {
      alert("Failed to send invites.");
    }
  };

  return (
    <div className="flex h-full relative">
      <div className={`flex flex-col h-full bg-white relative transition-all duration-300 ${showGroupInfo ? 'w-[calc(100%-320px)]' : 'w-full'}`}>
        
        {/* Clickable Header */}
        <div 
          className="h-16 border-b border-gray-100 px-6 flex justify-between items-center bg-white shrink-0 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowGroupInfo(!showGroupInfo)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              CH
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{newGroupName}</h2>
              <p className="text-xs text-gray-500 font-medium">Click here for group info</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <Search className="w-5 h-5 hover:text-blue-600 cursor-pointer" />
            <MoreVertical className="w-5 h-5 hover:text-blue-600 cursor-pointer" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Loading messages...</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div key={msg.id} className={`flex gap-3 max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-1">
                      {msg.sender_name?.substring(0, 2).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      {!isMe && <span className="text-xs font-bold text-gray-900">{msg.sender_name}</span>}
                      <span className="text-[10px] font-medium text-gray-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="group relative flex items-center gap-2">
                      <button onClick={() => setReplyingTo(msg)} className={`p-1.5 bg-white border border-gray-100 rounded-full text-gray-400 hover:text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'order-first mr-2' : 'order-last ml-2'}`}>
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm shadow-md' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                        {msg.parent && (
                           <div className={`text-xs mb-1.5 p-2 rounded bg-black/10 border-l-2 ${isMe ? 'border-blue-300 text-blue-100' : 'border-purple-400 text-gray-500'}`}>
                             <span className="font-bold">{msg.parent.sender_name}</span>
                             <p className="truncate mt-0.5">{msg.parent.content}</p>
                           </div>
                        )}
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="bg-white border-t border-gray-100 p-4">
          {replyingTo && (
            <div className="flex items-center justify-between bg-blue-50 border-l-4 border-blue-600 px-4 py-2 mb-3 rounded-r-lg">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-blue-800">Replying to {replyingTo.sender_name}</span>
                <span className="text-xs text-gray-600 truncate">{replyingTo.content}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-700 p-1"><X className="w-4 h-4" /></button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <button type="button" className="p-2 text-gray-400 hover:text-gray-600"><Paperclip className="w-5 h-5" /></button>
            <div className="flex-1 relative">
              <input type="text" placeholder="Type a message..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-full pl-4 pr-10 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Smile className="w-5 h-5" /></button>
            </div>
            <button type="submit" disabled={!inputMessage.trim()} className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"><Send className="w-5 h-5" /></button>
          </form>
        </div>
      </div>

      {/* WhatsApp-Style Group Info Side Panel */}
      {showGroupInfo && (
        <div className="w-[320px] border-l border-gray-100 bg-gray-50/50 flex flex-col h-full overflow-y-auto custom-scrollbar absolute right-0 top-0 bottom-0 shadow-lg">
          <div className="h-16 bg-white border-b border-gray-100 px-4 flex items-center gap-4 sticky top-0 z-10 shrink-0">
            <button onClick={() => setShowGroupInfo(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-gray-900">Group Info</h3>
          </div>

          <div className="p-6 bg-white border-b border-gray-100 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-3xl shadow-md mb-4">
              CH
            </div>
            
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full">
                <input 
                  type="text" 
                  value={newGroupName} 
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 border-b border-blue-500 outline-none text-center font-bold text-lg"
                />
                <button onClick={() => setIsEditingName(false)} className="text-blue-600"><Check className="w-5 h-5"/></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{newGroupName}</h2>
                <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">Group • {members.length || 0} members</p>
          </div>

          {/* Media Links and Docs UI Mimic */}
          <div className="mt-2 bg-white border-y border-gray-100 p-4">
             <div className="flex justify-between items-center mb-3 cursor-pointer group">
               <span className="text-sm font-semibold text-gray-500">Media, links, and docs</span>
               <div className="flex items-center text-gray-400 group-hover:text-gray-600">
                 <span className="text-sm mr-1">25</span>
                 <MoreVertical className="w-4 h-4" />
               </div>
             </div>
             <div className="flex gap-2 overflow-x-hidden">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400"><ImageIcon className="w-6 h-6"/></div>
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400"><ImageIcon className="w-6 h-6"/></div>
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400"><ImageIcon className="w-6 h-6"/></div>
             </div>
          </div>

          <div className="mt-2 bg-white border-y border-gray-100 py-2">
            <button onClick={handleExportChat} className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 text-gray-800 transition-colors">
              <Download className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Export Chat</span>
            </button>
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-red-50 text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Exit Group</span>
            </button>
            <button className="w-full px-4 py-3 flex items-center gap-4 hover:bg-red-50 text-red-600 transition-colors">
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Delete Group</span>
            </button>
          </div>

          <div className="mt-2 bg-white border-y border-gray-100 p-4 mb-6">
            <span className="text-sm font-semibold text-gray-500 mb-4 block">{members.length || 0} members</span>
            
            {/* Add Member Form Inside Group Info */}
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Add by email or ID..."
                value={inviteInput}
                onChange={(e)=>setInviteInput(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button onClick={handleAddMember} className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100">
                <UserPlus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {members.map(member => (
                <div key={member.user_id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">
                    {member.user_name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 truncate">{member.user_name}</h4>
                    <p className="text-xs text-gray-500 truncate">{member.role || 'Member'}</p>
                  </div>
                </div>
              ))}
              {members.length === 0 && <p className="text-xs text-gray-400 italic">Member fetching pending backend connection...</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;