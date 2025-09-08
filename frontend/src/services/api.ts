const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      user_id: string;
      email: string;
      displayName: string;
    };
    token: string;
  };
  message: string;
  timestamp: string;
}

export interface RegisterOtpRequest {
  email: string;
}

export interface RegisterOtpResponse {
  success: boolean;
  data: {};
  message: string;
  timestamp: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
  user_id: string;
  displayName: string;
  password: string;
  gender?: string;
  location?: string;
}

export interface ForgotPasswordOtpRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface Game {
  id: string;
  name: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  displayName: string;
  status: string;
}

export interface TeamSummary {
  id: string;
  title: string;
  description?: string;
  gameName?: string;
  isPublic?: boolean;
  game?: { name: string };
  members?: TeamMember[];
}

export interface UserListItem {
  user_id: string;
  displayName: string;
  email: string;
  photo?: string;
  gender?: string;
  location?: string;
  preferredGames?: Array<{ gameName: string; game?: { name: string } }>;
}

export interface UserProfile extends UserListItem {
  preferredDays?: string[];
  timeRange?: string[];
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error('Backend error response:', data);

        // Enhanced error message formatting
        let errorMessage = data?.message || 'Request failed';

        // Handle detailed validation errors
        if (data?.error) {
          if (Array.isArray(data.error)) {
            // Validation errors array
            const fieldErrors = data.error.map((err: any) =>
              `${err.field}: ${err.message}`
            ).join('\n• ');
            errorMessage += `\n\nValidation errors:\n• ${fieldErrors}`;
          } else if (typeof data.error === 'object') {
            // Object with error details
            errorMessage += `\n\nError details: ${JSON.stringify(data.error, null, 2)}`;
          } else {
            // Simple string error
            errorMessage += `\n\nDetails: ${data.error}`;
          }
        }

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async requestWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_BASE_URL}${endpoint}`;

    // Merge headers safely so Authorization cannot be overwritten by options spread
    const mergedHeaders: HeadersInit = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as any),
    };

    const config: RequestInit = {
      ...options,
      mode: 'cors',
      headers: mergedHeaders,
    };

    try {
      // Debug: verify auth header present
      console.debug('requestWithAuth ->', {
        endpoint: url,
        method: config.method || 'GET',
        hasToken: !!token,
        authHeader: (config.headers as any)?.['Authorization'] || (config.headers as any)?.['authorization'],
      });
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async requestRegistrationOtp(email: string): Promise<RegisterOtpResponse> {
    return this.request<RegisterOtpResponse>('/users/register/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyRegistrationOtp(data: VerifyOtpRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/users/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestForgotPasswordOtp(email: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/users/forgot-password/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/users/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Profile endpoints
  async getProfile(): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>('/users/profile');
  }

  async updateProfile(data: any): Promise<ApiResponse> {
    console.log('=== API SERVICE UPDATE PROFILE START ===');
    console.log('updateProfile - Input data:', data);
    console.log('updateProfile - Data type:', typeof data);
    console.log('updateProfile - Data keys:', Object.keys(data));

    const url = `${API_BASE_URL}/users/profile`;
    const headers = {
      'Authorization': `Bearer ${this.getAuthToken()}`,
      'Content-Type': 'application/json'
    };

    console.log('updateProfile - Sending request to:', url);
    console.log('updateProfile - Request data:', JSON.stringify(data, null, 2));
    console.log('updateProfile - Request headers:', headers);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      console.log('updateProfile - Response status:', response.status);
      console.log('updateProfile - Response headers:', Object.fromEntries(response.headers.entries()));

      const responseData = await response.json();
      console.log('updateProfile - Response data:', responseData);

      if (!response.ok) {
        console.log('updateProfile - Backend error response:', responseData);
        throw new Error(responseData.message || 'Failed to update profile');
      }

      console.log('updateProfile - Success response:', responseData);
      console.log('=== API SERVICE UPDATE PROFILE END ===');
      return responseData;
    } catch (error) {
      console.error('updateProfile - API request failed:', error);
      console.log('=== API SERVICE UPDATE PROFILE END ===');
      throw error;
    }
  }

  // Get all available games
  async getGames(): Promise<Game[]> {
    try {
      const response = await this.request<ApiResponse>('/games');
      // The API returns a paginated response with games in response.data.data
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching games:', error);
      return [];
    }
  }

  // Teams endpoints
  async getMyTeams(): Promise<TeamSummary[]> {
    try {
      // Use Teams controller endpoint that returns full team details
      const response = await this.requestWithAuth<ApiResponse>('/teams/my');
      // API returns { success, data } where data is either array or { teams }
      if (response && Array.isArray((response as any).data)) {
        return (response as any).data as TeamSummary[];
      }
      if (response && (response as any).data && Array.isArray((response as any).data.teams)) {
        return (response as any).data.teams as TeamSummary[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching my teams:', error);
      return [];
    }
  }

  // Users endpoints
  async listUsers(params?: { page?: number; limit?: number; search?: string; user_id?: string; displayName?: string; }): Promise<{ users: UserListItem[]; pagination: any } | UserListItem[]> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.user_id) query.set('user_id', params.user_id);
    if (params?.displayName) query.set('displayName', params.displayName);
    const endpoint = `/users${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await this.request<ApiResponse>(endpoint);
    if (Array.isArray(response.data)) return response.data as UserListItem[];
    return (response.data as any) || [];
  }

  async getUserById(userId: string): Promise<UserProfile> {
    const response = await this.request<ApiResponse>(`/users/${encodeURIComponent(userId)}`);
    return response.data as UserProfile;
  }

  // Friends API
  async sendFriendRequest(toUserId: string): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>('/friends/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUserId }),
    });
  }

  async listFriendRequests(box: 'incoming' | 'outgoing' = 'incoming'): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>(`/friends/requests?box=${box}`);
  }

  async respondFriendRequest(requestId: string, action: 'accept' | 'decline'): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>(`/friends/requests/${encodeURIComponent(requestId)}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  }

  async listFriends(): Promise<{ user_id: string; displayName: string; photo?: string }[]> {
    const res = await this.requestWithAuth<ApiResponse>('/friends');
    return (res.data as any[]) || [];
  }

  // Chat API
  async getOrCreateChat(friendId: string): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>(`/chat/friends/${encodeURIComponent(friendId)}`);
  }

  async getUserChats(): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>('/chat/chats');
  }

  async getChatMessages(chatId: string, limit?: number, offset?: number): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.requestWithAuth<ApiResponse>(`/chat/${encodeURIComponent(chatId)}/messages${query}`);
  }

  async sendMessage(chatId: string, content: string): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>(`/chat/${encodeURIComponent(chatId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async markMessagesAsRead(chatId: string): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>(`/chat/${encodeURIComponent(chatId)}/read`, {
      method: 'PUT',
    });
  }

  // Team API
  async createTeam(data: {
    title: string;
    description?: string;
    photo?: string;
    gameName: string;
    noOfPlayers?: number;
    isPublic?: boolean;
  }): Promise<ApiResponse> {
    return this.requestWithAuth<ApiResponse>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPublicTeams(params?: { page?: number; limit?: number; gameName?: string }): Promise<ApiResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.gameName) query.set('gameName', params.gameName);
    const endpoint = `/teams/public${query.toString() ? `?${query.toString()}` : ''}`;
    return this.request<ApiResponse>(endpoint);
  }

  async getAllTeams(params?: { page?: number; limit?: number; search?: string; isPublic?: boolean }): Promise<ApiResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.isPublic !== undefined) query.set('isPublic', String(params.isPublic));
    const endpoint = `/teams/all${query.toString() ? `?${query.toString()}` : ''}`;
    return this.requestWithAuth<ApiResponse>(endpoint);
  }

  // Get user profile

  // Helper method to get auth token from localStorage
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Extract userId from JWT without verifying (frontend convenience)
  getUserIdFromToken(): string | null {
    const token = this.getAuthToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = JSON.parse(atob(parts[1]));
      return payload?.userId || null;
    } catch {
      return null;
    }
  }

  // Helper method to set auth token in localStorage
  setAuthToken(token: string): void {
    // Clear any existing token first
    this.removeAuthToken();
    localStorage.setItem('authToken', token);
  }

  // Helper method to remove auth token from localStorage
  removeAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  // Helper method to logout (clear token and redirect)
  logout(): void {
    this.removeAuthToken();
    // Redirect to login page
    window.location.href = '/login';
  }

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  // Team join and members endpoints
  async requestToJoinTeam(teamId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/teams/${teamId}/join`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error requesting to join team:', error);
      throw error;
    }
  }

  async getTeamById(teamId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/teams/${teamId}`);
      return response;
    } catch (error) {
      console.error('Error getting team by ID:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      return response;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Delete account
  async deleteAccount(userId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/users/${userId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async getTeamMembers(teamId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/teams/${teamId}/members`);
      return response;
    } catch (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
  }

  // Team join request approval/rejection
  async approveTeamJoinRequest(invitationId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/invitations/${invitationId}/approve`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      console.error('Error approving team join request:', error);
      throw error;
    }
  }

  async rejectTeamJoinRequest(invitationId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/invitations/${invitationId}/reject`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      console.error('Error rejecting team join request:', error);
      throw error;
    }
  }

  async listInvitations(type: 'sent' | 'received'): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/invitations/${type}`);
      return response;
    } catch (error) {
      console.error('Error listing invitations:', error);
      throw error;
    }
  }

  // Team messaging methods
  async getTeamMessages(teamId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/teams/${teamId}/messages`);
      return response;
    } catch (error) {
      console.error('Error getting team messages:', error);
      throw error;
    }
  }

  async sendTeamMessage(teamId: string, content: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/teams/${teamId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      return response;
    } catch (error) {
      console.error('Error sending team message:', error);
      throw error;
    }
  }

  // Update team information
  async updateTeam(teamId: string, data: {
    title?: string;
    description?: string;
    photo?: string;
  }): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/teams/${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  // Make a team member an admin
  async makeMemberAdmin(teamId: string, memberId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberId)}/admin`, {
        method: 'PUT'
      });
      return response;
    } catch (error) {
      console.error('Error making member admin:', error);
      throw error;
    }
  }

  // Update member admin status (true to make admin, false to dismiss)
  async updateMemberAdmin(teamId: string, memberId: string, isAdmin: boolean): Promise<ApiResponse> {
    try {
      if (isAdmin) {
        // Promote: PUT without body
        return await this.requestWithAuth<ApiResponse>(`/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberId)}/admin`, {
          method: 'PUT'
        });
      } else {
        // Demote: DELETE
        return await this.requestWithAuth<ApiResponse>(`/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(memberId)}/admin`, {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.error('Error updating member admin:', error);
      throw error;
    }
  }

  // Remove a member from team
  async removeMemberFromTeam(teamId: string, memberId: string): Promise<ApiResponse> {
    try {
      const response = await this.requestWithAuth<ApiResponse>(`/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error removing member from team:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
