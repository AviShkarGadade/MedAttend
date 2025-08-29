
async function handleResponse(response: Response) {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "API request failed")
  }

  return data
}

// Get auth token from localStorage
function getAuthToken() {
  return localStorage.getItem("authToken")
}

// User services
export const userService = {
  getUsers: async (params: any = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key])
      }
    })

    const response = await fetch(`/api/users?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  getUserById: async (id: string) => {
    const response = await fetch(`/api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  createUser: async (userData: any) => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(userData),
    })

    return handleResponse(response)
  },

  updateUser: async (id: string, userData: any) => {
    const response = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(userData),
    })

    return handleResponse(response)
  },

  deleteUser: async (id: string) => {
    const response = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  approveFaculty: async (id: string) => {
    const response = await fetch(`/api/users/${id}/approve`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  rejectFaculty: async (id: string, reason: string) => {
    const response = await fetch(`/api/users/${id}/reject`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ reason }),
    })

    return handleResponse(response)
  },
}

// Department services
export const departmentService = {
  getDepartments: async () => {
    const response = await fetch("/api/departments", {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  getDepartmentById: async (id: string) => {
    const response = await fetch(`/api/departments/${id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },
}

// Hospital services
export const hospitalService = {
  getHospitals: async () => {
    const response = await fetch("/api/hospitals", {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  getHospitalById: async (id: string) => {
    const response = await fetch(`/api/hospitals/${id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },
}

// Session services
export const sessionService = {
  getSessions: async (params: any = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key])
      }
    })

    const response = await fetch(`/api/sessions?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  getSessionById: async (id: string) => {
    const response = await fetch(`/api/sessions/${id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  createSession: async (sessionData: any) => {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(sessionData),
    })

    return handleResponse(response)
  },

  updateSession: async (id: string, sessionData: any) => {
    const response = await fetch(`/api/sessions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(sessionData),
    })

    return handleResponse(response)
  },
}

// Attendance services
export const attendanceService = {
  getSessionAttendance: async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}/attendance`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },

  markAttendance: async (sessionId: string, attendanceData: any) => {
    const response = await fetch(`/api/attendance/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(attendanceData),
    })

    return handleResponse(response)
  },

  markBulkAttendance: async (sessionId: string, attendanceRecords: any[]) => {
    const response = await fetch(`/api/attendance/${sessionId}/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ attendanceRecords }),
    })

    return handleResponse(response)
  },

  getStudentAttendance: async (studentId: string, params: any = {}) => {
    const queryParams = new URLSearchParams()
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key])
      }
    })

    const response = await fetch(`/api/students/${studentId}/attendance?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    return handleResponse(response)
  },
}
