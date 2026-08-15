import React, { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import CreateGroupModal from './CreateGroupModal';
import chatService from '../../api/chatService';

const ChatLayout = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [invites, setInvites] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = JSON.parse(sessionStorage.getItem('user')) || {};
  const isAdmin = user.role === 'admin' || user.role === 'manager';

  const fetchChatData = async () => {
    setIsLoading(true);
    try {
      const [groupsRes, invitesRes] = await Promise.all([
        chatService.getGroups(),
        chatService.getInvites()
      ]);
      setGroups(groupsRes.data);
      setInvites(invitesRes.data);
    } catch (error) {
      console.error("Failed to load chat data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatData();
  }, []);

  const handleAcceptInvite = async (groupId) => {
    try {
      await chatService.acceptInvite(groupId);
      setActiveTab('chats');
      fetchChatData();
    } catch (error) {
      alert("Failed to accept invite");
    }
  };

  const handleDeclineInvite = async (groupId) => {
    try {
      await chatService.declineInvite(groupId);
      fetchChatData();
    } catch (error) {
      alert("Failed to decline invite");
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white overflow-hidden border border-gray-200 rounded-xl m-6 shadow-sm">
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white shrink-0">
        <ChatSidebar 
          isAdmin={isAdmin}
          groups={groups}
          invites={invites}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
          onOpenCreate={() => setIsCreateModalOpen(true)}
          onAcceptInvite={handleAcceptInvite}
          onDeclineInvite={handleDeclineInvite}
          isLoading={isLoading}
        />
      </div>
      <div className="flex-1 flex flex-col bg-white">
        {selectedGroupId ? (
          <ChatArea groupId={selectedGroupId} currentUserId={user.id} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">
            Select a chat to start messaging
          </div>
        )}
      </div>
      {isCreateModalOpen && (
        <CreateGroupModal onClose={() => { setIsCreateModalOpen(false); fetchChatData(); }} />
      )}
    </div>
  );
};
export default ChatLayout;