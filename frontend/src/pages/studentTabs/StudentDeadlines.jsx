import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const StudentDeadlines = () => {
  const navigate = useNavigate();

  // Mock data - swap this with your API call later
  const deadlines = [
    {
      id: 1,
      course: 'Software Engineering',
      instructor: 'Dr. Smith',
      deadline: 'July 5, 2026, 11:59 PM',
      type: 'Assignment',
      title: 'Assignment 2',
      description: 'Prepare revision notes and complete the practice quiz.',
      status: 'Pending'
    },
    {
      id: 2,
      course: 'Database Systems',
      instructor: 'Prof. Doe',
      deadline: 'July 8, 2026, 05:00 PM',
      type: 'Lab',
      title: 'Lab Report 4',
      description: 'Watch the remaining module and submit the checklist.',
      status: 'Pending'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 text-gray-800">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Upcoming Deadlines</h1>
      </div>

      <div className="flex flex-col gap-4">
        {deadlines.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.type}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-2">{item.title}</h2>
              </div>
              <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">{item.deadline}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">Course</p>
                <p className="font-semibold">{item.course}</p>
              </div>
              <div>
                <p className="text-gray-500">Instructor</p>
                <p className="font-semibold">{item.instructor}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">{item.description}</p>

            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-500">Status: <span className="font-medium text-gray-900">{item.status}</span></span>
              <button 
                onClick={() => navigate(`/student/courses`)} // Or specific activity link
                className="text-blue-600 font-semibold hover:underline"
              >
                Go to Activity →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDeadlines;