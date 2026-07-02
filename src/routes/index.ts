import { Hono } from 'hono';
import { authMiddleware } from '../interfaces/web/middlewares/auth.middleware';
import { getContainer } from '../di/container';
import { HttpStatus } from '../shared/constants';

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s]/g, '') // remove special characters
    .trim();
}

function isSemanticMatch(nameA: string, nameB: string): boolean {
  const normA = normalizeString(nameA);
  const normB = normalizeString(nameB);
  
  const tokensA = new Set(normA.split(/\s+/).filter(w => w.length > 1));
  const tokensB = new Set(normB.split(/\s+/).filter(w => w.length > 1));
  
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  
  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
  const minSize = Math.min(tokensA.size, tokensB.size);
  const overlapRatio = intersection.size / minSize;
  
  const isSubstring = normA.includes(normB) || normB.includes(normA);
  
  return overlapRatio >= 0.7 || isSubstring;
}

function isAllergenMatch(userAllergy: string, targetAllergen: string): boolean {
  const normUser = normalizeString(userAllergy);
  const normTarget = normalizeString(targetAllergen);
  return normUser.includes(normTarget) || normTarget.includes(normUser);
}

const api = new Hono<{ Bindings: any; Variables: { user: any } }>();

// GET /api/v1/health
api.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'API server is running and healthy.',
    timestamp: new Date().toISOString()
  });
});

// GET /api/v1/app/version
api.get('/app/version', async (c) => {
  try {
    const db = c.env.DB;
    let versionConfig = await db.prepare('SELECT * FROM app_versions LIMIT 1').first();
    if (!versionConfig) {
      await db
        .prepare('INSERT INTO app_versions (latest_version, store_url) VALUES (?, ?)')
        .bind('1.0.4+4', 'https://play.google.com/store/apps/details?id=com.thachhuynh.safefoodai')
        .run();
      versionConfig = {
        latest_version: '1.0.4+4',
        store_url: 'https://play.google.com/store/apps/details?id=com.thachhuynh.safefoodai'
      };
    }
    return c.json({
      success: true,
      message: 'Latest app version retrieved successfully',
      data: {
        latestVersion: versionConfig.latest_version || versionConfig.latestVersion,
        storeUrl: versionConfig.store_url || versionConfig.storeUrl
      }
    });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to retrieve app version', error: error.message }, 500);
  }
});

// GET /api/v1/profile/options
api.get('/profile/options', (c) => {
  const container = getContainer(c.env);
  const options = container.getProfileOptionsUseCase.execute();
  return c.json({
    success: true,
    message: 'Profile options retrieved successfully',
    data: options
  });
});

// GET /api/v1/app/images/* (Serve R2 images)
api.get('/app/images/:key{.+$}', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.BUCKET.get(key);
  if (!object) {
    return c.text('Image not found', 404);
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
});

// --- AUTH ROUTE HANDLERS ---

api.post('/auth/sync', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    if (!firebaseUser) {
      return c.json({ success: false, code: 'UNAUTHORIZED', message: 'User details missing.' }, 401);
    }
    const container = getContainer(c.env);
    const { user, isNew } = await container.syncUserUseCase.execute(
      firebaseUser.uid,
      firebaseUser.email,
      firebaseUser.name,
      firebaseUser.picture
    );
    return c.json({
      success: true,
      message: isNew ? 'User registered successfully.' : 'User details sync successfully.',
      data: user
    }, isNew ? 201 : 200);
  } catch (error: any) {
    return c.json({ success: false, code: 'DATABASE_ERROR', message: error.message }, 500);
  }
});

api.post('/auth/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json();
    const container = getContainer(c.env);
    const result = await container.registerPendingUseCase.execute(name, email, password);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, code: 'VALIDATION_ERROR', message: error.message }, 400);
  }
});

api.post('/auth/register/verify', async (c) => {
  try {
    const { email, otp } = await c.req.json();
    const container = getContainer(c.env);
    const { user, customToken } = await container.verifyOtpAndRegisterUseCase.execute(email, otp);
    return c.json({
      success: true,
      message: 'Xác thực OTP thành công. Tài khoản đã được khởi tạo.',
      data: { token: customToken, user }
    }, 201);
  } catch (error: any) {
    return c.json({ success: false, code: 'VALIDATION_ERROR', message: error.message }, 400);
  }
});

api.post('/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    const container = getContainer(c.env);
    const result = await container.forgotPasswordPendingUseCase.execute(email);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, code: 'VALIDATION_ERROR', message: error.message }, 400);
  }
});

api.post('/auth/forgot-password/verify', async (c) => {
  try {
    const { email, otp } = await c.req.json();
    const container = getContainer(c.env);
    const result = await container.verifyOtpForgotUseCase.execute(email, otp);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, code: 'VALIDATION_ERROR', message: error.message }, 400);
  }
});

api.post('/auth/reset-password', async (c) => {
  try {
    const { email, otp, password } = await c.req.json();
    const container = getContainer(c.env);
    const result = await container.resetPasswordUseCase.execute(email, otp, password);
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, code: 'VALIDATION_ERROR', message: error.message }, 400);
  }
});

// --- USER ROUTE HANDLERS ---

api.get('/users', async (c) => {
  try {
    const container = getContainer(c.env);
    const users = await container.getUsersUseCase.execute();
    return c.json({ success: true, data: users });
  } catch (error: any) {
    return c.json({ success: false, code: 'DATABASE_ERROR', message: error.message }, 500);
  }
});

api.get('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '', 10);
    const container = getContainer(c.env);
    const user = await container.getUserByIdUseCase.execute(id);
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    return c.json({ success: true, data: user });
  } catch (error: any) {
    return c.json({ success: false, code: 'DATABASE_ERROR', message: error.message }, 500);
  }
});

api.post('/users', async (c) => {
  try {
    const body = await c.req.json();
    const container = getContainer(c.env);
    const user = await container.createUserUseCase.execute(body);
    return c.json({ success: true, data: user }, 201);
  } catch (error: any) {
    return c.json({ success: false, code: 'VALIDATION_ERROR', message: error.message }, 400);
  }
});

api.put('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '', 10);
    const body = await c.req.json();
    const container = getContainer(c.env);
    const user = await container.updateUserUseCase.execute(id, body);
    return c.json({ success: true, data: user });
  } catch (error: any) {
    if (error.message === 'User not found') {
      return c.json({ success: false, message: 'User not found' }, 404);
    }
    return c.json({ success: false, code: 'VALIDATION_ERROR', message: error.message }, 400);
  }
});

// --- SCAN ROUTE HANDLERS ---

api.post('/scans', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    const body = await c.req.json();
    const container = getContainer(c.env);
    const scan = await container.createScanUseCase.execute(firebaseUser.uid, body);
    return c.json({ success: true, data: scan }, 201);
  } catch (error: any) {
    if (error.name === 'UserNotFoundError' || error.message === 'User not found') {
      return c.json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' }, 404);
    }
    return c.json({ success: false, code: 'BAD_REQUEST', message: error.message }, 400);
  }
});

api.post('/scans/analyze', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    const { scanType, base64Image, additionalContext } = await c.req.json();
    if (!scanType || !base64Image) {
      return c.json({ success: false, code: 'BAD_REQUEST', message: 'scanType and base64Image are required' }, 400);
    }
    const host = c.req.header('host');
    const container = getContainer(c.env, host);
    const result = await container.analyzeScanUseCase.execute(firebaseUser.uid, scanType, base64Image, additionalContext);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    if (error.name === 'UserNotFoundError' || error.message === 'User not found') {
      return c.json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' }, 404);
    }
    return c.json({ success: false, message: error.message }, 400);
  }
});

api.get('/scans', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    const container = getContainer(c.env);
    const scans = await container.getScansUseCase.execute(firebaseUser.uid);
    return c.json({ success: true, data: scans });
  } catch (error: any) {
    if (error.name === 'UserNotFoundError' || error.message === 'User not found') {
      return c.json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' }, 404);
    }
    return c.json({ success: false, message: error.message }, 500);
  }
});

api.delete('/scans/:id', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    const id = parseInt(c.req.param('id') || '', 10);
    if (isNaN(id)) {
      return c.json({ success: false, code: 'BAD_REQUEST', message: 'Valid Scan ID is required' }, 400);
    }
    const container = getContainer(c.env);
    await container.deleteScanUseCase.execute(firebaseUser.uid, id);
    return c.json({ success: true, message: 'Scan history entry deleted successfully' });
  } catch (error: any) {
    if (error.name === 'UserNotFoundError' || error.message === 'User not found') {
      return c.json({ success: false, code: 'USER_NOT_FOUND', message: 'User not found' }, 404);
    }
    if (error.message === 'SCAN_NOT_FOUND') {
      return c.json({ success: false, code: 'SCAN_NOT_FOUND', message: 'Scan history item not found or does not belong to you' }, 404);
    }
    return c.json({ success: false, message: error.message }, 500);
  }
});

// --- CHAT ROUTE HANDLERS ---

