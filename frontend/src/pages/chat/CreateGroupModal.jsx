import React, { useState } from 'react';
import { X, Users } from 'lucide-react';
import chatService from '../../api/chatService';

const CreateGroupModal = ({ onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create Group
      const groupRes = await chatService.createGroup({ name: groupName });
      
      // 2. Parse identifiers into emails and UUIDs
      const identifiers = inviteInput.split(',').map(i => i.trim()).filter(i => i);
      const emails = identifiers.filter(i => i.includes('@'));
      const studentIds = identifiers.filter(i => !i.includes('@'));
      
      // 3. Dispatch Invites
      if (identifiers.length > 0) {
        await chatService.inviteMembers(groupRes.data.id, emails, studentIds);
      }
      onClose();
    } catch (error) {
      console.error("Failed to create group or dispatch invites", error);
      alert("Error creating group. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> New Chat Group
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Group Name</label>
            <input type="text" required placeholder="e.g., Database Systems - Cohort A" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Invite Members</label>
            <textarea rows="3" placeholder="Enter student IDs or emails, separated by commas..." value={inviteInput} onChange={(e) => setInviteInput(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" />
            <p className="text-xs text-gray-500 mt-1">Invites will appear in the students' pending tab.</p>
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || !groupName} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Creating...' : 'Create & Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateGroupModal;