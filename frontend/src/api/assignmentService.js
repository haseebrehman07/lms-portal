import axios from 'axios';

// Ensure this matches your backend URL!
const API_URL = 'http://127.0.0.1:8000/api'; 

// Helper to grab the token for locked routes
const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Or however you store your token
    return {
        headers: { Authorization: `Bearer ${token}` }
    };
};

export const assignmentService = {
    // ---------------------------------------------------------
    // TEACHER / ADMIN ROUTES
    // ---------------------------------------------------------

    // 1. Create a new assignment for a specific lesson
    // Maps to: POST /lessons/{lesson_id}/assignment
    createAssignment: async (lessonId, assignmentData) => {
        const response = await axios.post(
            `${API_URL}/lessons/${lessonId}/assignment`,
            assignmentData, // { title, instructions, due_date, max_score }
            getAuthHeaders()
        );
        return response.data;
    },

    // 2. View ALL submissions for a specific assignment (Admin grading view)
    // Maps to: GET /assignments/{assignment_id}/submissions
    getAllSubmissions: async (assignmentId) => {
        const response = await axios.get(
            `${API_URL}/assignments/${assignmentId}/submissions`,
            getAuthHeaders()
        );
        return response.data;
    },

    // 3. Grade a student's submission
    // Maps to: PATCH /assignments/submissions/{submission_id}/grade
    gradeSubmission: async (submissionId, gradeData) => {
        const response = await axios.patch(
            `${API_URL}/assignments/submissions/${submissionId}/grade`,
            gradeData, // { score, feedback }
            getAuthHeaders()
        );
        return response.data;
    },


    // ---------------------------------------------------------
    // STUDENT ROUTES
    // ---------------------------------------------------------

    // 4. Get the assignment details for a lesson
    // Maps to: GET /lessons/{lesson_id}/assignment
    getAssignmentByLesson: async (lessonId) => {
        const response = await axios.get(
            `${API_URL}/lessons/${lessonId}/assignment`,
            getAuthHeaders()
        );
        return response.data;
    },

    // 5. Submit work for an assignment
    // Maps to: POST /assignments/{assignment_id}/submit
    submitAssignment: async (assignmentId, submissionData) => {
        const response = await axios.post(
            `${API_URL}/assignments/${assignmentId}/submit`,
            submissionData, // { submission_text, file_url }
            getAuthHeaders()
        );
        return response.data;
    },

    // 6. See my own past submission and grades
    // Maps to: GET /assignments/{assignment_id}/submissions/me
    getMySubmission: async (assignmentId) => {
        const response = await axios.get(
            `${API_URL}/assignments/${assignmentId}/submissions/me`,
            getAuthHeaders()
        );
        return response.data;
    }
};