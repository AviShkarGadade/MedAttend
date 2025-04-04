import axios from "axios"

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Don't automatically redirect to login to prevent loops
      // Just clear the auth data
      localStorage.removeItem("authToken")
      localStorage.removeItem("user")
    }
    return Promise.reject(error)
  },
)

// Auth services
export const authService = {
  register: async (userData: any) => {
    const response = await api.post("/auth/register", userData)
    return response.data
  },
  login: async (token: string) => {
    const response = await api.post("/auth/login", { token })
    return response.data
  },
  getCurrentUser: async () => {
    const response = await api.get("/auth/me")
    return response.data
  },
}

// User services
export const userService = {
  getUsers: async (params: any) => {
    const response = await api.get("/users", { params })
    return response.data
  },
  getUserById: async (id: string) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
  createUser: async (userData: any) => {
    const response = await api.post("/users", userData)
    return response.data
  },
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },
  approveFaculty: async (id: string) => {
    const response = await api.put(`/users/${id}/approve`)
    return response.data
  },
  rejectFaculty: async (id: string, reason: string) => {
    const response = await api.put(`/users/${id}/reject`, { reason })
    return response.data
  },
}

// Session services
export const sessionService = {
  getSessions: async (params: any) => {
    const response = await api.get("/sessions", { params })
    return response.data
  },
  getSessionById: async (id: string) => {
    const response = await api.get(`/sessions/${id}`)
    return response.data
  },
  createSession: async (sessionData: any) => {
    const response = await api.post("/sessions", sessionData)
    return response.data
  },
  updateSession: async (id: string, sessionData: any) => {
    const response = await api.put(`/sessions/${id}`, sessionData)
    return response.data
  },
  deleteSession: async (id: string) => {
    const response = await api.delete(`/sessions/${id}`)
    return response.data
  },
  generateQRCode: async (id: string) => {
    const response = await api.get(`/sessions/${id}/qrcode`)
    return response.data
  },
  completeSession: async (id: string) => {
    const response = await api.put(`/sessions/${id}/complete`)
    return response.data
  },
}

// Attendance services
export const attendanceService = {
  markAttendance: async (attendanceData: any) => {
    const response = await api.post("/attendance", attendanceData)
    return response.data
  },
  getSessionAttendance: async (sessionId: string, params: any) => {
    const response = await api.get(`/sessions/${sessionId}/attendance`, { params })
    return response.data
  },
  updateAttendance: async (id: string, attendanceData: any) => {
    const response = await api.put(`/attendance/${id}`, attendanceData)
    return response.data
  },
  markCheckout: async (id: string) => {
    const response = await api.put(`/attendance/${id}/checkout`)
    return response.data
  },
  getAttendanceHistory: async (params: any) => {
    const response = await api.get("/attendance/history", { params })
    return response.data
  },
  getAttendanceStats: async (params: any) => {
    const response = await api.get("/attendance/stats", { params })
    return response.data
  },
  generateAttendanceReport: async (params: any) => {
    const response = await api.get("/attendance/report", { params })
    return response.data
  },
  markBulkAttendance: async (sessionId: string, attendanceRecords: any[]) => {
    const response = await api.post(`/faculty/manual-attendance/${sessionId}`, {
      attendanceRecords,
    })
    return response.data
  },
}

// Department services
export const departmentService = {
  getDepartments: async () => {
    const response = await api.get("/departments")
    return response.data
  },
  getDepartmentById: async (id: string) => {
    const response = await api.get(`/departments/${id}`)
    return response.data
  },
  createDepartment: async (departmentData: any) => {
    const response = await api.post("/departments", departmentData)
    return response.data
  },
  updateDepartment: async (id: string, departmentData: any) => {
    const response = await api.put(`/departments/${id}`, departmentData)
    return response.data
  },
  deleteDepartment: async (id: string) => {
    const response = await api.delete(`/departments/${id}`)
    return response.data
  },
}

// Hospital services
export const hospitalService = {
  getHospitals: async () => {
    const response = await api.get("/hospitals")
    return response.data
  },
  getHospitalById: async (id: string) => {
    const response = await api.get(`/hospitals/${id}`)
    return response.data
  },
  createHospital: async (hospitalData: any) => {
    const response = await api.post("/hospitals", hospitalData)
    return response.data
  },
  updateHospital: async (id: string, hospitalData: any) => {
    const response = await api.put(`/hospitals/${id}`, hospitalData)
    return response.data
  },
  deleteHospital: async (id: string) => {
    const response = await api.delete(`/hospitals/${id}`)
    return response.data
  },
}

// Notification services
export const notificationService = {
  getNotifications: async () => {
    const response = await api.get("/notifications")
    return response.data
  },
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },
  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all")
    return response.data
  },
}

export default api

