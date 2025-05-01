import axios from 'axios';

interface LogActivityParams {
  action: string;
  adminId: string;
  adminName?: string; // Made optional with ?
  adminEmail?: string; // Added optional email
  adminDesignation: string;
  orgId: string;
  collectionType: 'assignment_collection' | 'connections' | 'conversation_history';
  details?: any;
}

/**
 * Logs an admin activity to the activity log system
 */
export async function logActivity(params: LogActivityParams) {
  // Validate required fields before sending
  const requiredFields = ['action', 'adminId', 'adminDesignation', 'orgId', 'collectionType'];
  for (const field of requiredFields) {
    if (!params[field as keyof LogActivityParams]) {
      console.error(`Missing required field for activity logging: ${field}`);
      throw new Error(`Missing required field for activity logging: ${field}`);
    }
  }

  // If adminName is not provided, use a default or the adminId
  if (!params.adminName && !params.adminEmail) {
    params.adminName = params.adminId; // Use adminId as fallback
  }

  try {
    console.log('Sending activity log:', params);
    const response = await axios.post('/api/activity-logs', params);
    console.log('Activity log response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error logging activity:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example usage in components:
 * 
 * // When adding a new dataset
 * await logActivity({
 *   action: 'New dataset added',
 *   adminId: currentUser.id,
 *   adminName: currentUser.name,
 *   adminDesignation: currentUser.role, // 'admin' or 'super admin'
 *   orgId: currentUser.orgId,
 *   collectionType: 'assignment_collection',
 *   details: { datasetName: 'Customer Support FAQ', size: '2.3MB' }
 * });
 */