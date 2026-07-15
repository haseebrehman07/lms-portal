import React from 'react';
import { Flame, LibraryBig, Timer, Award } from 'lucide-react';

const StudentLearning = () => {
  // Mock Data for the dashboard
  const stats = [
    { label: 'Learning Streak', value: '12 Days', subtext: 'Best this month', icon: Flame, color: 'bg-orange-100 text-orange-600' },
    { label: 'Active Courses', value: '12', subtext: '5 completed', icon: LibraryBig, color: 'bg-blue-100 text-blue-600' },
    { label: 'Learning Hours', value: '48h 30m', subtext: 'This month', icon: Timer, color: 'bg-purple-100 text-purple-600' },
    { label: 'Certificates', value: '8', subtext: 'Earned so far', icon: Award, color: 'bg-yellow-100 text-yellow-600' }
  ];

  const goals = [
    { label: 'Study 10 hours this week', current: 7, target: 10, unit: 'hrs', percent: 70 },
    { label: 'Complete 2 lessons today', current: 1, target: 2, unit: 'lessons', percent: 50 },
    { label: 'Finish Python course', current: 70, target: 100, unit: '%', percent: 70 }
  ];

  const deadlines = [
    { title: 'Excel Assessment Quiz', due: 'Due Tomorrow', desc: 'Prepare revision notes and complete the practice quiz.', color: 'text-red-600 bg-red-50 border-red-100' },
    { title: 'Workplace Safety Training', due: 'Due in 5 days', desc: 'Watch the remaining module and submit the checklist.', color: 'text-orange-600 bg-orange-50 border-orange-100' },
    { title: 'Leadership Assignment', due: 'Due in 7 days', desc: 'Complete the reflection exercise and upload your report.', color: 'text-blue-600 bg-blue-50 border-blue-100' }
  ];

  const learningPath = [
    { title: 'HTML Basics', status: 'Completed', color: 'bg-green-500' },
    { title: 'CSS Fundamentals', status: 'Completed', color: 'bg-green-500' },
    { title: 'JavaScript Essentials', status: 'In Progress', color: 'bg-blue-500' },
    { title: 'React Basics', status: 'Not Started', color: 'bg-gray-200' }
  ];

  const recommendations = [
    { title: 'Data Analysis with Pandas', level: 'Intermediate', rating: '4.8' },
    { title: 'UI/UX Design Fundamentals', level: 'Beginner', rating: '4.7' },
    { title: 'Project Management', level: 'Beginner', rating: '4.6' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 text-gray-800">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, Haseeb! 👋</h1>
          <p className="text-gray-500 mt-1">Keep learning, keep growing. Here is your progress so far.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (Wider) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Continue Learning */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">Continue Learning</h2>
              <button className="text-sm text-blue-600 font-medium hover:underline">View all courses</button>
            </div>
            <div className="p-6 flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-full sm:w-1/3 aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-inner">
                <span className="text-4xl">🐍</span>
              </div>
              <div className="w-full sm:w-2/3 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Python for Beginners</h3>
                    <p className="text-sm text-gray-500">Lesson 5 of 10 • Data Types</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">70%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto mt-2">
                  Resume Learning
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart (CSS Based) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-6">Weekly Learning Activity</h2>
            <div className="h-48 flex items-end justify-between gap-2 px-2">
              {[30, 60, 45, 80, 50, 90, 20].map((height, i) => (
                <div key={i} className="w-full flex flex-col items-center group cursor-pointer">
                  <div className="relative w-full flex justify-center h-40 items-end">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded transition-opacity whitespace-nowrap">
                      {Math.round((height/100)*8)} hours
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-full max-w-[40px] bg-blue-100 group-hover:bg-blue-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${height}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 font-medium">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Path */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Frontend Learning Path</h2>
              <span className="text-sm font-medium text-gray-500">42% completed</span>
            </div>
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
              {learningPath.map((step, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${step.color}`}></div>
                  <h3 className={`text-sm font-bold ${step.status === 'Not Started' ? 'text-gray-400' : 'text-gray-900'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500">{step.status}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN (Narrower) */}
        <div className="space-y-6">
          
          {/* Learning Goals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Learning Goals</h2>
              <button className="text-sm text-gray-500 hover:text-blue-600">Edit</button>
            </div>
            <div className="space-y-4">
              {goals.map((goal, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{goal.label}</span>
                    <span className="text-gray-500">{goal.current}/{goal.target} {goal.unit}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${goal.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Upcoming Deadlines</h2>
              <button className="text-sm text-blue-600 hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {deadlines.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${item.color} bg-opacity-50`}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold">{item.title}</h3>
                  </div>
                  <p className="text-xs font-semibold mb-1 opacity-80">{item.due}</p>
                  <p className="text-xs opacity-90">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Achievements</h2>
              <button className="text-sm text-blue-600 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl mb-2">📜</div>
                <span className="text-xs font-medium text-gray-700 text-balance">Python Cert</span>
              </div>
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl mb-2">🔥</div>
                <span className="text-xs font-medium text-gray-700 text-balance">7 Day Streak</span>
              </div>
              <div className="flex flex-col items-center text-center p-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-2">⭐</div>
                <span className="text-xs font-medium text-gray-700 text-balance">Top 10%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Recommended for You */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Recommended for You</h2>
          <button className="text-sm text-blue-600 hover:underline">Browse catalog</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((course, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer group">
              <div className="w-full h-24 bg-gray-100 rounded-md mb-3 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 transition-colors">
                Cover Image
              </div>
              <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
              <div className="flex justify-between text-xs text-gray-500 mb-3">
                <span>{course.level}</span>
                <span className="flex items-center gap-1">⭐ {course.rating}</span>
              </div>
              <button className="w-full py-2 bg-gray-50 text-blue-600 font-medium rounded text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Start
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default StudentLearning;