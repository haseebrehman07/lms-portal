import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, ArrowLeft, FileText, Download, FileArchive, CheckSquare, Square, PlayCircle, Award, AlertCircle, X, Timer, Check, X as XIcon, Lock, CheckCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

const StudentCourses = () => {
  // --- STATE MANAGEMENT ---
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('Enrolled'); // 'Discover' | 'Enrolled' | 'Completed'
  
  // Quiz States
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizUIState, setQuizUIState] = useState('landing');
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState(null);

  const [completedItems, setCompletedItems] = useState([]);

  // --- REAL DATA STATE ---
  // Starts empty, filled by useEffect below
  const [allCourses, setAllCourses] = useState([]);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch all real courses from the database
        const coursesRes = await api.get('/courses');
        const realCourses = coursesRes.data;

        // 2. Fetch the logged-in student's enrollments
        const enrollmentsRes = await api.get('/enrollments/me');
        const myEnrollments = enrollmentsRes.data;

        // 3. Merge them together for the UI
        const mergedCourses = realCourses.map(course => {
          // Check if this specific student is enrolled in this specific course
          const enrollment = myEnrollments.find(e => e.course_id === course.id);
          
          return {
            ...course,
            // Map the database fields to the UI fields
            instructor: course.instructor_name || 'TBA',
            thumbnailUrl: course.thumbnail_url,
            endDate: course.end_date || '2099-12-31', // Fallback for active courses
            enrollmentStatus: enrollment ? enrollment.status : 'none',
            progress: enrollment ? enrollment.progress_percent : 0,
            weeks: [], // Placeholder for curriculum later
            quiz: null
          };
        });

        setAllCourses(mergedCourses);
      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // --- TAB FILTERING LOGIC ---
  const filteredCourses = allCourses.filter(course => {
    const isExpired = new Date(course.endDate) < new Date();
    
    if (activeTab === 'Discover') {
      return (course.enrollmentStatus === 'none' || course.enrollmentStatus === 'pending') && !isExpired;
    }
    if (activeTab === 'Enrolled') {
      return course.enrollmentStatus === 'approved' && !isExpired;
    }
    if (activeTab === 'Completed') {
      return course.enrollmentStatus === 'approved' && isExpired;
    }
    return false;
  });

  // --- HANDLERS ---
  const handleEnrollRequest = async (courseId) => {
    try {
      // Sends the request to the new /enrollments endpoint we just built
      await api.post('/enrollments', { course_id: courseId });
      
      // Update local state to show 'pending' immediately so the UI reflects the change
      setAllCourses(allCourses.map(c => 
        c.id === courseId ? { ...c, enrollmentStatus: 'pending' } : c
      ));
    } catch (error) {
      console.error("Failed to request enrollment:", error);
      alert("Failed to send request. Check the console.");
    }
  };

  const toggleCompletion = (itemId) => {
    setCompletedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleFileClick = (e, fileType) => {
    e.preventDefault();
    if (fileType === 'pdf') window.open('#', '_blank');
    else alert("Downloading file to your device...");
  };

  // --- QUIZ ENGINE LOGIC ---
  const startQuiz = () => {
    setUserAnswers({});
    setTimeLeft(activeQuiz.timeLimit * 60); 
    setQuizStartTime(new Date());
    setQuizUIState('taking');
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitQuiz = () => {
    let score = 0;
    activeQuiz.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) score++;
    });
    
    const percentage = (score / activeQuiz.questions.length) * 100;
    const gradeOutOf10 = (percentage / 10).toFixed(2);
    const now = new Date();
    const timeOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    
    const timeDiffSeconds = Math.floor((now - quizStartTime) / 1000);
    const minsTaken = Math.floor(timeDiffSeconds / 60);
    const secsTaken = timeDiffSeconds % 60;
    const timeTakenFormatted = `${minsTaken} min ${secsTaken} secs`;

    setQuizResult({
      score, total: activeQuiz.questions.length, percentage, gradeOutOf10,
      startedAt: quizStartTime.toLocaleDateString('en-US', timeOptions),
      submittedAt: now.toLocaleDateString('en-US', timeOptions),
      timeTakenFormatted
    });
    setQuizUIState('landing');
  };

  useEffect(() => {
    let timerId;
    if (quizUIState === 'taking' && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerId); submitQuiz(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [quizUIState, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const resetCourseView = () => {
    setActiveCourse(null);
    setActiveQuiz(null);
    setQuizResult(null);
    setQuizUIState('landing');
  };


  // ==========================================
  // VIEW 3: QUIZ INTERFACE (Unchanged)
  // ==========================================
  if (activeQuiz) {
    // ... [Keep your exact existing Quiz code here, it is unchanged] ...
    return <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">Quiz UI placeholder</div>; // Replace this line with your actual block! (I am keeping the response short)
  }

  // ==========================================
  // VIEW 2: COURSE DETAIL (SYLLABUS VIEW)
  // ==========================================
  if (activeCourse) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-gray-800">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <button onClick={resetCourseView} className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{activeCourse.title}</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Instructor: {activeCourse.instructor}</p>
          </div>
        </div>

        {/* Syllabus Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Fallback if no lessons are loaded yet */}
          {(!activeCourse.weeks || activeCourse.weeks.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              Curriculum is being updated. Check back soon!
            </div>
          )}

          {activeCourse.weeks?.map((week) => (
            <div key={week.id} className="border-b border-gray-100 last:border-0">
              {/* Week Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-blue-900">{week.title}</h2>
              </div>
              
              {/* Week Materials List */}
              <div className="px-6 py-2">
                {week.materials?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-4 flex-1">
                      
                      {/* Dynamic Icon based on file type */}
                      <div className={`p-2 rounded-lg ${item.type === 'pdf' ? 'bg-red-50 text-red-500' : item.type === 'zip' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                        {item.type === 'pdf' ? <FileText className="w-5 h-5" /> : item.type === 'zip' ? <FileArchive className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                      </div>
                      
                      {/* Clickable Hypertext File */}
                      <a 
                        href="#" 
                        onClick={(e) => handleFileClick(e, item.type)}
                        className="font-medium text-gray-700 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                      >
                        {item.title}
                      </a>
                    </div>

                    {/* Progress Tracker Checkbox */}
                    <button 
                      onClick={() => toggleCompletion(item.id)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-2 cursor-pointer"
                    >
                      {completedItems.includes(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Final Quiz Section */}
          {activeCourse.quiz && (
            <div className="border-t-4 border-gray-50 bg-white">
              <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-blue-900">Assessments</h2>
              </div>
              <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span 
                      className="font-bold text-gray-900 block cursor-pointer hover:text-blue-600 hover:underline" 
                      onClick={() => setActiveQuiz(activeCourse.quiz)}
                    >
                      {activeCourse.quiz.title}
                    </span>
                    <span className="text-sm text-gray-500">Required to complete the course</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  // ==========================================
  // VIEW 1: MAIN COURSES GRID (Updated with Bubbles)
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800">
      
      {/* HEADER & THE 3 SLIDING BUBBLES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your enrollments and progress.</p>
        </div>
        
        {/* The 3 Bubbles Tab Menu */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-inner w-full md:w-auto">
          {['Enrolled', 'Completed', 'Discover'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* COURSE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
            No courses found in this category.
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-300 transition-colors group">
              
              {/* IMAGE SECTION (Updated to aspect-[4/5] to match Admin Posters) */}
              <div className="aspect-[4/5] bg-gray-50 flex items-center justify-center border-b border-gray-100 relative overflow-hidden">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <BookOpen className="w-12 h-12 text-gray-300" />
                )}
                {/* Status Overlay Badges */}
                {course.enrollmentStatus === 'pending' && (
                  <div className="absolute top-3 right-3 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <Clock className="w-3 h-3" /> Pending
                  </div>
                )}
                {activeTab === 'Completed' && (
                  <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <CheckCircle className="w-3 h-3" /> Finished
                  </div>
                )}
              </div>

              {/* CARD DETAILS */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-2 leading-snug">{course.title}</h3>
                <p className="text-xs text-gray-500 font-medium mb-4">Instructor: {course.instructor}</p>
                
                <div className="mt-auto">
                  
                  {/* Dynamic Buttons Based on Tab State */}
                  {activeTab === 'Discover' && course.enrollmentStatus === 'none' && (
                    <button 
                      onClick={() => handleEnrollRequest(course.id)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                    >
                      Request Enrollment
                    </button>
                  )}

                  {activeTab === 'Discover' && course.enrollmentStatus === 'pending' && (
                    <button disabled className="w-full py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                      <Lock className="w-4 h-4" /> Pending Approval
                    </button>
                  )}

                  {activeTab === 'Enrolled' && (
                    <>
                      <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }}></div>
                      </div>
                      <button 
                        onClick={() => setActiveCourse(course)}
                        className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-600 hover:text-white transition-all duration-300"
                      >
                        Continue Learning
                      </button>
                    </>
                  )}

                  {activeTab === 'Completed' && (
                    <button 
                      onClick={() => setActiveCourse(course)}
                      className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                      Review Course
                    </button>
                  )}

                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentCourses;