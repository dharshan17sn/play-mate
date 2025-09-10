import { Router, type Request, type Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { FriendController } from '../controllers/friendController';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Friends
 *     description: Friend requests and friendships
 */

/**
 * @openapi
 * /api/v1/friends/requests:
 *   post:
 *     summary: Send friend request
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toUserId]
 *             properties:
 *               toUserId: { type: string }
 *     responses:
 *       201: { description: Friend request sent }
 */
router.post('/requests', authenticateToken, FriendController.sendRequest);

/**
 * @openapi
 * /api/v1/friends/requests:
 *   get:
 *     summary: List friend requests
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: box
 *         schema: { type: string, enum: [incoming, outgoing] }
 *     responses:
 *       200: { description: OK }
 */
router.get('/requests', authenticateToken, FriendController.listRequests);

/**
 * @openapi
 * /api/v1/friends/requests/{requestId}/respond:
 *   post:
 *     summary: Respond to friend request
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [accept, decline] }
 *     responses:
 *       200: { description: Friend request updated }
 */
router.post('/requests/:requestId/respond', authenticateToken, FriendController.respond);

/**
 * @openapi
 * /api/v1/friends/requests/bulk:
 *   post:
 *     summary: Send friend requests to all active players
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Requests sent }
 */
router.post('/requests/bulk', authenticateToken, FriendController.sendRequestsToAll);

/**
 * @openapi
 * /api/v1/friends/requests/{requestId}:
 *   delete:
 *     summary: Withdraw a friend request (sender only)
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Friend request withdrawn }
 */
// router.delete('/requests/:requestId', authenticateToken, FriendController.cancel);

/**
 * @openapi
 * /api/v1/friends:
 *   get:
 *     summary: List friends
 *     tags: [Friends]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/', authenticateToken, FriendController.listFriends);

export default router;


