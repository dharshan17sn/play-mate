export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ResponseBuilder {
  static success<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string, error?: string): ApiResponse {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success'
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static created<T>(data: T, message: string = 'Resource created successfully'): ApiResponse<T> {
    return this.success(data, message);
  }

  static updated<T>(data: T, message: string = 'Resource updated successfully'): ApiResponse<T> {
    return this.success(data, message);
  }

  static deleted(message: string = 'Resource deleted successfully'): ApiResponse {
    return this.success(undefined, message);
  }

  static notFound(message: string = 'Resource not found'): ApiResponse {
    return this.error(message);
  }

  static validationError(message: string = 'Validation failed'): ApiResponse {
    return this.error(message);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiResponse {
    return this.error(message);
  }

  static forbidden(message: string = 'Forbidden'): ApiResponse {
    return this.error(message);
  }
}
