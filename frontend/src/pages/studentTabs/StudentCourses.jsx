import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Clock, ArrowLeft, FileText, Download, FileArchive, CheckSquare, Square, PlayCircle, Award, CheckCircle, Lock, Video, Loader2 } from 'lucide-react';
import api from '../../api/axiosConfig';

const StudentCourses = () => {
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('Enrolled'); 
  const [isPageLoading, setIsPageLoading] = useState(true); 
  const [processingCourseId, setProcessingCourseId] = useState(null); 
  const [loadingDetailsId, setLoadingDetailsId] = useState(null); 
  
  // NEW: Track which specific lesson checkbox is currently loading
  const [togglingLessonId, setTogglingLessonId] = useState(null);

  // Quiz States
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizUIState, setQuizUIState] = useState('landing');
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState(null);

  const [completedItems, setCompletedItems] = useState([]);
  const [allCourses, setAllCourses] = useState([]);

  // Extracted into a reusable function so we can call it when hitting the "Back" button
  const fetchDashboardData = useCallback(async () => {
    setIsPageLoading(true);
    try {
      const coursesRes = await api.get('/courses');
      const realCourses = coursesRes.data;

      let myEnrollments = [];
      let myRequests = [];

      try {
        const enrollmentsRes = await api.get('/enrollments/me');
        myEnrollments = enrollmentsRes.data;

        const requestsRes = await api.get('/enrollment-requests/me');
        myRequests = requestsRes.data;
      } catch (enrollErr) {
        console.warn("Could not fetch personal data. Defaulting to none.", enrollErr);
      }

      const mergedCourses = realCourses.map(course => {
        const enrollment = myEnrollments.find(e => e.course_id === course.id);
        const pendingRequest = myRequests.find(r => r.course_id === course.id && r.status === 'pending');

        let status = 'none';
        if (enrollment) {
          status = 'enrolled';
        } else if (pendingRequest) {
          status = 'pending';
        }

        return {
          ...course,
          instructor: course.instructor_name || 'TBA',
          thumbnailUrl: course.thumbnail_url,
          endDate: course.end_date || '2099-12-31', 
          enrollmentStatus: status,
          progress: enrollment ? Math.round(enrollment.progress_percent || 0) : 0,
          weeks: [], 
          quiz: null
        };
      });

      setAllCourses(mergedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredCourses = allCourses.filter(course => {
    const isExpired = new Date(course.endDate) < new Date();
    
    if (activeTab === 'Discover') {
      return (course.enrollmentStatus === 'none' || course.enrollmentStatus === 'pending') && !isExpired;
    }
    if (activeTab === 'Enrolled') {
      return course.enrollmentStatus === 'enrolled' && !isExpired;
    }
    if (activeTab === 'Completed') {
      return course.enrollmentStatus === 'enrolled' && isExpired;
    }
    return false;
  });

  const handleEnrollRequest = async (courseId) => {
    setProcessingCourseId(courseId); 
    try {
      await api.post('/enrollment-requests', { course_id: courseId });
      
      setAllCourses(allCourses.map(c => 
        c.id === courseId ? { ...c, enrollmentStatus: 'pending' } : c
      ));
    } catch (error) {
      console.error("Failed to request enrollment:", error);
      alert(error.response?.data?.detail || "Failed to send request.");
    } finally {
      setProcessingCourseId(null); 
    }
  };

  const loadCourseDetails = async (course) => {
    setLoadingDetailsId(course.id);
    try {
      const res = await api.get(`/courses/${course.id}/detail`);
      const detailData = res.data;

      const materials = [];
      let foundQuiz = null;

      // Automatically check off lessons the backend says are already completed
      const alreadyCompleted = detailData.lessons
        .filter(lesson => lesson.is_completed)
        .map(lesson => lesson.id);
      setCompletedItems(alreadyCompleted);

      detailData.lessons.forEach(lesson => {
        if (lesson.lesson_type === 'quiz') {
          foundQuiz = {
            id: lesson.id,
            title: lesson.title,
            isLocked: lesson.is_locked,
            questions: [] 
          };
        } else {
          materials.push({
            id: lesson.id,
            title: lesson.title,
            type: lesson.lesson_type === 'pdf' ? 'pdf' : 'video',
            url: lesson.pdf_url || lesson.video_url || null,
            isLocked: lesson.is_locked
          });
        }
      });

      const formattedCourse = {
        ...course,
        weeks: [
          {
            id: 'module-1',
            title: 'Course Materials',
            materials: materials
          }
        ],
        quiz: foundQuiz
      };

      setActiveCourse(formattedCourse);
    } catch (error) {
      console.error("Failed to load course details", error);
      alert("Could not load curriculum. Please try again.");
    } finally {
      setLoadingDetailsId(null); 
    }
  };

  // API Call to Mark Lesson Complete
  const toggleCompletion = async (item) => {
    if (item.isLocked) {
      alert("This content is locked until your enrollment is approved.");
      return;
    }
    
    // Prevent un-checking or double-clicking while loading
    if (completedItems.includes(item.id) || togglingLessonId === item.id) {
      return; 
    }

    setTogglingLessonId(item.id);
    try {
      // Hits the backend route to recalculate percentage
      await api.post(`/lessons/${item.id}/complete`);
      // Update local UI immediately so it checks off
      setCompletedItems(prev => [...prev, item.id]);
    } catch (error) {
      console.error("Failed to complete lesson:", error);
      alert(error.response?.data?.detail || "Failed to mark lesson complete.");
    } finally {
      setTogglingLessonId(null);
    }
  };

  const handleFileClick = (e, item) => {
    e.preventDefault();
    if (item.isLocked) {
      alert("This content is locked until your enrollment is approved.");
      return;
    }
    if (!item.url) {
      alert("File is still processing or unavailable.");
      return;
    }
    
    window.open(item.url, '_blank');
  };

  const startQuiz = () => {
    if (activeCourse.quiz?.isLocked) {
      alert("Quiz is locked.");
      return;
    }
    setUserAnswers({});
    setTimeLeft(30 * 60); 
    setQuizStartTime(new Date());
    setQuizUIState('taking');
  };

  const submitQuiz = () => {
    setQuizResult({
      score: 8, total: 10, percentage: 80, gradeOutOf10: '8.00',
      startedAt: new Date().toLocaleDateString(),
      submittedAt: new Date().toLocaleDateString(),
      timeTakenFormatted: '5 mins'
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

  // Hitting Back automatically fetches the new data so the percentage bar updates
  const resetCourseView = () => {
    setActiveCourse(null);
    setActiveQuiz(null);
    setQuizResult(null);
    setQuizUIState('landing');
    fetchDashboardData(); 
  };


  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="font-medium">Loading your courses...</p>
      </div>
    );
  }

  if (quizUIState === 'taking') {
    return <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">Quiz Interface Running...</div>; 
  }

  if (activeCourse) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-gray-800">
        
        <div className="flex items-center gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <button onClick={resetCourseView} className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{activeCourse.title}</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Instructor: {activeCourse.instructor}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {(!activeCourse.weeks || activeCourse.weeks[0].materials.length === 0) && !activeCourse.quiz && (
            <div className="p-12 text-center text-gray-500">
              Curriculum is being updated. Check back soon!
            </div>
          )}

          {activeCourse.weeks?.map((week) => (
            <div key={week.id} className="border-b border-gray-100 last:border-0">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-blue-900">{week.title}</h2>
              </div>
              
              <div className="px-6 py-2">
                {week.materials?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-4 flex-1">
                      
                      <div className={`p-2 rounded-lg ${item.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        {item.type === 'pdf' ? <FileText className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                      </div>
                      
                      <a 
                        href="#" 
                        onClick={(e) => handleFileClick(e, item)}
                        className={`font-medium transition-colors cursor-pointer flex items-center gap-2 ${item.isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-blue-600 hover:underline'}`}
                      >
                        {item.title}
                        {item.isLocked && <Lock className="w-3 h-3 text-gray-400" />}
                      </a>
                    </div>

                    {/* Updated Checkbox with Backend Integration & Loading State */}
                    <button 
                      onClick={() => toggleCompletion(item)}
                      disabled={togglingLessonId === item.id || completedItems.includes(item.id)}
                      className={`p-2 transition-colors ${completedItems.includes(item.id) ? 'text-blue-500 cursor-default' : 'text-gray-400 hover:text-blue-600 cursor-pointer'}`}
                    >
                      {togglingLessonId === item.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      ) : completedItems.includes(item.id) ? (
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
                  <div className="flex items-center gap-2">
                    <span 
                      className={`font-bold block transition-colors ${activeCourse.quiz.isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 cursor-pointer hover:text-blue-600 hover:underline'}`}
                      onClick={startQuiz}
                    >
                      {activeCourse.quiz.title}
                    </span>
                    {activeCourse.quiz.isLocked && <Lock className="w-3 h-3 text-gray-400" />}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-gray-800">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your enrollments and progress.</p>
        </div>
        
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
            No courses found in this category.
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-300 transition-colors group">
              
              <div className="aspect-[4/5] bg-gray-50 flex items-center justify-center border-b border-gray-100 relative overflow-hidden">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <BookOpen className="w-12 h-12 text-gray-300" />
                )}
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

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-2 leading-snug">{course.title}</h3>
                <p className="text-xs text-gray-500 font-medium mb-4">Instructor: {course.instructor}</p>
                
                <div className="mt-auto">
                  
                  {activeTab === 'Discover' && course.enrollmentStatus === 'none' && (
                    <button 
                      onClick={() => handleEnrollRequest(course.id)}
                      disabled={processingCourseId === course.id}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {processingCourseId === course.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</>
                      ) : (
                        'Request Enrollment'
                      )}
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
                        onClick={() => loadCourseDetails(course)}
                        disabled={loadingDetailsId === course.id}
                        className="w-full py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loadingDetailsId === course.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                        ) : (
                          'View Course'
                        )}
                      </button>
                    </>
                  )}

                  {activeTab === 'Completed' && (
                    <button 
                      onClick={() => loadCourseDetails(course)}
                      disabled={loadingDetailsId === course.id}
                      className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {loadingDetailsId === course.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                      ) : (
                        'Review Course'
                      )}
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