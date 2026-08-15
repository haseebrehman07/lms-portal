import React, { useState } from 'react';
import { Search, Plus, Check, X } from 'lucide-react';

const ChatSidebar = ({ isAdmin, groups, invites, activeTab, setActiveTab, selectedGroupId, setSelectedGroupId, onOpenCreate, onAcceptInvite, onDeclineInvite, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Group Chats</h2>
          {isAdmin && (
            <button onClick={onOpenCreate} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('chats')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'chats' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Active Chats
          </button>
          <button onClick={() => setActiveTab('invites')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'invites' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Invites {invites.length > 0 && <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{invites.length}</span>}
          </button>
        </div>
        <div className="relative">
          <input type="text" placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-100" />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
        ) : activeTab === 'chats' ? (
          <div className="divide-y divide-gray-50">
            {groups.length === 0 && <div className="p-4 text-center text-sm text-gray-400">No active chats.</div>}
            {groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map(group => (
              <div key={group.id} onClick={() => setSelectedGroupId(group.id)} className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedGroupId === group.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}>
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">{group.name.substring(0, 2).toUpperCase()}</div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-bold text-gray-900 truncate text-sm">{group.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{group.member_count} members</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invites.length === 0 && <div className="p-4 text-center text-sm text-gray-400">No pending invites.</div>}
            {invites.map(invite => (
              <div key={invite.group_id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold shrink-0">{invite.group_name.substring(0, 2).toUpperCase()}</div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{invite.group_name}</h4>
                    <p className="text-xs text-gray-500">Invited by Admin</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onAcceptInvite(invite.group_id)} className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Accept</button>
                  <button onClick={() => onDeclineInvite(invite.group_id)} className="flex-1 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-bold flex items-center justify-center gap-1"><X className="w-3 h-3" /> Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ChatSidebar;