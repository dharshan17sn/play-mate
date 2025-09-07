import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  userLoginSchema,
  userUpdateSchema,
  paginationSchema,
  searchSchema,
  userSearchSchema,
  idParamSchema,
  requestOtpSchema,
  verifyOtpSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema,
} from '../middleware/validation';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: User authentication and profiles
 */

// Public routes
/**
 * @openapi
 * /api/v1/users/register/request-otp:
 *   post:
 *     summary: Request registration OTP to email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: OTP sent }
 *       409: { description: Email already registered }
 */
router.post('/register/request-otp', validateRequest(requestOtpSchema), UserController.requestRegistrationOtp);

/**
 * @openapi
 * /api/v1/users/register/verify-otp:
 *   post:
 *     summary: Verify OTP and register the user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, user_id, displayName, password]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string }
 *               user_id: { type: string }
 *               displayName: { type: string }
 *               password: { type: string }
 *               gender: { type: string }
 *               location: { type: string }
 *     responses:
 *       201: { description: Registered }
 *       400: { description: Invalid or expired OTP }
 */
router.post('/register/verify-otp', validateRequest(verifyOtpSchema), UserController.verifyRegistrationOtp);

/**
 * @openapi
 * /api/v1/users/login:
 *   post:
 *     summary: Login using email or user_id (identifier) and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/login', validateRequest(userLoginSchema), UserController.login);

/**
 * @openapi
 * /api/v1/users/forgot-password/request-otp:
 *   post:
 *     summary: Request OTP to reset password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: OTP sent }
 *       404: { description: Email not found }
 */
router.post('/forgot-password/request-otp', validateRequest(forgotPasswordRequestSchema), UserController.requestForgotPasswordOtp);

/**
 * @openapi
 * /api/v1/users/forgot-password/reset:
 *   post:
 *     summary: Verify OTP and reset password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password reset }
 *       400: { description: Invalid or expired OTP }
 */
router.post('/forgot-password/reset', validateRequest(forgotPasswordResetSchema), UserController.resetForgotPassword);

// Admin/Public routes (place static routes before dynamic parameter routes)
/**
 * @openapi
 * /api/v1/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: user_id
 *         schema: { type: string }
 *       - in: query
 *         name: displayName
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/search', validateRequest(userSearchSchema), UserController.searchUsers);

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/', validateRequest(paginationSchema), validateRequest(userSearchSchema), UserController.getUsers);

// Protected routes
/**
 * @openapi
 * /api/v1/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/profile', authenticateToken, UserController.getProfile);

/**
 * @openapi
 * /api/v1/users/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Update your profile information. All fields are optional - only include the fields you want to update.
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 30
 *                 description: Your display name
 *                 example: "John Doe"
 *               photo:
 *                 type: string
 *                 format: uri
 *                 description: URL to your profile photo
 *                 example: "https://example.com/photo.jpg"
 *               gender:
 *                 type: string
 *                 description: Your gender
 *                 example: "male"
 *               location:
 *                 type: string
 *                 description: Your location/city
 *                 example: "New York"
 *               preferredDays:
 *                 type: array
 *                 description: Days of the week when you're available to play
 *                 items:
 *                   type: string
 *                   enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
 *                 example: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *               timeRange:
 *                 type: array
 *                 description: Time ranges when you're available to play (24-hour format)
 *                 items:
 *                   type: string
 *                   pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: ["18:00-22:00", "06:00-10:00"]
 *               preferredGames:
 *                 type: array
 *                 description: Names of games to add to your preferred games list (must exist in the database, duplicates are automatically skipped)
 *                 items:
 *                   type: string
 *                   minLength: 2
 *                   maxLength: 50
 *                 example: ["Valorant", "CS2", "League of Legends"]
 *           example:
 *             displayName: "John Doe"
 *             photo: "https://example.com/photo.jpg"
 *             gender: "male"
 *             location: "New York"
 *             preferredDays: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *             timeRange: ["18:00-22:00", "06:00-10:00"]
 *             preferredGames: ["Valorant", "CS2", "League of Legends"]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       example: "john_doe"
 *                     displayName:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     photo:
 *                       type: string
 *                       example: "https://example.com/photo.jpg"
 *                     gender:
 *                       type: string
 *                       example: "male"
 *                     location:
 *                       type: string
 *                       example: "New York"
 *                     preferredDays:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *                     timeRange:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["18:00-22:00", "06:00-10:00"]
 *                     preferredGames:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           gameName:
 *                             type: string
 *                             example: "Valorant"
 *                           game:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "Valorant"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed: Invalid input data"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Games not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Games not found: InvalidGame, AnotherInvalidGame"
 */
router.put('/profile', authenticateToken, validateRequest(userUpdateSchema), UserController.updateProfile);

/**
 * @openapi
 * /api/v1/users/teams:
 *   get:
 *     summary: Get my teams
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/teams', authenticateToken, UserController.getMyTeams);

/**
 * @openapi
 * /api/v1/users/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Changed }
 */
router.put('/change-password', authenticateToken, UserController.changePassword);

/**
 * @openapi
 * /api/v1/users/{user_id}:
 *   delete:
 *     summary: Delete own account
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       403: { description: Forbidden }
 */
router.delete('/:user_id', authenticateToken, validateRequest(idParamSchema), UserController.deleteUser);

// Public routes with optional authentication
/**
 * @openapi
 * /api/v1/users/{user_id}/teams:
 *   get:
 *     summary: Get teams for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/:user_id/teams', validateRequest(idParamSchema), UserController.getUserWithTeams);

/**
 * @openapi
 * /api/v1/users/{user_id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 */
router.get('/:user_id', validateRequest(idParamSchema), UserController.getUserById);

export default router;