api.post('/chat/analyze', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    const { sessionId, prompt, base64Image, scanHistoryId } = await c.req.json();
    if (!sessionId || !prompt) {
      return c.json({ status: 'error', message: 'Prompt and sessionId are required' }, 400);
    }
    const container = getContainer(c.env);
    const result = await container.analyzeFoodUseCase.execute(firebaseUser.uid, sessionId, prompt, base64Image, scanHistoryId);
    return c.json({ status: 'success', data: result });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

api.post('/chat/analyze-general', authMiddleware, async (c) => {
  try {
    const { prompt, base64Image } = await c.req.json();
    if (!prompt) {
      return c.json({ status: 'error', message: 'Prompt is required' }, 400);
    }
    const container = getContainer(c.env);
    const reply = await container.analyzeGeneralUseCase.execute(prompt, base64Image);
    return c.json({ status: 'success', data: { reply } });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

api.get('/chat/history', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    const sessionId = c.req.query('sessionId');
    if (!sessionId) {
      return c.json({ status: 'error', message: 'sessionId is required' }, 400);
    }
    const container = getContainer(c.env);
    const history = await container.getChatHistoryUseCase.execute(firebaseUser.uid, sessionId);
    return c.json({ status: 'success', data: history });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

api.get('/chat/sessions', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    const container = getContainer(c.env);
    const sessions = await container.getChatSessionsUseCase.execute(firebaseUser.uid);
    return c.json({ status: 'success', data: sessions });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

api.delete('/chat/sessions/:sessionId', authMiddleware, async (c) => {
  try {
    const firebaseUser = c.get('user');
    const sessionId = c.req.param('sessionId') || '';
    const container = getContainer(c.env);
    await container.deleteChatSessionUseCase.execute(firebaseUser.uid, sessionId);
    return c.json({ status: 'success', message: 'Session deleted' });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

// --- NEWS & TRIGGER ROUTE HANDLERS ---

api.get('/news/warnings', authMiddleware, async (c) => {
  try {
    const container = getContainer(c.env);
    const articles = await container.getNewsWarningsUseCase.execute();
    return c.json({
      success: true,
      message: 'News fetched successfully',
      data: articles
    });
  } catch (error: any) {
    console.error('[news/warnings] Error:', error?.message, error?.stack);
    return c.json({ success: false, message: error.message, stack: error?.stack }, 500);
  }
});

api.get('/news/cron-sync', async (c) => {
  try {
    const token = c.req.query('token');
    const expectedToken = c.env.CRON_SYNC_TOKEN || c.env.CRON_SECRET || 'safe_food_ai_secret';
    if (token !== expectedToken) {
      return c.json({ success: false, message: 'Unauthorized. Invalid security token.' }, 401);
    }
    const container = getContainer(c.env);
    const result = await container.cronSyncNewsUseCase.execute();
    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

api.post('/news/recalls/trigger', async (c) => {
  try {
    const { productName, reason, url } = await c.req.json();
    if (!productName || !reason) {
      return c.json({ success: false, message: 'productName and reason are required' }, 400);
    }

    const container = getContainer(c.env);
    const queryTokens = productName.split(/\s+/).filter((t: string) => t.length > 1);
    const histories = await container.scanRepository.findByTitleTokens(queryTokens);
    const matchedHistories = histories.filter((h: any) => isSemanticMatch(h.title, productName));

    if (matchedHistories.length === 0) {
      return c.json({
        success: true,
        message: 'No users have scanned this product. No notifications sent.',
        matchedUsers: 0
      });
    }

    const userIds = Array.from(new Set(matchedHistories.map((h: any) => h.userId)));
    const allPushUsers = await container.userRepository.findPushEnabledUsers();
    const users = allPushUsers.filter(u => userIds.includes(u.id));

    let sentCount = 0;
    
    for (const user of users) {
      if (user.fcmToken) {
        const success = await container.fcmService.sendPushNotification(
          user.id,
          user.fcmToken,
          '🔴 CẢNH BÁO THU HỒI KHẨN CẤP',
          `Sản phẩm "${productName}" bạn từng quét vừa bị yêu cầu thu hồi do ${reason}. Vui lòng ngừng sử dụng!`,
          {
            type: 'recall',
            url: url || '',
            productName
          }
        );
        if (success) sentCount++;
      }
    }

    return c.json({
      success: true,
      message: 'Processed food recall alert.',
      matchedUsers: userIds.length,
      notificationsSent: sentCount
    });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to process recalls trigger.', error: error.message }, 500);
  }
});

api.post('/news/allergies/trigger', async (c) => {
  try {
    const { productName, allergen } = await c.req.json();
    if (!productName || !allergen) {
      return c.json({ success: false, message: 'productName and allergen are required' }, 400);
    }

    const container = getContainer(c.env);
    const users = await container.userRepository.findPushEnabledUsers();

    let sentCount = 0;
    const matchedUserIds: number[] = [];

    for (const user of users) {
      const userAllergies: string[] = user.allergies || [];
      const hasAllergy = userAllergies.some((a) => isAllergenMatch(a, allergen));

      if (hasAllergy && user.fcmToken) {
        matchedUserIds.push(user.id);
        const success = await container.fcmService.sendPushNotification(
          user.id,
          user.fcmToken,
          '⚠️ CẢNH BÁO DỊ ỨNG CÁ NHÂN HÓA',
          `Lưu ý: Món "${productName}" mới ra mắt có chứa ${allergen}. Hãy cẩn thận vì nó có trong danh sách dị ứng của bạn!`,
          {
            type: 'allergy',
            productName,
            allergen
          }
        );
        if (success) sentCount++;
      }
    }

    return c.json({
      success: true,
      message: 'Processed allergy alert.',
      matchedUsers: matchedUserIds.length,
      notificationsSent: sentCount
    });
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to process allergies trigger.', error: error.message }, 500);
  }
});

export default api;
